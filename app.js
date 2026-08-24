import { QUESTIONS } from './questions.js';
import { initAI, chooseWithAI } from './ai.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const els = {
  setup: $('#setupScreen'), game: $('#gameScreen'), score: $('#scoreScreen'), list: $('#playerList'), add: $('#addPlayerBtn'), start: $('#startBtn'), ai: $('#aiToggle'), aiStatus: $('#aiStatus'), mode: $('#modeSelect'), rounds: $('#roundsSelect'), round: $('#roundLabel'), turn: $('#turnLabel'), points: $('#pointsLabel'), progress: $('#progressBar'), cat: $('#categoryPill'), diff: $('#difficultyPill'), q: $('#questionText'), answers: $('#answers'), feedback: $('#feedback'), event: $('#eventBanner'), fifty: $('#fiftyBtn'), fiftyCount: $('#fiftyCount'), double: $('#doubleBtn'), doubleCount: $('#doubleCount'), scoreboard: $('#scoreboard'), winner: $('#winnerText'), summary: $('#learningSummary'), again: $('#playAgainBtn'), sound: $('#soundBtn')
};

const LEVEL_LABEL = {1:'Little Learner',2:'Explorer',3:'Rising Star',4:'Teen',5:'Adult'};
const storeKey = 'brain-bash-ai-v1';
const recentKey = 'brain-bash-recent-v3';
const RECENT_LIMIT = 120;
let state = null;
let soundOn = true;
let currentQuestion = null;
let doubleActive = false;

function addPlayer(name='', level=2){
  if ($$('.player-row').length >= 10) return;
  const node = $('#playerRowTemplate').content.cloneNode(true);
  node.querySelector('.player-name').value = name;
  node.querySelector('.player-level').value = String(level);
  node.querySelector('.remove-player').onclick = e => {
    if ($$('.player-row').length > 2) e.target.closest('.player-row').remove();
  };
  els.list.append(node);
}

function setupDefaults(){
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(storeKey) || 'null'); } catch {}
  (saved?.players || [{name:'Player 1',level:2},{name:'Player 2',level:5}]).slice(0,10).forEach(p=>addPlayer(p.name,p.level));
  if (saved?.mode) els.mode.value = saved.mode;
  if (saved?.rounds) els.rounds.value = String(saved.rounds);
}

function loadRecent(){
  try {
    const value=JSON.parse(localStorage.getItem(recentKey) || '[]');
    return Array.isArray(value) ? value.filter(v=>typeof v==='string').slice(-RECENT_LIMIT) : [];
  } catch { return []; }
}

function questionSig(q){ return `${q.c}|${q.l}|${q.q}`; }
function sigText(sig){ return String(sig).split('|').slice(2).join('|'); }
function rememberQuestion(q){
  const sig=questionSig(q);
  state.used.add(sig);
  state.recent=state.recent.filter(v=>v!==sig);
  state.recent.push(sig);
  if(state.recent.length>RECENT_LIMIT) state.recent=state.recent.slice(-RECENT_LIMIT);
  try { localStorage.setItem(recentKey,JSON.stringify(state.recent)); } catch {}
}

function getCategories(){ return $$('.categories input:checked').map(x=>x.value); }
function collectPlayers(){
  return $$('.player-row').map((row,i)=>({
    name: row.querySelector('.player-name').value.trim() || `Player ${i+1}`,
    base: Number(row.querySelector('.player-level').value),
    skill: Number(row.querySelector('.player-level').value),
    label: LEVEL_LABEL[Number(row.querySelector('.player-level').value)],
    team: i % 2,
    score:0, correct:0, attempts:0, streak:0, fifty:1, double:1, byCategory:{}
  }));
}

function buildCandidates(player){
  const cats=state.categories;
  const desired=Math.max(1,Math.min(5,Math.round(player.skill)));
  let preferredCats=cats;

  if(state.mode==='learning'){
    const practiced=Object.entries(player.byCategory).filter(([,v])=>v.n>0);
    if(practiced.length && Math.random()<0.65){
      practiced.sort((a,b)=>(a[1].ok/a[1].n)-(b[1].ok/b[1].n));
      preferredCats=[practiced[0][0]];
    }
  }

  const chosenCat=preferredCats[Math.floor(Math.random()*preferredCats.length)];
  let pool=QUESTIONS.filter(q=>q.c===chosenCat && Math.abs(q.l-desired)<=1);
  if(!pool.length) pool=QUESTIONS.filter(q=>q.c===chosenCat);

  let candidates=pool.filter(q=>!state.used.has(questionSig(q)) && !state.recent.includes(questionSig(q)));
  if(!candidates.length) candidates=pool.filter(q=>!state.used.has(questionSig(q)));
  if(!candidates.length){
    pool=QUESTIONS.filter(q=>q.c===chosenCat);
    candidates=pool.filter(q=>!state.used.has(questionSig(q)) && !state.recent.includes(questionSig(q)));
  }
  if(!candidates.length) candidates=pool.filter(q=>!state.used.has(questionSig(q)));
  if(!candidates.length) candidates=pool;
  return candidates;
}

async function chooseQuestion(player){
  const candidates=buildCandidates(player);
  let q=null;

  if(state.aiReady && candidates.length>1){
    q=await chooseWithAI(candidates,state.recent.map(sigText));
    if(q?.aiPick) state.aiUsed++;
  }
  if(!q) q=candidates[Math.floor(Math.random()*candidates.length)];

  rememberQuestion(q);
  return {...q,a:[...q.a]};
}

function maybeEvent(){
  if(state.round>0 && state.round%5===0){
    const events=['⚡ Lightning round — bonus points are live!','🎯 Focus round — extra bonus for getting it right!','🎉 Wild round — everybody cheer before answering!'];
    els.event.textContent=events[(state.round/5-1)%events.length];
    els.event.classList.remove('hidden');
    return state.round%10===0 ? 50 : 25;
  }
  els.event.classList.add('hidden');
  return 0;
}

async function renderQuestion(){
  const player=state.players[state.turn];
  els.feedback.textContent='';
  els.feedback.className='feedback';
  doubleActive=false;
  els.double.classList.remove('active');
  els.round.textContent=`${state.round+1} / ${state.totalRounds}`;
  els.turn.textContent=state.mode==='teams'?`${player.name} • ${player.team===0?'Team Purple':'Team Cyan'}`:player.name;
  els.points.textContent=player.score;
  els.progress.style.width=`${(state.round/state.totalRounds)*100}%`;
  els.fiftyCount.textContent=player.fifty;
  els.doubleCount.textContent=player.double;

  if(state.aiReady){
    els.q.textContent='AI Game Master is choosing a fresh challenge…';
    els.answers.innerHTML='';
  }

  const q=await chooseQuestion(player);
  currentQuestion=q;
  els.cat.textContent=q.c.toUpperCase();
  els.diff.textContent=`LEVEL ${q.l}${q.aiPick?' • AI PICK':''}`;
  els.q.textContent=q.q;
  els.answers.innerHTML='';

  q.a.forEach((answer,i)=>{
    const b=document.createElement('button');
    b.className='answer-btn';
    b.textContent=`${String.fromCharCode(65+i)}. ${answer}`;
    b.dataset.i=i;
    b.onclick=()=>answerQuestion(i,b);
    els.answers.append(b);
  });
  state.eventBonus=maybeEvent();
}

function answerQuestion(index,button){
  const player=state.players[state.turn];
  const correct=index===currentQuestion.x;
  player.attempts++;
  player.byCategory[currentQuestion.c] ||= {ok:0,n:0};
  player.byCategory[currentQuestion.c].n++;
  $$('.answer-btn').forEach(b=>b.disabled=true);
  $(`.answer-btn[data-i="${currentQuestion.x}"]`)?.classList.add('correct');

  if(correct){
    button.classList.add('correct');
    player.correct++;
    player.byCategory[currentQuestion.c].ok++;
    player.streak++;
    const streakBonus=Math.min(50,Math.max(0,(player.streak-1)*10));
    let pts=100+streakBonus+state.eventBonus;
    if(doubleActive) pts*=2;
    player.score+=pts;
    if(player.streak>=2) player.skill=Math.min(5,player.skill+0.18);
    els.feedback.textContent=`Correct! +${pts} points${player.streak>1?` • ${player.streak} streak!`:''}`;
    els.feedback.classList.add('good');
    beep(720);
  }else{
    button.classList.add('wrong');
    player.streak=0;
    player.skill=Math.max(1,player.skill-0.22);
    els.feedback.textContent=`Good try. ${currentQuestion.h}`;
    els.feedback.classList.add('bad');
    beep(220);
  }
  els.points.textContent=player.score;
  setTimeout(nextTurn,1300);
}

function nextTurn(){
  state.round++;
  if(state.round>=state.totalRounds){ finishGame(); return; }
  state.turn=(state.turn+1)%state.players.length;
  renderQuestion();
}

async function startGame(){
  const players=collectPlayers();
  const categories=getCategories();
  if(players.length<2 || !categories.length) return;

  localStorage.setItem(storeKey,JSON.stringify({players:players.map(p=>({name:p.name,level:p.base})),mode:els.mode.value,rounds:Number(els.rounds.value)}));
  state={players,categories,mode:els.mode.value,totalRounds:Number(els.rounds.value),round:0,turn:0,used:new Set(),recent:loadRecent(),aiReady:false,eventBonus:0,aiUsed:0};
  show(els.game);

  if(els.ai.checked){
    els.aiStatus.textContent='Loading AI…';
    state.aiReady=await initAI(msg=>els.aiStatus.textContent=msg);
  }
  await renderQuestion();
}

function finishGame(){
  show(els.score);
  els.progress.style.width='100%';
  const ranked=[...state.players].sort((a,b)=>b.score-a.score);

  if(state.mode==='teams'){
    const teamScores=[0,0];
    state.players.forEach(p=>teamScores[p.team]+=p.score);
    const winTeam=teamScores[0]>=teamScores[1]?0:1;
    els.winner.textContent=`🏆 ${winTeam===0?'Team Purple':'Team Cyan'} wins ${teamScores[winTeam]} to ${teamScores[1-winTeam]}!`;
    els.scoreboard.innerHTML=[0,1].sort((a,b)=>teamScores[b]-teamScores[a]).map((t,i)=>`<div class="score-row"><span class="rank">${i===0?'🥇':'🥈'}</span><strong>${t===0?'Team Purple':'Team Cyan'}</strong><span class="score">${teamScores[t]}</span></div>`).join('');
  }else{
    els.winner.textContent=`🏆 ${ranked[0].name} wins with ${ranked[0].score} points!`;
    els.scoreboard.innerHTML=ranked.map((p,i)=>`<div class="score-row"><span class="rank">${['🥇','🥈','🥉'][i]||`${i+1}.`}</span><strong>${escapeHtml(p.name)}</strong><span class="score">${p.score}</span></div>`).join('');
  }

  const insights=ranked.map(p=>{
    const acc=p.attempts?Math.round(p.correct/p.attempts*100):0;
    const weak=Object.entries(p.byCategory).sort((a,b)=>(a[1].ok/a[1].n)-(b[1].ok/b[1].n))[0]?.[0];
    return `<p><strong>${escapeHtml(p.name)}</strong>: ${acc}% correct. ${weak?`Next game can give a little extra practice in <b>${weak}</b>.`:''}</p>`;
  }).join('');
  const aiNote=state.aiReady?`<p class="muted">Hugging Face AI selected <b>${state.aiUsed}</b> semantically varied question${state.aiUsed===1?'':'s'} this game.</p>`:'';
  els.summary.innerHTML=`<h3>Learning recap</h3>${insights}${aiNote}<p class="muted">Difficulty adapts to each player, and recently seen questions are avoided across games.</p>`;
}

function useFifty(){
  const p=state?.players[state.turn];
  if(!p||p.fifty<1) return;
  p.fifty--;
  const wrong=$$('.answer-btn').filter(b=>Number(b.dataset.i)!==currentQuestion.x);
  wrong.sort(()=>Math.random()-.5).slice(0,2).forEach(b=>{b.disabled=true;b.style.visibility='hidden'});
  els.fiftyCount.textContent=p.fifty;
}

function useDouble(){
  const p=state?.players[state.turn];
  if(!p||p.double<1||doubleActive) return;
  p.double--;
  doubleActive=true;
  els.double.classList.add('active');
  els.doubleCount.textContent=p.double;
}

function show(screen){
  [els.setup,els.game,els.score].forEach(x=>x.classList.remove('active'));
  screen.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

function escapeHtml(s){ return s.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function beep(freq){
  if(!soundOn) return;
  try{
    const c=new AudioContext(),o=c.createOscillator(),g=c.createGain();
    o.frequency.value=freq; g.gain.value=.04; o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+.08);
  }catch{}
}

els.add.onclick=()=>addPlayer('',2);
els.start.onclick=startGame;
els.fifty.onclick=useFifty;
els.double.onclick=useDouble;
els.again.onclick=()=>show(els.setup);
els.sound.onclick=()=>{ soundOn=!soundOn; els.sound.textContent=soundOn?'🔊':'🔇'; };
els.ai.onchange=async()=>{
  if(els.ai.checked){
    const ok=await initAI(msg=>els.aiStatus.textContent=msg);
    els.ai.checked=ok;
  }else{
    els.aiStatus.textContent='AI is off. The large non-repeating question bank is still ready.';
  }
};

setupDefaults();
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
