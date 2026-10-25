/**
 * Procedural Web Audio API sound synthesizer for The Midnight Steeper.
 * Generates retro-arcade, pet-care, mini-game sounds and continuous generative lofi sleep soundscapes
 * directly in the browser with 0 external assets.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  // Soundscape state
  private soundscapeActive: boolean = false;
  private soundscapeMode: 'off' | 'rain' | 'breeze' | 'chimes' = 'off';
  private soundscapeGain: GainNode | null = null;
  private soundscapeNodes: (AudioNode | { stop: () => void; disconnect: () => void })[] = [];
  private soundscapeInterval: ReturnType<typeof setInterval> | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Subtle sci-fi cursor hover blip
  playHover() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.025);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.025);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  }

  // Tactile button click / select sound
  playClick() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  // Ingredient slotting sound (snappy sci-fi double-beep)
  playEquip() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    [540, 810].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.04);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.04 + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.04);
      osc.stop(ctx.currentTime + idx * 0.04 + 0.09);
    });
  }

  // Typewriter micro-tick for alien transmissions
  playTypewriterTick() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200 + Math.random() * 400, ctx.currentTime);
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  }

  // Cosmic vat ignition: sub rumble + warp acceleration whoosh
  playIgnite() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Sub rumble
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(80, ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.4);
    subGain.gain.setValueAtTime(0.25, ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start();
    subOsc.stop(ctx.currentTime + 0.65);

    // High sweep
    const sweepOsc = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweepOsc.type = 'sine';
    sweepOsc.frequency.setValueAtTime(200, ctx.currentTime + 0.1);
    sweepOsc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.7);
    sweepGain.gain.setValueAtTime(0.2, ctx.currentTime + 0.1);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    sweepOsc.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweepOsc.start(ctx.currentTime + 0.1);
    sweepOsc.stop(ctx.currentTime + 0.85);
  }

  // Loot fanfare victory arpeggio
  playLootFanfare() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51]; // A major 7 arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
      gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.65);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.07);
      osc.stop(ctx.currentTime + idx * 0.07 + 0.7);
    });
  }

  // Achievement unlock fanfare (glistening chime)
  playAchievement() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const chords = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    chords.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.05);
      osc.stop(ctx.currentTime + idx * 0.05 + 0.55);
    });
  }

  // Bouncy sine blip used by the kid sounds below
  private blip(freqFrom: number, freqTo: number, start: number, dur: number, vol = 0.14, type: OscillatorType = 'sine') {
    const ctx = this.getContext();
    if (!ctx) return;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(freqTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // Sunny's giggle: a quick run of rising bubbles
  playGiggle() {
    if (!this.enabled) return;
    [0, 0.09, 0.18, 0.27].forEach((d, i) => this.blip(520 + i * 70, 900 + i * 90, d, 0.08, 0.13));
  }

  // Sleepy yawn: a slow falling slide
  playYawn() {
    if (!this.enabled) return;
    this.blip(520, 180, 0, 1.1, 0.1, 'triangle');
  }

  // Soft pop when a friend arrives or a card is picked
  playPop() {
    if (!this.enabled) return;
    this.blip(300, 760, 0, 0.09, 0.16);
  }

  // Little three-note wind chime
  playChime() {
    if (!this.enabled) return;
    [660, 880, 1320].forEach((f, i) => this.blip(f, f * 1.01, i * 0.12, 0.5, 0.1));
  }

  // Screen shake sub impact
  playImpact() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  }

  // Water splash sound for bath time!
  playSplash() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    this.blip(260, 90, 0, 0.22, 0.2, 'triangle');
    [0.04, 0.09, 0.14, 0.19].forEach((d, i) => {
      this.blip(500 + i * 140, 1100 + i * 80, d, 0.06, 0.12, 'sine');
    });
  }

  // Water stream whoosh for shower spray
  playWaterStream() {
    if (!this.enabled) return;
    [0, 0.05, 0.1, 0.15].forEach((d) => {
      this.blip(600 + Math.random() * 200, 1200 + Math.random() * 300, d, 0.05, 0.08, 'sine');
    });
  }

  // Squeaky rubber duck sound
  playSqueak() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, t0);
    osc.frequency.linearRampToValueAtTime(1480, t0 + 0.06);
    osc.frequency.linearRampToValueAtTime(820, t0 + 0.14);
    gain.gain.setValueAtTime(0.2, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.16);
  }

  // Bubble pop
  playBubblePop() {
    if (!this.enabled) return;
    this.blip(450, 1350, 0, 0.05, 0.18, 'sine');
  }

  // Cute nom nom / chomp sound for feeding
  playNom() {
    if (!this.enabled) return;
    this.blip(380, 180, 0, 0.07, 0.22, 'triangle');
    this.blip(520, 240, 0.08, 0.08, 0.18, 'sine');
  }

  // Mini-game card match success
  playMatchSuccess() {
    if (!this.enabled) return;
    this.blip(659.25, 659.25, 0, 0.12, 0.18, 'sine');
    this.blip(987.77, 987.77, 0.1, 0.25, 0.22, 'sine');
    this.blip(1318.51, 1318.51, 0.18, 0.35, 0.2, 'sine');
  }

  // Mini-game mismatch fail
  playMatchFail() {
    if (!this.enabled) return;
    this.blip(340, 290, 0, 0.12, 0.12, 'triangle');
    this.blip(260, 210, 0.1, 0.16, 0.12, 'triangle');
  }

  // Catching falling item / coin pickup
  playCatch() {
    if (!this.enabled) return;
    this.blip(784, 1174, 0, 0.08, 0.2, 'sine');
  }

  // Mini-game victory fanfare
  playGameWin() {
    if (!this.enabled) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      this.blip(f, f, idx * 0.08, 0.3, 0.18, 'triangle');
    });
  }

  // ==========================================
  // PROCEDURAL GENERATIVE LOFI / WHITE NOISE SOUNDSCAPE
  // ==========================================

  /** Generates a loopable pink noise buffer using the Paul Kellet algorithm */
  private createPinkNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  /** Starts a procedural soothing sleep soundscape: 'rain' | 'breeze' | 'chimes' */
  startSleepSoundscape(mode: 'rain' | 'breeze' | 'chimes' = 'rain') {
    if (!this.enabled) return;
    this.stopSleepSoundscape();
    const ctx = this.getContext();
    if (!ctx) return;

    this.soundscapeMode = mode;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 1.2);
    masterGain.connect(ctx.destination);
    this.soundscapeGain = masterGain;

    if (mode === 'rain' || mode === 'breeze') {
      const noiseBuffer = this.createPinkNoiseBuffer(ctx, 4);
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(mode === 'rain' ? 440 : 220, ctx.currentTime);

      // Slow breathing rate modulation (0.12 Hz LFO simulates relaxed sloth breathing)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(mode === 'rain' ? 0.2 : 0.09, ctx.currentTime);
      lfoGain.gain.setValueAtTime(mode === 'rain' ? 70 : 110, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      noiseSource.connect(filter);
      filter.connect(masterGain);
      noiseSource.start();

      this.soundscapeNodes.push(noiseSource, lfo);
    }

    if (mode === 'chimes' || mode === 'breeze') {
      // Warm, calming lofi drone chord: F3, C4, E4 (cozy restful interval)
      const freqs = [174.61, 261.63, 329.63];
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        g.gain.setValueAtTime(0.02, ctx.currentTime);
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        this.soundscapeNodes.push(osc);
      });
    }

    if (mode === 'chimes') {
      // Occasional random gentle wind chime note
      const chimeNotes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      this.soundscapeInterval = setInterval(() => {
        if (!this.soundscapeActive) return;
        const note = chimeNotes[Math.floor(Math.random() * chimeNotes.length)];
        this.blip(note, note, 0, 1.8, 0.045, 'sine');
      }, 3600);
    }

    this.soundscapeActive = true;
  }

  /** Stops and fades out the sleep soundscape */
  stopSleepSoundscape() {
    this.soundscapeActive = false;
    this.soundscapeMode = 'off';
    if (this.soundscapeInterval) {
      clearInterval(this.soundscapeInterval);
      this.soundscapeInterval = null;
    }
    if (this.soundscapeGain && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        this.soundscapeGain.gain.setValueAtTime(this.soundscapeGain.gain.value, now);
        this.soundscapeGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      } catch {}
    }
    const nodesToStop = [...this.soundscapeNodes];
    this.soundscapeNodes = [];
    setTimeout(() => {
      nodesToStop.forEach((node) => {
        try {
          if ('stop' in node && typeof (node as { stop: () => void }).stop === 'function') {
            (node as { stop: () => void }).stop();
          }
          if ('disconnect' in node && typeof (node as { disconnect: () => void }).disconnect === 'function') {
            (node as { disconnect: () => void }).disconnect();
          }
        } catch {}
      });
      this.soundscapeGain = null;
    }, 700);
  }

  getSoundscapeMode(): 'off' | 'rain' | 'breeze' | 'chimes' {
    return this.soundscapeActive ? this.soundscapeMode : 'off';
  }
}

export const sounds = new SoundEngine();
