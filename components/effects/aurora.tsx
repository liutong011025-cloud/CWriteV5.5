'use client';

import { useRef } from 'react';

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  time?: number;
  speed?: number;
}

export default function Aurora(props: AuroraProps) {
  const { colorStops = ['#5227FF', '#7cff67', '#5227FF'], amplitude = 1.0 } = props;
  const ctnDom = useRef<HTMLDivElement>(null);

  // 使用CSS渐变创建简化的Aurora效果
  const gradientStyle: React.CSSProperties = {
    background: `linear-gradient(90deg, ${colorStops[0]} 0%, ${colorStops[1]} 50%, ${colorStops[2]} 100%)`,
    backgroundSize: '200% 100%',
    animation: 'aurora-flow 8s ease-in-out infinite',
    opacity: 0.6 * amplitude,
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes aurora-flow {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      ` }} />
      <div 
        ref={ctnDom} 
        className="w-full h-full relative overflow-hidden"
        style={{
          background: 'white',
        }}
      >
        <div 
          className="absolute inset-0"
          style={gradientStyle}
        />
      </div>
    </>
  );
}
