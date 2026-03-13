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
    <div className={`flex items-center justify-between mb-8 mt-8 ${className || ""}`}>
      <div className="flex items-center gap-4">
        {/* 統一左上返回鍵：使用 back.png，大圖示，懸浮放大 */}
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
