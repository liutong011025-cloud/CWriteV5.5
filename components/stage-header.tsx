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
          <div className="text-sm font-medium text-muted-foreground">Stage {stage} of 5</div>
          <h1 className="text-3xl font-bold text-foreground">
            {title}
            {character && <span className="text-primary"> - {character}</span>}
          </h1>
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`w-2 h-2 rounded-full transition-all ${i <= stage ? "bg-primary" : "bg-border"}`} />
        ))}
      </div>
    </div>
  )
}
