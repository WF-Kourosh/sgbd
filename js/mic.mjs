// Microphone input for the candles. Audio is analysed in this tab and never recorded or sent.
import { binFor, flatness, meanLevel } from './blow.mjs';

export class Mic {
  constructor() {
    this.stream = null;
    this.context = null;
    this.analyser = null;
  }

  get live() { return Boolean(this.analyser); }

  async start() {
    if (this.live) return true;
    try {
      if (!navigator.mediaDevices?.getUserMedia) return false;
      // The browser's voice processing squashes exactly the rumble we're listening for.
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const Audio = window.AudioContext || window.webkitAudioContext;
      this.context = new Audio();
      if (this.context.state !== 'running') await this.context.resume().catch(() => {});
      const source = this.context.createMediaStreamSource(this.stream);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 1024;
      this.analyser.smoothingTimeConstant = 0.25;
      source.connect(this.analyser);
      const rate = this.context.sampleRate;
      this.bytes = new Uint8Array(this.analyser.frequencyBinCount);
      this.floats = new Float32Array(this.analyser.frequencyBinCount);
      this.lowEnd = Math.max(2, binFor(1500, rate, this.analyser.fftSize));
      this.flatFrom = binFor(250, rate, this.analyser.fftSize);
      this.flatTo = binFor(4000, rate, this.analyser.fftSize);
      return true;
    } catch {
      this.stop();
      return false;
    }
  }

  read() {
    if (!this.analyser) return { level: 0, flatness: 0 };
    this.analyser.getByteFrequencyData(this.bytes);
    this.analyser.getFloatFrequencyData(this.floats);
    return {
      level: meanLevel(this.bytes, 1, this.lowEnd),
      flatness: flatness(this.floats, this.flatFrom, this.flatTo),
    };
  }

  stop() {
    try { this.stream?.getTracks().forEach(track => track.stop()); } catch { /* already stopped */ }
    try { if (this.context && this.context.state !== 'closed') this.context.close(); } catch { /* already closed */ }
    this.stream = null;
    this.context = null;
    this.analyser = null;
  }
}
