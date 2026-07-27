// =============================================================
// ¡Adivina Adivinador! — lógica de la app
// =============================================================

import { db, FIREBASE_IS_CONFIGURED } from './firebase-config.js';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const FIVE_MIN_MS = 5 * 60 * 1000;
const STORAGE_KEY = 'generoBebeVoter';
const VOTES_COLLECTION = 'votes';

const VOTE_META = {
  varon:   { short: 'Varón', color: '#1565C0' },
  nena:    { short: 'Nena',  color: '#AD1457' },
  nididea: { short: 'Ni Idea', color: '#F57F17' }
};
const VOTE_ORDER = ['varon', 'nena', 'nididea'];

// ---------- referencias al DOM ----------
const screens = {
  welcome: document.getElementById('screen-welcome'),
  vote: document.getElementById('screen-vote'),
  results: document.getElementById('screen-results')
};

const welcomeForm = document.getElementById('welcome-form');
const nameInput = document.getElementById('name-input');
const greetingText = document.getElementById('greeting-text');

const voteCards = Array.from(document.querySelectorAll('.vote-card'));

const modalOverlay = document.getElementById('confirm-modal');
const modalChoice = document.getElementById('modal-choice');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');

const resultsGreeting = document.getElementById('results-greeting');
const timerBox = document.getElementById('timer-box');
const timerText = document.getElementById('timer-text');
const lockedBox = document.getElementById('locked-box');
const changeVoteBtn = document.getElementById('change-vote-btn');

const barsEl = document.getElementById('bars');
const voterListEl = document.getElementById('voter-list');

const shareBtn = document.getElementById('share-btn');
const restartBtn = document.getElementById('restart-btn');
const toastEl = document.getElementById('toast');

// ---------- estado ----------
let voter = loadVoter();          // { id, name, vote, votedAt }
let pendingVote = null;           // opción tocada, esperando confirmación
let countdownInterval = null;
let latestVotes = [];             // último snapshot de Firestore
let toastTimeout = null;

// ---------- almacenamiento local ----------
function loadVoter() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveVoter(v) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  } catch {
    // localStorage no disponible (modo privado, etc.) — la app sigue
    // funcionando, solo no va a recordar el voto entre recargas.
  }
}

function makeVoterId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'v-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

// ---------- navegación entre pantallas ----------
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

// ---------- arranque ----------
function init() {
  wireStaticEvents();

  if (!FIREBASE_IS_CONFIGURED) {
    showConfigWarning();
    return;
  }

  if (voter && voter.vote) {
    enterResults(false);
  } else {
    showScreen('welcome');
  }

  listenResults();
}

function showConfigWarning() {
  const card = document.querySelector('.card--welcome');
  const warning = document.createElement('div');
  warning.className = 'setup-warning';
  warning.innerHTML =
    'Todavía falta conectar la base de datos. ' +
    'Abrí <code>js/firebase-config.js</code> y pegá la configuración ' +
    'de tu proyecto de Firebase ahí (el README.md tiene el paso a paso). ' +
    'Mientras tanto la votación no se puede guardar.';
  card.appendChild(warning);
}

// ---------- pantalla de bienvenida ----------
welcomeForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = nameInput.value.trim().slice(0, 30);
  if (!name) return;

  voter = voter || { id: makeVoterId() };
  if (!voter.id) voter.id = makeVoterId();
  voter.name = name;
  saveVoter(voter);

  greetingText.textContent = `¡Hola, ${name}! ¿Vos qué creés?`;
  markSelectedCard(null);
  showScreen('vote');
});

// ---------- tarjetas de votación ----------
voteCards.forEach(card => {
  card.addEventListener('click', () => {
    pendingVote = card.dataset.vote;
    openConfirmModal(pendingVote);
  });
});

function openConfirmModal(voteKey) {
  const meta = VOTE_META[voteKey];
  modalChoice.textContent = meta.short;
  modalChoice.style.setProperty('--choice-color', meta.color);
  modalOverlay.classList.add('open');
  modalConfirm.focus();
}

function closeModal() {
  modalOverlay.classList.remove('open');
}

function wireStaticEvents() {
  modalCancel.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
  });

  modalConfirm.addEventListener('click', async () => {
    if (!pendingVote) return;
    modalConfirm.disabled = true;
    modalConfirm.textContent = 'Guardando…';
    await castVote(pendingVote);
    modalConfirm.disabled = false;
    modalConfirm.textContent = 'Sí, confirmar';
    closeModal();
  });

  changeVoteBtn.addEventListener('click', () => {
    markSelectedCard(voter.vote);
    greetingText.textContent = `¿Cambiás tu voto, ${voter.name}?`;
    showScreen('vote');
  });

  restartBtn.addEventListener('click', () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    voter = null;
    clearInterval(countdownInterval);
    nameInput.value = '';
    showScreen('welcome');
  });

  shareBtn.addEventListener('click', shareLink);
}

function markSelectedCard(voteKey) {
  voteCards.forEach(c => {
    const isSelected = c.dataset.vote === voteKey;
    c.classList.toggle('selected', isSelected);
    c.setAttribute('aria-pressed', String(isSelected));
  });
}

// ---------- guardar voto ----------
async function castVote(voteKey) {
  const isFirstVote = !voter.votedAt;
  const votedAt = isFirstVote ? Date.now() : voter.votedAt;
  const ref = doc(db, VOTES_COLLECTION, voter.id);

  try {
    if (isFirstVote) {
      await setDoc(ref, { name: voter.name, vote: voteKey, votedAt });
    } else {
      await updateDoc(ref, { vote: voteKey });
    }
  } catch (err) {
    console.error('Error al guardar el voto:', err);
    showToast('No pudimos guardar tu voto. Revisá tu conexión e intentá de nuevo.');
    return;
  }

  voter.vote = voteKey;
  voter.votedAt = votedAt;
  saveVoter(voter);
  enterResults(isFirstVote);
}

// ---------- pantalla de resultados ----------
function enterResults(justVoted) {
  resultsGreeting.textContent = `¡Gracias por votar, ${voter.name}!`;
  showScreen('results');
  startCountdown();
  renderResults();
  if (justVoted) launchConfetti();
}

function startCountdown() {
  clearInterval(countdownInterval);
  tickCountdown();
  countdownInterval = setInterval(tickCountdown, 1000);
}

function tickCountdown() {
  const remaining = FIVE_MIN_MS - (Date.now() - voter.votedAt);
  if (remaining <= 0) {
    clearInterval(countdownInterval);
    timerBox.hidden = true;
    lockedBox.hidden = false;
    return;
  }
  timerBox.hidden = false;
  lockedBox.hidden = true;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  timerText.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
}

// ---------- Firestore: escuchar resultados en vivo ----------
function listenResults() {
  onSnapshot(
    collection(db, VOTES_COLLECTION),
    snapshot => {
      latestVotes = [];
      snapshot.forEach(d => latestVotes.push({ id: d.id, ...d.data() }));
      renderResults();
    },
    err => console.error('Error al escuchar los votos:', err)
  );
}

function renderResults() {
  if (!screens.results.classList.contains('active')) return;

  const total = latestVotes.length;
  const counts = { varon: 0, nena: 0, nididea: 0 };
  latestVotes.forEach(v => {
    if (counts[v.vote] !== undefined) counts[v.vote]++;
  });

  barsEl.innerHTML = '';
  VOTE_ORDER.forEach(key => {
    const pct = total ? Math.round((counts[key] / total) * 100) : 0;
    barsEl.appendChild(buildBarRow(key, counts[key], pct));
  });

  voterListEl.innerHTML = '';
  if (!latestVotes.length) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'Todavía nadie votó. ¡Sé el primero en aparecer acá!';
    voterListEl.appendChild(empty);
  } else {
    [...latestVotes]
      .sort((a, b) => (b.votedAt || 0) - (a.votedAt || 0))
      .forEach(v => voterListEl.appendChild(buildVoterRow(v)));
  }
}

function buildBarRow(key, count, pct) {
  const meta = VOTE_META[key];
  const wrap = document.createElement('div');
  wrap.className = 'bar-row';

  const top = document.createElement('div');
  top.className = 'bar-row__top';

  const label = document.createElement('span');
  label.className = 'bar-row__label';
  const dot = document.createElement('span');
  dot.className = 'bar-row__dot';
  dot.style.background = meta.color;
  label.appendChild(dot);
  label.appendChild(document.createTextNode(`${meta.short} (${count})`));

  const pctEl = document.createElement('span');
  pctEl.className = 'bar-row__pct';
  pctEl.textContent = `${pct}%`;

  top.appendChild(label);
  top.appendChild(pctEl);

  const track = document.createElement('div');
  track.className = 'bar-track';
  const fill = document.createElement('div');
  fill.className = 'bar-fill';
  fill.style.background = meta.color;
  track.appendChild(fill);

  wrap.appendChild(top);
  wrap.appendChild(track);

  // animar el ancho después de insertarlo en el DOM
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { fill.style.width = pct + '%'; });
  });

  return wrap;
}

function buildVoterRow(v) {
  const li = document.createElement('li');
  li.className = 'voter-row' + (voter && v.id === voter.id ? ' voter-row--you' : '');

  const name = document.createElement('span');
  name.className = 'voter-row__name';
  name.textContent = v.name || 'Familiar';

  const tag = document.createElement('span');
  const meta = VOTE_META[v.vote];
  tag.className = 'voter-row__tag voter-row__tag--' + v.vote;
  tag.textContent = meta ? meta.short : v.vote;

  li.appendChild(name);
  li.appendChild(tag);
  return li;
}

// ---------- compartir ----------
async function shareLink() {
  const url = location.href;
  if (navigator.share) {
    try {
      await navigator.share({ title: '¡Adivina Adivinador!', text: 'Votá si va a ser varón o nena 👶', url });
    } catch {
      // el usuario canceló el share nativo — no hacemos nada
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast('¡Link copiado! Mandaselo por WhatsApp 💌');
  } catch {
    showToast('Copiá el link desde la barra de direcciones del navegador.');
  }
}

// ---------- toast ----------
function showToast(msg) {
  clearTimeout(toastTimeout);
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 3400);
}

// ---------- confeti ----------
function launchConfetti() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const colors = ['#90CAF9', '#F48FB1', '#FFE082', '#C9A66B'];
  const root = document.createElement('div');
  root.className = 'confetti-root';
  root.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < 26; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = (Math.random() * 0.4) + 's';
    piece.style.animationDuration = (2.2 + Math.random() * 1.2) + 's';
    root.appendChild(piece);
  }
  document.body.appendChild(root);
  setTimeout(() => root.remove(), 3800);
}

// ---------- arranque ----------
init();
