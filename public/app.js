'use strict';

/* VoiceClaude – Frontend-Logik */

const $ = (id) => document.getElementById(id);

// --- Screens ---
const loginScreen = $('login');
const appScreen = $('app');

// --- Login ---
async function checkAuth() {
  try {
    const r = await fetch('/api/me');
    const d = await r.json();
    showScreen(d.authed);
  } catch {
    showScreen(false);
  }
}
function showScreen(authed) {
  loginScreen.classList.toggle('hidden', authed);
  appScreen.classList.toggle('hidden', !authed);
  if (authed) $('textInput').focus();
  else $('password').focus();
}
$('loginBtn').addEventListener('click', doLogin);
$('password').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
async function doLogin() {
  const password = $('password').value;
  $('loginError').textContent = '';
  try {
    const r = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (r.ok) { $('password').value = ''; showScreen(true); }
    else { const d = await r.json(); $('loginError').textContent = d.error || 'Login fehlgeschlagen'; }
  } catch { $('loginError').textContent = 'Verbindungsfehler'; }
}
$('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  showScreen(false);
});
$('newChatBtn').addEventListener('click', async () => {
  await fetch('/api/new-chat', { method: 'POST' });
  $('conversation').innerHTML = '';
  $('player').classList.add('hidden');
  stopAudio();
  setStatus('Neues Gespräch begonnen.');
});

// --- Konversation anzeigen ---
function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.textContent = text;
  $('conversation').appendChild(div);
  $('conversation').scrollTop = $('conversation').scrollHeight;
  return div;
}
function setStatus(text, cls = '') {
  const s = $('status');
  s.textContent = text;
  s.className = 'status ' + (cls || 'muted');
}

// --- Text senden ---
$('textForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const text = $('textInput').value.trim();
  if (!text) return;
  $('textInput').value = '';
  sendToClaude(text);
});

async function sendToClaude(text) {
  addMessage('user', text);
  const thinking = addMessage('assistant thinking', 'denkt nach …');
  setStatus('Claude denkt nach …');
  try {
    const r = await fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Fehler');
    thinking.remove();
    addMessage('assistant', d.reply);
    setStatus('Bereit.');
    speak(d.reply);
  } catch (err) {
    thinking.remove();
    addMessage('assistant', '⚠️ ' + err.message);
    setStatus('Fehler: ' + err.message, 'err');
  }
}

/* =========================================================
 *  AUFNAHME (Speech-to-Text via Whisper auf dem VPS)
 * ========================================================= */
let mediaRecorder = null;
let chunks = [];
let recording = false;

function pickMime() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  for (const c of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

$('micBtn').addEventListener('click', toggleRecording);

async function toggleRecording() {
  if (recording) { stopRecording(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mime = pickMime();
    mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunks = [];
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: mime || 'audio/webm' });
      await transcribe(blob, mime);
    };
    mediaRecorder.start();
    recording = true;
    $('micBtn').classList.add('recording');
    setStatus('🔴 Aufnahme … tippe zum Stoppen', 'rec');
  } catch (err) {
    setStatus('Mikrofon-Zugriff verweigert oder kein HTTPS. ' + err.message, 'err');
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  recording = false;
  $('micBtn').classList.remove('recording');
  setStatus('Verarbeite Sprache …');
}

async function transcribe(blob, mime) {
  const ext = (mime || '').includes('mp4') ? 'mp4' : (mime || '').includes('ogg') ? 'ogg' : 'webm';
  const form = new FormData();
  form.append('audio', blob, 'aufnahme.' + ext);
  try {
    const r = await fetch('/api/transcribe', { method: 'POST', body: form });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || 'Erkennung fehlgeschlagen');
    const text = (d.text || '').trim();
    if (!text) { setStatus('Nichts verstanden – bitte nochmal.', 'err'); return; }
    sendToClaude(text);
  } catch (err) {
    setStatus('Fehler bei der Erkennung: ' + err.message, 'err');
  }
}

/* =========================================================
 *  WIEDERGABE (Text-to-Speech via Piper) mit Player-Steuerung
 * ========================================================= */
const audio = $('audio');
const playPauseBtn = $('playPause');
const seek = $('seek');

function fmt(t) {
  if (!isFinite(t)) return '0:00';
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return m + ':' + String(s).padStart(2, '0');
}
function stopAudio() {
  try { audio.pause(); } catch {}
  if (audio.src && audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src);
  audio.removeAttribute('src');
}

async function speak(text) {
  setStatus('Erzeuge Sprachausgabe …');
  try {
    const r = await fetch('/api/tts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || 'TTS-Fehler'); }
    const blob = await r.blob();
    stopAudio();
    audio.src = URL.createObjectURL(blob);
    $('player').classList.remove('hidden');
    await audio.play().catch(() => {}); // Autoplay kann blockiert sein -> Nutzer drückt Play
    setStatus('Bereit.');
  } catch (err) {
    setStatus('Sprachausgabe nicht möglich: ' + err.message, 'err');
  }
}

// Player-Buttons
playPauseBtn.addEventListener('click', () => {
  if (audio.paused) audio.play(); else audio.pause();
});
$('back10').addEventListener('click', () => { audio.currentTime = Math.max(0, audio.currentTime - 10); });
$('fwd10').addEventListener('click', () => { audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 10); });

const speeds = [1, 1.25, 1.5, 0.75];
let speedIdx = 0;
$('speed').addEventListener('click', () => {
  speedIdx = (speedIdx + 1) % speeds.length;
  audio.playbackRate = speeds[speedIdx];
  $('speed').textContent = speeds[speedIdx] + '×';
});

audio.addEventListener('play', () => { playPauseBtn.textContent = '⏸'; });
audio.addEventListener('pause', () => { playPauseBtn.textContent = '▶'; });
audio.addEventListener('ended', () => { playPauseBtn.textContent = '▶'; });
audio.addEventListener('loadedmetadata', () => { $('dur').textContent = fmt(audio.duration); });
audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    seek.value = (audio.currentTime / audio.duration) * 100;
    $('cur').textContent = fmt(audio.currentTime);
  }
});
seek.addEventListener('input', () => {
  if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration;
});

// Start
checkAuth();
