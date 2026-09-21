import React, { useState } from 'react';
import { Terminal, Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { EXACT_CLEAN_SOLUTION } from '../lib/presets';

interface TerminalFixerProps {
  cleanedCss: string;
}

export const TerminalFixer: React.FC<TerminalFixerProps> = ({ cleanedCss }) => {
  const [copiedScript, setCopiedScript] = useState<string | null>(null);

  const cleanContentToUse = cleanedCss.trim() || EXACT_CLEAN_SOLUTION.trim();

  const psCommand = `Set-Content -Path "app\\globals.css" -Value @'
${cleanContentToUse}
'@ -Force`;

  const bashCommand = `cat << 'EOF' > app/globals.css
${cleanContentToUse}
EOF`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(id);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-bold text-white tracking-tight">
            1-Click Terminal Overwrite (Bypasses VS Code Save Bugs)
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-[11px]">Guaranteed Line 1-2 @import</span>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        If VS Code kept appending lines instead of replacing, don't waste time struggling with editor tabs. Paste this directly into your terminal in the project root to atomically overwrite <code className="font-mono text-blue-400">app/globals.css</code>:
      </p>

      {/* PowerShell Card */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
        <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono font-semibold text-blue-300">Windows PowerShell (VS Code Terminal)</span>
          <button
            onClick={() => handleCopy(psCommand, 'ps')}
            className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors cursor-pointer text-xs"
          >
            {copiedScript === 'ps' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedScript === 'ps' ? 'Copied Command!' : 'Copy PowerShell Fix'}</span>
          </button>
        </div>
        <pre className="p-3.5 font-mono text-[11px] text-blue-300 overflow-x-auto leading-relaxed max-h-32">
          {psCommand}
        </pre>
      </div>

      {/* Bash / macOS / Linux Card */}
      <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
        <div className="px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono font-semibold text-emerald-300">macOS / Linux / Git Bash</span>
          <button
            onClick={() => handleCopy(bashCommand, 'bash')}
            className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded transition-colors cursor-pointer text-xs"
          >
            {copiedScript === 'bash' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedScript === 'bash' ? 'Copied Command!' : 'Copy Bash Fix'}</span>
          </button>
        </div>
        <pre className="p-3.5 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed max-h-32">
          {bashCommand}
        </pre>
      </div>

      {/* Next.js Cache Tip */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-950/20 border border-blue-800/40 text-xs text-slate-300">
        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-blue-300">Still seeing error in browser?</span> Next.js dev server caches compiled CSS. Run <code className="font-mono bg-slate-900 px-1 py-0.5 rounded text-amber-300">Remove-Item -Recurse -Force .next</code> (or <code className="font-mono bg-slate-900 px-1 py-0.5 rounded text-amber-300">rm -rf .next</code>), then restart <code className="font-mono bg-slate-900 px-1 py-0.5 rounded text-emerald-300">npm run dev</code>.
        </div>
      </div>
    </div>
  );
};
