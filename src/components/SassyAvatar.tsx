import React from 'react';
import { Sparkles, Zap, Flame } from 'lucide-react';
import { playSfx } from '../lib/audioDubber';

interface SassyAvatarProps {
  isSpeaking: boolean;
  persona: 'sassy_diva' | 'unhinged_hacker' | 'british_butler';
  cringeScore: number;
}

export const SassyAvatar: React.FC<SassyAvatarProps> = ({
  isSpeaking,
  persona,
  cringeScore,
}) => {
  const getAvatarTheme = () => {
    switch (persona) {
      case 'sassy_diva':
        return {
          name: 'Agent Roxie (Lead CSS Diva)',
          title: 'Senior Style Architect & Drama Queen',
          glow: 'shadow-[0_0_25px_rgba(236,72,153,0.35)]',
          border: 'border-pink-500/50',
          accent: 'text-pink-400',
          bg: 'from-pink-950/40 via-purple-950/40 to-slate-950',
          emoji: '💅',
        };
      case 'unhinged_hacker':
        return {
          name: 'GLITCH-9000 (Terminal Menace)',
          title: 'Unhinged PostCSS Enforcer',
          glow: 'shadow-[0_0_25px_rgba(34,197,94,0.35)]',
          border: 'border-emerald-500/50',
          accent: 'text-emerald-400',
          bg: 'from-emerald-950/40 via-slate-950 to-slate-950',
          emoji: '👾',
        };
      case 'british_butler':
        return {
          name: 'Sir Reginald (Style Connoisseur)',
          title: 'Devastatingly Polite Code Roaster',
          glow: 'shadow-[0_0_25px_rgba(245,158,11,0.35)]',
          border: 'border-amber-500/50',
          accent: 'text-amber-400',
          bg: 'from-amber-950/40 via-slate-950 to-slate-950',
          emoji: '🧐',
        };
    }
  };

  const theme = getAvatarTheme();

  return (
    <div
      className={`relative rounded-2xl border ${theme.border} bg-gradient-to-br ${theme.bg} p-4 sm:p-5 transition-all duration-300 ${
        isSpeaking ? theme.glow : 'shadow-lg'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Animated Avatar Face */}
        <div className="relative group shrink-0">
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900/90 border-2 ${
              isSpeaking ? theme.border : 'border-slate-700'
            } flex flex-col items-center justify-center relative overflow-hidden transition-all duration-200`}
          >
            {/* Scanline overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.5)_51%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

            {/* Glowing aura */}
            <div
              className={`absolute inset-0 bg-radial from-pink-500/20 to-transparent transition-opacity duration-300 ${
                isSpeaking ? 'opacity-100 animate-pulse' : 'opacity-20'
              }`}
            />

            {/* Face Expressions */}
            <div className="z-10 flex flex-col items-center justify-center space-y-1.5">
              {/* Eyes */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    isSpeaking
                      ? 'bg-pink-400 animate-bounce shadow-[0_0_10px_#ec4899]'
                      : 'bg-slate-300'
                  }`}
                />
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    isSpeaking
                      ? 'bg-pink-400 animate-bounce shadow-[0_0_10px_#ec4899] [animation-delay:0.1s]'
                      : 'bg-slate-300'
                  }`}
                />
              </div>

              {/* Mouth (animated while speaking) */}
              <div
                className={`transition-all duration-100 ${
                  isSpeaking
                    ? 'w-7 h-3 rounded-full bg-pink-500 animate-pulse shadow-[0_0_8px_#ec4899]'
                    : cringeScore > 80
                    ? 'w-6 h-0.5 bg-slate-400 rotate-6'
                    : 'w-5 h-1 rounded-full bg-slate-400'
                }`}
              />
            </div>

            {/* Persona Badge emoji on corner */}
            <div className="absolute -bottom-1 -right-1 text-lg bg-slate-800 rounded-full p-1 border border-slate-700 shadow">
              {theme.emoji}
            </div>
          </div>
        </div>

        {/* Info & Sassy Title */}
        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              {theme.name}
              {isSpeaking && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
                </span>
              )}
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {theme.title}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            {persona === 'sassy_diva' &&
              "“Did you seriously paste your stylesheet three times and shove @import onto line 551? Darling, my eyes are burning.”"}
            {persona === 'unhinged_hacker' &&
              "“SYS_ERR: POSTCSS_MELTDOWN! You broke the Cascading Style Sheet laws. The cyber police have been alerted to your line 551!”"}
            {persona === 'british_butler' &&
              "“Forgive me, madam/sir, but I must respectfully inquire if your keyboard possesses any keys other than Ctrl and V.”"}
          </p>

          {/* Sassy Quick SFX Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 mr-1">
              SFX:
            </span>
            <button
              onClick={() => playSfx('buzzer')}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 transition-colors cursor-pointer flex items-center gap-1"
              title="Play PostCSS Error Buzz"
            >
              <Zap className="w-3 h-3 text-red-400" />
              Buzzer
            </button>
            <button
              onClick={() => playSfx('cringe')}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/60 transition-colors cursor-pointer flex items-center gap-1"
              title="Play Cringe Horn"
            >
              <Flame className="w-3 h-3 text-amber-400" />
              Cringe
            </button>
            <button
              onClick={() => playSfx('glitch')}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-800/60 transition-colors cursor-pointer flex items-center gap-1"
              title="Play Cyber Glitch"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              Glitch
            </button>
            <button
              onClick={() => playSfx('chime')}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 transition-colors cursor-pointer flex items-center gap-1"
              title="Play Fixed Chime"
            >
              ✨ Clean Fix
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
