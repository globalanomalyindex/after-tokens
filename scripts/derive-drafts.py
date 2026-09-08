"""
Derive the model's drafts from the full traces and write them into the compact
files the site loads, plus the statistics the case study cites.

A draft is the model's provisional argmax for a position it has not committed
yet. At every step the recording holds one for every open position. Most of
them are the corpus prior (median probability about 0.065, decoding as "the"),
so a draft is recorded only while its probability clears RECORD_FLOOR; the
site shows it only above PROVISIONAL_FLOOR (lib/diffusion/traces.ts), which
leaves a little room for hysteresis.

  compact[id].drafts   one list per denoising step of [pos, text, p] entries,
                       recorded when a position's draft first clears the
                       floor, when its text changes while above it, or when
                       its probability moves by DP or more; [pos, "", 0] when
                       it falls back below the floor while still open. A
                       commit at a position ends its draft implicitly.
  derived/drafts.json  what the drafts do, over every recording whose answer
                       has at least MIN_CONTENT content tokens: how often a
                       draft is visible, how often it is right, how long it
                       holds before commit, how often it never changes again,
                       and how much a commit lifts its neighbors' confidence.

Run from the research environment, which has the tokenizer:
  ~/.cache/after-tokens-research/.venv/bin/python scripts/derive-drafts.py
"""
import glob
import gzip
import json
import os
import statistics as st
import sys
from collections import defaultdict

from transformers import AutoTokenizer

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
FULL = os.path.join(ROOT, "data", "traces", "full")
COMPACT = os.path.join(ROOT, "data", "traces", "compact")
DERIVED = os.path.join(ROOT, "data", "traces", "derived")
RECORD_FLOOR = 0.2
DISPLAY_FLOOR = 0.25
FLOORS = [0.15, 0.2, 0.25, 0.3, 0.4, 0.5]
DP = 0.05
MIN_CONTENT = 8
END = {"<|endoftext|>", "<|im_end|>"}

tok = AutoTokenizer.from_pretrained("dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1", trust_remote_code=True)
_cache = {}


def piece(i):
    if i not in _cache:
        _cache[i] = tok.decode([i], skip_special_tokens=False)
    return _cache[i]


def q(p):
    return round(round(p / DP) * DP, 2)


def median(xs):
    return st.median(xs) if xs else None


def mean(xs):
    return st.mean(xs) if xs else None


def main():
    files = sorted(glob.glob(os.path.join(FULL, "*.json.gz")))
    agg = {f: dict(pairs=0, vis=0, correct=0, steps=0, steps_with=0, polish=[], stable=0, cleared=0, word_initial=0, flips=[]) for f in FLOORS}
    percfg = defaultdict(lambda: dict(runs=0, share_by_decile=[[] for _ in range(10)], polish=[], correct=0, vis=0, pairs=0, first_draft_step=[]))
    lift = defaultdict(lambda: dict(nb=[], other=[]))
    shown = dict(pairs=0, vis=0, correct=0, steps=0, steps_with=0, polish=[], cleared=0, stable=0)
    shown_cfg = defaultdict(lambda: dict(pairs=0, vis=0, correct=0, polish=[], share_by_decile=[[] for _ in range(10)]))
    written = 0
    for fn in files:
        d = json.load(gzip.open(fn, "rt"))
        cfg = d["sampler"]["id"]
        toks, steps = d["tokens"], d["steps"]
        n = len(toks)
        commit_step = {t["pos"]: t["step"] for t in toks}
        final_id = {t["pos"]: steps[t["step"]]["argmax"][t["pos"]] for t in toks}
        content = [t["pos"] for t in toks if not t["tail"]]
        # ---- the compact drafts ----
        drafts = []
        prev = {}  # pos -> (id, qp) while recordable
        for si, s in enumerate(steps):
            pm, am = s["pmax"], s["argmax"]
            entries = []
            now = {}
            for pos in range(n):
                if commit_step[pos] <= si:
                    continue
                if pm[pos] >= RECORD_FLOOR:
                    now[pos] = (am[pos], q(pm[pos]))
            for pos, (tid, qp) in now.items():
                before = prev.get(pos)
                if before is None or before[0] != tid or abs(before[1] - qp) >= DP - 1e-9:
                    entries.append([pos, piece(tid), qp])
            for pos in prev:
                if pos not in now and commit_step[pos] > si:
                    entries.append([pos, "", 0])
            prev = now
            drafts.append(entries)
        cp = os.path.join(COMPACT, os.path.basename(fn).replace(".json.gz", ".json"))
        compact = json.load(open(cp))
        compact["drafts"] = drafts
        # ---- what the surface shows: the compact entries under the reducer's
        # rule (shown above the display floor, kept while the text holds) ----
        if len(content) >= MIN_CONTENT:
            held = {}
            S = len(steps)
            first_shown = {}
            last_text = {}
            flips_shown = defaultdict(int)
            sc = shown_cfg[cfg]
            for si, entries in enumerate(drafts):
                for pos, text, p in entries:
                    if text == "":
                        held.pop(pos, None)
                        continue
                    before = held.get(pos)
                    is_shown = p >= DISPLAY_FLOOR or bool(before and before[2] and before[0] == text)
                    held[pos] = (text, p, is_shown)
                open_c = [p for p in content if commit_step[p] > si]
                vis = [p for p in open_c if p in held and held[p][2]]
                shown["steps"] += 1
                shown["pairs"] += len(open_c)
                shown["vis"] += len(vis)
                sc["pairs"] += len(open_c)
                sc["vis"] += len(vis)
                if vis:
                    shown["steps_with"] += 1
                sc["share_by_decile"][min(9, int(10 * si / S))].append(len(vis) / max(1, len(open_c)))
                for p in vis:
                    text = held[p][0]
                    final = piece(final_id[p])
                    ok = text == final or (text in END and final in END)
                    if ok:
                        shown["correct"] += 1
                        sc["correct"] += 1
                    if p not in first_shown:
                        first_shown[p] = si
                    if p in last_text and last_text[p] != text:
                        flips_shown[p] += 1
                    last_text[p] = text
            for p, s0 in first_shown.items():
                shown["polish"].append(commit_step[p] - s0)
                sc["polish"].append(commit_step[p] - s0)
                shown["cleared"] += 1
                if flips_shown[p] == 0:
                    shown["stable"] += 1
        with open(cp, "w") as f:
            json.dump(compact, f, separators=(",", ":"), ensure_ascii=False)
        written += 1
        # ---- the statistics, over content positions of usable answers ----
        if len(content) < MIN_CONTENT:
            continue
        S = len(steps)
        pc = percfg[cfg]
        pc["runs"] += 1
        first_clear = {f: {} for f in FLOORS}
        flips_after = {f: defaultdict(int) for f in FLOORS}
        last = {f: {} for f in FLOORS}
        first_any = None
        for si, s in enumerate(steps):
            pm, am = s["pmax"], s["argmax"]
            open_c = [p for p in content if commit_step[p] > si]
            for f in FLOORS:
                a = agg[f]
                a["steps"] += 1
                vis = [p for p in open_c if pm[p] >= f]
                a["pairs"] += len(open_c)
                a["vis"] += len(vis)
                if vis:
                    a["steps_with"] += 1
                for p in vis:
                    if am[p] == final_id[p]:
                        a["correct"] += 1
                    txt = piece(am[p])
                    if txt[:1].isspace() or not any(c.isalnum() for c in txt):
                        a["word_initial"] += 1
                    if p not in first_clear[f]:
                        first_clear[f][p] = si
                    if p in last[f] and last[f][p] != am[p]:
                        flips_after[f][p] += 1
                    last[f][p] = am[p]
                if f == DISPLAY_FLOOR:
                    pc["pairs"] += len(open_c)
                    pc["vis"] += len(vis)
                    pc["correct"] += sum(1 for p in vis if am[p] == final_id[p])
                    pc["share_by_decile"][min(9, int(10 * si / S))].append(len(vis) / max(1, len(open_c)))
                    if vis and first_any is None:
                        first_any = si
            if si + 1 < S:
                pm2 = steps[si + 1]["pmax"]
                nb = set()
                for p in s["committed"]:
                    for r in (p - 1, p + 1):
                        if 0 <= r < n and commit_step[r] > si + 1 and r in content:
                            nb.add(r)
                for p in content:
                    if commit_step[p] > si + 1:
                        (lift[cfg]["nb"] if p in nb else lift[cfg]["other"]).append(pm2[p] - pm[p])
        pc["first_draft_step"].append(first_any if first_any is not None else S)
        for f in FLOORS:
            for p, s0 in first_clear[f].items():
                a = agg[f]
                a["polish"].append(commit_step[p] - s0)
                a["flips"].append(flips_after[f][p])
                a["cleared"] += 1
                if flips_after[f][p] == 0:
                    a["stable"] += 1
                if f == DISPLAY_FLOOR:
                    pc["polish"].append(commit_step[p] - s0)
    out = {
        "model": "dllm-hub/Qwen3-0.6B-diffusion-mdlm-v0.1",
        "recordFloor": RECORD_FLOOR,
        "displayFloor": DISPLAY_FLOOR,
        "minContentTokens": MIN_CONTENT,
        "note": "over content positions of every recording with at least minContentTokens content tokens; a pair is one open content position at one step. `shown` is what the surface draws: the recorded entries under the reducer's rule (a draft shows at or above the display floor and keeps showing while its text holds), accuracy by decoded text. `byFloor` explores the raw per-step probabilities at other floors, accuracy by token id.",
        "shown": {
            "visibleShare": round(shown["vis"] / shown["pairs"], 4),
            "accuracy": round(shown["correct"] / max(1, shown["vis"]), 4),
            "stepsWithDraftShare": round(shown["steps_with"] / shown["steps"], 4),
            "medianPolishSteps": median(shown["polish"]),
            "meanPolishSteps": round(mean(shown["polish"]), 2),
            "neverChangedShare": round(shown["stable"] / max(1, shown["cleared"]), 4),
            "byConfig": {
                cfg: {
                    "visibleShare": round(sc["vis"] / max(1, sc["pairs"]), 4),
                    "accuracy": round(sc["correct"] / max(1, sc["vis"]), 4),
                    "medianPolishSteps": median(sc["polish"]),
                    "visibleShareByDecile": [round(mean(x), 3) if x else None for x in sc["share_by_decile"]],
                }
                for cfg, sc in shown_cfg.items()
            },
        },
        "byFloor": {
            str(f): {
                "visibleShare": round(a["vis"] / a["pairs"], 4),
                "accuracy": round(a["correct"] / max(1, a["vis"]), 4),
                "stepsWithDraftShare": round(a["steps_with"] / a["steps"], 4),
                "medianPolishSteps": median(a["polish"]),
                "meanPolishSteps": round(mean(a["polish"]), 2),
                "neverChangedShare": round(a["stable"] / max(1, a["cleared"]), 4),
                "meanFlipsAfterClearing": round(mean(a["flips"]), 3),
                "wordInitialShare": round(a["word_initial"] / max(1, a["vis"]), 4),
            }
            for f, a in agg.items()
        },
        "byConfig": {
            cfg: {
                "runs": pc["runs"],
                "visibleShare": round(pc["vis"] / max(1, pc["pairs"]), 4),
                "accuracy": round(pc["correct"] / max(1, pc["vis"]), 4),
                "medianPolishSteps": median(pc["polish"]),
                "medianFirstDraftStep": median(pc["first_draft_step"]),
                "visibleShareByDecile": [round(mean(x), 3) if x else None for x in pc["share_by_decile"]],
                "neighborLift": round(mean(lift[cfg]["nb"]), 4),
                "neighborLiftN": len(lift[cfg]["nb"]),
                "otherLift": round(mean(lift[cfg]["other"]), 4),
                "otherLiftN": len(lift[cfg]["other"]),
            }
            for cfg, pc in percfg.items()
        },
    }
    os.makedirs(DERIVED, exist_ok=True)
    with open(os.path.join(DERIVED, "drafts.json"), "w") as f:
        json.dump(out, f, indent=2)
    print(f"wrote drafts into {written} compact traces and {os.path.join(DERIVED, 'drafts.json')}")
    for f, a in out["byFloor"].items():
        print(f, a)
    for cfg, pc in out["byConfig"].items():
        print(cfg, pc)


if __name__ == "__main__":
    sys.exit(main())
