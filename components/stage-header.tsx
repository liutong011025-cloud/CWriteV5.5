"use client"

import { BackButton } from "@/components/ui/back-button"

interface StageHeaderProps {
  stage: number
  title: string
  onBack: () => void
  character?: string
  className?: string
}

export default function StageHeader({ stage, title, onBack, character, className }: StageHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-8 mt-8 pl-20 lg:pl-24 ${className || ""}`}>
      <BackButton onClick={onBack} variant="default" />
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div>
          <div 
            className="text-sm font-bold"
            style={{ color: "#5a4a2a", textShadow: "1px 1px 0 rgba(0,0,0,0.15)" }}
          >
            Stage {stage} of 5
          </div>
          <h1 
            className="text-3xl font-extrabold"
            style={{ color: "#5a4a2a", textShadow: "2px 2px 0 rgba(0,0,0,0.2)" }}
          >
            {title}
            {character && <span style={{ color: "#7ec850" }}> - {character}</span>}
          </h1>
        </div>
      </div>
      {/* Pixel-style progress indicator - crop growth stages */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i} 
            className="w-4 h-4 transition-all"
            style={{ 
              background: i <= stage ? "#7ec850" : "#d9c9a6",
              border: `2px solid ${i <= stage ? "#5a9a32" : "#8b6914"}`,
              boxShadow: i <= stage ? "inset -1px -1px 0 rgba(0,0,0,0.2), inset 1px 1px 0 rgba(255,255,255,0.3)" : "none"
            }}
          />
        ))}
      </div>
    </div>
  )
}
