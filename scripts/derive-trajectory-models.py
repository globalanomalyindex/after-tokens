"""Fit reusable design parameters from the recorded trajectories:
  derived/order-model.json   growth-process statistics per config: seeds per
                             100 content tokens, adjacency probability, jump
                             histogram (fit inputs for an empirical lock order)
  derived/cadence.json       word lock time as a fraction of the run, by word
                             rank, pooled per config (the curve phi-decay is a
                             stylization of, drawn from data)
"""
import json, os, glob, statistics as st
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "traces")
S = json.load(open(os.path.join(OUT, "summary.json"))); MINC = S["min_content_tokens_for_order_stats"]
os.makedirs(os.path.join(OUT, "derived"), exist_ok=True)
order = {}; cadence = {}
for cfg in ["lowconf-b32", "random-b32", "lowconf-b128"]:
    seeds_per_100 = []; p_adj = []; hist = {"1": 0, "2": 0, "3-5": 0, "6-10": 0, "11+": 0}; n_tr = 0
    rank_curves = []  # each: list of lock fraction by word rank (normalized rank 0..1)
    for fp in sorted(glob.glob(os.path.join(OUT, "compact", f"*__{cfg}.json"))):
        t = json.load(open(fp)); ct = [x for x in t["tokens"] if not x["tail"] and x["step"] >= 0]
        if len(ct) < MINC: continue
        n_tr += 1
        committed = set(); seeds = 0; adj = 0; prev = None
        for x in sorted(ct, key=lambda x: x["step"]):
            p = x["pos"]
            if committed and (p - 1 in committed or p + 1 in committed): adj += 1
            elif committed: seeds += 1
            else: seeds += 1
            if prev is not None:
                j = abs(p - prev); k = "1" if j == 1 else "2" if j == 2 else "3-5" if j <= 5 else "6-10" if j <= 10 else "11+"; hist[k] += 1
            committed.add(p); prev = p
        seeds_per_100.append(100 * seeds / len(ct)); p_adj.append(adj / max(1, len(ct) - 1))
        ws = sorted(t["words"], key=lambda w: w["lock_step"]); n = len(ws); steps = t["sampler"]["steps"]
        rank_curves.append([(i / max(1, n - 1), w["lock_step"] / (steps - 1)) for i, w in enumerate(ws)])
    tot = sum(hist.values()) or 1
    order[cfg] = {"n": n_tr, "seeds_per_100_tokens": round(st.median(seeds_per_100), 2) if seeds_per_100 else None,
                  "p_adjacent": round(st.median(p_adj), 3) if p_adj else None,
                  "jump_hist": {k: round(v / tot, 3) for k, v in hist.items()}}
    # pooled cadence: for 21 rank bins, median lock fraction
    bins = [[] for _ in range(21)]
    for curve in rank_curves:
        for r, f in curve: bins[min(20, int(round(r * 20)))].append(f)
    cadence[cfg] = {"n": n_tr, "rank": [round(i / 20, 2) for i in range(21)],
                    "lock_fraction_median": [round(st.median(b), 3) if b else None for b in bins],
                    "lock_fraction_p25": [round(sorted(b)[len(b) // 4], 3) if b else None for b in bins],
                    "lock_fraction_p75": [round(sorted(b)[(3 * len(b)) // 4], 3) if b else None for b in bins]}
json.dump(order, open(os.path.join(OUT, "derived", "order-model.json"), "w"), indent=1)
json.dump(cadence, open(os.path.join(OUT, "derived", "cadence.json"), "w"), indent=1)
for cfg, o in order.items(): print(cfg, json.dumps(o))
for cfg, c in cadence.items(): print(cfg, "cadence median by rank:", c["lock_fraction_median"])
