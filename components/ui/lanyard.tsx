'use client';
import { useEffect, useRef, useState } from 'react';

interface LanyardProps {
  difficulty: number; // 1-5
}

// 难度等级颜色映射
const difficultyColors: Record<number, { 
  bg: string; 
  text: string; 
  border: string;
  glow: string;
  label: string;
}> = {
  1: { 
    bg: 'from-green-400 to-emerald-500', 
    text: 'text-white', 
    border: 'border-green-300',
    glow: 'shadow-green-500/50',
    label: 'Beginner'
  },
  2: { 
    bg: 'from-cyan-400 to-sky-500', 
    text: 'text-white', 
    border: 'border-cyan-300',
    glow: 'shadow-cyan-500/50',
    label: 'Intermediate'
  },
  3: { 
    bg: 'from-blue-400 to-indigo-500', 
    text: 'text-white', 
    border: 'border-blue-300',
    glow: 'shadow-blue-500/50',
    label: 'Advanced'
  },
  4: { 
    bg: 'from-purple-400 to-violet-500', 
    text: 'text-white', 
    border: 'border-purple-300',
    glow: 'shadow-purple-500/50',
    label: 'Expert'
  },
  5: { 
    bg: 'from-amber-400 to-orange-500', 
    text: 'text-white', 
    border: 'border-amber-300',
    glow: 'shadow-amber-500/50',
    label: 'Master'
  },
};

export default function Lanyard({ difficulty }: LanyardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const lanyardRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const colors = difficultyColors[difficulty] || difficultyColors[3];

  useEffect(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      mouseX = e.clientX - centerX;
      mouseY = e.clientY - centerY;
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      targetX = 0;
      targetY = 0;
      setRotation({ x: 0, y: 0 });
    };

    const handleMouseDown = () => {
      setIsClicked(true);
    };

    const handleMouseUp = () => {
      setIsClicked(false);
    };

    const animate = () => {
      targetX += (mouseX * 0.1 - targetX) * 0.1;
      targetY += (mouseY * 0.1 - targetY) * 0.1;
      
      setRotation({
        x: -targetY * 0.15,
        y: targetX * 0.15,
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);
    card.addEventListener('mousedown', handleMouseDown);
    card.addEventListener('mouseup', handleMouseUp);
    card.addEventListener('click', () => {
      // 点击时的弹跳效果
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 200);
    });

    animate();

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
      card.removeEventListener('mousedown', handleMouseDown);
      card.removeEventListener('mouseup', handleMouseUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed top-20 right-4 z-50 pointer-events-auto">
      {/* Lanyard strap with animation */}
      <div
        ref={lanyardRef}
        className="absolute -top-16 right-1/2 w-1.5 h-16 bg-gradient-to-t from-white/90 via-white/60 to-white/30 rounded-full shadow-lg animate-lanyard-sway"
        style={{
          transform: 'translateX(50%)',
        }}
      />
      
      {/* Card with difficulty */}
      <div
        ref={cardRef}
        className={`
          relative w-28 h-36 rounded-2xl
          bg-gradient-to-br ${colors.bg}
          border-4 ${colors.border}
          shadow-2xl ${colors.glow}
          transition-all duration-300
          cursor-pointer
          ${isHovered ? 'scale-110 shadow-3xl' : 'scale-100'}
          ${isClicked ? 'scale-95' : ''}
          flex flex-col items-center justify-center
          overflow-hidden
        `}
        style={{
          transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) ${isHovered ? 'translateY(-4px)' : ''} ${isClicked ? 'scale(0.95)' : ''}`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none" />
        
        {/* Glow effect */}
        <div 
          className={`absolute inset-0 rounded-2xl blur-2xl opacity-60 -z-10 ${colors.glow} animate-lanyard-pulse-glow`}
        />

        {/* Difficulty label */}
        <div className="absolute top-2 left-2 right-2 text-center">
          <span className={`text-xs font-bold ${colors.text} opacity-90 drop-shadow-md`}>
            Difficulty Level
          </span>
        </div>

        {/* Difficulty number with animation */}
        <div 
          className={`text-7xl font-black ${colors.text} drop-shadow-2xl mb-1 ${isHovered ? 'animate-number-bounce' : ''}`}
          style={{
            textShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 40px rgba(255,255,255,0.3)',
          }}
        >
          {difficulty}
        </div>

        {/* Level label */}
        <div className={`text-xs font-semibold ${colors.text} opacity-95 drop-shadow-md mt-1`}>
          {colors.label}
        </div>

        {/* Decorative stars */}
        <div className="absolute top-8 left-4 text-yellow-300/60 text-lg animate-pulse">✦</div>
        <div className="absolute bottom-8 right-4 text-yellow-300/60 text-lg animate-pulse" style={{ animationDelay: '0.5s' }}>✦</div>

        {/* Click ripple effect */}
        {isClicked && (
          <div className="absolute inset-0 rounded-2xl bg-white/30 animate-ripple" />
        )}
      </div>
    </div>
  );
}
