import React, { useEffect, useRef } from 'react';
import { getAudioAnalyser } from '../lib/audioDubber';

interface AudioVisualizerProps {
  isPlaying: boolean;
  color?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  color = '#ec4899',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = getAudioAnalyser();
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (isPlaying) {
        analyser.getByteFrequencyData(dataArray);
      }

      const barCount = 28;
      const barWidth = (width / barCount) - 2;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (isPlaying) {
          // If analyser has active signal, use it; otherwise generate a lively pseudo-random speech rhythm
          const freqValue = dataArray[i % bufferLength] || 0;
          if (freqValue > 0) {
            barHeight = Math.max(4, (freqValue / 255) * height * 0.9);
          } else {
            // Synthetic sassy speech cadence
            const time = Date.now() / 80;
            const wave = Math.sin(time + i * 0.4) * Math.cos(time * 0.7 + i);
            barHeight = Math.max(4, Math.abs(wave) * height * 0.85);
          }
        }

        const x = i * (barWidth + 2);
        const y = height - barHeight;

        // Gradient for bars
        const grad = ctx.createLinearGradient(0, height, 0, 0);
        grad.addColorStop(0, '#3b82f6');
        grad.addColorStop(0.5, '#a855f7');
        grad.addColorStop(1, color);

        ctx.fillStyle = isPlaying ? grad : '#334155';
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
        ctx.fill();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, color]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={36}
      className="w-full max-w-[240px] h-9 rounded bg-slate-950/60 border border-slate-800/80 px-1"
    />
  );
};
