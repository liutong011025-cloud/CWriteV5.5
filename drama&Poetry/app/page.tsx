"use client";

import { useRouter } from "next/navigation";
import {
  Theater,
  BookOpen,
  Sparkles,
  Star,
  ArrowRight,
} from "lucide-react";
import { GlowCard } from "@/components/ui/glow-card";

const TYPES = [
  {
    id: "drama",
    href: "/drama",
    title: "Drama",
    subtitle: "Build scenes, characters & dialogue",
    description:
      "Create your own play with AI-generated backgrounds, drag-and-drop characters, speech bubbles, and a full script.",
    icon: Theater,
    color: "from-primary/80 to-primary",
    bgLight: "bg-primary/5",
    borderColor: "border-primary/20 hover:border-primary/50",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    accent: "text-primary",
    features: ["Scene builder", "Character creator", "AI backgrounds", "Script generator"],
  },
  {
    id: "poetry",
    href: "/poetry",
    title: "Poetry",
    subtitle: "Write poems in different forms",
    description:
      "Choose from Rhyming Couplets, Haiku, or Free Verse. Get AI-powered rhyme suggestions, syllable counting, and rhetorical device help.",
    icon: BookOpen,
    color: "from-accent/80 to-accent",
    bgLight: "bg-accent/5",
    borderColor: "border-accent/20 hover:border-accent/50",
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    accent: "text-accent",
    features: ["3 poem forms", "Rhyme assistant", "Syllable counter", "Word inspiration"],
  },
] as const;

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-40" />
      <div className="pointer-events-none absolute -top-32 -right-32 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent/8 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/6 blur-3xl" />

      {/* Floating decorative stars */}
      <Star className="pointer-events-none absolute top-16 left-[15%] h-5 w-5 text-secondary/30 animate-float" />
      <Star className="pointer-events-none absolute top-28 right-[20%] h-4 w-4 text-primary/20 animate-float-delayed" />
      <Star className="pointer-events-none absolute bottom-24 left-[25%] h-3 w-3 text-accent/25 animate-sparkle" />
      <Sparkles className="pointer-events-none absolute bottom-32 right-[15%] h-5 w-5 text-secondary/20 animate-float" />

      {/* Header */}
      <div className="relative z-10 mb-12 text-center animate-fade-in-up">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-4 py-1.5 shadow-sm backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="font-hand text-xs tracking-wide text-muted-foreground">
            Creative Writing Studio
          </span>
        </div>
        <h1 className="font-hand text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl text-balance">
          What will you create{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            today
          </span>
          ?
        </h1>
        <p className="mx-auto mt-3 max-w-lg font-hand text-base text-muted-foreground sm:text-lg leading-relaxed">
          Pick a writing type and let your imagination fly.
          AI helpers are here to inspire you along the way!
        </p>
      </div>

      {/* Type cards */}
      <div className="relative z-10 flex w-full max-w-3xl flex-col gap-6 sm:flex-row sm:gap-8">
        {TYPES.map((type, i) => {
          const Icon = type.icon;
          return (
            <GlowCard
              key={type.id}
              className={`flex-1 rounded-3xl animate-fade-in-up cursor-pointer transition-all duration-300 hover:-translate-y-1`}
              innerClassName="bg-card/80 backdrop-blur-sm rounded-3xl"
              borderSize={0.02}
              circleSize={0.25}
              circleEdge={0.5}
            >
              <button
                type="button"
                onClick={() => router.push(type.href)}
                className="group flex w-full flex-col p-6 text-left sm:p-8"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                {/* Icon */}
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${type.iconBg} shadow-sm transition-transform group-hover:scale-110`}
                >
                  <Icon className={`h-7 w-7 ${type.iconColor}`} />
                </div>

                {/* Title */}
                <h2 className="font-hand text-2xl font-bold text-foreground sm:text-3xl">
                  {type.title}
                </h2>
                <p className={`mt-0.5 font-hand text-sm font-bold ${type.accent}`}>
                  {type.subtitle}
                </p>

                {/* Description */}
                <p className="mt-3 font-hand text-sm leading-relaxed text-muted-foreground">
                  {type.description}
                </p>

                {/* Feature tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {type.features.map((f) => (
                    <span
                      key={f}
                      className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 font-hand text-[11px] text-muted-foreground"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-6 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r ${type.color} px-5 py-2.5 font-hand text-sm font-bold text-primary-foreground shadow-md transition-transform group-hover:scale-[1.03]`}
                  >
                    Start Creating
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>
            </GlowCard>
          );
        })}
      </div>

      {/* Footer text */}
      <p className="relative z-10 mt-10 font-hand text-xs text-muted-foreground/60 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
        Built for young writers, powered by AI
      </p>
    </div>
  );
}
