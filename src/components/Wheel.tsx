import React, { useEffect, useRef } from 'react';
import { motion, useAnimation, useMotionValue, animate } from 'motion/react';

interface WheelProps {
  names: string[];
  colors: string[];
  isSpinning: boolean;
  onSpinComplete: (winner: string) => void;
  soundEnabled: boolean;
  soundTheme?: 'tick' | 'pop' | 'electronic';
  spinDuration?: number;
  volume?: number;
  fontFamily?: string;
  fontSize?: number;
  onSpinClick?: () => void;
}

export const Wheel: React.FC<WheelProps> = ({ 
  names, 
  colors, 
  isSpinning, 
  onSpinComplete,
  soundEnabled,
  soundTheme = 'tick',
  spinDuration = 5,
  volume = 0.5,
  fontFamily = 'Outfit',
  fontSize = 24,
  onSpinClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rotation = useMotionValue(0);
  const prevRotationRef = useRef(0);

  // Initialize audio context
  useEffect(() => {
    if (soundEnabled && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, [soundEnabled]);

  const playTick = () => {
    if (!soundEnabled || !audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (soundTheme === 'tick') {
      // Soft mechanical click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03);
      
      gain.gain.setValueAtTime(0.4 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001 * volume, ctx.currentTime + 0.03);
    } else if (soundTheme === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.6 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01 * volume, ctx.currentTime + 0.05);
    } else if (soundTheme === 'electronic') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.2 * volume, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01 * volume, ctx.currentTime + 0.08);
    }
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    const duration = soundTheme === 'tick' ? 0.03 : 0.08;
    osc.stop(ctx.currentTime + duration);
  };

  const drawWheel = (currRotation: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const segmentCount = names.length;
    const angleStep = (Math.PI * 2) / segmentCount;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(currRotation);

    names.forEach((name, i) => {
      const angle = i * angleStep;
      
      // Draw segment
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + angleStep);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      
      // Stroke for better visibility
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.rotate(angle + angleStep / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'white';
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      
      // Shadow for text
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 4;
      
      const textPadding = radius * 0.1;
      const textLimit = radius * 0.7;
      
      // Truncate text if too long
      let displayName = name;
      if (ctx.measureText(displayName).width > textLimit) {
        while (ctx.measureText(displayName + '...').width > textLimit && displayName.length > 0) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '...';
      }
      
      ctx.fillText(displayName, radius - textPadding, 5);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    
    // Decorative inner circle
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.05, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1';
    ctx.fill();

    ctx.restore();

    // Play tick sound based on rotation
    const segmentAngle = 360 / segmentCount;
    const totalRotationDeg = (currRotation * 180) / Math.PI;
    const currentSegmentIndex = Math.floor(Math.abs(totalRotationDeg) / segmentAngle);
    const prevSegmentIndex = Math.floor(Math.abs((prevRotationRef.current * 180) / Math.PI) / segmentAngle);
    
    if (currentSegmentIndex !== prevSegmentIndex) {
      playTick();
    }
    prevRotationRef.current = currRotation;
  };

  useEffect(() => {
    const unsub = rotation.on('change', (v) => {
      drawWheel(v);
    });
    drawWheel(rotation.get());
    return () => unsub();
  }, [names, colors]);

  useEffect(() => {
    if (isSpinning) {
      const extraSpins = 5 + Math.random() * 5;
      const finalRotation = rotation.get() + (Math.PI * 2 * extraSpins);
      
      animate(rotation, finalRotation, {
        duration: spinDuration,
        ease: [0.2, 0.8, 0.2, 1],
        onComplete: () => {
          // Normalize rotation to 0-2PI
          const normalized = ((finalRotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
          const angleStep = (Math.PI * 2) / names.length;
          
          // We rotate the wheel, but the pointer is fixed at the top (usually -PI/2 in canvas world)
          // The winning segment is the one that lands under the pointer.
          // Pointer position in the wheel's local space is: -finalRotation - PI/2
          const pointerAngle = (Math.PI * 1.5) - normalized;
          const winningIndex = Math.floor(((pointerAngle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2) / angleStep);
          
          onSpinComplete(names[winningIndex]);
        }
      });
    }
  }, [isSpinning]);

  // Handle Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // We add ResizeObserver instead of window resize to adapt to container changes
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const size = Math.min(width, height) * 2; // High DPI
        if (size > 0) {
           canvas.width = size;
           canvas.height = size;
           drawWheel(rotation.get());
        }
      }
    });

    const parent = canvas.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
      const size = Math.min(parent.clientWidth, parent.clientHeight) * 2;
      if (size > 0) {
        canvas.width = size;
        canvas.height = size;
        drawWheel(rotation.get());
      }
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center p-4">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
        <svg width="40" height="40" viewBox="0 0 40 40" className="drop-shadow-xl">
          <path d="M20 35 L5 10 Q20 0 35 10 Z" fill="#6366f1" stroke="white" strokeWidth="3" />
        </svg>
      </div>
      
      <div className="w-full aspect-square relative rounded-full border-8 border-slate-100 shadow-inner">
        <canvas 
          ref={canvasRef} 
          style={{ width: '100%', height: '100%' }}
        />
        
        {/* Clickable Center */}
        {onSpinClick && (
          <button 
            onClick={onSpinClick}
            disabled={isSpinning}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] h-[20%] rounded-full cursor-pointer z-20 outline-none transition-transform hover:scale-105 active:scale-95 ${isSpinning ? 'cursor-not-allowed opacity-0' : 'opacity-0'} hover:opacity-20 bg-white`}
            aria-label="Spin the wheel"
          />
        )}
      </div>
    </div>
  );
};
