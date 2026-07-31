let audioContext = null;

function getContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

export function jouerSonNotification() {
  try {
    const ctx = getContext();
    if (ctx.state === "suspended") ctx.resume();

    const jouerNote = (freq, debut, duree, volume = 0.15) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);

      const t = ctx.currentTime + debut;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(volume, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duree);

      osc.start(t);
      osc.stop(t + duree);
    };

    // Petit carillon a deux notes, agreable et discret
    jouerNote(880, 0, 0.18);
    jouerNote(1175, 0.12, 0.22);
  } catch (err) {
    console.warn("Impossible de jouer le son de notification:", err);
  }
}