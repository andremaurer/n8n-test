'use strict';

/*
 * VoiceClaude – Node-Backend
 * --------------------------
 * Aufgaben:
 *   1. Statische Web-Oberflaeche ausliefern (public/)
 *   2. Passwort-Login (Cookie-Session)
 *   3. /api/chat  -> ruft das `claude` CLI auf (nutzt dein Abo, keine API-Kosten)
 *   4. /api/transcribe und /api/tts  -> leitet an den Python-Media-Dienst weiter
 *
 * Der Server lauscht nur lokal; HTTPS macht Caddy davor.
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const cookieSession = require('cookie-session');
const multer = require('multer');
const { runClaude } = require('./lib/claude');

// --- Minimaler .env-Loader (keine Extra-Abhaengigkeit noetig) ---
(function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
})();

const PORT = parseInt(process.env.PORT || '3000', 10);
const APP_PASSWORD = process.env.APP_PASSWORD || '';
const SESSION_SECRET = process.env.SESSION_SECRET || 'unsicheres-standard-geheimnis-bitte-aendern';
const MEDIA_URL = (process.env.MEDIA_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');

if (!APP_PASSWORD) {
  console.error('FEHLER: APP_PASSWORD ist nicht gesetzt. Bitte .env anlegen (siehe .env.example).');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1); // hinter Caddy
app.use(express.json({ limit: '2mb' }));

// In Produktion laeuft alles hinter HTTPS (Caddy) -> Secure-Cookies.
// Fuer lokales Testen ueber http kann COOKIE_SECURE=false gesetzt werden.
const COOKIE_SECURE = process.env.COOKIE_SECURE !== 'false';
app.use(cookieSession({
  name: 'vc_session',
  keys: [SESSION_SECRET],
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Tage
  httpOnly: true,
  sameSite: 'lax',
  secure: COOKIE_SECURE,
}));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// --- Authentifizierung ---
function requireAuth(req, res, next) {
  if (req.session && req.session.authed) return next();
  return res.status(401).json({ error: 'Nicht angemeldet' });
}

app.post('/api/login', (req, res) => {
  const pw = (req.body && req.body.password) || '';
  if (pw && pw === APP_PASSWORD) {
    req.session.authed = true;
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Falsches Passwort' });
});

app.post('/api/logout', (req, res) => {
  req.session = null;
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  res.json({ authed: !!(req.session && req.session.authed) });
});

// --- Chat: an Claude weiterreichen ---
app.post('/api/chat', requireAuth, async (req, res) => {
  const text = (req.body && req.body.text || '').toString().trim();
  if (!text) return res.status(400).json({ error: 'Kein Text' });
  try {
    const { reply, sessionId } = await runClaude(text, req.session.claudeSession);
    req.session.claudeSession = sessionId;
    res.json({ reply });
  } catch (err) {
    console.error('Claude-Fehler:', err.message);
    res.status(500).json({ error: 'Claude-Aufruf fehlgeschlagen: ' + err.message });
  }
});

// Neues Gespraech beginnen (Verlauf bei Claude vergessen)
app.post('/api/new-chat', requireAuth, (req, res) => {
  req.session.claudeSession = undefined;
  res.json({ ok: true });
});

// --- Transcribe: Audio -> Text (Proxy zu Whisper) ---
app.post('/api/transcribe', requireAuth, upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Keine Audiodatei' });
  try {
    const form = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || 'audio/webm' });
    form.append('audio', blob, req.file.originalname || 'audio.webm');
    const r = await fetch(`${MEDIA_URL}/transcribe`, { method: 'POST', body: form });
    if (!r.ok) throw new Error('Media-Dienst antwortete ' + r.status);
    const data = await r.json();
    res.json(data);
  } catch (err) {
    console.error('Transcribe-Fehler:', err.message);
    res.status(500).json({ error: 'Spracherkennung fehlgeschlagen: ' + err.message });
  }
});

// --- TTS: Text -> Audio (Proxy zu Piper) ---
app.post('/api/tts', requireAuth, async (req, res) => {
  const text = (req.body && req.body.text || '').toString();
  if (!text.trim()) return res.status(400).json({ error: 'Kein Text' });
  try {
    const r = await fetch(`${MEDIA_URL}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) throw new Error('Media-Dienst antwortete ' + r.status);
    res.setHeader('Content-Type', 'audio/wav');
    const buf = Buffer.from(await r.arrayBuffer());
    res.send(buf);
  } catch (err) {
    console.error('TTS-Fehler:', err.message);
    res.status(500).json({ error: 'Sprachausgabe fehlgeschlagen: ' + err.message });
  }
});

// --- Statische Oberflaeche ---
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '127.0.0.1', () => {
  console.log(`VoiceClaude-Backend laeuft auf http://127.0.0.1:${PORT}`);
});
