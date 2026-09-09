"""Capture a separate, real 32-step / 128-position diffusion experiment.

Uses a pinned local Hugging Face revision. No network or old-trace rewriting.
Each model evaluation predicts all open positions, and the sampler commits the
four highest-confidence open positions in one operation. Provisional deltas
are produced online from that evaluation, never from the finished answer.

Run with the research environment (see the experiment README):
  HF_HUB_OFFLINE=1 TRANSFORMERS_OFFLINE=1 python scripts/capture-parallel-experiment.py
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import statistics
import subprocess
import time
from datetime import datetime, timezone

os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

import torch
import torch.nn.functional as F
import transformers
from transformers import AutoModelForMaskedLM, AutoTokenizer

ROOT = Path(__file__).resolve().parents[1]
MODEL = "dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1"
REVISION = "c8d24a3f4adaeef46881b450e1bf7d1005203bd7"
STEPS = 32
BOUND = 128
SEED = 0
PROMPTS = {
    "weather": "What's the weather like in metaphor land?",
    "sky-blue": "Explain to a child why the sky is blue.",
    "sleep-tips": "Give me three tips for sleeping better, one sentence each.",
}
SAMPLER = {
    "id": "lowconf-b128-s32", "remasking": "low_confidence",
    "block_size": BOUND, "steps": STEPS, "max_new_tokens": BOUND,
    "temperature": 0.0,
    "note": "Experimental real capture: 32 evaluations; four simultaneous token commitments per evaluation in one global 128-position field.",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def probability_bucket(value: float) -> float:
    return round(round(value / 0.05) * 0.05, 2)


def dump_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "data/experiments/parallel-qwen-2026-09-09")
    parser.add_argument("--prompts", nargs="+", choices=list(PROMPTS), default=list(PROMPTS))
    parser.add_argument("--remasking", choices=["low_confidence", "random"], default="low_confidence")
    args = parser.parse_args()
    sampler = SAMPLER | {
        "id": "random-b128-s32" if args.remasking == "random" else SAMPLER["id"],
        "remasking": args.remasking,
        "note": "Experimental real capture: 32 evaluations; four simultaneous token commitments per evaluation in one global 128-position field. Positions selected by " + ("seeded random scores." if args.remasking == "random" else "highest current model probability."),
    }
    output = args.output.resolve()
    if (output / "manifest.json").exists() or list(output.glob("compact/*.json")):
        raise SystemExit("Refusing to overwrite an existing experiment; choose a fresh --output.")
    (output / "full").mkdir(parents=True, exist_ok=True)
    (output / "compact").mkdir(parents=True, exist_ok=True)

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    torch.manual_seed(SEED)
    tokenizer = AutoTokenizer.from_pretrained(MODEL, revision=REVISION, trust_remote_code=True, local_files_only=True)
    started_at = datetime.now(timezone.utc).isoformat()
    load_start = time.perf_counter()
    model = AutoModelForMaskedLM.from_pretrained(
        MODEL, revision=REVISION, trust_remote_code=True, local_files_only=True,
        dtype=torch.bfloat16,
    ).to(device).eval()
    if device == "mps":
        torch.mps.synchronize()
    load_ms = (time.perf_counter() - load_start) * 1000
    decode = lambda values: tokenizer.decode(values, skip_special_tokens=False)
    eos_ids = {tokenizer.eos_token_id, tokenizer.pad_token_id}
    code_revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    script_hash = sha256(Path(__file__))
    (output / "capture-source.py").write_bytes(Path(__file__).read_bytes())
    captures = []
    print(f"Loaded pinned {MODEL}@{REVISION} on {device} in {load_ms:.1f} ms", flush=True)

    for prompt_id in args.prompts:
        torch.manual_seed(SEED)
        selection_generator = torch.Generator(device="cpu").manual_seed(SEED)
        prompt = PROMPTS[prompt_id]
        prompt_ids = tokenizer.apply_chat_template(
            [{"role": "user", "content": prompt}], add_generation_prompt=True,
            tokenize=True, enable_thinking=False,
        )
        prefix = len(prompt_ids)
        x = torch.full((1, prefix + BOUND), tokenizer.mask_token_id, dtype=torch.long, device=device)
        x[0, :prefix] = torch.tensor(prompt_ids, device=device)
        committed = {}
        steps = []
        drafts = []
        spins = []
        previous_drafts = {}
        previous_spins = {}
        previous_argmax = None
        flips = [0] * BOUND
        if device == "mps":
            torch.mps.synchronize()
        capture_start = time.perf_counter()
        previous_available_ms = 0.0
        for step_index in range(STEPS):
            forward_start = time.perf_counter()
            with torch.inference_mode():
                logits = model(x).logits[0, prefix:]
                if device == "mps":
                    torch.mps.synchronize()
                forward_ms = (time.perf_counter() - forward_start) * 1000
                predictions = logits.argmax(-1)
                probabilities = F.softmax(logits.float(), -1).gather(-1, predictions.unsqueeze(-1)).squeeze(-1)
                open_mask = x[0, prefix:] == tokenizer.mask_token_id
                selection_scores = probabilities if args.remasking == "low_confidence" else torch.rand(probabilities.shape, generator=selection_generator).to(device)
                scores = torch.where(open_mask, selection_scores, torch.full_like(probabilities, -1.0))
                selected = torch.topk(scores, k=BOUND // STEPS).indices.tolist()
                argmax = predictions.tolist()
                pmax = probabilities.tolist()
                assert len(selected) == 4 and not any(position in committed for position in selected)
                # Every selection comes from the same pre-commit model evaluation.
                x[0, [prefix + position for position in selected]] = predictions[selected]
            if previous_argmax is not None:
                for position in range(BOUND):
                    if position not in committed and argmax[position] != previous_argmax[position]:
                        flips[position] += 1
            previous_argmax = argmax
            for position in selected:
                committed[position] = {
                    "pos": position, "token_id": argmax[position],
                    "text": decode([argmax[position]]), "step": step_index,
                    "conf": pmax[position], "flips": flips[position],
                }
            # Online derivation: this branch consults only this evaluation and
            # the already committed set. No future token table or final bounds.
            draft_now = {
                position: (argmax[position], probability_bucket(pmax[position]))
                for position in range(BOUND)
                if position not in committed and pmax[position] >= 0.2
            }
            draft_delta = []
            for position, (token_id, p) in draft_now.items():
                previous = previous_drafts.get(position)
                if previous is None or previous[0] != token_id or abs(previous[1] - p) >= 0.05 - 1e-9:
                    draft_delta.append([position, decode([token_id]), p])
            for position in previous_drafts:
                if position not in committed and position not in draft_now:
                    draft_delta.append([position, "", 0])
            previous_drafts = draft_now
            spin_delta = []
            for position in range(BOUND):
                if position not in committed and previous_spins.get(position) != argmax[position]:
                    previous_spins[position] = argmax[position]
                    spin_delta.append([position, decode([argmax[position]]), probability_bucket(pmax[position])])
            drafts.append(draft_delta)
            spins.append(spin_delta)
            if device == "mps":
                torch.mps.synchronize()
            available_ms = (time.perf_counter() - capture_start) * 1000
            steps.append({
                "i": step_index, "block": 0, "ms": round(forward_ms, 3),
                "available_ms": round(available_ms, 3),
                "interval_ms": round(available_ms - previous_available_ms, 3),
                "committed": selected, "argmax": argmax, "pmax": pmax,
                "selection_scores": selection_scores.tolist(),
                "drafts": draft_delta, "spins": spin_delta,
            })
            previous_available_ms = available_ms

        generated_ids = x[0, prefix:].tolist()
        first_eos = next((position for position, token_id in enumerate(generated_ids) if token_id in eos_ids), BOUND)
        answer = tokenizer.decode(generated_ids[:first_eos], skip_special_tokens=True)
        tokens = [committed[position] | {"tail": position >= first_eos} for position in range(BOUND)]
        concatenated = "".join(token["text"] for token in tokens[:first_eos])
        assert concatenated == answer, "Per-token pieces must exactly reproduce decoded content for this replay adapter."
        # Retrospective labels retained for TraceCompact compatibility and
        # quality audit only. The causal replay adapter never reads this table.
        words = []
        starts = []
        cursor = 0
        for token in tokens[:first_eos]:
            starts.append((cursor, cursor + len(token["text"]), token))
            cursor += len(token["text"])
        for match in re.finditer(r"\S+", answer):
            overlaps = [token for start, end, token in starts if end > match.start() and start < match.end()]
            words.append({
                "index": len(words), "text": match.group(), "tokens": [token["pos"] for token in overlaps],
                "lock_step": max(token["step"] for token in overlaps),
                "first_step": min(token["step"] for token in overlaps),
                "conf": min(token["conf"] for token in overlaps), "changes": [],
            })
        content_batch_sizes = [sum(position < first_eos for position in step["committed"]) for step in steps]
        stats = {
            "content_tokens": first_eos, "words": len(words),
            "ms_total": round(sum(step["ms"] for step in steps), 3),
            "ms_per_step_median": round(statistics.median(step["ms"] for step in steps), 3),
            "capture_loop_ms": round(previous_available_ms, 3),
            "multi_token_steps": sum(len(step["committed"]) > 1 for step in steps),
            "multi_content_token_steps": sum(count > 1 for count in content_batch_sizes),
            "max_content_tokens_per_step": max(content_batch_sizes),
            "tail_tokens": BOUND - first_eos,
        }
        trace_id = f"{prompt_id}__{sampler['id']}"
        tail_done_step = max((token["step"] for token in tokens if token["tail"]), default=None)
        compact = {
            "id": trace_id, "prompt_id": prompt_id, "prompt": prompt, "model": MODEL,
            "sampler": sampler, "answer": answer, "tokens": tokens, "words": words,
            "step_ms": [step["ms"] for step in steps],
            "step_wall_ms": [step["interval_ms"] for step in steps],
            "drafts": drafts, "spins": spins, "tail_done_step": tail_done_step,
            "stats": stats,
            "experimental": True,
        }
        full = compact | {
            "model_revision": REVISION, "source_revision": code_revision,
            "capture_script_sha256": script_hash, "seed": SEED, "device": device,
            "prompt_token_ids": prompt_ids, "generated_token_ids": generated_ids,
            "eos_token_ids": sorted(eos_ids), "mask_token_id": tokenizer.mask_token_id,
            "steps": steps,
        }
        full_path = output / "full" / f"{trace_id}.json.gz"
        with gzip.open(full_path, "wt", encoding="utf-8") as stream:
            json.dump(full, stream, ensure_ascii=False, separators=(",", ":"))
        compact_path = output / "compact" / f"{trace_id}.json"
        compact_path.write_text(json.dumps(compact, ensure_ascii=False, separators=(",", ":")) + "\n")
        captures.append({
            "id": trace_id, "prompt_id": prompt_id, "stats": stats,
            "content_tokens_per_step": content_batch_sizes,
            "full": str(full_path.relative_to(output)), "full_sha256": sha256(full_path),
            "compact": str(compact_path.relative_to(output)), "compact_sha256": sha256(compact_path),
            "exact_piece_concat_matches_decoded_answer": True,
        })
        print(f"{trace_id}: {stats['ms_total']:.1f} ms forward / {stats['capture_loop_ms']:.1f} ms loop; {stats['multi_content_token_steps']} multi-content steps; answer={answer!r}", flush=True)

    manifest = {
        "schema_version": 1, "experimental": True, "captured_at_utc": started_at,
        "model": MODEL, "model_revision": REVISION, "source_revision": code_revision,
        "capture_script": str(Path(__file__).relative_to(ROOT)), "capture_script_sha256": script_hash,
        "capture_source_snapshot": "capture-source.py",
        "sampler": sampler, "seed": SEED,
        "runtime": {
            "python": platform.python_version(), "torch": torch.__version__,
            "transformers": transformers.__version__, "platform": platform.platform(),
            "machine": platform.machine(), "device": device, "dtype": "torch.bfloat16",
            "deterministic_algorithms": torch.are_deterministic_algorithms_enabled(),
            "model_load_ms": round(load_ms, 3), "warmup_forward_passes": 0,
        },
        "clocks": {
            "step_ms": "Synchronized model-forward duration only; retains first-step warmup. Existing replayTrace uses cumulative step_ms. This excludes selection, snapshots, tokenizer work, load and network; not end-to-end latency.",
            "step_wall_ms": "Observed monotonic intervals between step snapshots becoming available, including forward, selection, device-to-host and online draft encoding; origin immediately before first forward. Excludes prompt/model loading and final file serialization. Use cumulative values for the experimental observed capture-loop replay.",
        },
        "causality": "Each step commits four previously masked positions from one actual model evaluation. Deltas are created online after that commitment, using pre-commit argmax at still-open positions. No old commitments are regrouped. Answer/words/tail are retrospective audit labels and must never drive geometry or event availability.",
        "limitations": [
            "Three fixed prompts from one small model and one sampler; no claims of representative answer quality or reader benefit.",
            "Four token commitments do not imply four complete words, sentences, or independent list items.",
            "Global low-confidence selection can commit EOS positions before useful content and produce very short answers.",
            "Seed is fixed, but exact numerical reproducibility across MPS/PyTorch/hardware versions is not guaranteed.",
            "The previous 60-trace corpus used one token per step; these recordings are a separate experiment and are excluded from its aggregate claims.",
        ],
        "captures": captures,
    }
    dump_json(output / "manifest.json", manifest)


if __name__ == "__main__":
    main()
