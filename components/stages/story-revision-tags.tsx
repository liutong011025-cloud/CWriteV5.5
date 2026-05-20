"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  REVISION_TAG_COLOR_STYLES,
  type StoryRevisionTag,
} from "@/lib/story-revision-tags"

interface StoryRevisionTagsProps {
  tags: StoryRevisionTag[]
  className?: string
}

export default function StoryRevisionTags({ tags, className }: StoryRevisionTagsProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  if (!tags.length) return null

  return (
    <div className={cn("mt-3 space-y-2", className)}>
      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#6b5210" }}>
        Tap a tag to see why · hover to preview
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => {
          const styles = REVISION_TAG_COLOR_STYLES[tag.color]
          const isOpen = openIndex === index
          const isHover = hoverIndex === index
          return (
            <button
              key={`${tag.label}-${index}`}
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              className={cn(
                "rounded-lg px-3 py-2 text-left text-xs font-bold transition-all duration-200",
                isOpen && "ring-2 ring-offset-1",
              )}
              style={{
                background: isHover || isOpen ? styles.hoverBg : styles.bg,
                border: `2px solid ${styles.border}`,
                color: styles.text,
                transform: isHover || isOpen ? "scale(1.06)" : "scale(1)",
                boxShadow: isHover || isOpen ? "3px 3px 0 rgba(0,0,0,0.15)" : "2px 2px 0 rgba(0,0,0,0.1)",
                ringColor: styles.border,
              }}
              title={tag.rationale}
            >
              {tag.label}
            </button>
          )
        })}
      </div>
      {openIndex !== null && tags[openIndex] && (
        <div
          className="rounded-lg px-4 py-3 text-sm leading-relaxed"
          style={{
            background: "#fff",
            border: `3px solid ${REVISION_TAG_COLOR_STYLES[tags[openIndex].color].border}`,
            color: "#5a4a2a",
            boxShadow: "3px 3px 0 rgba(0,0,0,0.12)",
          }}
        >
          <p className="text-xs font-extrabold uppercase tracking-wide mb-1" style={{ color: "#6b5210" }}>
            Why change this?
          </p>
          <p>{tags[openIndex].rationale}</p>
        </div>
      )}
    </div>
  )
}
