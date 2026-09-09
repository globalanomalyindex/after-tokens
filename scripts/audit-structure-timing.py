"""Audit committed formatting timing. Final-text classification is retrospective only."""
import hashlib,json,re,subprocess
from datetime import datetime, timezone
from pathlib import Path
repo=Path(__file__).resolve().parents[1]
out=repo/'data/experiments/structure-timing-2026-09-09.json'
inputs=[('original60',p) for p in sorted((repo/'data/traces/compact').glob('*.json'))]
inputs += [('parallel4',p) for d in ['parallel-qwen-2026-09-09','parallel-qwen-random-2026-09-09'] for p in sorted((repo/'data/experiments'/d/'compact').glob('*.json'))]
rows=[]
for group,path in inputs:
 t=json.loads(path.read_text()); tokens=sorted(t['tokens'],key=lambda x:x['pos'])
 limit=next((i for i,x in enumerate(tokens) if x['text'] in ['<|endoftext|>','<|im_end|>']),len(tokens))
 text=''.join(x['text'] for x in tokens[:limit])
 assert text==t['answer'],t['id']
 durations=t.get('step_wall_ms',t['step_ms']); ends=[];acc=0
 for ms in durations: acc+=ms;ends.append(round(acc,3))
 spans=[];cursor=0
 for token in tokens[:limit]:
  spans.append((cursor,cursor+len(token['text']),token));cursor+=len(token['text'])
 def support(a,b):return [x for lo,hi,x in spans if hi>a and lo<b]
 def details(a,b):
  toks=support(a,b);s=max(x['step'] for x in toks)
  return {'text':text[a:b],'tokenPositions':[x['pos'] for x in toks],'lastTokenStep':s,'availableAtMs':ends[s]}
 words=[(m.start(),m.end()) for m in re.finditer(r'\S+',text)]
 newlines=[]
 for match in re.finditer('\n',text):
  d=details(match.start(),match.end()); previous=next(((a,b) for a,b in reversed(words) if b<=match.start()),None);following=next(((a,b) for a,b in words if a>match.start()),None)
  before=details(*previous) if previous else None; after=details(*following) if following else None
  newlines.append(d|{'charOffset':match.start(),'previousWhitespaceWord':before,'nextWhitespaceWord':after,'beforePreviousWordLastToken':bool(before and d['lastTokenStep']<before['lastTokenStep']),'beforeNextWordLastToken':bool(after and d['lastTokenStep']<after['lastTokenStep'])})
 markers=[]
 for match in re.finditer(r'(?m)^[ \t]*(\d+[.)]|[-*])(?=\s)',text):
  a,b=match.span(1);d=details(a,b);body=next(((lo,hi) for lo,hi in words if lo>b),None)
  line_end=text.find('\n',b)
  if line_end<0:line_end=len(text)
  body_tokens=support(b,line_end)
  body_detail=details(*body) if body and body[0]<line_end else None
  markers.append(d|{'charOffset':a,'firstBodyWhitespaceWord':body_detail,'beforeFirstBodyWordLastToken':bool(body_detail and d['lastTokenStep']<body_detail['lastTokenStep']),'lineBodyLastTokenStep':max((x['step'] for x in body_tokens),default=None),'lineText':text[a:line_end]})
 batches=[]
 for step in range(len(durations)):
  commits=[x for x in tokens if x['step']==step];content=[x for x in commits if x['pos']<limit]
  batches.append({'step':step,'availableAtMs':ends[step],'committedPositions':[x['pos'] for x in commits],'contentPositions':[x['pos'] for x in content],'endOrPostEndPositions':[x['pos'] for x in commits if x['pos']>=limit]})
 first_content=next((b for b in batches if b['contentPositions']),None)
 rows.append({'sourceFile':str(path.relative_to(repo)),'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'id':t['id'],'group':group,'sampler':t['sampler']['id'],'clock':'observed capture-loop intervals' if 'step_wall_ms'in t else 'synchronized model forward only','contentTokenCount':limit,'firstContentStep':first_content['step'] if first_content else None,'firstContentAtMs':first_content['availableAtMs'] if first_content else None,'durationMs':ends[-1],'newlines':newlines,'listMarkers':markers,'batches':batches})
summary={}
for group in ['original60','parallel4']:
 subset=[r for r in rows if r['group']==group];newline=[n for r in subset for n in r['newlines']];markers=[m for r in subset for m in r['listMarkers']]
 summary[group]={'traces':len(subset),'tracesWithCommittedNewline':sum(bool(r['newlines'])for r in subset),'newlineCharacters':len(newline),'newlineBeforePreviousWordLastToken':sum(n['beforePreviousWordLastToken']for n in newline),'newlineBeforeNextWordLastToken':sum(n['beforeNextWordLastToken']for n in newline),'newlineBeforeBothNeighborWordsLastToken':sum(n['beforePreviousWordLastToken'] and n['beforeNextWordLastToken'] for n in newline),'listMarkers':len(markers),'markersBeforeFirstBodyWordLastToken':sum(m['beforeFirstBodyWordLastToken']for m in markers)}
report={'generatedAtUtc':datetime.now(timezone.utc).isoformat(),'sourceRevision':subprocess.check_output(['git','rev-parse','HEAD'],cwd=repo,text=True).strip(),'definitions':{'source':'Retrospective classification of exact decoded captured answer; renderer must never use these final-text spans to decide early shape. Timing comes only from actual commit steps.','newline':'A newline character whose containing token has irreversibly committed; multiple newlines in one token counted as characters, not independent source events.','listMarker':'Number+dot/parenthesis or -/* at line start followed by whitespace in final decoded text; requires all marker token pieces to commit. This is an audit classification, not proof the causal prefix already establishes a list.','neighborWord':'Adjacent whitespace-delimited final word. Last-token timing is an optimistic lexical availability bound; it does not prove boundaries or semantic finality.','endOrPostEnd':'Positions at or after the first EOS/pad in final position order; retrospective content/tail split. Not a predicate the renderer may know early.','clock':'Original60 synchronized forward-only; new4 observed loop. Do not compare their latencies as controlled model performance.'},'summary':summary,'traces':rows}
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(summary,indent=2))
for row in rows:
 if row['group']=='parallel4':
  print(row['id'], 'first-content',row['firstContentStep'],row['firstContentAtMs'],'newlines',row['newlines'],'markers',row['listMarkers'])
