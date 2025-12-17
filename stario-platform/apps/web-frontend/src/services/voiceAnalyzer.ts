/**
 * VoiceAnalyzer - Real-time voice analysis using Web Audio API
 *
 * Analyzes: Volume, Pitch, Timbre
 * Privacy-first: No audio is saved or sent to server
 */

// ============ TYPES ============

export interface VolumeMetrics {
  current: number;        // 0-1, current RMS
  average: number;        // 0-1, average over recording
  peak: number;           // 0-1, max peak
  dynamicRange: number;   // 0-1, variation
  stability: number;      // 0-1, how stable
  classification: 'quiet' | 'medium' | 'loud';
}

export interface PitchMetrics {
  current: number;        // Hz, current pitch
  average: number;        // Hz, average pitch
  min: number;            // Hz, lowest detected
  max: number;            // Hz, highest detected
  stability: number;      // 0-1, pitch stability (1 - jitter)
  classification: 'bass' | 'baritone' | 'tenor' | 'alto' | 'mezzo' | 'soprano';
}

export interface TimbreMetrics {
  spectralCentroid: number;    // Hz, "brightness" center
  spectralRolloff: number;     // Hz, where 85% energy is below
  spectralFlatness: number;    // 0-1, noise vs tonal
  brightness: number;          // 0-1, derived from centroid
  warmth: number;              // 0-1, inverse of brightness
  richness: number;            // 0-1, harmonic richness
  clarity: number;             // 0-1, tonal clarity
  classification: 'bright_clear' | 'warm_rich' | 'dark_deep' | 'neutral';
}

export interface DeliveryMetrics {
  energy: number;              // 0-1, overall energy
  expressiveness: number;      // 0-1, pitch variation
  confidence: number;          // 0-1, stability + volume
  tempo: 'slow' | 'moderate' | 'fast';
}

export interface VoiceProfile {
  volume: VolumeMetrics;
  pitch: PitchMetrics;
  timbre: TimbreMetrics;
  delivery: DeliveryMetrics;
  embedding: number[];         // Vector for ML comparison
  duration: number;            // Seconds of active speech
  quality: number;             // 0-1, recording quality
}

export interface RealtimeData {
  volume: number;
  pitch: number;
  isSpeaking: boolean;
  waveform: number[];
  spectrum: number[];
}

type RealtimeCallback = (data: RealtimeData) => void;

// ============ VOICE ANALYZER CLASS ============

export class VoiceAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  // Analysis buffers
  private timeData: Uint8Array<ArrayBuffer> = new Uint8Array(0);
  private frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(0);

  // Collected metrics over time
  private volumeSamples: number[] = [];
  private pitchSamples: number[] = [];
  private spectralCentroidSamples: number[] = [];
  private spectralRolloffSamples: number[] = [];
  private spectralFlatnessSamples: number[] = [];

  // State
  private isRecording = false;
  private animationFrameId: number | null = null;
  private realtimeCallback: RealtimeCallback | null = null;
  private activeSpeechDuration = 0;

  // Configuration
  private readonly FFT_SIZE = 2048;
  private readonly SAMPLE_RATE = 44100;
  private readonly SILENCE_THRESHOLD = 0.02;
  private readonly MIN_PITCH = 75;   // Hz
  private readonly MAX_PITCH = 600;  // Hz

  // ============ PUBLIC METHODS ============

  /**
   * Request microphone access and initialize audio context
   */
  async initialize(): Promise<boolean> {
    try {
      // Request microphone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: this.SAMPLE_RATE });

      // Create analyser node
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = this.FFT_SIZE;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Connect microphone to analyser
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyserNode);

      // Initialize data arrays
      this.timeData = new Uint8Array(this.analyserNode.fftSize);
      this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);

      return true;
    } catch (error) {
      console.error('Failed to initialize VoiceAnalyzer:', error);
      return false;
    }
  }

  /**
   * Start recording and analyzing
   */
  startRecording(onRealtimeData?: RealtimeCallback): void {
    if (!this.audioContext || !this.analyserNode) {
      console.error('VoiceAnalyzer not initialized');
      return;
    }

    // Resume audio context if suspended (iOS Safari fix)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isRecording = true;
    this.activeSpeechDuration = 0;
    this.realtimeCallback = onRealtimeData || null;

    // Clear previous samples
    this.volumeSamples = [];
    this.pitchSamples = [];
    this.spectralCentroidSamples = [];
    this.spectralRolloffSamples = [];
    this.spectralFlatnessSamples = [];

    // Start analysis loop
    this.analyzeLoop();
  }

  /**
   * Stop recording and return final profile
   */
  stopRecording(): VoiceProfile {
    this.isRecording = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    return this.computeFinalProfile();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.isRecording = false;

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }

    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  // ============ ANALYSIS LOOP ============

  private analyzeLoop = (): void => {
    if (!this.isRecording || !this.analyserNode) return;

    // Get audio data
    this.analyserNode.getByteTimeDomainData(this.timeData);
    this.analyserNode.getByteFrequencyData(this.frequencyData);

    // Calculate metrics
    const volume = this.calculateRMS();
    const isSpeaking = volume > this.SILENCE_THRESHOLD;

    let pitch = 0;
    if (isSpeaking) {
      pitch = this.detectPitch();
      this.activeSpeechDuration += 1000 / 60; // ~16ms per frame

      // Collect samples only during speech
      this.volumeSamples.push(volume);
      if (pitch > 0) {
        this.pitchSamples.push(pitch);
      }

      // Spectral features
      const centroid = this.calculateSpectralCentroid();
      const rolloff = this.calculateSpectralRolloff();
      const flatness = this.calculateSpectralFlatness();

      this.spectralCentroidSamples.push(centroid);
      this.spectralRolloffSamples.push(rolloff);
      this.spectralFlatnessSamples.push(flatness);
    }

    // Send realtime data
    if (this.realtimeCallback) {
      this.realtimeCallback({
        volume,
        pitch,
        isSpeaking,
        waveform: this.getWaveformData(),
        spectrum: this.getSpectrumData()
      });
    }

    // Continue loop
    this.animationFrameId = requestAnimationFrame(this.analyzeLoop);
  };

  // ============ VOLUME ANALYSIS ============

  /**
   * Calculate Root Mean Square (RMS) - primary volume metric
   */
  private calculateRMS(): number {
    let sum = 0;
    for (let i = 0; i < this.timeData.length; i++) {
      const normalized = (this.timeData[i] - 128) / 128; // Convert to -1 to 1
      sum += normalized * normalized;
    }
    return Math.sqrt(sum / this.timeData.length);
  }

  // ============ PITCH DETECTION ============

  /**
   * Detect fundamental frequency using autocorrelation
   */
  private detectPitch(): number {
    const buffer = new Float32Array(this.timeData.length);
    for (let i = 0; i < this.timeData.length; i++) {
      buffer[i] = (this.timeData[i] - 128) / 128;
    }

    // Autocorrelation
    const correlations = new Float32Array(this.timeData.length);
    for (let lag = 0; lag < this.timeData.length; lag++) {
      let sum = 0;
      for (let i = 0; i < this.timeData.length - lag; i++) {
        sum += buffer[i] * buffer[i + lag];
      }
      correlations[lag] = sum;
    }

    // Find the best lag (period)
    const minLag = Math.floor(this.SAMPLE_RATE / this.MAX_PITCH);
    const maxLag = Math.floor(this.SAMPLE_RATE / this.MIN_PITCH);

    let bestLag = minLag;
    let bestCorrelation = -1;

    for (let lag = minLag; lag < maxLag && lag < correlations.length; lag++) {
      if (correlations[lag] > bestCorrelation) {
        bestCorrelation = correlations[lag];
        bestLag = lag;
      }
    }

    // Validate: correlation should be significant
    if (bestCorrelation < correlations[0] * 0.3) {
      return 0; // No clear pitch detected
    }

    // Convert lag to frequency
    const pitch = this.SAMPLE_RATE / bestLag;

    // Validate pitch range
    if (pitch < this.MIN_PITCH || pitch > this.MAX_PITCH) {
      return 0;
    }

    return pitch;
  }

  // ============ TIMBRE / SPECTRAL ANALYSIS ============

  /**
   * Calculate spectral centroid - "center of mass" of spectrum
   * Higher = brighter sound
   */
  private calculateSpectralCentroid(): number {
    let weightedSum = 0;
    let totalMagnitude = 0;
    const binWidth = this.SAMPLE_RATE / this.FFT_SIZE;

    for (let i = 0; i < this.frequencyData.length; i++) {
      const magnitude = this.frequencyData[i];
      const frequency = i * binWidth;
      weightedSum += magnitude * frequency;
      totalMagnitude += magnitude;
    }

    if (totalMagnitude === 0) return 0;
    return weightedSum / totalMagnitude;
  }

  /**
   * Calculate spectral rolloff - frequency below which 85% of energy exists
   */
  private calculateSpectralRolloff(): number {
    let totalEnergy = 0;
    for (let i = 0; i < this.frequencyData.length; i++) {
      totalEnergy += this.frequencyData[i] * this.frequencyData[i];
    }

    const threshold = totalEnergy * 0.85;
    let cumulativeEnergy = 0;
    const binWidth = this.SAMPLE_RATE / this.FFT_SIZE;

    for (let i = 0; i < this.frequencyData.length; i++) {
      cumulativeEnergy += this.frequencyData[i] * this.frequencyData[i];
      if (cumulativeEnergy >= threshold) {
        return i * binWidth;
      }
    }

    return this.SAMPLE_RATE / 2;
  }

  /**
   * Calculate spectral flatness - how "noisy" vs "tonal" the sound is
   * 0 = pure tone, 1 = white noise
   */
  private calculateSpectralFlatness(): number {
    let logSum = 0;
    let linearSum = 0;
    let count = 0;

    for (let i = 1; i < this.frequencyData.length; i++) {
      const magnitude = this.frequencyData[i] + 1; // Avoid log(0)
      logSum += Math.log(magnitude);
      linearSum += magnitude;
      count++;
    }

    if (count === 0 || linearSum === 0) return 0;

    const geometricMean = Math.exp(logSum / count);
    const arithmeticMean = linearSum / count;

    return geometricMean / arithmeticMean;
  }

  // ============ VISUALIZATION DATA ============

  private getWaveformData(): number[] {
    const samples = 32;
    const step = Math.floor(this.timeData.length / samples);
    const waveform: number[] = [];

    for (let i = 0; i < samples; i++) {
      const value = (this.timeData[i * step] - 128) / 128;
      waveform.push(Math.abs(value));
    }

    return waveform;
  }

  private getSpectrumData(): number[] {
    const bands = 16;
    const step = Math.floor(this.frequencyData.length / bands);
    const spectrum: number[] = [];

    for (let i = 0; i < bands; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += this.frequencyData[i * step + j];
      }
      spectrum.push(sum / step / 255);
    }

    return spectrum;
  }

  // ============ FINAL PROFILE COMPUTATION ============

  private computeFinalProfile(): VoiceProfile {
    const volume = this.computeVolumeMetrics();
    const pitch = this.computePitchMetrics();
    const timbre = this.computeTimbreMetrics();
    const delivery = this.computeDeliveryMetrics(volume, pitch, timbre);
    const embedding = this.computeEmbedding(pitch, timbre);

    return {
      volume,
      pitch,
      timbre,
      delivery,
      embedding,
      duration: this.activeSpeechDuration / 1000,
      quality: this.computeQuality()
    };
  }

  private computeVolumeMetrics(): VolumeMetrics {
    if (this.volumeSamples.length === 0) {
      return {
        current: 0, average: 0, peak: 0, dynamicRange: 0, stability: 0,
        classification: 'quiet'
      };
    }

    const average = this.mean(this.volumeSamples);
    const peak = Math.max(...this.volumeSamples);
    const std = this.standardDeviation(this.volumeSamples);
    const dynamicRange = Math.min(1, (peak - Math.min(...this.volumeSamples)) * 3);
    const stability = Math.max(0, 1 - std * 5);

    let classification: 'quiet' | 'medium' | 'loud' = 'medium';
    if (average < 0.08) classification = 'quiet';
    else if (average > 0.25) classification = 'loud';

    return {
      current: this.volumeSamples[this.volumeSamples.length - 1] || 0,
      average,
      peak,
      dynamicRange,
      stability,
      classification
    };
  }

  private computePitchMetrics(): PitchMetrics {
    if (this.pitchSamples.length === 0) {
      return {
        current: 0, average: 150, min: 100, max: 200, stability: 0.5,
        classification: 'baritone'
      };
    }

    // Filter outliers using IQR
    const sorted = [...this.pitchSamples].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const filtered = this.pitchSamples.filter(p => p >= q1 - 1.5 * iqr && p <= q3 + 1.5 * iqr);

    if (filtered.length === 0) {
      return {
        current: 0, average: 150, min: 100, max: 200, stability: 0.5,
        classification: 'baritone'
      };
    }

    const average = this.mean(filtered);
    const min = Math.min(...filtered);
    const max = Math.max(...filtered);

    // Jitter = average pitch variation between consecutive samples
    let jitterSum = 0;
    for (let i = 1; i < filtered.length; i++) {
      jitterSum += Math.abs(filtered[i] - filtered[i - 1]);
    }
    const jitter = jitterSum / (filtered.length - 1) / average;
    const stability = Math.max(0, Math.min(1, 1 - jitter * 10));

    // Classify by average pitch
    let classification: PitchMetrics['classification'] = 'baritone';
    if (average < 120) classification = 'bass';
    else if (average < 165) classification = 'baritone';
    else if (average < 220) classification = 'tenor';
    else if (average < 280) classification = 'alto';
    else if (average < 350) classification = 'mezzo';
    else classification = 'soprano';

    return {
      current: this.pitchSamples[this.pitchSamples.length - 1] || 0,
      average,
      min,
      max,
      stability,
      classification
    };
  }

  private computeTimbreMetrics(): TimbreMetrics {
    if (this.spectralCentroidSamples.length === 0) {
      return {
        spectralCentroid: 1500, spectralRolloff: 3000, spectralFlatness: 0.3,
        brightness: 0.5, warmth: 0.5, richness: 0.5, clarity: 0.5,
        classification: 'neutral'
      };
    }

    const spectralCentroid = this.mean(this.spectralCentroidSamples);
    const spectralRolloff = this.mean(this.spectralRolloffSamples);
    const spectralFlatness = this.mean(this.spectralFlatnessSamples);

    // Normalize to 0-1 scales
    // Centroid typically 500-4000 Hz for voice
    const brightness = Math.min(1, Math.max(0, (spectralCentroid - 500) / 3500));
    const warmth = 1 - brightness;

    // Richness = low flatness + good rolloff range
    const richness = Math.min(1, Math.max(0, (1 - spectralFlatness) * (spectralRolloff / 5000)));

    // Clarity = inverse of flatness
    const clarity = 1 - spectralFlatness;

    // Classify timbre
    let classification: TimbreMetrics['classification'] = 'neutral';
    if (brightness > 0.6 && clarity > 0.6) classification = 'bright_clear';
    else if (warmth > 0.6 && richness > 0.5) classification = 'warm_rich';
    else if (warmth > 0.7 && brightness < 0.3) classification = 'dark_deep';

    return {
      spectralCentroid,
      spectralRolloff,
      spectralFlatness,
      brightness,
      warmth,
      richness,
      clarity,
      classification
    };
  }

  private computeDeliveryMetrics(
    volume: VolumeMetrics,
    pitch: PitchMetrics,
    timbre: TimbreMetrics
  ): DeliveryMetrics {
    // Energy = volume + brightness
    const energy = (volume.average * 2 + timbre.brightness) / 3;

    // Expressiveness = pitch range + dynamic range
    const pitchRange = pitch.max - pitch.min;
    const normalizedPitchRange = Math.min(1, pitchRange / 200);
    const expressiveness = (normalizedPitchRange + volume.dynamicRange) / 2;

    // Confidence = stability + volume
    const confidence = (volume.stability + pitch.stability + volume.average) / 3;

    // Tempo based on speech patterns (simplified)
    let tempo: 'slow' | 'moderate' | 'fast' = 'moderate';
    if (energy > 0.6) tempo = 'fast';
    else if (energy < 0.3) tempo = 'slow';

    return { energy, expressiveness, confidence, tempo };
  }

  private computeEmbedding(pitch: PitchMetrics, timbre: TimbreMetrics): number[] {
    // Create a 20-dimensional embedding vector for ML comparison
    return [
      // Pitch features (normalized)
      pitch.average / 400,
      (pitch.max - pitch.min) / 200,
      pitch.stability,

      // Timbre features
      timbre.brightness,
      timbre.warmth,
      timbre.richness,
      timbre.clarity,
      timbre.spectralCentroid / 4000,
      timbre.spectralRolloff / 8000,
      timbre.spectralFlatness,

      // Derived features
      timbre.brightness * pitch.stability,
      timbre.warmth * timbre.richness,
      pitch.stability * timbre.clarity,

      // Volume features
      this.mean(this.volumeSamples) || 0.15,
      this.standardDeviation(this.volumeSamples) || 0.05,

      // Padding for future features
      0.5, 0.5, 0.5, 0.5, 0.5
    ];
  }

  private computeQuality(): number {
    // Quality based on sample count and consistency
    const sampleCount = this.volumeSamples.length;
    const hasPitch = this.pitchSamples.length > 10;
    const hasTimbre = this.spectralCentroidSamples.length > 10;

    let quality = 0.5;
    if (sampleCount > 100) quality += 0.2;
    if (hasPitch) quality += 0.15;
    if (hasTimbre) quality += 0.15;

    return Math.min(1, quality);
  }

  // ============ UTILITY FUNCTIONS ============

  private mean(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private standardDeviation(arr: number[]): number {
    if (arr.length === 0) return 0;
    const avg = this.mean(arr);
    const squareDiffs = arr.map(value => Math.pow(value - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }
}

// ============ ARCHETYPE MATCHING ============

export interface VoiceArchetype {
  id: string;
  name: string;
  type: string;
  image: string;
  description: string;
  characteristics: string[];
  embedding: number[]; // Reference embedding for comparison
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Match user voice profile against archetypes
 */
export function matchArchetypes(
  userProfile: VoiceProfile,
  archetypes: VoiceArchetype[],
  topN: number = 7
): Array<VoiceArchetype & { similarity: number }> {
  const results = archetypes.map(archetype => {
    const similarity = cosineSimilarity(userProfile.embedding, archetype.embedding);
    // Convert to percentage (0.5-1 range becomes 50-100%)
    const percentage = Math.round(Math.max(45, Math.min(98, similarity * 100 + 20)));

    return {
      ...archetype,
      similarity: percentage
    };
  });

  // Sort by similarity descending
  results.sort((a, b) => b.similarity - a.similarity);

  return results.slice(0, topN);
}

/**
 * Generate human-readable voice description
 */
export function generateVoiceDescription(profile: VoiceProfile): string {
  const { pitch, timbre, delivery } = profile;

  const pitchNames: Record<string, string> = {
    bass: 'глубокий бас',
    baritone: 'тёплый баритон',
    tenor: 'выразительный тенор',
    alto: 'насыщенный альт',
    mezzo: 'яркое меццо-сопрано',
    soprano: 'высокое сопрано'
  };

  const timbreNames: Record<string, string> = {
    bright_clear: 'яркий и чистый',
    warm_rich: 'тёплый и богатый',
    dark_deep: 'глубокий и бархатистый',
    neutral: 'сбалансированный'
  };

  const pitchDesc = pitchNames[pitch.classification] || 'уникальный голос';
  const timbreDesc = timbreNames[timbre.classification] || 'интересный тембр';

  let deliveryDesc = '';
  if (delivery.confidence > 0.7) deliveryDesc = 'с уверенной подачей';
  else if (delivery.expressiveness > 0.7) deliveryDesc = 'с выразительной манерой';
  else if (delivery.energy > 0.7) deliveryDesc = 'с энергичной подачей';
  else deliveryDesc = 'с мягкой манерой';

  return `${pitchDesc} с ${timbreDesc} тембром ${deliveryDesc}`;
}
