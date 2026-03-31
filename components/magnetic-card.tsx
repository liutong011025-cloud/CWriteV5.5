"use client"

import type React from "react"
import { useRef, useEffect, type CSSProperties } from "react"
import { gsap } from "gsap"

interface CardItem {
  id: string
  title: string
  color: string
  rotation?: number
}

interface MagneticCardsProps {
  cards: CardItem[]
  onCardClick?: (id: string) => void
  activeCard?: string | null
  animationDuration?: number
  staggerDelay?: number
  delayStart?: number
}

export function MagneticCards({
  cards,
  onCardClick,
  activeCard,
  animationDuration = 0.7,
  staggerDelay = 0.2,
  delayStart = 0,
}: MagneticCardsProps) {
  const cardsRef = useRef<(HTMLButtonElement | null)[]>([])
  const labelsRef = useRef<(HTMLSpanElement | null)[]>([])
  const hasAnimated = useRef(false)
  const positionRefs = useRef<{ x: number; y: number }[]>([])

  useEffect(() => {
    const cardElements = cardsRef.current.filter(Boolean) as HTMLButtonElement[]
    const labelElements = labelsRef.current.filter(Boolean) as HTMLSpanElement[]

    if (!cardElements.length || hasAnimated.current) return

    hasAnimated.current = true

    gsap.set(cardElements, { scale: 0, opacity: 0, transformOrigin: "50% 50%", force3D: true })
    gsap.set(labelElements, { y: 24, autoAlpha: 0 })

    const tl = gsap.timeline({ delay: delayStart })

    cardElements.forEach((card, i) => {
      const delay = i * staggerDelay

      tl.to(
        card,
        {
          scale: 1,
          opacity: 1,
          duration: animationDuration * 0.8,
          ease: "cubic.out",
        },
        delay,
      )

      if (labelElements[i]) {
        tl.to(
          labelElements[i],
          {
            y: 0,
            autoAlpha: 1,
            duration: animationDuration * 0.6,
            ease: "power2.out",
          },
          delay + animationDuration * 0.2,
        )
      }
    })
  }, [animationDuration, staggerDelay, delayStart])

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>, index: number) => {
    const card = cardsRef.current[index]
    if (!card) return

    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2

    positionRefs.current[index] = { x: x * 0.15, y: y * 0.15 }

    const rotation = defaultRotations[index % defaultRotations.length]
    card.style.transform = `translate3d(${positionRefs.current[index].x}px, ${positionRefs.current[index].y}px, 0) rotate(${rotation}deg) scale(1.1)`
  }

  const handleMouseLeave = (index: number) => {
    const card = cardsRef.current[index]
    if (!card) return

    positionRefs.current[index] = { x: 0, y: 0 }
    const rotation = defaultRotations[index % defaultRotations.length]
    card.style.transform = `translate3d(0px, 0px, 0) rotate(${rotation}deg) scale(1)`
  }

  const defaultRotations = [-8, 8, -5, 6, -8]

  return (
    <div className="flex flex-wrap justify-center gap-4 md:gap-6">
      {cards.map((card, index) => {
        const rotation = card.rotation ?? defaultRotations[index % defaultRotations.length]
        const isActive = activeCard === card.id

        return (
          <button
            key={card.id}
            ref={(el) => {
              cardsRef.current[index] = el
            }}
            onClick={() => onCardClick?.(card.id)}
            onMouseMove={(e) => handleMouseMove(e, index)}
            onMouseLeave={() => handleMouseLeave(index)}
            data-pixel-item
            data-pixel-kind="button"
            className="group relative rounded-full px-8 py-5 md:px-12 md:py-7 lg:px-14 lg:py-8 transition-all duration-300 ease-out active:scale-95 will-change-transform"
            style={
              {
                backgroundColor: card.color,
                transform: `rotate(${rotation}deg)`,
                boxShadow: isActive ? `0 0 0 3px white, 0 8px 32px rgba(0,0,0,0.25)` : `0 4px 16px rgba(0,0,0,0.15)`,
              } as CSSProperties
            }
          >
            <span
              ref={(el) => {
                labelsRef.current[index] = el
              }}
              className="block text-xl md:text-3xl lg:text-4xl font-bold text-gray-900 whitespace-nowrap"
              style={{ willChange: "transform, opacity" }}
            >
              {card.title}
            </span>
          </button>
        )
      })}
    </div>
  )
}
