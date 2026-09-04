#!/bin/bash
# LLaDA-8B-Instruct (Q4_K_S, llama.cpp on Metal) on four of the coda fixture
# prompts, with the per-step dump patch. llama.cpp applies its own chat template,
# so the prompt token count is learned from a one-step probe (single block, so
# any length is valid) and the real run is sized to generate exactly 128 tokens
# in 4 blocks of 32 over 128 steps, matching the 0.6B capture.
set -u
cd /Users/chrisfiore/.cache/after-tokens-research
source .venv/bin/activate
BIN=llama.cpp/build/bin/llama-diffusion-cli
MODEL=models/LLaDA-8B-Instruct.Q4_K_S.gguf
OUT=capture/llada; mkdir -p "$OUT/dumps" "$OUT/compact"
declare -a IDS=(weather diffusion-explain travel heron-poem)
declare -a PROMPTS=(
  "What's the weather like in metaphor land?"
  "Explain how diffusion text generation works."
  "Quick question. Should I take the train or fly?"
  "Write a poem about a heron at dawn."
)
for i in "${!IDS[@]}"; do
  id="${IDS[$i]}"; p="${PROMPTS[$i]}"
  probe="$OUT/dumps/$id.probe.jsonl"; rm -f "$probe"
  DIFFUSION_DUMP="$probe" "$BIN" -m "$MODEL" -p "$p" -ub 512 -c 512 --diffusion-block-length 512 --diffusion-steps 1 --temp 0 -ngl 99 > "$OUT/$id.probe.log" 2>&1
  gen=$(python -c "import json;print(len(json.loads(open('$probe').readline())['tokens']))" 2>/dev/null || echo 0)
  if [ "$gen" -le 0 ]; then echo "[$id] probe failed"; tail -3 "$OUT/$id.probe.log"; continue; fi
  n_in=$((512 - gen))
  # llama.cpp's LLaDA path blocks the WHOLE sequence, so its length must be a
  # multiple of the block length; pad up and run one step per position.
  ub=$(( ((n_in + 128 + 31) / 32) * 32 ))
  dump="$OUT/dumps/$id.jsonl"; rm -f "$dump"
  echo "[$((i+1))/4] $id  n_input=$n_in ubatch=$ub  $(date +%H:%M:%S)"
  DIFFUSION_DUMP="$dump" "$BIN" -m "$MODEL" -p "$p" -ub "$ub" -c "$ub" --diffusion-block-length 32 --diffusion-steps "$ub" --temp 0 -ngl 99 > "$OUT/$id.log" 2>&1
  python capture/parse_llada_dump.py "$dump" "$id" "$p" "llada8b-lowconf-b32" "LLaDA-8B-Instruct Q4_K_S via llama.cpp, low-confidence remasking, 4 blocks of 32" 32 "$OUT/compact" 2>/dev/null | tail -1
done
echo LLADA_DONE
