/**
 * Audio Dubber & Speech Engine - Powered by Sal from Grok AI Persona
 * Supports Gemini 3.1 Flash TTS (PCM 24kHz) + Expressive Neural Web Speech Engine
 * Includes real-time Web Audio Synthesizer, broadcast EQ filter, and frequency analyzers.
 */

let audioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let analyserNode: AnalyserNode | null = null;
let broadcastMasterGain: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function getAudioAnalyser(): AnalyserNode {
  const ctx = getAudioContext();
  if (!analyserNode) {
    analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 64;
  }
  return analyserNode;
}

/**
 * Prime/unlock audio context and Web Speech API on user gesture so auto-speech never gets blocked
 */
export function unlockAudio() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  } catch {}
}

/**
 * Converts 16-bit PCM base64 audio into an AudioBuffer and plays it through the broadcast filter and analyser.
 */
/**
 * Converts audio data (MP3/WAV/PCM base64) into an AudioBuffer and plays it through the broadcast filter and analyser.
 */
export async function playGrokAudio(
  base64Data: string,
  mimeType = 'audio/mp3',
  sampleRate = 24000,
  onEnded?: () => void,
  onDuration?: (durationSeconds: number) => void
): Promise<() => void> {
  stopAllAudio();
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  const analyser = getAudioAnalyser();

  // Decode base64
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  let audioBuffer: AudioBuffer;

  if (mimeType.includes('pcm')) {
    // 16-bit raw PCM
    const int16Array = new Int16Array(bytes.buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }
    audioBuffer = ctx.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.copyToChannel(float32Array, 0);
  } else {
    // Native MP3/WAV decode via Web Audio API
    const copy = bytes.buffer.slice(0);
    audioBuffer = await ctx.decodeAudioData(copy);
  }

  if (onDuration) {
    onDuration(audioBuffer.duration);
  }

  // Broadcast processing chain: Warm presence shelf + dynamic compressor for punchy Grok delivery
  const lowShelf = ctx.createBiquadFilter();
  lowShelf.type = 'lowshelf';
  lowShelf.frequency.value = 220;
  lowShelf.gain.value = 2.0;

  const presencePeak = ctx.createBiquadFilter();
  presencePeak.type = 'peaking';
  presencePeak.frequency.value = 2800;
  presencePeak.Q.value = 1.0;
  presencePeak.gain.value = 1.8;

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-16, ctx.currentTime);
  compressor.knee.setValueAtTime(6, ctx.currentTime);
  compressor.ratio.setValueAtTime(3.0, ctx.currentTime);
  compressor.attack.setValueAtTime(0.003, ctx.currentTime);
  compressor.release.setValueAtTime(0.2, ctx.currentTime);

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;

  // source -> lowShelf -> presencePeak -> compressor -> analyser -> destination
  source.connect(lowShelf);
  lowShelf.connect(presencePeak);
  presencePeak.connect(compressor);
  compressor.connect(analyser);
  analyser.connect(ctx.destination);

  currentSource = source;
  source.onended = () => {
    currentSource = null;
    if (onEnded) onEnded();
  };

  source.start(0);

  return () => {
    try {
      source.stop();
    } catch {}
    currentSource = null;
  };
}

export const playPcmAudio = playGrokAudio;

export type VoicePersona = 'sal' | 'ara' | 'rex' | 'eve' | 'leo' | 'Charon' | 'Fenrir' | 'Puck' | 'Kore';

export interface VoiceOption {
  id: VoicePersona;
  name: string;
  tagline: string;
  gender: string;
  vibe: string;
  badge: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  {
    id: 'sal',
    name: 'Sal (Grok Default)',
    tagline: 'Iconic Grok Tesla AI voice: crisp diction, dry wit, and unhinged Brooklyn sarcasm',
    gender: 'Male',
    vibe: '🚗 Grok Sal',
    badge: 'Flagship Voice',
  },
  {
    id: 'ara',
    name: 'Ara (Grok Expressive)',
    tagline: 'Razor-sharp, witty female persona with supreme confidence & playful mockery',
    gender: 'Female',
    vibe: '💅 Grok Ara',
    badge: 'Expressive Diva',
  },
  {
    id: 'rex',
    name: 'Rex (Grok Cynic)',
    tagline: 'Deep, blunt, gravelly deadpan investigator who pulls zero punches',
    gender: 'Male',
    vibe: '🕶️ Grok Rex',
    badge: 'Deadpan OSINT',
  },
  {
    id: 'eve',
    name: 'Eve (Grok Conversational)',
    tagline: 'Natural, smooth conversational delivery with sly roasts and effortless charisma',
    gender: 'Female',
    vibe: '🎙️ Grok Eve',
    badge: 'Natural Flow',
  },
  {
    id: 'leo',
    name: 'Leo (Grok Energetic)',
    tagline: 'High-energy, fast-talking banter and rapid-fire commentary',
    gender: 'Male',
    vibe: '⚡ Grok Leo',
    badge: 'Fast Banter',
  },
];

export function cleanSpokenDialogue(text: string): string {
  if (!text) return '';
  return text
    // Remove markdown asterisks or brackets stage directions like *sips coffee* or [gasps]
    .replace(/\*([^*]+)\*/g, '')
    .replace(/\[([^\]]+)\]/g, '')
    .replace(/\(([^)]+)\)/g, '')
    // Remove verbalized stage actions
    .replace(/(?:^|[.!?]\s*)(?:drops?|sets?|puts?)\s+(?:down\s+)?(?:her|his|my|the)?\s*(?:coffee|tea|latte|drink|mug|cup|glass|phone)[^.!?]*[.!?]?\s*/gi, '. ')
    .replace(/(?:^|[.!?]\s*)(?:takes?\s+a\s+sip\s+of\s+[^.!?]*)[.!?]?\s*/gi, '. ')
    .replace(/(?:^|[.!?]\s*)(?:sips?\s+(?:her|his|my|the)?\s*(?:latte|coffee|tea|drink|cup)[^.!?]*)[.!?]?\s*/gi, '. ')
    .replace(/(?:^|[.!?]\s*)(?:leans?\s+(?:in|back|closer|forward)[^.!?]*)[.!?]?\s*/gi, '. ')
    .replace(/(?:^|[.!?]\s*)(?:looks?\s+(?:at\s+(?:the\s+)?(?:photo|screen|image)|closer|up)[^.!?]*)[.!?]?\s*/gi, '. ')
    .replace(/(?:^|[.!?]\s*)(?:sighs?|gasps?|chuckles?|scoffs?|laughs?|rolls?\s+eyes?)[^.!?]*[.!?]?\s*/gi, '. ')
    .replace(/[*_~`#]/g, ' ')
    .replace(/GG/g, 'G-G')
    .replace(/^[\s.!?]+/, '')
    .trim();
}

/**
 * Discovers and ranks highest-fidelity Neural / Natural voices, prioritizing
 * deep, gritty, expressive male voices for Sal / Grok style delivery.
 */
export function getBestSalVoice(persona: VoicePersona = 'Charon'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Filter out known robotic / monotone legacy synthesizers
  const isRobotic = (v: SpeechSynthesisVoice) => {
    const name = v.name.toLowerCase();
    return (
      name.includes('espeak') ||
      name.includes('desktop') ||
      name.includes('zira') ||
      name.includes('david') ||
      name.includes('hazel') ||
      name.includes('george') ||
      name.includes('hedda') ||
      name.includes('klatt') ||
      name.includes('mbrola')
    );
  };

  const englishVoices = voices.filter(
    (v) => (v.lang.startsWith('en') || v.lang.startsWith('EN')) && !isRobotic(v)
  );

  const wantsFemale = persona === 'Kore';

  if (!wantsFemale) {
    // Sal / Charon / Fenrir: Find punchy, resonant, natural male voices
    const salCandidates = englishVoices.filter((v) => {
      const name = v.name.toLowerCase();
      return (
        name.includes('guy') ||
        name.includes('ryan') ||
        name.includes('steffan') ||
        name.includes('daniel') ||
        name.includes('alex') ||
        name.includes('aaron') ||
        name.includes('tom') ||
        name.includes('google us english male') ||
        name.includes('google uk english male') ||
        (name.includes('natural') && !name.includes('female') && !name.includes('aria') && !name.includes('jenny'))
      );
    });

    if (salCandidates.length > 0) {
      // Prioritize online/natural
      const naturalMale = salCandidates.find(
        (v) => v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural')
      );
      return naturalMale || salCandidates[0];
    }
  }

  // 1. Tier-1: High Definition Neural / Natural Online voices
  const tier1 = englishVoices.find((v) => {
    const name = v.name.toLowerCase();
    return (
      name.includes('natural') ||
      name.includes('online') ||
      name.includes('neural')
    );
  });
  if (tier1) return tier1;

  // 2. Tier-2: High quality Google / Apple Enhanced voices
  const tier2 = englishVoices.find((v) => {
    const name = v.name.toLowerCase();
    return (
      name.includes('google us english') ||
      name.includes('enhanced') ||
      name.includes('premium') ||
      name.includes('samantha') ||
      name.includes('ava')
    );
  });
  if (tier2) return tier2;

  // 3. Fallback
  return englishVoices[0] || voices[0] || null;
}

// Pre-warm voices list
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

let activeSpeechQueue: { cancel: () => void } | null = null;

/**
 * Sal from Grok AI Expressive Web Speech Synthesizer:
 * Injects massive vocal inflection, dynamic pacing, gritty pitch drops, and street-smart cadence.
 */
export function speakWithWebSpeech(
  text: string,
  voiceTone: VoicePersona = 'Charon',
  onStart?: () => void,
  onEnd?: () => void
): () => void {
  stopAllAudio();

  if (!('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    if (onEnd) onEnd();
    return () => {};
  }

  window.speechSynthesis.cancel();

  // Clean text and make abbreviations punchy and conversational
  const cleanText = cleanSpokenDialogue(text)
    .replace(/\bBC\b/g, 'B C')
    .replace(/\bUK\b/g, 'U K')
    .replace(/\bUS\b/g, 'U S')
    .replace(/\bUSA\b/g, 'U S A')
    .replace(/\bGPS\b/g, 'G P S')
    .replace(/\bOSINT\b/g, 'Oh-Sint')
    .replace(/[:;#]/g, ' ')
    .trim();

  if (!cleanText) {
    if (onEnd) onEnd();
    return () => {};
  }

  // Split into natural punchy spoken sentences
  const rawSentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const sentences = rawSentences.length > 0 ? rawSentences : [cleanText];
  const selectedVoice = getBestSalVoice(voiceTone);

  let isCancelled = false;
  let currentIndex = 0;

  const playNextSentence = () => {
    if (isCancelled || currentIndex >= sentences.length) {
      if (!isCancelled && onEnd) onEnd();
      return;
    }

    const currentSentence = sentences[currentIndex];
    const utterance = new SpeechSynthesisUtterance(currentSentence);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Sal / Grok AI Dynamic Prosody & Inflection:
    // Sarcastic high-energy roast opener -> fast analytical banter -> gritty punchline
    if (voiceTone === 'Charon' || voiceTone === 'Fenrir') {
      // Sal (Tesla / Grok gritty Brooklyn style)
      if (currentIndex === 0) {
        utterance.rate = 1.15;
        utterance.pitch = 0.95; // Gritty, confident, assertive opening
      } else if (currentIndex === 1) {
        utterance.rate = 1.20; // Fast-talking forensic breakdown
        utterance.pitch = 0.92;
      } else {
        utterance.rate = 1.12; // Grounded, punchy drop
        utterance.pitch = 0.88;
      }
    } else if (voiceTone === 'Puck') {
      // Puck (Chaotic rapid sarcasm)
      utterance.rate = 1.22;
      utterance.pitch = 1.06;
    } else {
      // Kore (Sharp Diva)
      utterance.rate = 1.14;
      utterance.pitch = 1.05;
    }

    utterance.onstart = () => {
      if (currentIndex === 0 && onStart) {
        onStart();
      }
    };

    utterance.onend = () => {
      if (isCancelled) return;
      currentIndex++;
      if (currentIndex < sentences.length) {
        // Human conversational breath pause (50ms)
        setTimeout(playNextSentence, 50);
      } else {
        if (onEnd) onEnd();
      }
    };

    utterance.onerror = (e) => {
      if (!isCancelled) {
        console.warn('Speech chunk error:', e);
        currentIndex++;
        if (currentIndex < sentences.length) {
          setTimeout(playNextSentence, 40);
        } else if (onEnd) {
          onEnd();
        }
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  playNextSentence();

  const cancelFn = () => {
    isCancelled = true;
    window.speechSynthesis.cancel();
    if (onEnd) onEnd();
  };

  activeSpeechQueue = { cancel: cancelFn };

  return cancelFn;
}

export function stopAllAudio() {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {}
    currentSource = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Procedural synthesizer sound effects for GeoSass
 */
export function playSfx(type: 'radar' | 'lock' | 'shutter' | 'glitch' | 'chime' | 'cringe' | 'buzzer') {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'buzzer') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.31);
    } else if (type === 'radar') {
      // Submarine / satellite radar sweep ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'lock') {
      // Coordinate Target Locked double-beep
      [0, 0.08].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(1760, now + offset);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.06);
        osc.start(now + offset);
        osc.stop(now + offset + 0.07);
      });
    } else if (type === 'shutter') {
      // Camera shutter snap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'glitch') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.setValueAtTime(450, now + 0.04);
      osc.frequency.setValueAtTime(1350, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.19);
    } else if (type === 'chime') {
      // Geolocation triumph arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.25, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.3);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.32);
      });
    } else if (type === 'cringe') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.4);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.start(now);
      osc.stop(now + 0.43);
    }
  } catch (err) {
    console.error('SFX error:', err);
  }
}
