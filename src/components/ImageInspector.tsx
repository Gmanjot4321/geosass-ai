import React, { useState, useRef } from 'react';
import {
  ZoomIn,
  Target,
  Sparkles,
  Info,
  Maximize2,
  Crosshair,
  Layers,
  MapPin
} from 'lucide-react';
import { GeoClue } from '../lib/geoPresets';
import { playSfx } from '../lib/audioDubber';

interface ImageInspectorProps {
  imageUrl: string;
  clues: GeoClue[];
  biome: string;
  soilType: string;
  confidenceScore: number;
  focusedClueIndex?: number | null;
  onClueSelected?: (index: number) => void;
  isInspecting?: boolean;
}

export const ImageInspector: React.FC<ImageInspectorProps> = ({
  imageUrl,
  clues,
  biome,
  soilType,
  confidenceScore,
  focusedClueIndex = 0,
  onClueSelected,
  isInspecting = false,
}) => {
  const [internalActiveClueIndex, setInternalActiveClueIndex] = useState<number | null>(0);
  const [isMagnifierActive, setIsMagnifierActive] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const imageContainerRef = useRef<HTMLDivElement | null>(null);

  // Sync with prop when parent drives focusedClueIndex
  const activeClueIndex = focusedClueIndex !== undefined && focusedClueIndex !== null ? focusedClueIndex : internalActiveClueIndex;

  const currentActiveClue = activeClueIndex !== null && clues[activeClueIndex] ? clues[activeClueIndex] : clues[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setMagnifierPos({ x, y });
  };

  const handleClueClick = (index: number) => {
    setInternalActiveClueIndex(index);
    if (onClueSelected) onClueSelected(index);
    playSfx('lock');
  };

  return (
    <div className="glass-panel flex flex-col h-full rounded-3xl overflow-hidden shadow-2xl">
      {/* Header HUD */}
      <div className="px-5 py-3.5 bg-slate-900/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-mono font-bold tracking-wider text-pink-400 uppercase">
            FORENSIC OSINT IMAGE INSPECTOR
          </span>
        </div>

        {/* Magnifier Lens Toggle */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-magnifier-btn"
            onClick={() => {
              setIsMagnifierActive(!isMagnifierActive);
              playSfx('glitch');
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer ${
              isMagnifierActive
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/30'
                : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
            {isMagnifierActive ? 'Exit Loupe Mode' : '2.5x Micro Loupe'}
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        ref={imageContainerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => isMagnifierActive && playSfx('radar')}
        className="relative flex-1 min-h-[360px] sm:min-h-[420px] bg-slate-950 flex items-center justify-center overflow-hidden cursor-crosshair select-none group"
      >
        {/* Main Image Stage - stable and clear without disorienting auto-zoom */}
        <div className="w-full h-full max-h-[460px] overflow-hidden flex items-center justify-center">
          <img
            src={imageUrl}
            alt="Forensic Target"
            className="w-full h-full object-contain object-center"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Tactical Scanlines & Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.4)_51%)] bg-[length:100%_4px] opacity-35"></div>

        {/* Tactical Crosshair Reticle for Currently Inspected Clue */}
        {currentActiveClue && (
          <div
            style={{
              left: `${currentActiveClue.zoomFocus.x}%`,
              top: `${currentActiveClue.zoomFocus.y}%`,
            }}
            className="absolute -ml-10 -mt-10 w-20 h-20 pointer-events-none z-20 flex items-center justify-center transition-all duration-500 ease-out"
          >
            {/* Pulsing Target Ring */}
            <div className="absolute w-16 h-16 rounded-full border border-pink-400/80 animate-ping opacity-75"></div>
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-pink-400 flex items-center justify-center animate-spin-slow">
              <div className="w-2 h-2 rounded-full bg-pink-500 shadow-lg shadow-pink-500/80"></div>
            </div>
            {/* Corner Bracket Reticles */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-400"></div>
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-400"></div>
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-400"></div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-400"></div>
            {/* Clue Category Tag */}
            <div className="absolute -bottom-5 px-2 py-0.5 rounded bg-slate-950/90 border border-pink-500/60 font-mono text-[9px] font-bold text-pink-300 uppercase tracking-wider whitespace-nowrap shadow-md">
              LOCK: {currentActiveClue.category}
            </div>
          </div>
        )}

        {/* Interactive Clue Pins on Photo */}
        {clues.map((clue, idx) => {
          const isSelected = activeClueIndex === idx;
          return (
            <button
              key={idx}
              onClick={() => handleClueClick(idx)}
              style={{
                left: `${clue.zoomFocus.x}%`,
                top: `${clue.zoomFocus.y}%`,
              }}
              className={`absolute -ml-3.5 -mt-3.5 z-20 group transition-transform duration-200 cursor-pointer ${
                isSelected ? 'scale-125' : 'hover:scale-110'
              }`}
              title={clue.category}
            >
              <div className="relative flex items-center justify-center">
                {isSelected && (
                  <div className="absolute w-10 h-10 rounded-full bg-pink-500/30 animate-ping"></div>
                )}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold border-2 shadow-lg ${
                    isSelected
                      ? 'bg-pink-500 text-white border-white ring-2 ring-pink-400/50'
                      : 'bg-slate-900/90 text-pink-300 border-pink-500/70 hover:bg-pink-600 hover:text-white'
                  }`}
                >
                  {idx + 1}
                </div>
              </div>
            </button>
          );
        })}

        {/* Dynamic Magnifying Loupe Overlay when active */}
        {isMagnifierActive && (
          <div
            style={{
              left: `${magnifierPos.x}%`,
              top: `${magnifierPos.y}%`,
            }}
            className="absolute -ml-20 -mt-20 w-40 h-40 rounded-full border-2 border-emerald-400 bg-slate-950/80 shadow-2xl overflow-hidden pointer-events-none z-30 ring-4 ring-emerald-500/30 backdrop-blur-xs"
          >
            <div
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundPosition: `${magnifierPos.x}% ${magnifierPos.y}%`,
                backgroundSize: '350%',
              }}
              className="w-full h-full"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-6 h-6 border-t border-b border-emerald-400/70"></div>
              <div className="h-6 w-6 border-l border-r border-emerald-400/70 absolute"></div>
            </div>
            <div className="absolute bottom-1.5 inset-x-0 text-center font-mono text-[9px] text-emerald-300 font-bold bg-slate-950/80">
              MICROSCOPIC LENS
            </div>
          </div>
        )}

        {/* Selected Clue Floating Callout */}
        {activeClueIndex !== null && clues[activeClueIndex] && (
          <div className="absolute bottom-3 inset-x-3 z-20 bg-slate-950/90 backdrop-blur-md p-3 rounded-xl border border-pink-500/40 shadow-xl max-w-lg mx-auto">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-pink-500 text-white font-mono text-[10px] font-bold flex items-center justify-center">
                  {activeClueIndex + 1}
                </span>
                <span className="font-bold text-pink-300">
                  {clues[activeClueIndex].category}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Target Lock @ ({clues[activeClueIndex].zoomFocus.x}%, {clues[activeClueIndex].zoomFocus.y}%)
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
              {clues[activeClueIndex].clue}
            </p>
          </div>
        )}
      </div>

      {/* Forensic Clue Details Bar */}
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="w-2 h-2 rounded-full bg-amber-400"></div>
          <div className="truncate">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Surface / Material</span>
            <span className="font-semibold text-slate-200 truncate">{soilType || 'Identified Material'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <div className="truncate">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Environment / Biome</span>
            <span className="font-semibold text-slate-200 truncate">{biome || 'Regional Climate'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
