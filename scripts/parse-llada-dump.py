"""Turn a llama-diffusion-cli per-step dump (DIFFUSION_DUMP jsonl) into the
same compact trajectory shape as capture.py, minus confidences (llama.cpp's
sampler does not expose them through the step callback). Order and timing are
real; conf is reported as null and flips as null."""
import json, re, sys, os
from transformers import AutoTokenizer
tok = AutoTokenizer.from_pretrained("GSAI-ML/LLaDA-8B-Instruct", trust_remote_code=True)
def kendall_tau(a, b):
    n=len(a); c=d=0
    for i in range(n):
        for j in range(i+1,n):
            s=(a[i]-a[j])*(b[i]-b[j]); c+= s>0; d+= s<0
    tot=n*(n-1)/2; return (c-d)/tot if tot else 0.0
def parse(dump_path, prompt_id, prompt, cfg_id, note, block_size, out_dir):
    lines=[json.loads(l) for l in open(dump_path) if l.strip()]
    if not lines: raise SystemExit("empty dump")
    n=len(lines[0]["tokens"]); commit_step=[-1]*n; commit_tok=[0]*n; step_ms=[]; prev_ms=0.0
    prev=[-1]*n
    for li,l in enumerate(lines):
        cur=l["tokens"]; step_ms.append(round(l["ms"]-prev_ms,1)); prev_ms=l["ms"]
        for q in range(n):
            if prev[q]==-1 and cur[q]!=-1: commit_step[q]=li; commit_tok[q]=cur[q]
        prev=cur
    eos=tok.eos_token_id
    first_eos=next((q for q,t in enumerate(commit_tok) if t==eos or t==126081), n)  # 126081 = <|endoftext|> in LLaDA vocab
    content_ids=commit_tok[:first_eos]
    spans=[]; prev_len=0
    for q in range(len(content_ids)):
        txt=tok.decode(content_ids[:q+1], skip_special_tokens=True); spans.append((prev_len,len(txt))); prev_len=len(txt)
    answer=tok.decode(content_ids, skip_special_tokens=True)
    tokens=[{"pos":q,"text":tok.decode([commit_tok[q]],skip_special_tokens=False),"step":commit_step[q],"conf":None,"flips":None,"tail":q>=first_eos} for q in range(n)]
    words=[]
    for m in re.finditer(r"\S+", answer):
        a,b=m.start(),m.end(); toks=[t for t in tokens[:first_eos] if spans[t["pos"]][1]>a and spans[t["pos"]][0]<b]
        if not toks: continue
        words.append({"index":len(words),"text":m.group(0),"tokens":[t["pos"] for t in toks],"lock_step":max(t["step"] for t in toks),"first_step":min(t["step"] for t in toks),"conf":None})
    ct=tokens[:first_eos]; order=sorted(ct,key=lambda t:t["step"]); pbr=[t["pos"] for t in order]
    jumps=[abs(pbr[i]-pbr[i-1]) for i in range(1,len(pbr))]
    tail=[t["step"] for t in tokens if t["tail"]]; lastc=max(t["step"] for t in ct) if ct else 0
    stats={"content_tokens":len(ct),"words":len(words),
           "kendall_tau_step_vs_position":round(kendall_tau([t["step"] for t in ct],[t["pos"] for t in ct]),4) if len(ct)>1 else 0,
           "mean_jump":round(sum(jumps)/len(jumps),2) if jumps else 0,"expected_random_jump":round((len(ct)+1)/3,2),
           "adjacent_commit_fraction":round(sum(1 for j in jumps if j==1)/len(jumps),4) if jumps else 0,
           "tail_tokens":len(tail),"tail_all_committed_by_step":max(tail) if tail else None,"last_content_committed_step":lastc,
           "tail_before_last_content":(max(tail)<lastc) if tail else None,
           "ms_per_step_median":round(sorted(step_ms)[len(step_ms)//2],1),"ms_total":round(sum(step_ms),1)}
    out={"id":f"{prompt_id}__{cfg_id}","prompt_id":prompt_id,"prompt":prompt,"model":"GSAI-ML/LLaDA-8B-Instruct (Q4_K_S via llama.cpp)",
         "sampler":{"id":cfg_id,"remasking":"low_confidence","block_size":block_size,"steps":len(lines),"max_new_tokens":n,"temperature":0.0,"note":note},
         "answer":answer,"words":words,"tokens":tokens,"step_ms":step_ms,"stats":stats}
    os.makedirs(out_dir,exist_ok=True)
    json.dump(out,open(os.path.join(out_dir,out["id"]+".json"),"w"))
    return out
if __name__=="__main__":
    dump,pid,prompt,cfg,note,bs,outd=sys.argv[1:8]
    o=parse(dump,pid,prompt,cfg,note,int(bs),outd)
    print(json.dumps({"id":o["id"],"stats":o["stats"],"answer":o["answer"][:120]}))
