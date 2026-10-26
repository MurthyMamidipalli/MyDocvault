// Web Audio API & Vibration utility for cross-device Notification Sounds
// Zero external files, 100% offline, works in browser and installed mobile PWAs

export const playNotificationSound = (type: 'reminder' | 'task' | 'complete' | 'alert' = 'reminder') => {
  try {
    // 1. Mobile Vibration API (vibrates phone on Android / supported mobile PWAs)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'complete') {
          navigator.vibrate([100, 50, 150]);
        } else if (type === 'alert') {
          navigator.vibrate([200, 100, 200]);
        } else {
          // 3 rhythmic pulses for calendar / task reminder
          navigator.vibrate([250, 100, 250, 100, 250]);
        }
      } catch (_) {}
    }

    // 2. Synthesized Audio Chimes via standard Web Audio API
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === 'complete') {
      // Pleasant high-rising completion chime (D5 -> A5 -> D6)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880.00, now + 0.12);

      osc2.frequency.setValueAtTime(880.00, now + 0.12);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.2);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.6);
    } else if (type === 'alert') {
      // Warning chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(370, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } else {
      // Crystal bell notification chime for Calendar reminders & Tasks (E5 -> B5 -> E6)
      const notes = [659.25, 987.77, 1318.51];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0.35, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.48);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.52);
      });
    }
  } catch (err) {
    console.warn("[Sound Notification Warning]", err);
  }
};
