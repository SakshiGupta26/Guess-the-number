const $ = (sel) => document.querySelector(sel);

const DIFF = {
  easy:   { max: 20,  time: 30 },
  medium: { max: 50,  time: 45 },
  hard:   { max: 100, time: 60 }
};

const els = {
  range: $('#range'), feedback: $('#feedback'), time: $('#time'),
  attempts: $('#attempts'), wins: $('#wins'), streak: $('#streak'),
  score: $('#score'), hiEasy: $('#hi-easy'), hiMed: $('#hi-medium'), hiHard: $('#hi-hard'),
  diff: $('#difficulty'), start: $('#newGame'), submit: $('#submitGuess'),
  giveUp: $('#giveUp'), guess: $('#guess'), bar: $('#bar'), toast: $('#toast')
};

let state = {
  difficulty: 'medium', secret: null, timeLeft: 0, timerId: null,
  attempts: 0, wins: 0, streak: 0, score: 0, inRound: false
};

// load highscores
function loadHighscores(){
  els.hiEasy.textContent  = localStorage.getItem('guess-hi-easy')   || 0;
  els.hiMed.textContent   = localStorage.getItem('guess-hi-medium') || 0;
  els.hiHard.textContent  = localStorage.getItem('guess-hi-hard')   || 0;
}

function saveHighscore(){
  const key = `guess-hi-${state.difficulty}`;
  const current = Number(localStorage.getItem(key) || 0);
  if(state.score > current){
    localStorage.setItem(key, state.score);
    loadHighscores();
    toast(`New high score (${state.difficulty})! 🎉`);
  }
}

function toast(msg){
  els.toast.textContent = msg;
  els.toast.classList.add('show');
  setTimeout(()=>els.toast.classList.remove('show'), 1800);
}

function setDifficulty(value){
  state.difficulty = value;
  const {max, time} = DIFF[value];
  els.range.textContent = `Guess a number between 1 and ${max}. You have ${time}s.`;
  resetRoundState();
}

function resetRoundState(){
  clearInterval(state.timerId);
  state.inRound = false;
  state.attempts = 0;
  els.attempts.textContent = 0;
  els.feedback.textContent = '';
  els.submit.disabled = true;
  els.giveUp.disabled = true;
  els.guess.value = '';
  els.time.textContent = '—';
  els.bar.style.transform = 'scaleX(0)';
}

function startRound(){
  const {max, time} = DIFF[state.difficulty];
  state.secret = Math.floor(Math.random()*max)+1;
  state.timeLeft = time;
  state.attempts = 0;
  els.attempts.textContent = 0;
  els.feedback.textContent = `Round started! Range: 1–${max}`;
  els.guess.min = 1; els.guess.max = max;
  els.submit.disabled = false; els.giveUp.disabled = false;
  els.guess.focus();
  state.inRound = true;
  tick();
  clearInterval(state.timerId);
  state.timerId = setInterval(tick, 1000);
}

function tick(){
  const {time} = DIFF[state.difficulty];
  els.time.textContent = `${state.timeLeft}s`;
  const p = Math.max(0, state.timeLeft / time);
  els.bar.style.transform = `scaleX(${p})`;
  if(state.timeLeft <= 0){ endRound(false, '⏰ Time up!'); }
  state.timeLeft--;
}

function submitGuess(){
  if(!state.inRound) return;
  const value = Number(els.guess.value);
  const {max} = DIFF[state.difficulty];
  if(!Number.isInteger(value) || value < 1 || value > max){
    els.feedback.innerHTML = `<span class="danger">Enter a valid number between 1 and ${max}.</span>`;
    return;
  }
  state.attempts++; els.attempts.textContent = state.attempts;
  if(value === state.secret){
    const bonus = Math.max(1, state.timeLeft+1) + (5*state.streak);
    state.score += bonus; els.score.textContent = state.score;
    state.wins++; els.wins.textContent = state.wins;
    state.streak++; els.streak.textContent = state.streak;
    endRound(true, `🎉 Correct! It was ${state.secret}. +${bonus} points`);
    return;
  }
  state.score = Math.max(0, state.score-1);
  els.score.textContent = state.score;
  els.feedback.textContent = value > state.secret ? '📉 Too high!' : '📈 Too low!';
  els.guess.select();
}

function endRound(won,msg){
  clearInterval(state.timerId);
  state.inRound = false;
  els.feedback.innerHTML = msg + (won ? ' New round soon…' : ` The number was ${state.secret}.`);
  els.submit.disabled = true; els.giveUp.disabled = true;
  if(!won){ state.streak = 0; els.streak.textContent = 0; }
  saveHighscore();
  if(won){ setTimeout(()=>startRound(), 1200); }
}

function giveUp(){
  if(!state.inRound) return;
  endRound(false,'🙈 Gave up.');
}

function resetGame(){
  clearInterval(state.timerId);
  state = { difficulty: state.difficulty, secret:null, timeLeft:0, timerId:null,
            attempts:0, wins:0, streak:0, score:0, inRound:false };
  els.score.textContent = 0; els.wins.textContent = 0; els.streak.textContent = 0;
  els.attempts.textContent = 0; els.feedback.textContent='';
  setDifficulty(state.difficulty);
}

// Event listeners
document.addEventListener("DOMContentLoaded", ()=>{
  loadHighscores();
  setDifficulty(state.difficulty);
  els.diff.addEventListener('change', (e)=>{ setDifficulty(e.target.value); resetGame(); });
  els.start.addEventListener('click', ()=>{ resetGame(); startRound(); });
  els.submit.addEventListener('click', submitGuess);
  els.giveUp.addEventListener('click', giveUp);
  els.guess.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ submitGuess(); }});
  document.querySelector('#resetScore').addEventListener('click', ()=>{
    if(confirm('Reset all high scores?')){
      localStorage.clear(); loadHighscores(); toast('High scores cleared');
    }
  });
});
