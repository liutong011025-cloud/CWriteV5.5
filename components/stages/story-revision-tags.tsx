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
    <div className={cn("mt-4 space-y-3", className)}>
      <p className="text-sm font-bold uppercase tracking-wide" style={{ color: "#6b5210" }}>
        Tap a tag to see why · hover to preview
      </p>
      <div className="flex flex-wrap gap-2.5">
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
                "rounded-xl px-4 py-2.5 text-left text-base font-extrabold transition-all duration-200",
                isOpen && "ring-2 ring-offset-2",
              )}
              style={{
                background: isHover || isOpen ? styles.hoverBg : styles.bg,
                border: `3px solid ${styles.border}`,
                color: styles.text,
                transform: isHover || isOpen ? "scale(1.05)" : "scale(1)",
                boxShadow: isHover || isOpen ? "4px 4px 0 rgba(0,0,0,0.18)" : "3px 3px 0 rgba(0,0,0,0.12)",
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
          className="rounded-xl px-5 py-4 text-base leading-relaxed"
          style={{
            background: "#fff",
            border: `4px solid ${REVISION_TAG_COLOR_STYLES[tags[openIndex].color].border}`,
            color: "#5a4a2a",
            boxShadow: "4px 4px 0 rgba(0,0,0,0.14)",
          }}
        >
          <p className="text-sm font-extrabold uppercase tracking-wide mb-1" style={{ color: "#6b5210" }}>
            Why change this?
          </p>
          <p className="text-base font-bold mb-2" style={{ color: REVISION_TAG_COLOR_STYLES[tags[openIndex].color].text }}>
            {tags[openIndex].label}
          </p>
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{tags[openIndex].rationale}</p>
        </div>
      )}
    </div>
  )
}
