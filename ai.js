const TRANSFORMERS_URL='https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0';
const MODEL_CANDIDATES=['Xenova/bge-small-en-v1.5','Xenova/all-MiniLM-L6-v2'];
const PICK_TIMEOUT_MS=3000;
const FALLBACK_SAMPLE_SIZE=48;
let embedder=null,loading=null,activeBackend=null,activeModel=null;
const timeout=(p,ms,msg)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error(msg)),ms))]);
function progressReporter(onProgress){let last=-1;return p=>{const v=Number(p?.progress);if(!Number.isFinite(v))return;const pct=Math.max(0,Math.min(100,Math.round(v)));if(pct===last)return;last=pct;onProgress(`AI download ${pct}%`);};}
async function embedTexts(texts){if(!embedder||!texts.length)return[];const output=await embedder(texts,{pooling:'mean',normalize:true});if(typeof output?.tolist==='function')return output.tolist();if(Array.isArray(output))return output;throw new Error('AI embedding output was not readable');}
function dot(a,b){let s=0,n=Math.min(a?.length||0,b?.length||0);for(let i=0;i<n;i++)s+=a[i]*b[i];return s;}
async function selfTest(){const rows=await embedTexts(['Brain Bash learning game','A completely different sentence']);if(!Array.isArray(rows)||rows.length!==2||!Array.isArray(rows[0])||rows[0].length<32)throw new Error('AI self-test returned invalid embeddings');}
async function loadModel(pipeline,onProgress){let last=null;for(const model of MODEL_CANDIDATES){try{onProgress(`Loading ${model.split('/').pop()}…`);const pipe=await pipeline('feature-extraction',model,{progress_callback:progressReporter(onProgress)});embedder=pipe;activeModel=model;await selfTest();return true;}catch(e){last=e;try{await embedder?.dispose?.();}catch{}embedder=null;activeModel=null;console.warn(`Brain Bash could not load ${model}; trying fallback.`,e);}}throw last||new Error('No Hugging Face embedding model loaded');}

// Reliability rule: enabling AI never blocks Start. Model loading happens in the
// background; until ready, the large built-in non-repeating question bank is used.
export async function initAI(onProgress=()=>{}){
  if(embedder){onProgress('AI Game Master ready — deep anti-repeat mode is ON.');return true;}
  if(!loading){
    onProgress('Game can start now • AI is loading in the background…');
    loading=(async()=>{try{const{pipeline,env}=await import(TRANSFORMERS_URL);env.allowLocalModels=false;env.useBrowserCache=true;if(env.backends?.onnx?.wasm)env.backends.onnx.wasm.numThreads=1;await loadModel(pipeline,onProgress);activeBackend=navigator.gpu?'phone/browser • WebGPU available':'phone/browser CPU';onProgress('AI Game Master ready — deep anti-repeat mode is ON.');return true;}catch(e){console.error('Brain Bash AI failed:',e);try{await embedder?.dispose?.();}catch{}embedder=null;activeBackend=null;activeModel=null;onProgress('AI model unavailable — game continues normally with anti-repeat rules.');return false;}finally{loading=null;}})();
  }else onProgress('Game can start now • AI is still loading in the background…');
  return true;
}

function shuffle(values){const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function normalizeText(value){return String(value||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();}
function tokenSet(value){return new Set(normalizeText(value).split(' ').filter(token=>token.length>2));}
function jaccard(a,b){const left=tokenSet(a),right=tokenSet(b);if(!left.size||!right.size)return 0;let overlap=0;for(const token of left)if(right.has(token))overlap++;return overlap/(left.size+right.size-overlap);}
function fallbackNovelPick(candidates,recentTexts=[]){
  const sample=shuffle(candidates).slice(0,FALLBACK_SAMPLE_SIZE);
  const recent=recentTexts.filter(Boolean).slice(-40);
  if(!recent.length)return sample[Math.floor(Math.random()*sample.length)]||candidates[0];
  const scored=sample.map((candidate,index)=>{
    const text=`${candidate.q||''} ${Array.isArray(candidate.a)?candidate.a.join(' '):''}`;
    const maxOverlap=Math.max(0,...recent.map(old=>jaccard(text,old)));
    return{index,novelty:1-maxOverlap+Math.random()*.02,maxOverlap};
  }).sort((a,b)=>b.novelty-a.novelty);
  const fresh=scored.filter(item=>item.maxOverlap<.72).slice(0,6);
  const pool=fresh.length?fresh:scored.slice(0,Math.min(6,scored.length));
  const chosen=pool[Math.floor(Math.random()*pool.length)]||scored[0];
  return sample[chosen.index]||candidates[0];
}

export async function chooseWithAI(candidates,recentTexts=[]){
  if(!Array.isArray(candidates)||!candidates.length)return null;
  if(candidates.length<2)return candidates[0];
  if(!embedder)return fallbackNovelPick(candidates,recentTexts);
  const sample=shuffle(candidates).slice(0,32),recent=recentTexts.filter(Boolean).slice(-30);
  if(!recent.length)return{...sample[Math.floor(Math.random()*sample.length)],aiPick:true};
  try{
    const texts=sample.map(q=>`${q.q} ${Array.isArray(q.a)?q.a.join(' '):''}`);
    const vectors=await timeout(embedTexts([...texts,...recent]),PICK_TIMEOUT_MS,'AI picker timed out');
    const cv=vectors.slice(0,sample.length),rv=vectors.slice(sample.length);
    const scores=cv.map((vec,i)=>{const sims=rv.map(old=>dot(vec,old)),max=Math.max(...sims),avg=sims.reduce((a,b)=>a+b,0)/Math.max(1,sims.length);let peer=0,count=0;for(let j=0;j<cv.length;j++){if(j===i)continue;peer+=dot(vec,cv[j]);count++;}const novelty=(1-max)*.68+(1-avg)*.22+(1-(count?peer/count:0))*.10+Math.random()*.012;return{i,novelty,maxRecent:max};}).sort((a,b)=>b.novelty-a.novelty);
    const shortlist=scores.filter(x=>x.maxRecent<.88).slice(0,5),pool=shortlist.length?shortlist:scores.slice(0,Math.min(5,scores.length)),chosen=pool[Math.floor(Math.random()*pool.length)]||scores[0];
    return{...sample[chosen.i],aiPick:true,aiNovelty:Number(chosen.novelty.toFixed(3))};
  }catch(e){
    console.warn('AI question selection timed out/failed; using lexical anti-repeat picker:',e);
    return fallbackNovelPick(sample,recentTexts);
  }
}
export function getAIStatus(){return{ready:!!embedder,backend:activeBackend,model:activeModel||MODEL_CANDIDATES[0],loading:!!loading};}
