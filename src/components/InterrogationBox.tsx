import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Loader2,
  Volume2,
  VolumeX,
  Sparkles,
  MessageSquare,
  HelpCircle,
  ShieldQuestion,
  CornerDownRight
} from 'lucide-react';
import {
  VoicePersona,
  playSfx,
  speakWithWebSpeech,
  playGrokAudio,
  stopAllAudio,
  cleanSpokenDialogue
} from '../lib/audioDubber';
import { GeoLocationResult } from '../lib/geoPresets';
import { VoiceSyncedText } from './VoiceSyncedText';

interface InterrogationBoxProps {
  currentResult: GeoLocationResult;
  currentImage: string | null;
  currentImageMime: string;
  selectedVoice: VoicePersona;
  unhingedMode: boolean;
  onInterrogationVoiceStart?: () => void;
  onInterrogationVoiceEnd?: () => void;
}

interface ChatExchange {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
  voice: VoicePersona;
}

export const InterrogationBox: React.FC<InterrogationBoxProps> = ({
  currentResult,
  currentImage,
  currentImageMime,
  selectedVoice,
  unhingedMode,
  onInterrogationVoiceStart,
  onInterrogationVoiceEnd,
}) => {
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingAnswer, setIsSpeakingAnswer] = useState(false);
  const [activeSpeakingChatId, setActiveSpeakingChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatExchange[]>([]);
  const speechRecognitionRef = useRef<any>(null);

  // Preset interrogation questions for rapid user one-click probing
  const SUGGESTED_QUESTIONS = [
    `How are you sure this is ${currentResult.locationName.split(',')[0]} and not somewhere else?`,
    "What exact visual clue gave it away first?",
    "Could this photo just be a generic studio background?",
    "What if I took this in a completely different country?",
  ];

  // Initialize Speech Recognition if supported in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setQuestionInput(transcript);
            handleAsk(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        speechRecognitionRef.current = recognition;
      }
    }
  }, [currentResult, selectedVoice, unhingedMode]);

  const toggleMic = () => {
    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
    } else {
      playSfx('radar');
      try {
        speechRecognitionRef.current?.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSpeakText = async (text: string, exchangeId?: string) => {
    stopAllAudio();
    setIsSpeakingAnswer(true);
    if (exchangeId) setActiveSpeakingChatId(exchangeId);
    onInterrogationVoiceStart?.();

    const handleDone = () => {
      setIsSpeakingAnswer(false);
      setActiveSpeakingChatId(null);
      onInterrogationVoiceEnd?.();
    };

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: cleanSpokenDialogue(text),
          voice: selectedVoice,
        }),
      });
      const data = await res.json();
      if (data.available && data.base64Audio) {
        await playGrokAudio(
          data.base64Audio,
          data.mimeType || 'audio/mp3',
          data.sampleRate || 24000,
          handleDone
        );
      } else {
        speakWithWebSpeech(
          text,
          selectedVoice,
          () => setIsSpeakingAnswer(true),
          handleDone
        );
      }
    } catch {
      speakWithWebSpeech(
        text,
        selectedVoice,
        () => setIsSpeakingAnswer(true),
        handleDone
      );
    }
  };

  const handleAsk = async (questionToAsk?: string) => {
    const q = (questionToAsk || questionInput).trim();
    if (!q || isAsking) return;

    playSfx('radar');
    setIsAsking(true);
    setPendingQuestion(q);
    setQuestionInput('');

    try {
      const res = await fetch('/api/interrogate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userQuestion: q,
          locationName: currentResult.locationName,
          country: currentResult.country,
          coordinates: currentResult.coordinates,
          clues: currentResult.clues,
          persona: selectedVoice,
          imageBase64: currentImage,
          mimeType: currentImageMime,
          unhingedMode,
        }),
      });

      const data = await res.json();
      if (data.success && data.answer) {
        const newExchange: ChatExchange = {
          id: 'chat-' + Date.now(),
          question: q,
          answer: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          voice: selectedVoice,
        };

        setChatHistory((prev) => [newExchange, ...prev]);
        playSfx('chime');
        handleSpeakText(data.answer, newExchange.id);
      }
    } catch (err) {
      console.error('Interrogation failed:', err);
    } finally {
      setIsAsking(false);
      setPendingQuestion(null);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative overflow-hidden">
      {/* Background Subtle Cyber Glow */}
      <div className="absolute -bottom-10 -left-10 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-15 bg-gradient-to-tr from-purple-600 to-indigo-600" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3.5 relative z-10">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wide flex items-center gap-1.5">
            <span>VOICE &amp; TEXT INTERROGATION &bull; DEBATE THE AI</span>
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-purple-300">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
          <span>Interrogating Host: {selectedVoice.toUpperCase()}</span>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="space-y-1.5 relative z-10">
        <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-purple-400" />
          Suggested Skeptic Probes:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map((sq, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAsk(sq)}
              disabled={isAsking}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-purple-950/60 border border-white/10 hover:border-purple-500/50 text-slate-300 hover:text-purple-200 text-[11px] font-sans transition-all text-left cursor-pointer disabled:opacity-50"
            >
              "{sq}"
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar with Voice Recognition and Submit */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex items-center gap-2 relative z-10"
      >
        <div className="relative flex-1">
          <input
            id="interrogation-question-input"
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder={`Ask ${selectedVoice.toUpperCase()} why they picked this location, or challenge a clue...`}
            disabled={isAsking}
            className="w-full glass-input rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-sans pr-10"
          />

          {/* Mic Button if supported */}
          {speechRecognitionRef.current && (
            <button
              type="button"
              onClick={toggleMic}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/80'
              }`}
              title="Speak your question via microphone"
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        <button
          id="send-interrogation-btn"
          type="submit"
          disabled={!questionInput.trim() || isAsking}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shadow-lg shadow-purple-600/30"
        >
          {isAsking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Challenge</span>
        </button>
      </form>

      {/* Conversation Thread & Responding Indicator */}
      {(chatHistory.length > 0 || isAsking) && (
        <div className="space-y-3 pt-2 max-h-80 overflow-y-auto pr-1">
          {/* Animated Responding / Thinking State with Pulsing Dots and Rotating Circle */}
          {isAsking && (
            <div className="p-3.5 rounded-xl bg-slate-950/95 border border-purple-500/40 space-y-2.5 shadow-lg shadow-purple-950/40 animate-fadeIn">
              {pendingQuestion && (
                <div className="flex items-start gap-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300 font-bold uppercase shrink-0">
                    YOU:
                  </span>
                  <p className="text-slate-300 font-sans italic">"{pendingQuestion}"</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  {/* Rotating Radar Circle Spinner */}
                  <div className="relative w-5 h-5 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></div>
                  </div>

                  {/* Persona Label & Pulsing Three Dots */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-purple-300">
                      {selectedVoice.toUpperCase()} IS FORMULATING COMEBACK
                    </span>

                    {/* Three Animated Pulsing Dots */}
                    <div className="flex items-center gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></span>
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></span>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-purple-400/80 animate-pulse hidden sm:inline">
                  Consulting satellite &amp; OSINT archives...
                </span>
              </div>
            </div>
          )}

          {chatHistory.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-slate-950/90 border border-purple-500/20 space-y-2 animate-fadeIn"
            >
              {/* User Question */}
              <div className="flex items-start gap-2 text-xs">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300 font-bold uppercase shrink-0">
                  YOU:
                </span>
                <p className="text-slate-200 font-sans italic">"{item.question}"</p>
                <span className="text-[10px] font-mono text-slate-500 ml-auto shrink-0">
                  {item.timestamp}
                </span>
              </div>

              {/* Host Response */}
              <div className="flex items-start gap-2 pt-1 border-t border-slate-800/60 text-xs">
                <span className="px-1.5 py-0.5 rounded bg-purple-950/80 border border-purple-500/30 font-mono text-[10px] text-purple-300 font-bold uppercase shrink-0 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                  {item.voice.toUpperCase()}:
                </span>
                <div className="text-purple-100 font-sans font-medium flex-1">
                  <span className="text-purple-400/80 font-serif mr-1">“</span>
                  <VoiceSyncedText
                    text={item.answer}
                    isSpeaking={isSpeakingAnswer && activeSpeakingChatId === item.id}
                    fallbackWordsPerMinute={165}
                    activeWordClassName="text-purple-100 font-medium"
                    inactiveWordClassName="text-slate-600/40"
                    cursorClassName="inline-block w-1.5 h-3.5 ml-1 bg-purple-400 animate-pulse rounded-sm align-middle shadow-[0_0_8px_#c084fc]"
                  />
                  <span className="text-purple-400/80 font-serif ml-1">”</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSpeakText(item.answer, item.id)}
                  className="p-1 rounded-md text-purple-400 hover:text-purple-200 hover:bg-purple-950/60 transition-colors cursor-pointer shrink-0"
                  title="Re-play spoken voiceover"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
