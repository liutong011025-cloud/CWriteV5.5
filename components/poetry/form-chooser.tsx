"use client";

import { usePoetryStore } from "@/lib/poetry-store";
import { POETRY_FORMS, type PoetryForm } from "@/lib/poetry-types";
import { BookOpen, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlowCard } from "@/components/ui/glow-card";
import Link from "next/link";

const CARD_STYLES: Record<PoetryForm, { border: string; iconBg: string; accent: string }> = {
  couplets: { border: "border-primary/20 hover:border-primary/50", iconBg: "bg-primary/10", accent: "text-primary" },
  haiku: { border: "border-accent/20 hover:border-accent/50", iconBg: "bg-accent/10", accent: "text-accent" },
  freeverse: { border: "border-secondary/30 hover:border-secondary/60", iconBg: "bg-secondary/15", accent: "text-secondary-foreground" },
};

interface FormChooserProps {
  onBack?: () => void;
  backLabel?: string;
}

export function FormChooser({ onBack, backLabel }: FormChooserProps) {
  const setForm = usePoetryStore((s) => s.setForm);
  const setPhase = usePoetryStore((s) => s.setPhase);

  const handleChoose = (form: PoetryForm) => {
    setForm(form);
    setPhase("setup-topic");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 pattern-dots opacity-40" />
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/6 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-accent/6 blur-3xl" />

      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
        {onBack ? (
          <Button
            onClick={onBack}
            variant="ghost"
            className="transition-transform duration-200 hover:scale-110 bg-transparent p-0 h-auto w-auto"
            title="Back"
          >
            <img src="/back.png" alt="Back" className="h-24 w-24 object-contain lg:h-28 lg:w-28" />
          </Button>
        ) : (
          <Button variant="ghost" className="transition-transform duration-200 hover:scale-110 bg-transparent p-0 h-auto w-auto" asChild>
            <Link href="/">
              <img src="/back.png" alt="Back" className="h-24 w-24 object-contain lg:h-28 lg:w-28" />
            </Link>
          </Button>
        )}
      </div>
      <div className="relative z-10 mb-6 w-full max-w-4xl pl-28 lg:pl-32">

      <div className="relative z-10 mb-10 text-center animate-fade-in-up">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/60 px-4 py-1.5 shadow-sm backdrop-blur-sm">
          <BookOpen className="h-3.5 w-3.5 text-accent" />
          <span className="font-hand text-xs tracking-wide text-muted-foreground">Poetry Studio</span>
        </div>
        <h1 className="font-hand text-3xl font-bold text-foreground sm:text-4xl text-balance">
          Choose Your Poetry Form
        </h1>
        <p className="mx-auto mt-2 max-w-md font-hand text-sm text-muted-foreground leading-relaxed">
          Each form has its own magic. Pick one and start writing!
        </p>
      </div>

      <div className="relative z-10 grid w-full max-w-4xl gap-6 sm:grid-cols-3">
        {(Object.entries(POETRY_FORMS) as [PoetryForm, (typeof POETRY_FORMS)[PoetryForm]][]).map(
          ([key, form], i) => {
            const style = CARD_STYLES[key];
            return (
              <GlowCard
                key={key}
                className="rounded-3xl animate-fade-in-up transition-all duration-300 hover:-translate-y-1"
                innerClassName="bg-card/80 backdrop-blur-sm rounded-3xl p-6"
                borderSize={0.018}
                circleSize={0.22}
                circleEdge={0.45}
              >
                <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-2xl ${style.iconBg} shadow-sm`}>
                  <BookOpen className={`h-5 w-5 ${style.accent}`} />
                </div>

                <h3 className="font-hand text-xl font-bold text-foreground">{form.name}</h3>
                <p className="mt-1 font-hand text-xs leading-relaxed text-muted-foreground">{form.rules}</p>

                <div className="mt-3 flex-1 rounded-2xl border border-border/50 bg-muted/30 p-3">
                  <p className="mb-1.5 font-hand text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Example {form.example.title ? `-- ${form.example.title}` : ""}
                  </p>
                  {form.example.lines.map((line, li) => (
                    <p key={li} className="font-hand text-xs italic leading-relaxed text-foreground/80">
                      {line}
                    </p>
                  ))}
                  {form.example.author && (
                    <p className="mt-1 font-hand text-[10px] text-muted-foreground">-- {form.example.author}</p>
                  )}
                </div>

                <Button
                  onClick={() => handleChoose(key)}
                  className="mt-4 w-full gap-1.5 rounded-2xl font-hand text-sm shadow-md"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Choose
                </Button>
              </GlowCard>
            );
          },
        )}
      </div>

      <Star className="pointer-events-none absolute top-20 right-[18%] h-4 w-4 text-secondary/20 animate-float" />
      <Star className="pointer-events-none absolute bottom-28 left-[12%] h-3 w-3 text-primary/15 animate-float-delayed" />
    </div>
  );
}
