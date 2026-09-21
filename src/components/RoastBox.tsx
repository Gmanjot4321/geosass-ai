import React from 'react';
import {
  Volume2,
  VolumeX,
  RefreshCw,
  Sparkles,
  Flame,
  AlertOctagon,
  Radio,
  SlidersHorizontal,
  Bot
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

interface RoastBoxProps {
  roastData: {
    title: string;
    roast: string;
    cringeScore: number;
    spaghettiRating: string;
    sassLevel: string;
    verdict: string;
    isFallback?: boolean;
  };
  isSpeaking: boolean;
  isLoadingRoast: boolean;
  isLoadingAudio: boolean;
  persona: 'sassy_diva' | 'unhinged_hacker' | 'british_butler';
  setPersona: (p: 'sassy_diva' | 'unhinged_hacker' | 'british_butler') => void;
  voice: string;
  setVoice: (v: string) => void;
  onPlayDubbing: () => void;
  onStopDubbing: () => void;
  onGenerateNewRoast: () => void;
}

export const RoastBox: React.FC<RoastBoxProps> = ({
  roastData,
  isSpeaking,
  isLoadingRoast,
  isLoadingAudio,
  persona,
  setPersona,
  voice,
  setVoice,
  onPlayDubbing,
  onStopDubbing,
  onGenerateNewRoast,
}) => {
  // Format stage directions in text (e.g. *slaps forehead*) to stand out stylishly
  const renderFormattedRoast = (text: string) => {
    const parts = text.split(/(\*[^*]+\*|\[[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <span
            key={index}
            className="inline-block mx-1 px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono text-[11px] font-semibold border border-pink-500/30"
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span
            key={index}
            className="inline-block mx-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[11px] font-semibold border border-purple-500/30"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-5 space-y-5 shadow-xl">
      {/* Header & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500 animate-pulse" />
            <h2 className="text-base font-bold text-white tracking-tight">
              {roastData.title || 'AI Sassy Roast Dubbing'}
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {roastData.spaghettiRating} &bull; Sass: {roastData.sassLevel}
          </p>
        </div>

        {/* Cringe Score Meter */}
        <div className="flex items-center gap-3 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Cringe Index
            </div>
            <div className="text-base font-black text-rose-400 font-mono">
              {roastData.cringeScore}/100
            </div>
          </div>
          <div className="w-20 bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 transition-all duration-500"
              style={{ width: `${Math.min(100, roastData.cringeScore)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Roast Body */}
      <div className="relative rounded-xl bg-slate-950/70 p-4 border border-slate-800/90 space-y-3">
        <div className="text-xs text-slate-200 leading-relaxed font-sans sm:text-sm">
          {renderFormattedRoast(roastData.roast)}
        </div>

        {roastData.verdict && (
          <div className="pt-2 border-t border-slate-800/60 flex items-start gap-2 text-xs text-emerald-400 font-mono">
            <span className="font-bold uppercase tracking-wider text-emerald-500 shrink-0">Verdict:</span>
            <span>{roastData.verdict}</span>
          </div>
        )}
      </div>

      {/* Dubbing Control Deck */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-950/90 p-4 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          {/* Main Play / Stop Button */}
          {!isSpeaking ? (
            <button
              id="play-dubbing-btn"
              onClick={onPlayDubbing}
              disabled={isLoadingAudio || isLoadingRoast}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 hover:from-pink-500 hover:to-blue-500 text-white shadow-lg shadow-pink-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Volume2 className="w-4 h-4" />
              {isLoadingAudio ? 'Synthesizing Dub...' : 'Play Sassy AI Dub'}
            </button>
          ) : (
            <button
              id="stop-dubbing-btn"
              onClick={onStopDubbing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
            >
              <VolumeX className="w-4 h-4" />
              Stop Dubbing
            </button>
          )}

          {/* Re-Roast Button */}
          <button
            id="re-roast-btn"
            onClick={onGenerateNewRoast}
            disabled={isLoadingRoast || isSpeaking}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Generate a brand new roast with Gemini"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRoast ? 'animate-spin text-pink-400' : ''}`} />
            {isLoadingRoast ? 'Cooking Roast...' : 'Re-Roast CSS'}
          </button>
        </div>

        {/* Audio Visualizer */}
        <div className="flex items-center gap-3 justify-end">
          <div className="text-[10px] uppercase font-mono text-slate-400 hidden md:block">
            {isSpeaking ? 'Voice Output' : 'Audio Sync'}
          </div>
          <AudioVisualizer isPlaying={isSpeaking} color="#ec4899" />
        </div>
      </div>

      {/* Voice & Persona Configurator */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] flex items-center gap-1 text-slate-400">
            <Bot className="w-3.5 h-3.5 text-pink-400" />
            Persona:
          </span>
          <select
            id="persona-select"
            value={persona}
            onChange={(e) => setPersona(e.target.value as any)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
          >
            <option value="sassy_diva">💅 Sassy Senior Diva (Roxie)</option>
            <option value="unhinged_hacker">👾 Unhinged Cyber-Gremlin (GLITCH-9000)</option>
            <option value="british_butler">🧐 Devastating British Butler (Sir Reginald)</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] flex items-center gap-1 text-slate-400">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            Gemini TTS Voice:
          </span>
          <select
            id="voice-select"
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="Puck">Puck (Energetic &amp; Sassy)</option>
            <option value="Kore">Kore (Sharp &amp; Melodic)</option>
            <option value="Charon">Charon (Deep &amp; Menacing)</option>
            <option value="Fenrir">Fenrir (Intense &amp; Dramatic)</option>
            <option value="Zephyr">Zephyr (Airy &amp; Sarcastic)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
