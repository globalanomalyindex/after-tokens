"""Independently check recorded parallel capture integrity and source causality.

This loads the pinned tokenizer only, never a model or an inference runtime.
Usage: python scripts/validate-parallel-experiment.py [experiment-directory]
"""
import gzip
import hashlib
import json
import os
from pathlib import Path
import sys

os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
from transformers import AutoTokenizer
import torch


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    root = Path(__file__).resolve().parents[1]
    directory = Path(sys.argv[1]) if len(sys.argv) > 1 else root / "data/experiments/parallel-qwen-2026-09-09"
    manifest = json.loads((directory / "manifest.json").read_text())
    assert digest(directory / manifest["capture_source_snapshot"]) == manifest["capture_script_sha256"]
    tokenizer = AutoTokenizer.from_pretrained(
        manifest["model"], revision=manifest["model_revision"],
        trust_remote_code=True, local_files_only=True,
    )
    decode = lambda token_id: tokenizer.decode([token_id], skip_special_tokens=False)
    bucket = lambda probability: round(round(probability / 0.05) * 0.05, 2)
    results = []
    for item in manifest["captures"]:
        compact_path = directory / item["compact"]
        full_path = directory / item["full"]
        assert digest(compact_path) == item["compact_sha256"]
        assert digest(full_path) == item["full_sha256"]
        compact = json.loads(compact_path.read_text())
        with gzip.open(full_path, "rt") as stream:
            raw = json.load(stream)
        assert len(raw["steps"]) == 32
        assert len(raw["tokens"]) == raw["sampler"]["max_new_tokens"] == 128
        assert compact["tokens"] == raw["tokens"]
        seen = set()
        prior_spins = {}
        prior_drafts = {}
        previous_available = 0
        validated_drafts = validated_spins = 0
        content_steps = []
        commit_quartiles = []
        first_eos = next((position for position, token_id in enumerate(raw["generated_token_ids"]) if token_id in raw["eos_token_ids"]), 128)
        selection_generator = torch.Generator(device="cpu").manual_seed(manifest["seed"])
        for step_index, step in enumerate(raw["steps"]):
            assert step["i"] == step_index
            selected = step["committed"]
            assert len(selected) == len(set(selected)) == 4
            assert not seen.intersection(selected)
            assert len(step["argmax"]) == len(step["pmax"]) == 128
            assert 0 < step["ms"] <= step["interval_ms"] + 0.002
            assert abs(step["available_ms"] - previous_available - step["interval_ms"]) < 0.003
            previous_available = step["available_ms"]
            # Tie ordering is backend-dependent; top-k still cannot select a
            # strictly less probable candidate while a better one stays open.
            unselected = set(range(128)) - seen - set(selected)
            scores = step.get("selection_scores", step["pmax"])
            if raw["sampler"]["remasking"] == "random":
                assert scores == torch.rand((128,), generator=selection_generator).tolist()
            else:
                assert scores == step["pmax"]
            if unselected:
                assert min(scores[position] for position in selected) >= max(scores[position] for position in unselected)
            for position in selected:
                token = raw["tokens"][position]
                assert token["pos"] == position and token["step"] == step_index
                assert token["token_id"] == step["argmax"][position] == raw["generated_token_ids"][position]
                assert token["token_id"] != raw["mask_token_id"]
                assert token["text"] == decode(token["token_id"])
                assert token["conf"] == step["pmax"][position]
            seen.update(selected)
            expected_spins = []
            current_drafts = {}
            for position in range(128):
                if position in seen:
                    continue
                token_id = step["argmax"][position]
                probability = step["pmax"][position]
                if prior_spins.get(position) != token_id:
                    expected_spins.append([position, decode(token_id), bucket(probability)])
                    prior_spins[position] = token_id
                if probability >= 0.2:
                    current_drafts[position] = (token_id, bucket(probability))
            assert step["spins"] == compact["spins"][step_index] == expected_spins
            expected_drafts = []
            for position, (token_id, probability) in current_drafts.items():
                prior = prior_drafts.get(position)
                if prior is None or prior[0] != token_id or abs(prior[1] - probability) >= 0.05 - 1e-9:
                    expected_drafts.append([position, decode(token_id), probability])
            for position in prior_drafts:
                if position not in seen and position not in current_drafts:
                    expected_drafts.append([position, "", 0])
            assert step["drafts"] == compact["drafts"][step_index] == expected_drafts
            prior_drafts = current_drafts
            validated_drafts += len(expected_drafts)
            validated_spins += len(expected_spins)
            content = [position for position in selected if position < first_eos]
            content_steps.append(len(content))
            commit_quartiles.append(len({position // 32 for position in content}))
        assert seen == set(range(128))
        assert compact["step_ms"] == [step["ms"] for step in raw["steps"]]
        assert compact["step_wall_ms"] == [step["interval_ms"] for step in raw["steps"]]
        decoded = tokenizer.decode(raw["generated_token_ids"][:first_eos], skip_special_tokens=True)
        assert decoded == raw["answer"] == compact["answer"]
        assert "".join(token["text"] for token in raw["tokens"][:first_eos]) == decoded
        assert all(token["tail"] == (token["pos"] >= first_eos) for token in raw["tokens"])
        results.append({
            "id": item["id"], "steps": 32, "unique_committed_positions": 128,
            "commits_per_step": 4, "content_tokens": first_eos,
            "multi_content_steps": sum(value > 1 for value in content_steps),
            "content_batch_histogram": {str(value): content_steps.count(value) for value in sorted(set(content_steps))},
            "max_request_quartiles_in_content_batch": max(commit_quartiles),
            "draft_entries_checked": validated_drafts, "spin_entries_checked": validated_spins,
            "exact_final_decode": True,
        })
    print(json.dumps({"passed": True, "captures": results}, indent=2))


if __name__ == "__main__":
    main()
