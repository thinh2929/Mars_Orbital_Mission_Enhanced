let audioCtx: AudioContext | null = null;
let soundEnabled = true;

export function setSoundEnabled(val: boolean) {
  soundEnabled = val;
}

export function isSoundEnabled() {
  return soundEnabled;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playTone(freq = 550, dur = 0.1) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch (e) {
    console.debug('Audio error:', e);
  }
}

export function playSoundEffect(which: 'ignite' | 'stage-sep' | 'centaur-ignite' | 'fairing-sep' | 'detach') {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const durations: Record<string, number> = {
      ignite: 2.2,
      'stage-sep': 0.5,
      'centaur-ignite': 1.2,
      'fairing-sep': 0.45,
      detach: 0.64,
    };
    const duration = durations[which] || 0.4;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = which === 'ignite' ? 'sawtooth' : which === 'centaur-ignite' ? 'triangle' : 'square';
    const startFreq = which === 'ignite' ? 45 : which === 'centaur-ignite' ? 110 : 270;
    const endFreq = which === 'ignite' ? 155 : which === 'centaur-ignite' ? 190 : 70;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(which === 'ignite' ? 0.095 : 0.065, now + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  } catch (e) {
    console.debug('Sound effect error:', e);
  }
}
