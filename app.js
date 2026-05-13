const boardEl = document.getElementById('sudokuBoard');
const timerEl = document.getElementById('timer');
const mistakesEl = document.getElementById('mistakes');
const hintsEl = document.getElementById('hints');
const coachText = document.getElementById('coachText');
const modeTitle = document.getElementById('modeTitle');
const playerName = document.getElementById('playerName');
const citySelect = document.getElementById('citySelect');

const LEVELS = { easy: 38, medium: 46, hard: 54, expert: 60 };
const state = {
  puzzle: [], solution: [], fixed: new Set(), selected: null, notesMode: false,
  notes: Array.from({ length: 81 }, () => new Set()), mistakes: 0, hints: 3,
  seconds: 0, timerId: null, level: 'easy', daily: false, startedAt: Date.now()
};

const defaultStats = { played: 0, solved: 0, best: null, streak: 0, lastDaily: null };
const mockPlayers = [
  ['Amina', '04:18', '100%'], ['Dias', '05:02', '98%'], ['Miras', '05:41', '96%'], ['Sara', '06:20', '94%']
];

function storageGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function storageSet(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function shuffle(arr, rand = Math.random) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function todayKey() { return new Date().toISOString().slice(0, 10); }
function seedFromString(str) { return [...str].reduce((a, c) => Math.imul(31, a) + c.charCodeAt(0) | 0, 7); }
function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${m}:${s}`;
}
function baseSolvedGrid() {
  const pattern = (r, c) => (r * 3 + Math.floor(r / 3) + c) % 9;
  return Array.from({ length: 81 }, (_, i) => pattern(Math.floor(i / 9), i % 9) + 1);
}
function generateSolved(rand = Math.random) {
  const rows = shuffle([0,1,2], rand).flatMap(g => shuffle([0,1,2], rand).map(r => g * 3 + r));
  const cols = shuffle([0,1,2], rand).flatMap(g => shuffle([0,1,2], rand).map(c => g * 3 + c));
  const nums = shuffle([1,2,3,4,5,6,7,8,9], rand);
  const base = baseSolvedGrid();
  return Array.from({ length: 81 }, (_, i) => {
    const r = rows[Math.floor(i / 9)], c = cols[i % 9];
    return nums[base[r * 9 + c] - 1];
  });
}
function canPlace(grid, index, value) {
  const r = Math.floor(index / 9), c = index % 9;
  for (let i = 0; i < 9; i++) {
    if (grid[r * 9 + i] === value || grid[i * 9 + c] === value) return false;
  }
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let rr = br; rr < br + 3; rr++) for (let cc = bc; cc < bc + 3; cc++) {
    if (grid[rr * 9 + cc] === value) return false;
  }
  return true;
}
function countSolutions(grid, limit = 2) {
  let count = 0;
  const work = [...grid];
  function solve() {
    if (count >= limit) return;
    let idx = -1, best = null;
    for (let i = 0; i < 81; i++) if (!work[i]) {
      const candidates = [1,2,3,4,5,6,7,8,9].filter(n => canPlace(work, i, n));
      if (!best || candidates.length < best.length) { idx = i; best = candidates; }
      if (candidates.length === 0) return;
    }
    if (idx === -1) { count++; return; }
    for (const n of best) { work[idx] = n; solve(); work[idx] = 0; }
  }
  solve();
  return count;
}
function makePuzzle(level = 'easy', seeded = false) {
  const rand = seeded ? mulberry32(seedFromString(todayKey())) : Math.random;
  const solved = generateSolved(rand);
  const puzzle = [...solved];
  const order = shuffle([...Array(81).keys()], rand);
  const removeTarget = LEVELS[level];
  let removed = 0;
  for (const idx of order) {
    if (removed >= removeTarget) break;
    const backup = puzzle[idx];
    puzzle[idx] = 0;
    if (countSolutions(puzzle, 2) === 1) removed++;
    else puzzle[idx] = backup;
  }
  return { puzzle, solved };
}
function newGame(level = state.level, daily = false) {
  const { puzzle, solved } = makePuzzle(level, daily);
  Object.assign(state, {
    puzzle, solution: solved, fixed: new Set(puzzle.map((v, i) => v ? i : null).filter(v => v !== null)),
    selected: null, notesMode: false, notes: Array.from({ length: 81 }, () => new Set()),
    mistakes: 0, hints: 3, seconds: 0, level, daily, startedAt: Date.now()
  });
  modeTitle.textContent = daily ? `Daily Challenge • ${todayKey()}` : `${level[0].toUpperCase() + level.slice(1)} Puzzle`;
  document.getElementById('notesBtn').textContent = 'Notes: Off';
  updateCounters();
  renderBoard();
  startTimer();
  const stats = storageGet('mindokuStats', defaultStats); stats.played++; storageSet('mindokuStats', stats); renderStats();
}
function startTimer() {
  clearInterval(state.timerId);
  state.timerId = setInterval(() => { state.seconds++; timerEl.textContent = formatTime(state.seconds); }, 1000);
}
function updateCounters() { mistakesEl.textContent = state.mistakes; hintsEl.textContent = state.hints; timerEl.textContent = formatTime(state.seconds); }
function renderBoard() {
  boardEl.innerHTML = '';
  state.puzzle.forEach((value, index) => {
    const cell = document.createElement('button');
    cell.className = 'cell'; cell.type = 'button'; cell.dataset.index = index;
    if (state.fixed.has(index)) cell.classList.add('fixed');
    if (state.selected === index) cell.classList.add('selected');
    if (state.selected !== null && isPeer(index, state.selected)) cell.classList.add('peer');
    if (value) cell.textContent = value;
    else if (state.notes[index].size) {
      const notes = document.createElement('div'); notes.className = 'notes';
      for (let n = 1; n <= 9; n++) { const s = document.createElement('span'); s.textContent = state.notes[index].has(n) ? n : ''; notes.appendChild(s); }
      cell.appendChild(notes);
    }
    cell.addEventListener('click', () => selectCell(index));
    boardEl.appendChild(cell);
  });
}
function isPeer(a, b) {
  const ar = Math.floor(a / 9), ac = a % 9, br = Math.floor(b / 9), bc = b % 9;
  return a !== b && (ar === br || ac === bc || (Math.floor(ar / 3) === Math.floor(br / 3) && Math.floor(ac / 3) === Math.floor(bc / 3)));
}
function selectCell(index) { state.selected = index; renderBoard(); }
function flashCell(index, cls) {
  const el = boardEl.querySelector(`[data-index="${index}"]`); if (!el) return;
  el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 700);
}
function inputNumber(num) {
  const idx = state.selected;
  if (idx === null || state.fixed.has(idx)) return;
  if (num === 0) { state.puzzle[idx] = 0; state.notes[idx].clear(); renderBoard(); saveProgress(); return; }
  if (state.notesMode) {
    if (state.notes[idx].has(num)) state.notes[idx].delete(num); else state.notes[idx].add(num);
    renderBoard(); saveProgress(); return;
  }
  state.notes[idx].clear(); state.puzzle[idx] = num;
  renderBoard();
  if (num !== state.solution[idx]) { state.mistakes++; updateCounters(); flashCell(idx, 'error'); }
  else flashCell(idx, 'correct-flash');
  saveProgress();
  if (isComplete()) finishGame();
}
function isComplete() { return state.puzzle.every((v, i) => v === state.solution[i]); }
function candidates(index) { return [1,2,3,4,5,6,7,8,9].filter(n => canPlace(state.puzzle, index, n)); }
function explain(index, value = state.solution[index]) {
  const r = Math.floor(index / 9) + 1, c = index % 9 + 1;
  const poss = candidates(index);
  const rowVals = valuesInRow(index), colVals = valuesInCol(index), boxVals = valuesInBox(index);
  return `Cell R${r}C${c}: the correct value is ${value}. Current candidates are ${poss.length ? poss.join(', ') : 'none because of conflicts'}. ${value} works because it is not repeated in row ${r}, column ${c}, or its 3×3 box. Row contains [${rowVals}], column contains [${colVals}], box contains [${boxVals}]. Strategy: eliminate numbers already visible in the same row, column and box; then compare the remaining candidates.`;
}
function valuesInRow(index) { const r = Math.floor(index / 9); return state.puzzle.slice(r*9, r*9+9).filter(Boolean).join(', ') || 'empty'; }
function valuesInCol(index) { const c = index % 9; return Array.from({length:9},(_,r)=>state.puzzle[r*9+c]).filter(Boolean).join(', ') || 'empty'; }
function valuesInBox(index) {
  const r = Math.floor(index / 9), c = index % 9, br = Math.floor(r/3)*3, bc = Math.floor(c/3)*3, out = [];
  for (let rr=br; rr<br+3; rr++) for (let cc=bc; cc<bc+3; cc++) if (state.puzzle[rr*9+cc]) out.push(state.puzzle[rr*9+cc]);
  return out.join(', ') || 'empty';
}
function useHint() {
  if (state.hints <= 0) { coachText.textContent = 'You have no hints left. Pro mode could unlock unlimited AI Coach hints.'; return; }
  const idx = state.selected !== null && !state.fixed.has(state.selected) && !state.puzzle[state.selected] ? state.selected : state.puzzle.findIndex((v, i) => !v && !state.fixed.has(i));
  if (idx < 0) return;
  state.selected = idx; state.puzzle[idx] = state.solution[idx]; state.notes[idx].clear(); state.hints--; updateCounters(); renderBoard(); flashCell(idx, 'correct-flash');
  coachText.textContent = explain(idx);
  saveProgress(); if (isComplete()) finishGame();
}
function checkBoard() {
  let wrong = [];
  state.puzzle.forEach((v, i) => { if (v && v !== state.solution[i]) wrong.push(i); });
  if (!wrong.length) coachText.textContent = 'No mistakes detected. Keep going — your current board is logically consistent with the solution.';
  else { coachText.textContent = `${wrong.length} mistake(s) found. Red cells conflict with the solved puzzle.`; wrong.forEach(i => flashCell(i, 'error')); }
}
function aiCoach() {
  const idx = state.selected;
  if (idx === null) { coachText.textContent = 'Select a cell first. I can explain candidates and the next logical move.'; return; }
  if (state.fixed.has(idx)) { coachText.textContent = 'This is a fixed starting clue. Use it to eliminate the same number from its row, column and box.'; return; }
  coachText.textContent = explain(idx);
}
function finishGame() {
  clearInterval(state.timerId);
  const stats = storageGet('mindokuStats', defaultStats);
  stats.solved++;
  if (!stats.best || state.seconds < stats.best) stats.best = state.seconds;
  if (state.daily) {
    if (stats.lastDaily !== todayKey()) stats.streak++;
    stats.lastDaily = todayKey();
  }
  storageSet('mindokuStats', stats);
  addLeaderboardEntry(); renderStats(); renderLeaderboard();
  document.getElementById('winText').textContent = `Finished in ${formatTime(state.seconds)} with ${state.mistakes} mistake(s).`;
  openModal('winModal');
}
function saveProgress() { storageSet('mindokuProgress', { ...state, fixed: [...state.fixed], notes: state.notes.map(s => [...s]), timerId: null }); }
function loadSettings() {
  const profile = storageGet('mindokuProfile', { name: 'Adel', city: 'Almaty' });
  playerName.value = profile.name; citySelect.value = profile.city;
  if (storageGet('mindokuTheme', 'light') === 'dark') document.body.classList.add('dark');
}
function saveProfile() { storageSet('mindokuProfile', { name: playerName.value || 'Player', city: citySelect.value }); renderLeaderboard(); }
function renderStats() {
  const s = storageGet('mindokuStats', defaultStats);
  document.getElementById('statPlayed').textContent = s.played;
  document.getElementById('statSolved').textContent = s.solved;
  document.getElementById('statBest').textContent = s.best ? formatTime(s.best) : '—';
  document.getElementById('statStreak').textContent = s.streak;
}
function addLeaderboardEntry() {
  const key = `mindokuLeaderboard:${citySelect.value}`;
  const list = storageGet(key, []);
  list.push({ name: playerName.value || 'Player', time: formatTime(state.seconds), raw: state.seconds, accuracy: `${Math.max(0, 100 - state.mistakes * 4)}%` });
  list.sort((a,b) => a.raw - b.raw); storageSet(key, list.slice(0, 10));
}
function renderLeaderboard() {
  const city = citySelect.value || 'Almaty'; document.getElementById('leaderboardCity').textContent = city;
  const saved = storageGet(`mindokuLeaderboard:${city}`, []);
  const combined = [...saved, ...mockPlayers.map(([name,time,accuracy], i) => ({ name, time, accuracy, raw: 260 + i*44 }))].sort((a,b)=>a.raw-b.raw).slice(0,5);
  document.getElementById('leaderboard').innerHTML = combined.map(p => `<li><strong>${p.name}</strong><span>${p.time} • ${p.accuracy} accuracy</span></li>`).join('');
}
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

document.querySelectorAll('[data-number]').forEach(btn => btn.addEventListener('click', () => inputNumber(Number(btn.dataset.number))));
document.addEventListener('keydown', e => { if (/^[1-9]$/.test(e.key)) inputNumber(Number(e.key)); if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') inputNumber(0); });
document.querySelectorAll('.difficulty').forEach(btn => btn.addEventListener('click', () => { document.querySelectorAll('.difficulty,.daily-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); state.level = btn.dataset.level; newGame(state.level, false); }));
document.getElementById('dailyBtn').addEventListener('click', e => { document.querySelectorAll('.difficulty,.daily-btn').forEach(b=>b.classList.remove('active')); e.currentTarget.classList.add('active'); state.level = 'hard'; newGame('hard', true); });
document.getElementById('newGameBtn').addEventListener('click', () => newGame(state.level, state.daily));
document.getElementById('modalNewGame').addEventListener('click', () => { closeModal('winModal'); newGame(state.level, state.daily); });
document.getElementById('notesBtn').addEventListener('click', e => { state.notesMode = !state.notesMode; e.currentTarget.textContent = `Notes: ${state.notesMode ? 'On' : 'Off'}`; });
document.getElementById('checkBtn').addEventListener('click', checkBoard);
document.getElementById('hintBtn').addEventListener('click', useHint);
document.getElementById('coachBtn').addEventListener('click', aiCoach);
document.getElementById('themeBtn').addEventListener('click', () => { document.body.classList.toggle('dark'); storageSet('mindokuTheme', document.body.classList.contains('dark') ? 'dark' : 'light'); });
document.getElementById('proBtn').addEventListener('click', () => openModal('proModal'));
document.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
playerName.addEventListener('input', saveProfile); citySelect.addEventListener('change', saveProfile);

loadSettings(); renderStats(); renderLeaderboard(); newGame('easy', false);
