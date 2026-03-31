"use client";

import { usePoetryStore } from "@/lib/poetry-store";
import { POETRY_FORMS, type PoetryForm } from "@/lib/poetry-types";
import { BookOpen, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { GlowCard } from "@/components/ui/glow-card";

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
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-transparent px-4 py-8">
      {/* keep subtle dots but let pixel sky/grass show through */}
      <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)", backgroundSize: "12px 12px" }} />

      <BackButton onClick={onBack} href={onBack ? undefined : "/"} variant="purple" />
      <div className="relative z-10 mb-6 w-full max-w-4xl pl-16 lg:pl-20">

      <div className="relative z-10 mb-10 text-center animate-fade-in-up">
        <div className="mb-3 inline-flex items-center gap-2 px-4 py-1.5 shadow-sm pixel-card" style={{ background: "#f5e6c8" }}>
          <BookOpen className="h-3.5 w-3.5" style={{ color: "#3a8aa3" }} />
          <span className="font-hand text-xs tracking-wide pixel-text" style={{ color: "#6b5210" }}>Poetry Studio</span>
        </div>
        <h1 className="font-hand text-3xl font-bold sm:text-4xl text-balance pixel-title" style={{ color: "#6b5210", textShadow: "2px 2px 0 rgba(0,0,0,0.15)" }}>
          Choose Your Poetry Form
        </h1>
        <p className="mx-auto mt-2 max-w-md font-hand text-sm leading-relaxed pixel-text" style={{ color: "#5a4a2a" }}>
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
                  className="mt-4 w-full gap-1.5 font-hand text-sm shadow-md pixel-btn pixel-btn-green"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Choose
                </Button>
              </GlowCard>
            );
          },
        )}
      </div>
      </div>

      <Star className="pointer-events-none absolute top-20 right-[18%] h-4 w-4 text-secondary/20 animate-float" />
      <Star className="pointer-events-none absolute bottom-28 left-[12%] h-3 w-3 text-primary/15 animate-float-delayed" />
    </div>
  );
}
