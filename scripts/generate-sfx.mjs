/**
 * Generates the game's sound-effect WAV files offline (no dependencies).
 * Run with: npm run sfx
 * Output: public/media/sfx/*.wav — the game falls back to Web Audio
 * synthesis if these files are removed.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "media", "sfx");
mkdirSync(OUT, { recursive: true });

function wavFile(samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
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
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  return buf;
}

const seconds = (s) => Math.floor(SR * s);
const env = (i, n, attack = 0.01) => {
  const a = seconds(attack);
  if (i < a) return i / a;
  return Math.pow(1 - (i - a) / (n - a), 2);
};

function tone(freq, dur, { type = "sine", vol = 0.5, attack = 0.01 } = {}) {
  const n = seconds(dur);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v;
    const phase = 2 * Math.PI * freq * t;
    if (type === "triangle") v = (2 / Math.PI) * Math.asin(Math.sin(phase));
    else if (type === "square") v = Math.sign(Math.sin(phase)) * 0.6;
    else v = Math.sin(phase);
    out[i] = v * vol * env(i, n, attack);
  }
  return out;
}

function mix(...layers) {
  const n = Math.max(...layers.map((l) => l.offset + l.data.length));
  const out = new Float32Array(n);
  for (const { data, offset } of layers) {
    for (let i = 0; i < data.length; i++) out[offset + i] += data[i];
  }
  return out;
}
const at = (sec, data) => ({ data, offset: seconds(sec) });

// pop: white-noise burst with a low thump
function pop() {
  const n = seconds(0.16);
  const noise = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    noise[i] = (Math.random() * 2 - 1) * 0.85 * Math.pow(1 - i / n, 2.4);
  }
  return mix(at(0, noise), at(0, tone(170, 0.1, { type: "triangle", vol: 0.5 })));
}

const correct = () =>
  mix(
    at(0, tone(523.25, 0.16, { type: "triangle", vol: 0.4 })),
    at(0.1, tone(659.25, 0.16, { type: "triangle", vol: 0.4 })),
    at(0.2, tone(783.99, 0.34, { type: "triangle", vol: 0.45 })),
  );

const wrong = () =>
  mix(
    at(0, tone(392, 0.24, { vol: 0.32 })),
    at(0.2, tone(311.13, 0.4, { vol: 0.28 })),
  );

const tick = () => tone(880, 0.08, { vol: 0.3 });

const fanfare = () =>
  mix(
    at(0, tone(523.25, 0.2, { type: "triangle", vol: 0.35 })),
    at(0.15, tone(659.25, 0.2, { type: "triangle", vol: 0.35 })),
    at(0.3, tone(783.99, 0.2, { type: "triangle", vol: 0.35 })),
    at(0.45, tone(1046.5, 0.6, { type: "triangle", vol: 0.4 })),
    at(0.45, tone(523.25, 0.6, { type: "triangle", vol: 0.2 })),
  );

const click = () => tone(600, 0.05, { type: "square", vol: 0.12 });

const files = { pop, correct, wrong, tick, fanfare, click };
for (const [name, fn] of Object.entries(files)) {
  const path = join(OUT, `${name}.wav`);
  writeFileSync(path, wavFile(fn()));
  console.log("wrote", path);
}
