/**
 * Generates a seamless, upbeat, instrumental background-music loop offline
 * (no dependencies). Light "game-show" energy — soft pads, gentle arpeggio
 * and a warm bass — intended to sit quietly at ~12% volume.
 *
 * Run with: npm run music
 * Output: public/media/audio/background-music.wav
 *
 * The game references background-music.mp3 first and falls back to this .wav,
 * so a licensed MP3 track can be dropped in later without code changes.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public",
  "media",
  "audio",
);
mkdirSync(OUT, { recursive: true });

// --- Musical plan -------------------------------------------------------
const BPM = 112;
const beat = 60 / BPM; // seconds per beat
const bar = beat * 4;
const BARS = 8;
const totalSec = bar * BARS;
const N = Math.floor(SR * totalSec);

const NOTE = (name) => {
  // Equal temperament, A4 = 440.
  const map = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const m = /^([A-G])(#?)(-?\d)$/.exec(name);
  const semis = map[m[1]] + (m[2] ? 1 : 0);
  const octave = parseInt(m[3], 10);
  const midi = semis + (octave + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
};

// I–V–vi–IV feel in C major, resolved.
const chords = [
  { root: "C2", notes: ["C4", "E4", "G4"] },
  { root: "G2", notes: ["B3", "D4", "G4"] },
  { root: "A2", notes: ["A3", "C4", "E4"] },
  { root: "F2", notes: ["F3", "A3", "C4"] },
  { root: "C2", notes: ["C4", "E4", "G4"] },
  { root: "G2", notes: ["B3", "D4", "G4"] },
  { root: "F2", notes: ["F3", "A3", "C4"] },
  { root: "G2", notes: ["G3", "B3", "D4"] },
];

const out = new Float32Array(N);

function addNote(startSec, durSec, freq, vol, type, attack = 0.008) {
  const start = Math.floor(startSec * SR);
  const len = Math.floor(durSec * SR);
  const a = Math.max(1, Math.floor(attack * SR));
  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= N) continue;
    const t = i / SR;
    const phase = 2 * Math.PI * freq * t;
    let v;
    if (type === "triangle") v = (2 / Math.PI) * Math.asin(Math.sin(phase));
    else if (type === "saw") v = 2 * ((freq * t) % 1) - 1;
    else v = Math.sin(phase);
    // Envelope: short attack, gentle exponential decay to a soft sustain.
    let env;
    if (i < a) env = i / a;
    else env = 0.35 + 0.65 * Math.pow(1 - (i - a) / (len - a), 1.6);
    out[idx] += v * vol * env;
  }
}

for (let b = 0; b < BARS; b++) {
  const chord = chords[b];
  const barStart = b * bar;

  // Warm bass: root on beats 1 and 3, a fifth-ish bounce on 2 and 4.
  addNote(barStart + 0 * beat, beat * 0.9, NOTE(chord.root), 0.5, "triangle");
  addNote(barStart + 2 * beat, beat * 0.9, NOTE(chord.root), 0.42, "triangle");

  // Soft sustained pad (chord triad) across the whole bar.
  chord.notes.forEach((n) =>
    addNote(barStart, bar * 0.98, NOTE(n), 0.09, "sine", 0.06),
  );

  // Gentle arpeggio: eighth notes cycling the triad — light plucks.
  for (let e = 0; e < 8; e++) {
    const n = chord.notes[e % chord.notes.length];
    const up = e >= 4 ? 2 : 1; // lift the octave in the back half of the bar
    addNote(
      barStart + e * (beat / 2),
      beat * 0.42,
      NOTE(n) * up,
      0.11,
      "sine",
      0.004,
    );
  }

  // Sparse melody accents on a few bars for a game-show lift.
  if (b === 3 || b === 7) {
    addNote(barStart + 3 * beat, beat * 0.9, NOTE(chord.notes[2]) * 2, 0.14, "triangle");
  }
}

// Soft master limiting to keep it smooth and quiet.
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(out[i]));
const norm = peak > 0 ? 0.6 / peak : 1;
for (let i = 0; i < N; i++) out[i] = Math.tanh(out[i] * norm * 1.2) * 0.85;

// --- Write 16-bit mono WAV ---------------------------------------------
const buf = Buffer.alloc(44 + N * 2);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 2, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(1, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 2, 28);
buf.writeUInt16LE(2, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) {
  const v = Math.max(-1, Math.min(1, out[i]));
  buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
}
const path = join(OUT, "background-music.wav");
writeFileSync(path, buf);
console.log(`wrote ${path} (${(buf.length / 1024 / 1024).toFixed(2)} MB, ${totalSec.toFixed(1)}s loop)`);
