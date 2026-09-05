"""Derive design inputs from the full traces and write them into the compact
files the site loads:
  words[i].changes      [[step, text], ...]  the provisional text the model would
                        have shown for that word at each step where it changed,
                        ending with the committed text (real "mind changes")
  tail_done_step        the step at which every end-of-sequence position had
                        committed (the answer's length became fixed), or null
"""
import json, gzip, os, glob
from transformers import AutoTokenizer
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "traces")
tok = AutoTokenizer.from_pretrained("dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1", trust_remote_code=True)
cache = {}
def piece(i):
    if i not in cache: cache[i] = tok.decode([i], skip_special_tokens=False)
    return cache[i]
n_done = 0
for fp in sorted(glob.glob(os.path.join(OUT, "full", "*.json.gz"))):
    full = json.load(gzip.open(fp, "rt"))
    cp = os.path.join(OUT, "compact", os.path.basename(fp).replace(".json.gz", ".json"))
    compact = json.load(open(cp))
    steps = full["steps"]; tokens = full["tokens"]
    for w in compact["words"]:
        pos = w["tokens"]; changes = []; prev = None
        for s in range(0, w["lock_step"] + 1):
            am = steps[s]["argmax"]
            # committed piece once committed, else the step's provisional argmax piece
            pm = steps[s]["pmax"]
            txt = "".join((tokens[q]["text"] if 0 <= tokens[q]["step"] <= s else piece(am[q])) for q in pos).strip()
            # the guess's probability: the weakest uncommitted token's max-prob at
            # this step (once everything is committed, the word's commit conf)
            open_ps = [pm[q] for q in pos if not (0 <= tokens[q]["step"] <= s)]
            pw = min(open_ps) if open_ps else w["conf"]
            if txt != prev:
                changes.append([s, txt, round(float(pw), 3)]); prev = txt
        w["changes"] = changes
        if changes and changes[-1][1] != w["text"]:
            print(f"  warn {compact['id']} word {w['index']}: final provisional {changes[-1][1]!r} != {w['text']!r}")
    tail = [t["step"] for t in tokens if t["tail"] and t["step"] >= 0]
    compact["tail_done_step"] = max(tail) if tail else None
    json.dump(compact, open(cp, "w"))
    n_done += 1
print(f"enriched {n_done} compact traces")
