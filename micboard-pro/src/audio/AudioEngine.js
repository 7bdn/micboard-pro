/**
 * MicBoard Pro — Audio Engine
 * Full Web Audio API engine: mic control, FX chain, soundboard playback
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.micStream = null;
    this.micSource = null;
    this.micGain = null;
    this.micBoostGain = null;
    this.noiseGate = null;
    this.compressor = null;
    this.micAnalyser = null;
    this.masterGain = null;
    this.micOutputGain = null;
    this.virtualDest = null;
    this.mediaStreamDest = null;

    // FX nodes
    this.noiseGateEnabled = false;
    this.compressorEnabled = false;
    this.autoDuckingEnabled = false;
    this.echoEnabled = false;

    // EQ
    this.eqBands = {};

    // Playing sounds
    this.playingSounds = new Map(); // id -> { source, gainNode, startTime }

    // Master
    this.masterVolume = 0.85;
    this.micVolume = 1.0;
    this.micBoost = 1.0;
    this.micMuted = false;

    // Callbacks
    this.onMicLevel = null;
    this.onOutputLevel = null;
    this.onSoundEnded = null;

    // Animation frame
    this._meterRaf = null;
    this._initialized = false;

    // Audio buffers cache
    this.bufferCache = new Map();

    // Current device
    this.currentMicId = null;
    this.availableDevices = [];

    // Voice Changer params
    this.pitchShift = 1.0;
    this.pitchEnabled = false;
    this._pitchShifterNode = null;

    // Noise reduction (simple approach via script processor or native)
    this.noiseReductionEnabled = false;
  }

  async init() {
    if (this._initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 48000, latencyHint: 'interactive' });
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.masterVolume;
    this.masterGain.connect(this.ctx.destination);

    this.micOutputGain = this.ctx.createGain();
    this.micOutputGain.gain.value = 1.0;

    this.micAnalyser = this.ctx.createAnalyser();
    this.micAnalyser.fftSize = 256;
    this.micAnalyser.smoothingTimeConstant = 0.8;

    this.outputAnalyser = this.ctx.createAnalyser();
    this.outputAnalyser.fftSize = 256;
    this.masterGain.connect(this.outputAnalyser);

    this._initialized = true;
    this._startMeterLoop();
    console.log('[AudioEngine] Initialized, sample rate:', this.ctx.sampleRate);
  }

  // ─── DEVICES ────────────────────────────────────────────────────────────────
  async getInputDevices() {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.availableDevices = devices.filter(d => d.kind === 'audioinput');
      return this.availableDevices;
    } catch (e) {
      console.error('[AudioEngine] getInputDevices error:', e);
      return [];
    }
  }

  async getOutputDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(d => d.kind === 'audiooutput');
    } catch { return []; }
  }

  // ─── MICROPHONE ─────────────────────────────────────────────────────────────
  async startMic(deviceId = null) {
    await this.init();
    if (this.micStream) this.stopMic();

    const constraints = {
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        sampleRate: 48000,
        channelCount: 1
      }
    };

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentMicId = deviceId;
      this._buildMicChain();
      console.log('[AudioEngine] Mic started:', deviceId);
      return true;
    } catch (e) {
      console.error('[AudioEngine] startMic error:', e);
      return false;
    }
  }

  _buildMicChain() {
    if (!this.micStream || !this.ctx) return;

    // Cleanup existing
    if (this.micSource) { try { this.micSource.disconnect(); } catch {} }

    // Source
    this.micSource = this.ctx.createMediaStreamSource(this.micStream);

    // Gain (volume)
    this.micGain = this.ctx.createGain();
    this.micGain.gain.value = this.micMuted ? 0 : this.micVolume;

    // Boost gain
    this.micBoostGain = this.ctx.createGain();
    this.micBoostGain.gain.value = this.micBoost;

    // Compressor
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // EQ bands
    this.lowCut = this.ctx.createBiquadFilter();
    this.lowCut.type = 'highpass';
    this.lowCut.frequency.value = 80;

    this.lowMid = this.ctx.createBiquadFilter();
    this.lowMid.type = 'peaking';
    this.lowMid.frequency.value = 300;
    this.lowMid.gain.value = 0;

    this.highMid = this.ctx.createBiquadFilter();
    this.highMid.type = 'peaking';
    this.highMid.frequency.value = 3000;
    this.highMid.gain.value = 0;

    this.highShelf = this.ctx.createBiquadFilter();
    this.highShelf.type = 'highshelf';
    this.highShelf.frequency.value = 8000;
    this.highShelf.gain.value = 0;

    // Analyser
    this.micAnalyser = this.ctx.createAnalyser();
    this.micAnalyser.fftSize = 1024;
    this.micAnalyser.smoothingTimeConstant = 0.85;

    // Virtual mic output (MediaStream destination)
    this.mediaStreamDest = this.ctx.createMediaStreamDestination();

    // Build chain: source -> gain -> boost -> lowCut -> EQ -> analyser -> compressor -> output
    this.micSource.connect(this.micGain);
    this.micGain.connect(this.micBoostGain);
    this.micBoostGain.connect(this.lowCut);
    this.lowCut.connect(this.lowMid);
    this.lowMid.connect(this.highMid);
    this.highMid.connect(this.highShelf);
    this.highShelf.connect(this.micAnalyser);

    if (this.compressorEnabled) {
      this.micAnalyser.connect(this.compressor);
      this.compressor.connect(this.micOutputGain);
    } else {
      this.micAnalyser.connect(this.micOutputGain);
    }

    this.micOutputGain.connect(this.mediaStreamDest);
    // Also monitor output
    this.micOutputGain.connect(this.ctx.destination);
  }

  stopMic() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      try { this.micSource.disconnect(); } catch {}
      this.micSource = null;
    }
    console.log('[AudioEngine] Mic stopped');
  }

  setMicVolume(value) {
    this.micVolume = Math.max(0, Math.min(3, value)); // 0 to 300%
    if (this.micGain && !this.micMuted) {
      this.micGain.gain.setTargetAtTime(this.micVolume, this.ctx.currentTime, 0.01);
    }
  }

  setMicBoost(db) {
    // db: 0 to 30
    const linear = Math.pow(10, db / 20);
    this.micBoost = linear;
    if (this.micBoostGain) {
      this.micBoostGain.gain.setTargetAtTime(linear, this.ctx.currentTime, 0.01);
    }
  }

  setMicMuted(muted) {
    this.micMuted = muted;
    if (this.micGain) {
      this.micGain.gain.setTargetAtTime(muted ? 0 : this.micVolume, this.ctx.currentTime, 0.01);
    }
  }

  toggleMicMute() {
    this.setMicMuted(!this.micMuted);
    return this.micMuted;
  }

  setCompressor(enabled, { threshold = -24, ratio = 4, attack = 0.003, release = 0.25 } = {}) {
    this.compressorEnabled = enabled;
    if (this.compressor) {
      this.compressor.threshold.value = threshold;
      this.compressor.ratio.value = ratio;
      this.compressor.attack.value = attack;
      this.compressor.release.value = release;
    }
    if (this.micStream) this._buildMicChain();
  }

  setEQ(band, gainDb) {
    const nodeMap = { lowCut: this.lowCut, lowMid: this.lowMid, highMid: this.highMid, high: this.highShelf };
    const node = nodeMap[band];
    if (node) node.gain.value = gainDb;
  }

  setNoiseGate(enabled, threshold = -40) {
    this.noiseGateEnabled = enabled;
    // Implemented via ScriptProcessor in advanced mode, basic threshold here
    this._noiseGateThreshold = threshold;
  }

  // Voice changer: pitch shift via playback rate trick
  setPitch(semitones) {
    this.pitchShift = Math.pow(2, semitones / 12);
    // Applied to each new sound source on play
    this._currentPitchSemitones = semitones;
  }

  // ─── MASTER VOLUME ──────────────────────────────────────────────────────────
  setMasterVolume(value) {
    this.masterVolume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.02);
    }
  }

  // ─── SOUNDBOARD PLAYBACK ────────────────────────────────────────────────────
  async loadBuffer(filePath) {
    if (this.bufferCache.has(filePath)) return this.bufferCache.get(filePath);
    try {
      const dataUrl = await window.electronAPI.readAudioFile(filePath);
      if (!dataUrl) throw new Error('File not found');
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(filePath, audioBuffer);
      return audioBuffer;
    } catch (e) {
      console.error('[AudioEngine] loadBuffer error:', filePath, e);
      return null;
    }
  }

  async playSound(sound, options = {}) {
    await this.init();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    const { volume = 1.0, loop = false, fadeIn = 0, overlap = true } = options;

    if (!overlap && this.playingSounds.has(sound.id)) {
      this.stopSound(sound.id);
    }

    const buffer = await this.loadBuffer(sound.filePath);
    if (!buffer) return false;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;

    // Apply pitch (voice changer)
    if (this.pitchEnabled && this._currentPitchSemitones) {
      source.playbackRate.value = Math.pow(2, this._currentPitchSemitones / 12);
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = fadeIn > 0 ? 0 : volume;

    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    if (fadeIn > 0) {
      gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + fadeIn);
    }

    source.start();
    const startTime = Date.now();

    source.onended = () => {
      if (this.playingSounds.has(sound.id)) {
        const entry = this.playingSounds.get(sound.id);
        if (entry.source === source) {
          this.playingSounds.delete(sound.id);
          this.onSoundEnded?.(sound.id);
        }
      }
    };

    this.playingSounds.set(sound.id, { source, gainNode, startTime, volume, buffer });
    return true;
  }

  stopSound(id, fadeOut = 0) {
    const entry = this.playingSounds.get(id);
    if (!entry) return;
    const { source, gainNode } = entry;
    if (fadeOut > 0) {
      gainNode.gain.setTargetAtTime(0, this.ctx.currentTime, fadeOut / 3);
      setTimeout(() => { try { source.stop(); } catch {} }, fadeOut * 1000 + 100);
    } else {
      try { source.stop(); } catch {}
    }
    this.playingSounds.delete(id);
  }

  stopAllSounds(fadeOut = 0.1) {
    for (const [id] of this.playingSounds) {
      this.stopSound(id, fadeOut);
    }
  }

  setSoundVolume(id, volume) {
    const entry = this.playingSounds.get(id);
    if (entry) {
      entry.gainNode.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.01);
      entry.volume = volume;
    }
  }

  isPlaying(id) { return this.playingSounds.has(id); }

  getPlayingIds() { return Array.from(this.playingSounds.keys()); }

  // Auto ducking: lower mic when sounds play
  setAutoDucking(enabled, duckAmount = 0.3) {
    this.autoDuckingEnabled = enabled;
    this._duckAmount = duckAmount;
    if (enabled && this.playingSounds.size > 0) {
      this._applyDucking(true);
    } else {
      this._applyDucking(false);
    }
  }

  _applyDucking(duck) {
    if (!this.micOutputGain) return;
    const target = duck ? this._duckAmount : 1.0;
    this.micOutputGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.1);
  }

  // ─── METER LOOP ─────────────────────────────────────────────────────────────
  _startMeterLoop() {
    const micBuf = new Uint8Array(this.micAnalyser?.frequencyBinCount || 128);
    const outBuf = new Uint8Array(this.outputAnalyser?.frequencyBinCount || 128);

    const tick = () => {
      if (this.micAnalyser && this.onMicLevel) {
        this.micAnalyser.getByteFrequencyData(micBuf);
        const avg = micBuf.reduce((a, b) => a + b, 0) / micBuf.length;
        const normalized = avg / 255;
        const db = normalized > 0 ? 20 * Math.log10(normalized) : -100;
        this.onMicLevel(normalized, Math.max(-60, db));
      }
      if (this.outputAnalyser && this.onOutputLevel) {
        this.outputAnalyser.getByteFrequencyData(outBuf);
        const avg = outBuf.reduce((a, b) => a + b, 0) / outBuf.length;
        this.onOutputLevel(avg / 255);
      }
      this._meterRaf = requestAnimationFrame(tick);
    };
    this._meterRaf = requestAnimationFrame(tick);
  }

  // ─── RECORDING ──────────────────────────────────────────────────────────────
  startRecording() {
    if (!this.mediaStreamDest) return null;
    const stream = this.mediaStreamDest.stream;
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    const chunks = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.start();
    this._recorder = recorder;
    this._recChunks = chunks;
    return recorder;
  }

  stopRecording() {
    return new Promise(resolve => {
      if (!this._recorder) { resolve(null); return; }
      this._recorder.onstop = () => {
        const blob = new Blob(this._recChunks, { type: 'audio/webm' });
        resolve(blob);
      };
      this._recorder.stop();
      this._recorder = null;
    });
  }

  destroy() {
    this.stopAllSounds();
    this.stopMic();
    if (this._meterRaf) cancelAnimationFrame(this._meterRaf);
    if (this.ctx) { this.ctx.close(); this.ctx = null; }
    this._initialized = false;
  }
}

const audioEngine = new AudioEngine();
export default audioEngine;
