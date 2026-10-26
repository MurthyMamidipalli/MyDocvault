// Web Audio API & Vibration utility for cross-device Notification Sounds
// Zero external files, 100% offline, works in browser and installed mobile PWAs

export interface NotificationSoundOption {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const AVAILABLE_NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  { id: 'morning_harp', name: 'Morning Sunrise Harp', description: 'Gentle warm acoustic arpeggio chime', icon: '🌅' },
  { id: 'crystal_bell', name: 'Crystal Bell Chime', description: 'Bright rhythmic high-clarity triple bell', icon: '🔔' },
  { id: 'gentle_chime', name: 'Zen Bowl / Gentle Chime', description: 'Calm harmonic meditation bell', icon: '✨' },
  { id: 'digital_pulse', name: 'Digital Tech Pulse', description: 'Modern futuristic crisp double ping', icon: '⚡' },
  { id: 'marimba_pop', name: 'Marimba Uplift', description: 'Playful warm wooden melodic bounce', icon: '🎵' },
  { id: 'rooster_ding', name: 'Morning Wakeup Ding', description: 'Crisp energetic double chime', icon: '☀️' }
];

export const getUserPreferredSound = (): string => {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user_custom_notification_sound');
      if (stored && AVAILABLE_NOTIFICATION_SOUNDS.some(s => s.id === stored)) {
        return stored;
      }
    }
  } catch (_) {}
  return 'morning_harp';
};

export const setUserPreferredSound = (soundId: string) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_custom_notification_sound', soundId);
    }
  } catch (_) {}
};

export const playNotificationSound = (
  type: 'reminder' | 'task' | 'complete' | 'alert' | string = 'reminder'
) => {
  try {
    // 1. Mobile Vibration API (vibrates phone on Android / supported mobile PWAs)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'complete') {
          navigator.vibrate([100, 50, 150]);
        } else if (type === 'alert') {
          navigator.vibrate([200, 100, 200]);
        } else {
          // 3 rhythmic pulses for calendar / task / morning reminder
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

    // Check if a specific custom sound ID was provided or if user configured a custom sound
    const effectiveSound = AVAILABLE_NOTIFICATION_SOUNDS.some(s => s.id === type) 
      ? type 
      : (type === 'reminder' || type === 'task' ? getUserPreferredSound() : type);

    if (effectiveSound === 'complete') {
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
    } else if (effectiveSound === 'alert') {
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
    } else if (effectiveSound === 'morning_harp') {
      // Gentle Morning Sunrise Harp (C4, E4, G4, B4, D5, G5)
      const notes = [261.63, 329.63, 392.00, 493.88, 587.33, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + i * 0.08;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.65);
      });
    } else if (effectiveSound === 'gentle_chime') {
      // Warm Zen Bowl / Singing Bell (F4, A4, C5)
      const notes = [349.23, 440.00, 523.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + i * 0.15;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.95);
      });
    } else if (effectiveSound === 'digital_pulse') {
      // Crisp Futuristic Tech Pulse (880Hz -> 1760Hz double ping)
      [0, 0.12].forEach((offset, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = now + offset;
        osc.frequency.setValueAtTime(idx === 0 ? 880 : 1760, start);

        gain.gain.setValueAtTime(0.28, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.2);
      });
    } else if (effectiveSound === 'marimba_pop') {
      // Marimba Uplift (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = now + i * 0.09;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.32, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.4);
      });
    } else if (effectiveSound === 'rooster_ding') {
      // Morning Wakeup Ding (Bright Double Chime D5 -> A5)
      [587.33, 880.00].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = now + i * 0.16;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.6);
      });
    } else {
      // Default: Crystal Bell Chime (E5 -> B5 -> E6)
      const notes = [659.25, 987.77, 1318.51];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = now + i * 0.12;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.48);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.52);
      });
    }
  } catch (err) {
    console.warn("[Sound Notification Warning]", err);
  }
};

// Cross-device Morning Email Notification Dispatcher
export const sendMorningEmailNotification = (
  userEmailOrOptions: string | { toEmail?: string; userEmail?: string; items: { title: string; category?: string; targetDate?: string; type?: string }[]; userName?: string },
  itemsParam?: { title: string; category?: string; targetDate?: string; type?: string }[],
  userNameParam?: string
) => {
  let recipient = 'user@example.com';
  let items: { title: string; category?: string; targetDate?: string; type?: string }[] = [];
  let userName = '';

  if (typeof userEmailOrOptions === 'object' && userEmailOrOptions !== null) {
    recipient = (userEmailOrOptions.toEmail || userEmailOrOptions.userEmail || '').trim() || 'user@example.com';
    items = userEmailOrOptions.items || [];
    userName = userEmailOrOptions.userName || '';
  } else {
    recipient = (typeof userEmailOrOptions === 'string' ? userEmailOrOptions : '').trim() || 'user@example.com';
    items = itemsParam || [];
    userName = userNameParam || '';
  }
  const todayStr = new Date().toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const subject = `☀️ Morning Daily Reminder: Tasks & Milestones for ${todayStr}`;
  
  const tasksFormatted = items.length > 0 
    ? items.map((item, idx) => `  ${idx + 1}. [ ] ${item.title}${item.targetDate ? ` (Target: ${item.targetDate})` : ''} - [${item.category || item.type || 'Daily Work'}]`).join('\n')
    : '  • No pending tasks scheduled for this morning.';

  const body = 
`Good Morning ${userName || 'there'},

Here is your daily scheduled morning check-in:

📅 Date: ${todayStr}

🎯 Today's Daily Milestones & Work Tasks:
${tasksFormatted}

🔔 Note: This reminder was scheduled with the 'Every Day' option in your MyDocVault workspace.
Have a productive and successful day!

-- 
MyDocVault Automated Morning Intelligence`;

  const isMobile = typeof navigator !== 'undefined' && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
    window.innerWidth < 768
  );

  if (isMobile) {
    window.location.href = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  } else {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
  }
};
