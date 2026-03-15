"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

interface StageHeaderProps {
  stage: number
  title: string
  onBack: () => void
  character?: string
  className?: string
}

export default function StageHeader({ stage, title, onBack, character, className }: StageHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-8 mt-8 pl-28 lg:pl-32 ${className || ""}`}>
      {/* 統一左側垂直居中返回鍵 */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
        <Button
          onClick={onBack}
          variant="ghost"
          size="icon"
          className="rounded-full p-0 bg-transparent hover:bg-transparent active:bg-transparent data-[state=pressed]:bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-primary/60 w-24 h-24 lg:w-28 lg:h-28"
        >
          <Image
            src="/back.png"
            alt="Back"
            width={112}
            height={112}
            className="w-24 h-24 lg:w-28 lg:h-28 object-contain transition-transform duration-200 hover:scale-110"
            priority
            unoptimized
          />
        </Button>
      </div>
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
