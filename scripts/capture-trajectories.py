"""
Capture real denoising trajectories from a masked diffusion language model.

For every (prompt, sampler config) pair this records, per denoising step:
  - which positions were committed (unmasked) and with what confidence
  - the model's provisional argmax for EVERY still-masked position
  - the max-probability per position
  - wall-clock ms for the forward pass
It then maps committed tokens onto whitespace words (the unit the interface
renders) and computes order statistics. Two artefacts per trajectory:
  full/<id>.json.gz   everything (for researchers)
  compact/<id>.json   per-token commit step/conf/flips + step timings (for the site)
"""
import json, gzip, os, re, sys, time, math
import torch, torch.nn.functional as F
from transformers import AutoTokenizer, AutoModelForMaskedLM

NAME = "dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1"
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "traces")
os.makedirs(os.path.join(OUT, "full"), exist_ok=True)
os.makedirs(os.path.join(OUT, "compact"), exist_ok=True)
dev = "mps" if torch.backends.mps.is_available() else "cpu"

PROMPTS = [
  ("weather",           "What's the weather like in metaphor land?"),
  ("diffusion-explain", "Explain how diffusion text generation works."),
  ("research-summary",  "Summarize the last three years of model research."),
  ("heron-poem",        "Write a poem about a heron at dawn."),
  ("brainstorm",        "Give me a few wild ideas for naming a new color."),
  ("travel",            "Quick question. Should I take the train or fly?"),
  ("compiler-error",    "Walk me through this compiler error."),
  ("capital",           "What is the capital of Australia, and why do people get it wrong?"),
  ("sleep-tips",        "Give me three tips for sleeping better, one sentence each."),
  ("lighthouse-haiku",  "Write a haiku about a lighthouse."),
  ("hash-function",     "In one paragraph, explain what a hash function is to a designer."),
  ("rust-or-go",        "Should I learn Rust or Go first? Answer briefly."),
  ("houseplants",       "List five common houseplants that tolerate low light."),
  ("concise-rewrite",   "Rewrite this sentence to be more concise: The meeting, which was scheduled for the afternoon, has been moved to the morning by the organizers."),
  ("golden-sunflower",  "What does the golden ratio have to do with sunflowers?"),
  ("sky-blue",          "Explain to a child why the sky is blue."),
  ("out-of-office",     "Draft a two-sentence out-of-office reply."),
  ("solder-project",    "Name a good first project for learning to solder."),
  ("why-out-of-order",  "Why do diffusion models generate text out of order?"),
  ("heist-plot",        "Summarize the plot of a heist movie in three sentences, without naming a real film."),
]

# Three sampler configurations. All greedy (temperature 0), all 128 steps for
# 128 new tokens so every step commits exactly one token and step index is
# also commit rank. This keeps the order statistics directly comparable.
CONFIGS = [
  dict(id="lowconf-b32", remasking="low_confidence", block_size=32,  note="LLaDA-style low-confidence remasking, 4 blocks of 32 (the model card default)"),
  dict(id="random-b32",  remasking="random",         block_size=32,  note="original MDLM random unmasking order, same block schedule"),
  dict(id="lowconf-b128",remasking="low_confidence", block_size=128, note="low-confidence remasking with no block schedule: one global 128-position field"),
]
STEPS, MAX_NEW = 128, 128
STOP = set("a an the of to in on at for and or but if is are was were be been am it its this that these those i you he she we they me him her us them my your his our their as by with from into over under not no yes so than then there here do does did have has had can could will would should may might must".split())

def kendall_tau(a, b):
    n = len(a); c = d = 0
    for i in range(n):
        for j in range(i+1, n):
            s = (a[i]-a[j]) * (b[i]-b[j])
            if s > 0: c += 1
            elif s < 0: d += 1
    tot = n*(n-1)/2
    return (c - d) / tot if tot else 0.0

def main():
    torch.manual_seed(0)
    tok = AutoTokenizer.from_pretrained(NAME, trust_remote_code=True)
    model = AutoModelForMaskedLM.from_pretrained(NAME, trust_remote_code=True, dtype=torch.bfloat16).to(dev).eval()
    mask_id, pad_id, eos_id = tok.mask_token_id, tok.pad_token_id, tok.eos_token_id
    manifest = []
    total = len(PROMPTS) * len(CONFIGS); done = 0
    for cfg in CONFIGS:
        for pid, ptext in PROMPTS:
            tid = f"{pid}__{cfg['id']}"
            if os.path.exists(os.path.join(OUT, "compact", tid + ".json")):
                manifest.append(json.load(open(os.path.join(OUT, "compact", tid + ".json"))) | {"config": cfg["id"]})
                manifest[-1] = {"id": tid, "prompt_id": pid, "config": cfg["id"], "words": manifest[-1]["stats"]["words"], "stats": manifest[-1]["stats"]}
                done += 1; print(f"[{done:2d}/{total}] {tid:36s} (resume: existing)", flush=True); continue
            t_wall = time.time()
            msgs = [{"role": "user", "content": ptext}]
            ids = tok.apply_chat_template(msgs, add_generation_prompt=True, tokenize=True, enable_thinking=False)
            L = len(ids)
            x = torch.full((1, L + MAX_NEW), pad_id, dtype=torch.long, device=dev)
            x[0, :L] = torch.tensor(ids, device=dev); x[0, L:] = mask_id
            pos = torch.arange(L + MAX_NEW, device=dev)
            g = torch.Generator(device="cpu").manual_seed(0)
            nb = MAX_NEW // cfg["block_size"]; spb = STEPS // nb
            steps = []; step_i = 0
            commit_step = [-1] * MAX_NEW; commit_conf = [0.0] * MAX_NEW; commit_tok = [0] * MAX_NEW
            prev_argmax = None; flips = [0] * MAX_NEW
            with torch.no_grad():
                for b in range(nb):
                    bs, be = L + b * cfg["block_size"], L + (b + 1) * cfg["block_size"]
                    init_mask = (pos >= bs) & (pos < be) & (x[0] == mask_id)
                    n = int(init_mask.sum()); base, rem = n // spb, n % spb
                    for i in range(spb):
                        k = base + (1 if i < rem else 0)
                        bm = (pos >= bs) & (pos < be) & (x[0] == mask_id)
                        ts = time.time()
                        logits = model(x).logits[0]
                        if dev == "mps": torch.mps.synchronize()
                        ms = (time.time() - ts) * 1000
                        x0 = logits.argmax(-1)
                        p = F.softmax(logits.float(), -1)
                        pmax = p.gather(-1, x0.unsqueeze(-1)).squeeze(-1)
                        if cfg["remasking"] == "low_confidence":
                            score = pmax
                        else:
                            score = torch.rand(pmax.shape, generator=g).to(dev)
                        score = torch.where(bm, score, torch.full_like(score, -1.0))
                        # provisional-guess flips: did the argmax for a still-masked
                        # position change since the previous step?
                        am = x0[L:].tolist()
                        if prev_argmax is not None:
                            for q in range(MAX_NEW):
                                if commit_step[q] < 0 and am[q] != prev_argmax[q]:
                                    flips[q] += 1
                        prev_argmax = am
                        sel = torch.topk(score, k=k).indices.tolist() if k > 0 else []
                        for s in sel:
                            x[0, s] = x0[s]
                            q = s - L
                            commit_step[q] = step_i; commit_conf[q] = float(pmax[s]); commit_tok[q] = int(x0[s])
                        steps.append({
                            "i": step_i, "block": b, "ms": round(ms, 1),
                            "committed": [s - L for s in sel],
                            "pmax": [round(float(v), 3) for v in pmax[L:].tolist()],
                            "argmax": am,
                        })
                        step_i += 1
            gen_ids = x[0, L:].tolist()
            # content = up to the first EOS; the tail (eos/pad) is kept in the
            # token table with a flag because WHEN it commits is itself a finding
            first_eos = next((q for q, t in enumerate(gen_ids) if t in (eos_id, pad_id)), MAX_NEW)
            content_ids = gen_ids[:first_eos]
            # char spans per token via progressive decode
            spans = []; prev_len = 0
            for q in range(len(content_ids)):
                txt = tok.decode(content_ids[:q + 1], skip_special_tokens=True)
                spans.append((prev_len, len(txt))); prev_len = len(txt)
            answer = tok.decode(content_ids, skip_special_tokens=True)
            tokens = []
            for q in range(MAX_NEW):
                piece = tok.decode([gen_ids[q]], skip_special_tokens=False)
                tokens.append({"pos": q, "text": piece, "step": commit_step[q], "conf": round(commit_conf[q], 4),
                               "flips": flips[q], "tail": q >= first_eos,
                               "span": list(spans[q]) if q < first_eos else None})
            # whitespace words (the interface's atom), each locking when its last token commits
            words = []
            for m in re.finditer(r"\S+", answer):
                a, bnd = m.start(), m.end()
                toks = [t for t in tokens[:first_eos] if t["span"][1] > a and t["span"][0] < bnd]
                words.append({"index": len(words), "text": m.group(0),
                              "tokens": [t["pos"] for t in toks],
                              "lock_step": max(t["step"] for t in toks),
                              "first_step": min(t["step"] for t in toks),
                              "conf": round(min(t["conf"] for t in toks), 4)})
            # ---- statistics over CONTENT tokens ----
            ct = tokens[:first_eos]
            order = sorted(ct, key=lambda t: t["step"])
            positions_by_rank = [t["pos"] for t in order]
            tau = kendall_tau([t["step"] for t in ct], [t["pos"] for t in ct]) if len(ct) > 1 else 0.0
            jumps = [abs(positions_by_rank[i] - positions_by_rank[i-1]) for i in range(1, len(positions_by_rank))]
            n_ct = len(ct)
            tail_steps = [t["step"] for t in tokens if t["tail"]]
            last_content_step = max(t["step"] for t in ct) if ct else 0
            q1 = order[: max(1, n_ct // 4)] if n_ct else []
            def is_stop(t): 
                w = t["text"].strip().lower()
                return (w in STOP) or (not re.search(r"[a-z0-9]", w))
            stats = {
                "content_tokens": n_ct, "words": len(words),
                "kendall_tau_step_vs_position": round(tau, 4),
                "mean_jump": round(sum(jumps) / len(jumps), 2) if jumps else 0.0,
                "expected_random_jump": round((n_ct + 1) / 3, 2),
                "adjacent_commit_fraction": round(sum(1 for j in jumps if j == 1) / len(jumps), 4) if jumps else 0.0,
                "median_commit_conf": round(sorted(t["conf"] for t in ct)[n_ct // 2], 4) if ct else 0.0,
                "low_conf_commits_frac": round(sum(1 for t in ct if t["conf"] < 0.5) / n_ct, 4) if ct else 0.0,
                "first_quartile_stopword_frac": round(sum(1 for t in q1 if is_stop(t)) / len(q1), 4) if q1 else 0.0,
                "overall_stopword_frac": round(sum(1 for t in ct if is_stop(t)) / n_ct, 4) if ct else 0.0,
                "mean_flips_per_token": round(sum(t["flips"] for t in ct) / n_ct, 3) if ct else 0.0,
                "tokens_with_any_flip_frac": round(sum(1 for t in ct if t["flips"] > 0) / n_ct, 4) if ct else 0.0,
                "tail_tokens": len(tail_steps),
                "tail_all_committed_by_step": max(tail_steps) if tail_steps else None,
                "last_content_committed_step": last_content_step,
                "tail_before_last_content": (max(tail_steps) < last_content_step) if tail_steps else None,
                "ms_per_step_median": round(sorted(s["ms"] for s in steps)[len(steps) // 2], 1),
                "ms_total": round(sum(s["ms"] for s in steps), 1),
            }
            full = {"id": tid, "prompt_id": pid, "prompt": ptext, "model": NAME, "device": dev,
                    "sampler": {**cfg, "steps": STEPS, "max_new_tokens": MAX_NEW, "temperature": 0.0},
                    "answer": answer, "prompt_tokens": L, "tokens": tokens, "words": words, "steps": steps, "stats": stats}
            with gzip.open(os.path.join(OUT, "full", tid + ".json.gz"), "wt") as f: json.dump(full, f)
            compact = {k: full[k] for k in ("id", "prompt_id", "prompt", "model", "sampler", "answer", "words", "stats")}
            compact["tokens"] = [{k: t[k] for k in ("pos", "text", "step", "conf", "flips", "tail")} for t in tokens]
            compact["step_ms"] = [s["ms"] for s in steps]
            with open(os.path.join(OUT, "compact", tid + ".json"), "w") as f: json.dump(compact, f)
            manifest.append({"id": tid, "prompt_id": pid, "config": cfg["id"], "words": len(words), "stats": stats})
            done += 1
            print(f"[{done:2d}/{total}] {tid:36s} {time.time()-t_wall:5.1f}s  tau={stats['kendall_tau_step_vs_position']:+.2f} jump={stats['mean_jump']:5.1f} flips/tok={stats['mean_flips_per_token']:.2f} tail_first={stats['tail_before_last_content']}  | {answer[:60]!r}", flush=True)
    with open(os.path.join(OUT, "manifest.json"), "w") as f: json.dump(manifest, f, indent=1)
    print("DONE", flush=True)

if __name__ == "__main__":
    main()
