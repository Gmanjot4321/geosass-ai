/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Flame,
  Globe2,
  Volume2,
  VolumeX,
  Upload,
  Sparkles,
  Target,
  Maximize2,
  Layers,
  Radio,
  Shuffle,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import {
  GeoLocationResult,
  SAMPLE_MYSTERY_PHOTOS
} from './lib/geoPresets';
import {
  playGrokAudio,
  playPcmAudio,
  speakWithWebSpeech,
  stopAllAudio,
  playSfx,
  cleanSpokenDialogue,
  VoicePersona,
} from './lib/audioDubber';
import { InteractiveGeoMap } from './components/InteractiveGeoMap';
import { ImageInspector } from './components/ImageInspector';
import { AgentDubberBox } from './components/AgentDubberBox';
import { PhotoUploader } from './components/PhotoUploader';
import { ExifScrubber, ExifDataSummary } from './components/ExifScrubber';
import { InterrogationBox } from './components/InterrogationBox';
import { purgeExifFromDataUrl } from './lib/exifUtils';

export default function App() {
  // Current active result (defaults to null so results only appear after image upload)
  const [currentResult, setCurrentResult] = useState<GeoLocationResult | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentImageMime, setCurrentImageMime] = useState<string>('image/jpeg');
  const [currentContextHint, setCurrentContextHint] = useState<string>('');
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>('sal');
  const [unhingedMode, setUnhingedMode] = useState<boolean>(true);

  // EXIF metadata scrubber state
  const [currentExif, setCurrentExif] = useState<ExifDataSummary | null>(null);
  const [isExifPurged, setIsExifPurged] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // Synchronized clue zoom state
  const [activeClueIndex, setActiveClueIndex] = useState<number | null>(0);
  const [isInspecting, setIsInspecting] = useState(false);

  // Taunt banner rotation state
  const stopAudioRef = useRef<(() => void) | null>(null);
  const clueTimerRef = useRef<number | null>(null);

  // Stop audio and timers on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (clueTimerRef.current) window.clearInterval(clueTimerRef.current);
    };
  }, []);

  // Clue stepping helper (no automatic ticking or jumping between 1 and 2)
  const startClueSequence = (clues?: GeoLocationResult['clues']) => {
    if (clueTimerRef.current) {
      window.clearInterval(clueTimerRef.current);
      clueTimerRef.current = null;
    }
    if (!clues || clues.length === 0) return;

    setActiveClueIndex(0);
    setIsInspecting(true);
    playSfx('lock');
  };

  const stopClueSequence = () => {
    if (clueTimerRef.current) {
      window.clearInterval(clueTimerRef.current);
      clueTimerRef.current = null;
    }
  };

  // Play voiceover with automatic zoom coordination
  const handlePlayDubbing = async (targetResult?: GeoLocationResult | null) => {
    const resultToPlay = targetResult || currentResult;
    if (!resultToPlay) return;

    if (isSpeaking) {
      handleStopDubbing();
      return;
    }

    setIsLoadingAudio(true);
    startClueSequence(resultToPlay.clues);

    const cleanedMonologue = cleanSpokenDialogue(resultToPlay.sassyMonologue);

    const fallbackToWebSpeech = () => {
      setIsLoadingAudio(false);
      setIsSpeaking(true);
      const stopSpeech = speakWithWebSpeech(
        cleanedMonologue,
        selectedVoice,
        () => {
          setIsSpeaking(true);
        },
        () => {
          setIsSpeaking(false);
          setIsInspecting(false);
          stopClueSequence();
          stopAudioRef.current = null;
        }
      );
      stopAudioRef.current = stopSpeech;
    };

    // High-fidelity Grok voice dubbing via official xAI / Neural synthesis
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9500);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanedMonologue,
          voice: selectedVoice,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.available && data.base64Audio) {
        setIsLoadingAudio(false);
        setIsSpeaking(true);
        const stopFn = await playGrokAudio(
          data.base64Audio,
          data.mimeType || 'audio/mp3',
          data.sampleRate || 24000,
          () => {
            setIsSpeaking(false);
            setIsInspecting(false);
            stopClueSequence();
            stopAudioRef.current = null;
          }
        );
        stopAudioRef.current = stopFn;
      } else {
        fallbackToWebSpeech();
      }
    } catch {
      clearTimeout(timeoutId);
      fallbackToWebSpeech();
    }
  };

  const handleStopDubbing = () => {
    stopAllAudio();
    stopClueSequence();
    if (stopAudioRef.current) {
      stopAudioRef.current();
      stopAudioRef.current = null;
    }
    setIsSpeaking(false);
    setIsLoadingAudio(false);
    setIsInspecting(false);
  };

  // Handle custom uploaded image -> automatically run voiceover and zoom into clues upon upload completion!
  const handleUploadCustomImage = async (
    base64Image: string,
    mimeType: string,
    contextHint?: string,
    exifSummary?: ExifDataSummary
  ) => {
    handleStopDubbing();
    setCurrentImage(base64Image);
    setCurrentImageMime(mimeType);
    setCurrentExif(exifSummary || null);
    setIsExifPurged(false);

    if (contextHint !== undefined) {
      setCurrentContextHint(contextHint);
    }

    setIsLoadingAnalysis(true);
    setIsInspecting(true);
    playSfx('shutter');

    try {
      const res = await fetch('/api/geolocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType,
          contextHint: contextHint ?? currentContextHint,
          persona: selectedVoice,
          unhingedMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newResult: GeoLocationResult = {
          id: 'custom-upload-' + Date.now(),
          title: 'Custom Forensic Target',
          locationName: data.locationName || 'Estimated Target Location',
          country: data.country || 'Identified Region',
          flag: data.flag || '📍',
          coordinates: data.coordinates || { lat: 0, lng: 0 },
          confidenceScore: data.confidenceScore ?? 96,
          confidenceRating: data.confidenceRating || 'Satellite Locked',
          biome: data.biome || 'Analyzed Biome',
          soilType: data.soilType || 'Identified Material',
          clues: data.clues || [],
          sassyMonologue: cleanSpokenDialogue(data.sassyMonologue) || 'Location identified with high-precision satellite accuracy.',
          imageThumbnail: base64Image,
          detectTimeMs: data.detectTimeMs,
        };

        setCurrentResult(newResult);
        setActiveClueIndex(0);
        playSfx('chime');

        // Immediately trigger the voiceover and synchronized zoom as soon as results render
        handlePlayDubbing(newResult);
      }
    } catch (err) {
      console.error('Failed to geolocate:', err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Handler to purge EXIF metadata from the current photo
  const handlePurgeMetadata = async () => {
    if (!currentImage) return;
    const sanitizedImage = await purgeExifFromDataUrl(currentImage);
    setCurrentImage(sanitizedImage);
    setIsExifPurged(true);
    if (currentExif) {
      setCurrentExif({
        ...currentExif,
        hasGps: false,
        latitude: undefined,
        longitude: undefined,
      });
    }
  };

  // Re-analyze current image with selected persona and automatically dub
  const handleReAnalyze = async () => {
    if (!currentImage || !currentResult) return;
    handleStopDubbing();
    setIsLoadingAnalysis(true);
    setIsInspecting(true);
    playSfx('radar');

    try {
      const res = await fetch('/api/geolocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: currentImage,
          mimeType: currentImageMime,
          contextHint: currentContextHint,
          persona: selectedVoice,
          unhingedMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const updatedResult: GeoLocationResult = {
          ...currentResult,
          locationName: data.locationName || currentResult.locationName,
          country: data.country || currentResult.country,
          flag: data.flag || currentResult.flag,
          coordinates: data.coordinates || currentResult.coordinates,
          confidenceScore: data.confidenceScore ?? currentResult.confidenceScore,
          confidenceRating: data.confidenceRating || currentResult.confidenceRating,
          biome: data.biome || currentResult.biome,
          soilType: data.soilType || currentResult.soilType,
          clues: data.clues || currentResult.clues,
          sassyMonologue: data.sassyMonologue || currentResult.sassyMonologue,
        };

        setCurrentResult(updatedResult);
        setActiveClueIndex(0);
        playSfx('chime');

        handlePlayDubbing(updatedResult);
      }
    } catch (err) {
      console.error('Re-analysis failed:', err);
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-600 selection:text-white relative overflow-x-hidden cyber-grid">
      {/* Dynamic Ambient Glow Blobs */}
      <div className="glow-orb-pink top-[-100px] left-[-150px]" />
      <div className="glow-orb-cyan top-[250px] right-[-150px]" />
      <div className="glow-orb-pink bottom-[100px] left-[20%]" />

      {/* Top Navigation Bar with Sleek Glass Header */}
      <header className="border-b border-white/10 bg-slate-950/60 backdrop-blur-2xl sticky top-0 z-40 shadow-2xl shadow-black/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 shadow-lg shadow-pink-500/10 backdrop-blur-md">
              <Compass className="w-6 h-6 text-pink-400 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                  GeoSass
                  <span className="text-white/20 font-normal">|</span>
                  <span className="text-pink-400 text-xs font-mono uppercase tracking-wider font-semibold">
                    Any-Photo AI Geolocator
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Pinpoint any location on Earth from any photo—cafes, interiors, skylines, streets, food, reflections &amp; dirt—with unhinged sassy dubbing
              </p>
            </div>
          </div>

          {/* Grok Unhinged Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              id="toggle-unhinged-mode-btn"
              type="button"
              onClick={() => setUnhingedMode(!unhingedMode)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-mono border transition-all cursor-pointer shadow-lg ${
                unhingedMode
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-rose-950/50'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-slate-200 hover:bg-white/10'
              }`}
              title="Toggle Grok Unhinged Mode"
            >
              <Flame className={`w-3.5 h-3.5 ${unhingedMode ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
              <span>Grok Unhinged: {unhingedMode ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main App Canvas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6 relative z-10">
        {/* Upload Custom Image - Front & Center */}
        <PhotoUploader
          onUploadCustomImage={handleUploadCustomImage}
          isLoading={isLoadingAnalysis}
        />

        {/* Forensic Results Section - Only rendered after user uploads/provides an image */}
        {currentResult && currentImage ? (
          <div className="space-y-6 animate-fadeIn">
            {/* EXIF Metadata Scrubber & Transparency Bar */}
            <ExifScrubber
              exifData={currentExif}
              onPurgeMetadata={handlePurgeMetadata}
              isPurged={isExifPurged}
            />

            {/* Sassy OSINT Host Dubbing Box with Synchronized Actions */}
            <AgentDubberBox
              currentResult={currentResult}
              isSpeaking={isSpeaking}
              isLoadingAudio={isLoadingAudio}
              isLoadingAnalysis={isLoadingAnalysis}
              onPlayDubbing={handlePlayDubbing}
              onStopDubbing={handleStopDubbing}
              onReAnalyze={handleReAnalyze}
              activeClueIndex={activeClueIndex}
              selectedVoice={selectedVoice}
              onSelectVoice={(voice) => {
                setSelectedVoice(voice);
                handleStopDubbing();
              }}
              onSelectClueIndex={(idx) => {
                setActiveClueIndex(idx);
                setIsInspecting(true);
                playSfx('lock');
              }}
            />

            {/* Dual Split Stage: Left (Image Forensic Inspector) / Right (Satellite Radar Map) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Left Column: Forensic Photo Inspector */}
              <div className="h-full">
                 <ImageInspector
                  imageUrl={currentImage}
                  clues={currentResult.clues}
                  biome={currentResult.biome}
                  soilType={currentResult.soilType}
                  confidenceScore={currentResult.confidenceScore}
                  focusedClueIndex={activeClueIndex}
                  isInspecting={isInspecting || isSpeaking}
                  onClueSelected={(idx) => {
                    setActiveClueIndex(idx);
                    setIsInspecting(true);
                  }}
                />
              </div>

              {/* Right Column: Satellite Radar Lock */}
              <div className="h-full">
                <InteractiveGeoMap
                  coordinates={currentResult.coordinates}
                  locationName={currentResult.locationName}
                  country={currentResult.country}
                  confidenceScore={currentResult.confidenceScore}
                  confidenceRating={currentResult.confidenceRating}
                />
              </div>
            </div>

            {/* Feature 4: Live Voice Interrogation & Debate Section */}
            <InterrogationBox
              currentResult={currentResult}
              currentImage={currentImage}
              currentImageMime={currentImageMime}
              selectedVoice={selectedVoice}
              unhingedMode={unhingedMode}
              onInterrogationVoiceStart={() => {
                setIsSpeaking(true);
                setIsInspecting(true);
              }}
              onInterrogationVoiceEnd={() => {
                setIsSpeaking(false);
                setIsInspecting(false);
              }}
            />
          </div>
        ) : (
          /* Clean Waiting Empty State with Glass Panel */
          <div className="glass-panel-subtle rounded-3xl border border-white/10 p-12 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 text-pink-400 mx-auto flex items-center justify-center shadow-lg shadow-pink-500/10">
              <Sparkles className="w-7 h-7 text-pink-400 animate-pulse" />
            </div>
            <h3 className="text-base font-semibold text-slate-100 font-mono tracking-wide">
              Dare To Test The Locator?
            </h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              Upload any photo above to challenge the locator. The satellite radar, coordinates, and roaster voice will activate immediately.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-md py-4 text-center text-xs text-slate-500 relative z-10">
        GeoSass &bull; Autonomous Multimodal Forensic OSINT &bull; Neural Grok Voice Synthesis
      </footer>
    </div>
  );
}
