import React, { useRef, useState } from 'react';
import {
  Upload,
  Link,
  Camera,
  Layers,
  Sparkles,
  HelpCircle,
  Loader2,
  Scan,
  ShieldCheck,
  Video,
  Compass
} from 'lucide-react';
import { playSfx, unlockAudio } from '../lib/audioDubber';
import { CameraCaptureModal } from './CameraCaptureModal';
import { extractExifMetadata } from '../lib/exifUtils';
import { ExifDataSummary } from './ExifScrubber';

interface PhotoUploaderProps {
  onUploadCustomImage: (base64Image: string, mimeType: string, contextHint?: string, exifSummary?: ExifDataSummary) => void;
  isLoading: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onUploadCustomImage,
  isLoading,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [contextHint, setContextHint] = useState('');
  const [showHintField, setShowHintField] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const compressImage = (dataUrl: string, maxDim = 1080): Promise<{ base64: string; mime: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim && dataUrl.length < 500000) {
          resolve({ base64: dataUrl, mime: 'image/jpeg' });
          return;
        }
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve({
            base64: canvas.toDataURL('image/jpeg', 0.85),
            mime: 'image/jpeg',
          });
        } else {
          resolve({ base64: dataUrl, mime: 'image/jpeg' });
        }
      };
      img.onerror = () => resolve({ base64: dataUrl, mime: 'image/jpeg' });
      img.src = dataUrl;
    });
  };

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    unlockAudio();
    playSfx('shutter');

    // 1. Extract EXIF & GPS tags before canvas compression
    let exifSummary: ExifDataSummary | undefined = undefined;
    try {
      exifSummary = await extractExifMetadata(file);
    } catch (e) {
      console.warn('Could not read EXIF data', e);
    }

    // 2. Read and compress dataUrl for payload
    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawDataUrl = e.target?.result as string;
      if (rawDataUrl) {
        const compressed = await compressImage(rawDataUrl);
        onUploadCustomImage(compressed.base64, compressed.mime, contextHint, exifSummary);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || isLoading) return;
    unlockAudio();
    playSfx('radar');

    try {
      const res = await fetch(urlInput);
      const blob = await res.blob();
      const file = new File([blob], 'url-image.jpg', { type: blob.type || 'image/jpeg' });
      await handleFileProcess(file);
      setUrlInput('');
      setShowUrlInput(false);
    } catch (err) {
      onUploadCustomImage(urlInput, 'image/jpeg', contextHint);
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-400">
            <Upload className="w-4 h-4 text-pink-400" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <span>Try To Stump The AI &bull; Upload Any Photo</span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Think you're off the grid? Upload a blurry street, cafe corner, or reflection and watch it get pinned.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="open-camera-capture-btn"
            type="button"
            onClick={() => {
              unlockAudio();
              playSfx('shutter');
              setIsCameraModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/40 text-xs text-rose-300 hover:text-rose-200 transition-all cursor-pointer flex items-center gap-1.5 font-mono font-semibold"
            title="Snap a photo directly with your camera"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Snap Camera</span>
          </button>
          <button
            id="toggle-hint-input-btn"
            type="button"
            onClick={() => setShowHintField(!showHintField)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              showHintField 
                ? 'bg-pink-500/20 border-pink-500/40 text-pink-300' 
                : 'bg-white/5 border-white/10 hover:border-pink-500/30 text-slate-300 hover:text-pink-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-pink-400" />
            <span>{showHintField ? 'Hide Clue' : '+ Clue Anchor'}</span>
          </button>
          <button
            id="toggle-url-input-btn"
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
              showUrlInput
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-white/5 border-white/10 hover:border-cyan-500/30 text-slate-300 hover:text-cyan-200'
            }`}
          >
            <Link className="w-3 h-3" />
            <span>{showUrlInput ? 'Hide URL' : 'Paste Link'}</span>
          </button>
        </div>
      </div>

      {/* Optional Location Clue / Anchor Input */}
      {showHintField && (
        <div className="glass-panel-subtle p-3.5 rounded-2xl border border-pink-500/30 space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-pink-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Suspect Landmark or City Hint (Optional):
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Calibrates satellite accuracy</span>
          </div>
          <input
            id="context-hint-input"
            type="text"
            value={contextHint}
            onChange={(e) => setContextHint(e.target.value)}
            placeholder="e.g. 'Coffee shop in Kyoto', 'Subway station in Berlin', or 'Somewhere in Northern Spain'"
            className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-pink-500 font-sans"
          />
        </div>
      )}

      {/* URL Input Form if toggled */}
      {showUrlInput && (
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <input
            id="image-url-input"
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste public image link (e.g. https://.../photo.jpg)"
            className="flex-1 glass-input rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
          />
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono cursor-pointer shadow-lg shadow-cyan-600/30 transition-all"
          >
            Analyze
          </button>
        </form>
      )}

      {/* Main Drag-and-Drop Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!isLoading) fileInputRef.current?.click();
        }}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all duration-300 group ${
          isLoading
            ? 'border-pink-500/80 bg-pink-950/20 cursor-wait'
            : isDragging
            ? 'border-pink-500 bg-pink-500/15 scale-[1.01] cursor-pointer'
            : 'border-white/15 hover:border-pink-500/60 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={isLoading}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileProcess(e.target.files[0]);
            }
          }}
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-2 animate-fadeIn">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/40 flex items-center justify-center shadow-xl shadow-pink-500/20 backdrop-blur-md">
                <Scan className="w-8 h-8 text-pink-400 animate-pulse" />
              </div>
              <div className="absolute -inset-1.5 rounded-2xl border-2 border-pink-400/40 animate-ping opacity-30"></div>
            </div>

            <div className="space-y-1.5 max-w-md">
              <div className="flex items-center justify-center gap-2 text-pink-300 font-mono text-xs font-bold uppercase tracking-wider">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Multimodal Vision OSINT In Progress...</span>
              </div>
              <p className="text-xs text-slate-300">
                Scanning architecture, sun shadows, street infrastructure &amp; civil markers across world databases.
              </p>
            </div>

            {/* Glowing Scanline Bar */}
            <div className="w-56 h-1.5 bg-slate-800/80 rounded-full overflow-hidden relative mt-2 border border-white/10">
              <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-pink-500 via-cyan-400 to-pink-500 animate-pulse"></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-pink-500/10">
              <Camera className="w-7 h-7 text-pink-400" />
            </div>
            <div>
              <span className="text-sm font-semibold text-slate-100">
                Drop your most impossible photo here, or{' '}
                <span className="text-pink-400 underline underline-offset-4 decoration-pink-500/50 hover:decoration-pink-400">browse files</span>
              </span>
              <p className="text-xs text-slate-400 mt-1.5 font-sans">
                Random curb, mysterious alley, potato-quality food snap, or reflection—let’s see if you can break the locator
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Live Camera Viewfinder Modal */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={(base64, mime) => {
          onUploadCustomImage(base64, mime, contextHint);
        }}
      />
    </div>
  );
};
