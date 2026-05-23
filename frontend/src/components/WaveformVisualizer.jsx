import React, { useRef, useEffect } from 'react';
import { useAudio } from '../context/AudioContext';

const WaveformVisualizer = ({ height = 80 }) => {
  const { analyser, isPlaying } = useAudio();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high DPI canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    
    // Allocate data buffer for frequencies
    let bufferLength = analyser ? analyser.frequencyBinCount : 64;
    let dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      // Clear canvas with subtle trail effect for motion blur
      ctx.fillStyle = 'rgba(11, 15, 25, 0.2)';
      ctx.fillRect(0, 0, width, height);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (width / (bufferLength / 2)) * 1.5;
        let x = 0;

        // Draw symmetrical frequency bars
        for (let i = 0; i < bufferLength / 2; i++) {
          const value = dataArray[i];
          const percent = value / 255;
          const barHeight = Math.max(4, percent * (height - 10));

          // Create beautiful vertical neon gradients
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, 'rgba(147, 51, 234, 0.15)'); // Translucent purple base
          gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.7)'); // Hot purple mid
          gradient.addColorStop(1, 'rgba(236, 72, 153, 0.95)'); // Electric pink tip

          ctx.fillStyle = gradient;
          
          // Draw mirrored bar sets from center outward or simple left-to-right
          // Left-to-right looks great, but centered looks premium:
          const yPos = (height - barHeight) / 2; // Vertically centered
          
          // Draw round-capped bars
          ctx.beginPath();
          ctx.roundRect(x, yPos, barWidth - 2.5, barHeight, 4);
          ctx.fill();

          // Optional neon glow peak highlight
          if (value > 160) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(x + (barWidth - 2.5) / 2, yPos, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }

          x += barWidth;
        }
      } else {
        // Draw standard tranquil idle wave
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const sliceWidth = width / 100;
        let x = 0;
        
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < 100; i++) {
          const y = height / 2 + Math.sin(i * 0.15 + Date.now() * 0.005) * 4;
          ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isPlaying, height]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full rounded-xl"
      style={{ height: `${height}px`, display: 'block' }}
    />
  );
};

export default WaveformVisualizer;
