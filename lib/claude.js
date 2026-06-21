'use strict';

/*
 * Anbindung an das `claude` CLI (Claude Code).
 * Nutzt die Abo-Anmeldung auf dem VPS – es entstehen KEINE separaten API-Kosten,
 * solange du dich mit `claude` (OAuth/Abo) angemeldet hast.
 *
 * Pro Browser-Session merken wir uns die Claude-Session-ID, damit der
 * Gespraechsverlauf erhalten bleibt (--resume).
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const MODEL = process.env.CLAUDE_MODEL || 'sonnet';
const WORKDIR = path.resolve(process.env.CLAUDE_WORKDIR || path.join(__dirname, '..', 'data'));
const TIMEOUT_MS = parseInt(process.env.CLAUDE_TIMEOUT_MS || '180000', 10);

// Persona: gespraechig, deutsch, gut vorlesbar (kein Markdown).
const SYSTEM_PROMPT = [
  'Du bist ein freundlicher, natuerlicher Sprachassistent.',
  'Antworte standardmaessig auf Deutsch, es sei denn der Nutzer spricht eine andere Sprache.',
  'Deine Antworten werden laut vorgelesen: schreibe daher in fliessenden Saetzen,',
  'ohne Markdown, ohne Aufzaehlungszeichen, ohne Code-Bloecke, ohne Emojis und ohne Sonderzeichen,',
  'die sich schlecht vorlesen lassen. Fasse dich klar und nicht unnoetig lang.',
].join(' ');

// Arbeitsverzeichnis sicherstellen
try { fs.mkdirSync(WORKDIR, { recursive: true }); } catch (_) {}

/**
 * @param {string} prompt  Nutzereingabe
 * @param {string|undefined} resumeSession  vorhandene Claude-Session-ID
 * @returns {Promise<{reply:string, sessionId:string}>}
 */
function runClaude(prompt, resumeSession) {
  return new Promise((resolve, reject) => {
    const args = ['-p', prompt, '--output-format', 'json', '--model', MODEL];
    if (resumeSession) {
      args.push('--resume', resumeSession);
    } else {
      args.push('--system-prompt', SYSTEM_PROMPT);
    }

    const child = spawn('claude', args, {
      cwd: WORKDIR,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let out = '';
    let err = '';
    let done = false;

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      child.kill('SIGKILL');
      reject(new Error('Zeitueberschreitung'));
    }, TIMEOUT_MS);

    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { err += d.toString(); });

    child.on('error', (e) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      reject(new Error('claude konnte nicht gestartet werden: ' + e.message));
    });

    child.on('close', (code) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new Error((err || out || 'unbekannter Fehler').slice(0, 500)));
      }
      try {
        const json = JSON.parse(out);
        const reply = (json.result || '').toString().trim();
        const sessionId = json.session_id || resumeSession;
        if (json.is_error) return reject(new Error(reply || 'Claude meldete einen Fehler'));
        resolve({ reply, sessionId });
      } catch (e) {
        reject(new Error('Antwort konnte nicht gelesen werden: ' + e.message));
      }
    });
  });
}

module.exports = { runClaude };
