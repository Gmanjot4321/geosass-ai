import React, { useEffect, useState, useRef } from 'react';

interface VoiceSyncedTextProps {
  text: string;
  isSpeaking: boolean;
  className?: string;
  activeWordClassName?: string;
  inactiveWordClassName?: string;
  cursorClassName?: string;
  fallbackWordsPerMinute?: number;
}

/**
 * Renders text synchronized with the pace of spoken audio.
 * When active, it reveals words in rhythm with speech and highlights
 * the currently vocalized token with a glowing cursor.
 */
export const VoiceSyncedText: React.FC<VoiceSyncedTextProps> = ({
  text,
  isSpeaking,
  className = '',
  activeWordClassName = 'text-white font-medium',
  inactiveWordClassName = 'text-slate-500 opacity-40',
  cursorClassName = 'inline-block w-1.5 h-4 ml-1 bg-rose-400 animate-pulse rounded-sm align-middle',
  fallbackWordsPerMinute = 160,
}) => {
  const [displayedWordCount, setDisplayedWordCount] = useState<number>(() => (isSpeaking ? 0 : 9999));
  const words = React.useMemo(() => {
    return text.split(/\s+/).filter((w) => w.length > 0);
  }, [text]);

  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!isSpeaking) {
      // Once voice completes or when idle, show all words
      setDisplayedWordCount(words.length);
      return;
    }

    // Reset when starting to speak
    setDisplayedWordCount(1);
    startTimeRef.current = Date.now();

    // Word interval based on speech rate (approx 160 words/min = ~375ms per word, adjusted for punctuation)
    const baseIntervalMs = Math.round((60 * 1000) / fallbackWordsPerMinute);

    let currentIndex = 1;
    const interval = window.setInterval(() => {
      currentIndex++;
      if (currentIndex <= words.length) {
        setDisplayedWordCount(currentIndex);
      } else {
        clearInterval(interval);
      }
    }, baseIntervalMs);

    timerRef.current = interval;

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSpeaking, text, words.length, fallbackWordsPerMinute]);

  if (!isSpeaking) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {words.map((word, idx) => {
        const isRevealed = idx < displayedWordCount;
        const isCurrentWord = idx === displayedWordCount - 1 && isSpeaking;

        return (
          <span
            key={idx}
            className={`transition-all duration-150 inline-block mr-1.5 ${
              isRevealed ? activeWordClassName : inactiveWordClassName
            } ${isCurrentWord ? 'scale-[1.03] text-rose-300 font-bold drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]' : ''}`}
          >
            {word}
          </span>
        );
      })}
      {isSpeaking && displayedWordCount < words.length && (
        <span className={cursorClassName} />
      )}
    </span>
  );
};
