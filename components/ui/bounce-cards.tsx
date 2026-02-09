import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './BounceCards.css';

interface ArticleType {
  emoji: string;
  title: string;
  gradient?: string;
}

interface BounceCardsProps {
  className?: string;
  images?: string[];
  articles?: ArticleType[];
  containerWidth?: number;
  containerHeight?: number;
  animationDelay?: number;
  animationStagger?: number;
  easeType?: string;
  transformStyles?: string[];
  enableHover?: boolean;
}

export default function BounceCards({
  className = '',
  images = [],
  articles = [],
  containerWidth = 600,
  containerHeight = 400,
  animationDelay = 0.5,
  animationStagger = 0.06,
  easeType = 'elastic.out(1, 0.8)',
  transformStyles = [
    'rotate(10deg) translate(-170px)',
    'rotate(5deg) translate(-85px)',
    'rotate(-3deg)',
    'rotate(-10deg) translate(85px)',
    'rotate(2deg) translate(170px)'
  ],
  enableHover = false
}: BounceCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 确定使用哪个数据源
  const dataSource = images.length > 0 ? images : articles;
  const isImageMode = images.length > 0;

  useEffect(() => {
    if (!containerRef.current || dataSource.length === 0) return;
    
    const ctx = gsap.context(() => {
      const cards = containerRef.current?.querySelectorAll('.card');
      if (cards && cards.length > 0) {
        gsap.fromTo(
          cards,
          { scale: 0 },
          {
            scale: 1,
            stagger: animationStagger,
            ease: easeType,
            delay: animationDelay
          }
        );
      }
    }, containerRef);
    
    return () => ctx.revert();
  }, [animationStagger, easeType, animationDelay, dataSource.length]);

  const getNoRotationTransform = (transformStr: string): string => {
    const hasRotate = /rotate\([\s\S]*?\)/.test(transformStr);
    if (hasRotate) {
      return transformStr.replace(/rotate\([\s\S]*?\)/, 'rotate(0deg)');
    } else if (transformStr === 'none') {
      return 'rotate(0deg)';
    } else {
      return `${transformStr} rotate(0deg)`;
    }
  };

  const getPushedTransform = (baseTransform: string, offsetX: number): string => {
    const translateRegex = /translate\(([-0-9.]+)px\)/;
    const match = baseTransform.match(translateRegex);
    if (match) {
      const currentX = parseFloat(match[1]);
      const newX = currentX + offsetX;
      return baseTransform.replace(translateRegex, `translate(${newX}px)`);
    } else {
      return baseTransform === 'none' ? `translate(${offsetX}px)` : `${baseTransform} translate(${offsetX}px)`;
    }
  };

  const pushSiblings = (hoveredIdx: number) => {
    if (!enableHover || !containerRef.current) return;
    const q = gsap.utils.selector(containerRef);
    
    dataSource.forEach((_, i) => {
      const selector = q(`.card-${i}`);
      gsap.killTweensOf(selector);

      const baseTransform = transformStyles[i] || 'none';

      if (i === hoveredIdx) {
        const noRotation = getNoRotationTransform(baseTransform);
        gsap.to(selector, {
          transform: noRotation,
          duration: 0.4,
          ease: 'back.out(1.4)',
          overwrite: 'auto'
        });
      } else {
        const offsetX = i < hoveredIdx ? -160 : 160;
        const pushedTransform = getPushedTransform(baseTransform, offsetX);

        const distance = Math.abs(hoveredIdx - i);
        const delay = distance * 0.05;

        gsap.to(selector, {
          transform: pushedTransform,
          duration: 0.4,
          ease: 'back.out(1.4)',
          delay,
          overwrite: 'auto'
        });
      }
    });
  };

  const resetSiblings = () => {
    if (!enableHover || !containerRef.current) return;
    const q = gsap.utils.selector(containerRef);

    dataSource.forEach((_, i) => {
      const selector = q(`.card-${i}`);
      gsap.killTweensOf(selector);

      const baseTransform = transformStyles[i] || 'none';
      gsap.to(selector, {
        transform: baseTransform,
        duration: 0.4,
        ease: 'back.out(1.4)',
        overwrite: 'auto'
      });
    });
  };

  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ];

  return (
    <div
      className={`bounceCardsContainer ${className}`}
      ref={containerRef}
      style={{
        position: 'relative',
        width: containerWidth,
        height: containerHeight
      }}
    >
      {isImageMode ? (
        // 图片模式
        images.map((src, idx) => (
          <div
            key={idx}
            className={`card card-${idx}`}
            style={{
              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
              transform: transformStyles[idx] || 'none'
            }}
            onMouseEnter={() => enableHover && pushSiblings(idx)}
            onMouseLeave={() => enableHover && resetSiblings()}
          >
            <img className="image" src={src} alt={`card-${idx}`} />
          </div>
        ))
      ) : (
        // 文章模式（emoji + 标题）
        articles.map((article, idx) => (
          <div
            key={idx}
            className={`card card-${idx}`}
            style={{
              transform: transformStyles[idx] ?? 'none',
              background: article.gradient || gradients[idx % gradients.length]
            }}
            onMouseEnter={() => enableHover && pushSiblings(idx)}
            onMouseLeave={() => enableHover && resetSiblings()}
          >
            <div className="emoji">{article.emoji}</div>
            <div className="title">{article.title}</div>
          </div>
        ))
      )}
    </div>
  );
}
