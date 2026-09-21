import React, { useEffect, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Loader2,
  Quote,
  Radio,
  Zap,
} from 'lucide-react';
import {
  getAudioAnalyser,
  playSfx,
  cleanSpokenDialogue,
  VoicePersona,
  VOICE_OPTIONS,
  speakWithWebSpeech,
  playGrokAudio,
} from '../lib/audioDubber';
import { GeoLocationResult } from '../lib/geoPresets';
import { VoiceSyncedText } from './VoiceSyncedText';

interface AgentDubberBoxProps {
  currentResult: GeoLocationResult;
  isSpeaking: boolean;
  isLoadingAudio: boolean;
  isLoadingAnalysis: boolean;
  onPlayDubbing?: () => void;
  onStopDubbing: () => void;
  onReAnalyze: () => void;
  activeClueIndex?: number | null;
  onSelectClueIndex?: (idx: number) => void;
  selectedVoice?: VoicePersona;
  onSelectVoice?: (voice: VoicePersona) => void;
}

export const AgentDubberBox: React.FC<AgentDubberBoxProps> = ({
  currentResult,
  isSpeaking,
  isLoadingAudio,
  isLoadingAnalysis,
  onPlayDubbing,
  onStopDubbing,
  onReAnalyze,
  activeClueIndex = 0,
  onSelectClueIndex,
  selectedVoice = 'sal',
  onSelectVoice,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  // Real-time audio waveform equalizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let analyser: AnalyserNode | null = null;
    try {
      analyser = getAudioAnalyser();
    } catch {}

    const bufferLength = analyser ? analyser.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isSpeaking && analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else {
        // Subtle ambient oscillation
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = Math.sin(Date.now() / 200 + i) * 6 + 10;
        }
      }

      const barWidth = (canvas.width / 24) - 2;
      let x = 0;

      for (let i = 0; i < 24; i++) {
        const val = isSpeaking ? (dataArray[i % dataArray.length] || 20) : (dataArray[i] || 10);
        const barHeight = Math.max(3, (val / 255) * canvas.height * 0.85);

        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#f43f5e');
        gradient.addColorStop(1, '#a855f7');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 2;
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking]);

  const currentVoiceMeta =
    VOICE_OPTIONS.find((v) => v.id === selectedVoice) ||
    VOICE_OPTIONS.find((v) => v.id.toLowerCase() === (selectedVoice || '').toLowerCase()) ||
    VOICE_OPTIONS[0];

  const getVoiceEmoji = (v: string) => {
    const norm = v.toLowerCase();
    if (norm === 'ara' || norm === 'kore') return '💅';
    if (norm === 'rex' || norm === 'fenrir') return '🕶️';
    if (norm === 'eve') return '🎙️';
    if (norm === 'leo' || norm === 'puck') return '⚡';
    return '🚗';
  };

  const handleTestVoiceSample = async (e: React.MouseEvent) => {
    e.stopPropagation();
    playSfx('lock');
    if (isSpeaking || isPlayingSample) {
      onStopDubbing();
      setIsPlayingSample(false);
      return;
    }

    const norm = (selectedVoice || 'sal').toLowerCase();
    const sampleLine =
      norm === 'rex' || norm === 'fenrir'
        ? "I have analyzed satellite feeds for fifteen years, and then you show up with a photo that looks like it was taken by a confused raccoon. That curb angle was standardized in 1991. You are not off the grid, you are standing behind a dumpster in New Jersey. Next."
        : norm === 'ara' || norm === 'kore'
        ? "Oh, look at you trying to be mysterious with your crooked framing and zero depth of field. You thought you were giving Jason Bourne, but that pavement is screaming third-tier suburbia within walking distance of an IKEA. I'm embarrassed on your behalf. Pin dropped!"
        : norm === 'eve'
        ? "I love this for you! It takes genuine courage to upload a photo that looks like it was taken inside a washing machine, and believe nobody could trace it. Too bad that power line transformer just leaked your exact home address to the entire internet."
        : norm === 'leo' || norm === 'puck'
        ? "BRO. Did you actually think this was a challenge?! I literally sneezed and identified your entire neighborhood from a rusty screw in the top left corner! Who took this, your microwave?! Coordinates locked, sit down!"
        : "Did you take this photo with an electric toaster while running for your life? You tried hiding behind a brick wall, but you literally left a municipal trash can with the city logo in 4K resolution. I had your exact coordinates before my coffee even got cold. Pack it up!";

    setIsPlayingSample(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleLine,
          voice: selectedVoice,
        }),
      });
      const data = await res.json();
      if (data.available && data.base64Audio) {
        await playGrokAudio(
          data.base64Audio,
          data.mimeType || 'audio/mp3',
          data.sampleRate || 24000,
          () => {
            setIsPlayingSample(false);
          }
        );
      } else {
        speakWithWebSpeech(sampleLine, selectedVoice as VoicePersona, () => {}, () => setIsPlayingSample(false));
      }
    } catch {
      speakWithWebSpeech(sampleLine, selectedVoice as VoicePersona, () => {}, () => setIsPlayingSample(false));
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden">
      {/* Background Subtle Cyber Glow */}
      <div className="absolute -top-10 -right-10 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20 bg-gradient-to-br from-rose-500 to-purple-600 transition-all duration-700" />

      {/* Host Avatar & Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 relative z-10 border-b border-white/10 pb-4">
        {/* Avatar Profile & Identification */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div
              className={`w-13 h-13 rounded-2xl flex items-center justify-center text-2xl border shadow-lg transition-all duration-300 ${
                isSpeaking || isPlayingSample
                  ? 'scale-105 ring-4 ring-rose-500/40 bg-gradient-to-br from-rose-500/30 to-amber-500/30 border-rose-500'
                  : 'bg-slate-800 border-slate-700'
              }`}
            >
              <span>{getVoiceEmoji(selectedVoice)}</span>
              {(isSpeaking || isPlayingSample) && (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {currentResult.locationName.split(',')[0]}
              </h2>
              <span className="text-xs font-mono text-slate-400">
                {currentResult.flag}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {currentVoiceMeta.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-md">
              {currentResult.country} • {currentResult.biome}
            </p>
          </div>
        </div>

        {/* Audio Dubber Live Automatic Speech Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            {(isSpeaking || isLoadingAudio) && (
              <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5 mb-0.5">
                {isSpeaking ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="text-rose-400 font-bold">ROASTING</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-rose-400" />
                    <span className="text-rose-300">VOICING...</span>
                  </>
                )}
              </span>
            )}
            <canvas
              ref={canvasRef}
              width={110}
              height={26}
              className="rounded bg-slate-950/80 px-1 border border-slate-800"
            />
          </div>

          {/* Quick stop/mute button only when active speech is playing */}
          {isSpeaking ? (
            <button
              id="stop-dubbing-active-btn"
              type="button"
              onClick={onStopDubbing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600/90 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-lg shadow-rose-600/30 animate-pulse"
              title="Mute/Stop Current Audio"
            >
              <VolumeX className="w-4 h-4" />
              <span>Mute</span>
            </button>
          ) : (
            onPlayDubbing && (
              <button
                id="play-dubbing-btn"
                type="button"
                onClick={onPlayDubbing}
                disabled={isLoadingAudio}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white transition-all cursor-pointer shadow-md disabled:opacity-50"
                title="Play Audio Voiceover"
              >
                <Volume2 className="w-4 h-4" />
                <span>Play Grok Voice</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Voice Persona Switcher & Test Button */}
      <div className="relative z-10 rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Voice &amp; Expression Style:</span>
          </div>

          <button
            type="button"
            onClick={handleTestVoiceSample}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 transition-all cursor-pointer"
            title="Preview this voice delivering an unhinged test line"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Test Sample</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {VOICE_OPTIONS.map((opt) => {
            const norm = (selectedVoice || 'sal').toLowerCase();
            const isSelected =
              norm === opt.id.toLowerCase() ||
              (opt.id === 'sal' && norm === 'charon') ||
              (opt.id === 'rex' && norm === 'fenrir') ||
              (opt.id === 'ara' && norm === 'kore') ||
              (opt.id === 'leo' && norm === 'puck');
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelectVoice && onSelectVoice(opt.id)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-br from-rose-950/60 to-purple-950/60 border-rose-500 ring-2 ring-rose-500/40 shadow-md'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {opt.name.split(' (')[0]}
                  </span>
                  <span className="text-[10px]">{opt.vibe.split(' ')[0]}</span>
                </div>
                <div className="mt-1">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-rose-300 border border-rose-500/20">
                    {opt.badge}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight line-clamp-1">
                  {opt.tagline}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-3 text-xs relative z-10">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            🎯 {currentResult.confidenceRating} ({currentResult.confidenceScore}%)
          </span>
        </div>

        <button
          id="re-analyze-btn"
          onClick={() => {
            onReAnalyze();
            playSfx('glitch');
          }}
          disabled={isLoadingAnalysis}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors cursor-pointer disabled:opacity-50 ml-auto"
          title="Re-run AI Forensic Vision Geolocation"
        >
          {isLoadingAnalysis ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5" />
          )}
          <span>Re-Inspect</span>
        </button>
      </div>

      {/* Spoken Commentary Speech Card */}
      <div className="relative z-10 rounded-2xl bg-slate-950/80 border border-white/10 p-4 sm:p-5 space-y-3 shadow-xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <Quote className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-slate-100 leading-relaxed font-sans font-medium selection:bg-rose-500 selection:text-white">
            <span className="text-rose-400/80 font-serif mr-1">“</span>
            <VoiceSyncedText
              text={cleanSpokenDialogue(currentResult.sassyMonologue)}
              isSpeaking={isSpeaking || isPlayingSample}
              fallbackWordsPerMinute={165}
              activeWordClassName="text-slate-100 font-medium"
              inactiveWordClassName="text-slate-600/40"
              cursorClassName="inline-block w-1.5 h-4 ml-1 bg-rose-400 animate-pulse rounded-sm align-middle shadow-[0_0_8px_#f43f5e]"
            />
            <span className="text-rose-400/80 font-serif ml-1">”</span>
          </div>
        </div>

        {/* Clue Highlights with live zoom trigger buttons */}
        <div className="pt-2 border-t border-slate-800/70 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-slate-400 font-mono text-[10px] uppercase mr-1">
            Forensic Clues:
          </span>
          {currentResult.clues.map((c, i) => {
            const isClueActive = activeClueIndex === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelectClueIndex && onSelectClueIndex(i)}
                className={`px-2.5 py-1 rounded-md text-left transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isClueActive
                    ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-500/30 ring-1 ring-rose-400'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isClueActive ? 'bg-white animate-ping' : 'bg-rose-400'
                  }`}
                ></span>
                <strong className={isClueActive ? 'text-white' : 'text-rose-300'}>
                  {c.category}:
                </strong>
                <span className="truncate max-w-[170px] sm:max-w-[240px]">{c.clue}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

