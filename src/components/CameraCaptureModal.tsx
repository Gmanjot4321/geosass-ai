import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, AlertCircle } from 'lucide-react';
import { playSfx, unlockAudio } from '../lib/audioDubber';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string, mimeType: string) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasCameraError, setHasCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Start camera stream
  const startCamera = async (facing: 'environment' | 'user') => {
    setIsStarting(true);
    setHasCameraError(null);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      // Fallback try without specific facingMode if rear camera failed
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = fallbackStream;
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          await videoRef.current.play();
        }
      } catch (fallbackErr: any) {
        setHasCameraError(fallbackErr?.message || 'Could not access camera. Please check browser permissions.');
      }
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen, facingMode]);

  const handleFlipCamera = () => {
    playSfx('radar');
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleSnap = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    unlockAudio();
    playSfx('shutter');

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);

    // Stop camera and send image
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    onCapture(dataUrl, 'image/jpeg');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg glass-panel border border-white/20 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header with Title and Prominent Cross/Close Button */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-100 block">
                Live Camera Capture
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Snap any physical location or screen
              </span>
            </div>
          </div>
          
          {/* Top-right Cross/Close Button */}
          <button
            id="close-camera-modal-btn"
            type="button"
            onClick={onClose}
            aria-label="Close snap camera window"
            className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-white/10 hover:border-rose-500/30 transition-all cursor-pointer shadow-sm group"
            title="Close camera window (Esc)"
          >
            <X className="w-4 h-4 transition-transform group-hover:scale-110" />
          </button>
        </div>

        {/* Viewfinder Video Area */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {hasCameraError ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 font-mono leading-relaxed">{hasCameraError}</p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-300 text-xs font-semibold font-mono border border-slate-700 cursor-pointer"
                >
                  Retry Camera
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold font-mono border border-white/10 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
              />

              {/* Viewfinder Reticle / Crosshair Overlays */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {/* Corner Marks */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-pink-400/80"></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-pink-400/80"></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-pink-400/80"></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-pink-400/80"></div>

                {/* Center target circle */}
                <div className="w-16 h-16 rounded-full border border-dashed border-pink-400/60 animate-spin-slow"></div>
                <div className="w-2 h-2 rounded-full bg-pink-500"></div>

                {/* Top OSINT HUD tag */}
                <div className="absolute top-4 font-mono text-[10px] text-pink-300 bg-slate-950/70 px-2 py-0.5 rounded border border-pink-500/30 uppercase tracking-wider">
                  OSINT OPTICAL TARGET
                </div>
              </div>

              {/* Direct In-Viewfinder Floating Close Button (Top-Right of Video) */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close viewfinder"
                className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-slate-950/80 hover:bg-rose-950/80 text-white/80 hover:text-rose-300 border border-white/20 hover:border-rose-500/50 transition-all cursor-pointer backdrop-blur-md shadow-lg"
                title="Close camera window"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 sm:p-5 bg-slate-950/90 flex items-center justify-between gap-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleFlipCamera}
            disabled={Boolean(hasCameraError) || isStarting}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono font-semibold transition-all disabled:opacity-40 cursor-pointer"
            title="Switch Camera (Front / Rear)"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flip Cam</span>
          </button>

          {/* Snap Button */}
          <button
            id="capture-and-geolocate-btn"
            type="button"
            onClick={handleSnap}
            disabled={Boolean(hasCameraError) || isStarting}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-pink-600/30 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Camera className="w-4 sm:w-5 h-4 sm:h-5" />
            <span>CAPTURE &amp; GEOLOCATE</span>
          </button>

          {/* Cancel / Close Footer Button */}
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-slate-200 text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

