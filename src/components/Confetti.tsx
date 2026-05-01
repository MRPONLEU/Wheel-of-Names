import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export const Confetti = ({ absolute = false }: { absolute?: boolean }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: number; vx: number; vy: number; rotation: number; rotationSpeed: number }[]>([]);

  useEffect(() => {
    const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F06292', '#AED581', '#FFD54F'];
    
    const newParticles = Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      x: 50,
      y: 50,
      color: i % COLORS.length,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.7) * 25,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15
    }));
    
    setParticles(newParticles);
    
    const interval = setInterval(() => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        vy: p.vy + 0.8, // gravity
        rotation: p.rotation + p.rotationSpeed
      })).filter(p => p.y < 110 && p.x > -10 && p.x < 110));
    }, 16);

    return () => clearInterval(interval);
  }, []);

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F06292', '#AED581', '#FFD54F'];

  return (
    <div className={`${absolute ? 'absolute' : 'fixed'} inset-0 pointer-events-none z-50 overflow-hidden`}>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: '12px',
            height: '12px',
            backgroundColor: COLORS[p.color],
            transform: `rotate(${p.rotation}deg)`,
            opacity: Math.max(0, 1 - (p.y / 100))
          }}
        />
      ))}
    </div>
  );
};
