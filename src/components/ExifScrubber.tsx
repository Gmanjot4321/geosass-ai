import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Sparkles, Trash2, MapPin, Eye, Info, CheckCircle } from 'lucide-react';
import { playSfx } from '../lib/audioDubber';

export interface ExifDataSummary {
  hasGps: boolean;
  latitude?: number;
  longitude?: number;
  cameraMake?: string;
  cameraModel?: string;
  dateTimeOriginal?: string;
  software?: string;
  exposureTime?: string;
  iso?: string;
  lensModel?: string;
}

interface ExifScrubberProps {
  exifData: ExifDataSummary | null;
  onPurgeMetadata: () => void;
  isPurged: boolean;
}

export const ExifScrubber: React.FC<ExifScrubberProps> = ({
  exifData,
  onPurgeMetadata,
  isPurged,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!exifData) return null;

  const hasAnyMetadata =
    exifData.hasGps ||
    Boolean(exifData.cameraMake) ||
    Boolean(exifData.cameraModel) ||
    Boolean(exifData.dateTimeOriginal) ||
    Boolean(exifData.software);

  return (
    <div className="glass-panel-subtle rounded-2xl p-4 space-y-3 transition-all text-xs font-mono shadow-lg border border-white/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {exifData.hasGps && !isPurged ? (
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="font-bold text-[11px]">EXIF GPS DETECTED</span>
            </span>
          ) : isPurged ? (
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold text-[11px]">METADATA SCRUBBED</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-xl bg-white/5 text-slate-400 border border-white/10 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-[11px]">NO GPS METADATA</span>
            </span>
          )}

          <span className="text-[11px] text-slate-300 font-sans">
            {exifData.hasGps && !isPurged
              ? 'Raw photo file includes embedded GPS tags'
              : isPurged
              ? 'File header sanitized — Pure visual reasoning test'
              : 'Photo has no GPS tags — Evaluated strictly via visual cues'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {hasAnyMetadata && !isPurged && (
            <button
              type="button"
              onClick={() => {
                playSfx('glitch');
                onPurgeMetadata();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 text-[11px] font-semibold transition-colors cursor-pointer"
              title="Scrub all GPS and hardware EXIF tags from this photo to test pure AI visual reasoning"
            >
              <Trash2 className="w-3 h-3 text-rose-400" />
              <span>Scrub Metadata</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer flex items-center gap-0.5 underline"
          >
            {isExpanded ? 'Hide Details' : 'View EXIF Header'}
          </button>
        </div>
      </div>

      {/* Expanded EXIF Data Breakdown */}
      {isExpanded && (
        <div className="mt-2 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] animate-fadeIn">
          <div>
            <span className="text-slate-500">Camera / Device: </span>
            <span className="text-slate-200">
              {exifData.cameraMake || exifData.cameraModel
                ? `${exifData.cameraMake || ''} ${exifData.cameraModel || ''}`.trim()
                : 'Not recorded / Anonymized'}
            </span>
          </div>

          <div>
            <span className="text-slate-500">Embedded GPS: </span>
            <span className={exifData.hasGps ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              {exifData.hasGps && exifData.latitude && exifData.longitude
                ? `${exifData.latitude.toFixed(5)}°, ${exifData.longitude.toFixed(5)}°`
                : isPurged
                ? 'Stripped clean'
                : 'None'}
            </span>
          </div>

          <div>
            <span className="text-slate-500">Timestamp: </span>
            <span className="text-slate-200">{exifData.dateTimeOriginal || 'Not present'}</span>
          </div>

          <div>
            <span className="text-slate-500">Lens / ISO: </span>
            <span className="text-slate-200">
              {exifData.lensModel || exifData.iso ? `${exifData.lensModel || ''} (ISO ${exifData.iso || 'N/A'})` : 'Standard'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
