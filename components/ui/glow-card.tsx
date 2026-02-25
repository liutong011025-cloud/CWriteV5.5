"use client";

import React, { type ReactNode } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const ShapeBlur = dynamic(() => import("@/components/effects/shape-blur"), {
  ssr: false,
});

interface GlowCardProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  variation?: number;
  borderSize?: number;
  circleSize?: number;
  circleEdge?: number;
  shapeSize?: number;
  roundness?: number;
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
