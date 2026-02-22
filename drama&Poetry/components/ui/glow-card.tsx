"use client";

import React, { type ReactNode } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const ShapeBlur = dynamic(() => import("@/components/ui/shape-blur"), {
  ssr: false,
});

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  /** Extra classes on the inner content wrapper */
  innerClassName?: string;
  /** ShapeBlur variation: 0 = rounded rect stroke (default), 1 = filled circle, 2 = circle stroke */
  variation?: number;
  /** Border glow size — smaller = thinner glow line */
  borderSize?: number;
  /** How large the follow-cursor spotlight is */
  circleSize?: number;
  /** Softness of the spotlight edge */
  circleEdge?: number;
  /** Overall shape size */
  shapeSize?: number;
  /** Corner roundness */
  roundness?: number;
  /** Whether to disable the effect (e.g. on mobile) */
  disabled?: boolean;
}

export function GlowCard({
  children,
  className,
  innerClassName,
  variation = 0,
  borderSize = 0.015,
  circleSize = 0.2,
  circleEdge = 0.4,
  shapeSize = 1.1,
  roundness = 0.5,
  disabled = false,
}: GlowCardProps) {
  return (
    <div className={cn("group relative", className)}>
      {/* ShapeBlur overlay — absolute, sits behind content via z-index */}
      {!disabled && (
        <div
          className="pointer-events-none absolute -inset-px z-0 overflow-hidden rounded-[inherit] opacity-60 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden="true"
        >
          <ShapeBlur
            variation={variation}
            shapeSize={shapeSize}
            roundness={roundness}
            borderSize={borderSize}
            circleSize={circleSize}
            circleEdge={circleEdge}
            pixelRatioProp={2}
            className="h-full w-full"
          />
        </div>
      )}

      {/* Content sits on top */}
      <div
        className={cn(
          "relative z-10 h-full rounded-[inherit] bg-card",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
