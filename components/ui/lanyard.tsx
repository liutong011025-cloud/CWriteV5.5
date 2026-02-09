'use client';
import { useEffect, useRef, useState } from 'react';

interface LanyardProps {
  difficulty: number; // 1-5
}

// 难度等级颜色映射
const difficultyColors: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: 'from-green-400 to-green-600', text: 'text-white', border: 'border-green-300' },
  2: { bg: 'from-cyan-400 to-cyan-600', text: 'text-white', border: 'border-cyan-300' },
  3: { bg: 'from-blue-400 to-blue-600', text: 'text-white', border: 'border-blue-300' },
  4: { bg: 'from-purple-400 to-purple-600', text: 'text-white', border: 'border-purple-300' },
  5: { bg: 'from-amber-400 to-amber-600', text: 'text-white', border: 'border-amber-300' },
};

export default function Lanyard({ difficulty }: LanyardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const lanyardRef = useRef<HTMLDivElement>(null);

  const colors = difficultyColors[difficulty] || difficultyColors[3];

  useEffect(() => {
    if (!cardRef.current || !lanyardRef.current) return;

    const card = cardRef.current;
    const lanyard = lanyardRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) * 0.1;
      const deltaY = (e.clientY - centerY) * 0.1;
      
      card.style.transform = `translate(${deltaX}px, ${deltaY}px) rotateX(${-deltaY * 0.1}deg) rotateY(${deltaX * 0.1}deg)`;
    };

    const handleMouseLeave = () => {
      card.style.transform = '';
      setIsHovered(false);
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    card.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
      card.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-none">
      {/* Lanyard strap */}
      <div
        ref={lanyardRef}
        className="absolute -top-16 right-1/2 w-1 h-16 bg-gradient-to-t from-white/80 to-white/40 rounded-full shadow-lg"
        style={{
          transform: 'translateX(50%)',
        }}
      />
      
      {/* Card with difficulty */}
      <div
        ref={cardRef}
        className={`
          relative w-24 h-32 rounded-xl
          bg-gradient-to-br ${colors.bg}
          border-4 ${colors.border}
          shadow-2xl
          transition-all duration-300
          ${isHovered ? 'scale-105 shadow-3xl' : 'scale-100'}
          flex items-center justify-center
        `}
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
      >
        {/* Difficulty number */}
        <div className={`text-6xl font-black ${colors.text} drop-shadow-lg`}>
          {difficulty}
        </div>
        
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        
        {/* Glow effect */}
        <div 
          className="absolute inset-0 rounded-xl blur-xl opacity-50 -z-10"
          style={{
            background: `linear-gradient(135deg, ${colors.bg.split(' ')[1]}, ${colors.bg.split(' ')[3]})`,
          }}
        />
      </div>
    </div>
  );
}
