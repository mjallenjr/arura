/**
 * Sound design system for arura.
 * Uses Web Audio API to generate short branded tones.
 * No external audio files needed.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", volume = 0.12) {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

function playChord(freqs: number[], duration: number, type: OscillatorType = "sine", volume = 0.08) {
  freqs.forEach((f) => playTone(f, duration, type, volume));
}

/** Soft "felt" tap — warm low tone */
export function playFelt() {
  playTone(440, 0.15, "sine", 0.1);
  setTimeout(() => playTone(554, 0.1, "sine", 0.06), 50);
}

/** Stitch submit — ascending two-note */
export function playStitch() {
  playTone(523, 0.12, "triangle", 0.1);
  setTimeout(() => playTone(659, 0.15, "triangle", 0.08), 80);
}

/** Level up — triumphant chord burst */
export function playLevelUp() {
  playChord([523, 659, 784], 0.3, "sine", 0.1);
  setTimeout(() => playChord([587, 740, 880], 0.4, "sine", 0.08), 150);
}

/** Rekindle — warm rising sweep */
export function playRekindle() {
  const ctx = getCtx();
  if (ctx.state === "suspended") ctx.resume();
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(330, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

/** Swipe transition — subtle click */
export function playSwipe() {
  playTone(1200, 0.04, "square", 0.03);
}

/** Haptic patterns */
export function hapticFelt() {
  navigator.vibrate?.([15]);
}

export function hapticStitch() {
  navigator.vibrate?.([10, 30, 20]);
}

export function hapticLevelUp() {
  navigator.vibrate?.([30, 50, 30, 50, 60]);
}

export function hapticRekindle() {
  navigator.vibrate?.([20, 40, 40]);
}

export function hapticSwipe() {
  navigator.vibrate?.([8]);
}
