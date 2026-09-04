"""Aggregate the capture manifest into summary.json: per-config medians/means
for every statistic, plus paired comparisons across configs on the same prompt."""
import json, os, statistics as st
OUT = os.path.join(os.path.dirname(__file__), "..", "data", "traces")
man = json.load(open(os.path.join(OUT, "manifest.json")))
by_cfg = {}
for m in man: by_cfg.setdefault(m["config"], []).append(m)
KEYS = ["kendall_tau_step_vs_position","mean_jump","expected_random_jump","adjacent_commit_fraction",
        "median_commit_conf","low_conf_commits_frac","first_quartile_stopword_frac","overall_stopword_frac",
        "mean_flips_per_token","tokens_with_any_flip_frac","content_tokens","words","ms_per_step_median","ms_total",
        "tail_all_committed_by_step","last_content_committed_step"]
# Order statistics are meaningless on an empty answer and trivial on a very
# short one (two tokens are always "in order"), so they are computed over
# trajectories with at least MIN_CONTENT content tokens; the excluded count is
# reported rather than hidden. Timing stats use every trajectory.
MIN_CONTENT = 8
ORDER_KEYS = {"kendall_tau_step_vs_position","mean_jump","expected_random_jump","adjacent_commit_fraction",
              "median_commit_conf","low_conf_commits_frac","first_quartile_stopword_frac","overall_stopword_frac",
              "mean_flips_per_token","tokens_with_any_flip_frac","tail_all_committed_by_step","last_content_committed_step"}
summary = {"n_prompts": len({m["prompt_id"] for m in man}), "min_content_tokens_for_order_stats": MIN_CONTENT, "configs": {}}
for cfg, rows in by_cfg.items():
    agg = {}
    usable = [r for r in rows if r["stats"]["content_tokens"] >= MIN_CONTENT]
    agg["n_total"] = len(rows); agg["n_used_for_order_stats"] = len(usable)
    agg["empty_answers"] = sum(1 for r in rows if r["stats"]["content_tokens"] == 0)
    agg["short_answers_excluded"] = len(rows) - len(usable)
    for k in KEYS:
        src = usable if k in ORDER_KEYS else rows
        vals = [r["stats"][k] for r in src if isinstance(r["stats"].get(k), (int, float))]
        if vals: agg[k] = {"median": round(st.median(vals), 4), "mean": round(st.mean(vals), 4), "min": round(min(vals), 4), "max": round(max(vals), 4), "n": len(vals)}
    tb = [r["stats"]["tail_before_last_content"] for r in usable if r["stats"]["tail_before_last_content"] is not None]
    agg["tail_before_last_content_frac"] = round(sum(tb) / len(tb), 4) if tb else None
    agg["tail_present_n"] = len(tb)
    summary["configs"][cfg] = agg
# paired: same prompt, lowconf vs random
pairs = []
for pid in {m["prompt_id"] for m in man}:
    a = next((m for m in man if m["prompt_id"] == pid and m["config"] == "lowconf-b32"), None)
    b = next((m for m in man if m["prompt_id"] == pid and m["config"] == "random-b32"), None)
    c = next((m for m in man if m["prompt_id"] == pid and m["config"] == "lowconf-b128"), None)
    if a and b and c and min(x["stats"]["content_tokens"] for x in (a, b, c)) >= MIN_CONTENT:
        pairs.append({"prompt_id": pid,
            "tau": {"lowconf-b32": a["stats"]["kendall_tau_step_vs_position"], "random-b32": b["stats"]["kendall_tau_step_vs_position"], "lowconf-b128": c["stats"]["kendall_tau_step_vs_position"]},
            "jump": {"lowconf-b32": a["stats"]["mean_jump"], "random-b32": b["stats"]["mean_jump"], "lowconf-b128": c["stats"]["mean_jump"]},
            "flips": {"lowconf-b32": a["stats"]["mean_flips_per_token"], "random-b32": b["stats"]["mean_flips_per_token"], "lowconf-b128": c["stats"]["mean_flips_per_token"]}})
summary["paired"] = pairs
json.dump(summary, open(os.path.join(OUT, "summary.json"), "w"), indent=1)
for cfg, agg in summary["configs"].items():
    print(f"\n== {cfg} ==")
    for k in ["kendall_tau_step_vs_position","mean_jump","adjacent_commit_fraction","median_commit_conf","low_conf_commits_frac","first_quartile_stopword_frac","overall_stopword_frac","mean_flips_per_token","tokens_with_any_flip_frac","ms_per_step_median","content_tokens"]:
        if k in agg: print(f"  {k:34s} median {agg[k]['median']:8.3f}   mean {agg[k]['mean']:8.3f}   [{agg[k]['min']:.3f}, {agg[k]['max']:.3f}]")
    print(f"  tail_before_last_content_frac      {agg['tail_before_last_content_frac']}  (n={agg['tail_present_n']})")
    print(f"  used {agg['n_used_for_order_stats']}/{agg['n_total']} for order stats; empty answers {agg['empty_answers']}; short excluded {agg['short_answers_excluded']}")
