# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CWriteV5.5 is an AI-powered children's creative writing platform (MuseAIWriteV2) built with Next.js. It supports multiple writing modes: **Story**, **Book Review**, **Letter**, **Drama**, and **Poetry**. Each mode has AI-assisted and no-AI variants for different user needs.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + @tailwindcss/postcss
- **UI Components**: Radix UI + shadcn-style components in `components/ui/`
- **State**: Zustand (`lib/*-store.ts`)
- **Database**: PostgreSQL via Prisma ORM (`lib/prisma.ts`)
- **AI**: DeepSeek (`lib/deepseek.ts`) as primary; Dify AI used by some legacy routes

## Common Commands

```bash
# Development
npm run dev          # Start dev server at localhost:3000
npm run build        # Build for production (runs prisma generate first)
npm run lint         # ESLint check
npm run start        # Start production server (runs baseline-and-migrate.js first)

# Database (PostgreSQL)
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to DB
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:init      # Initialize DB with seed data
npm run db:run-sql   # Run raw SQL migration scripts

# Vercel deployment
vercel               # Deploy to Vercel
vercel env pull      # Pull Vercel env vars locally
```

## Architecture

### Routing & Pages
- `app/page.tsx` - **Monolithic orchestrator**: single ~2500-line client component where `stage` useState drives the entire UI. All 40+ stages are rendered conditionally inside this one component.
- `app/write/page.tsx` - Redirect stub to `/`, dispatches a `navigateToWriteTypeSelection` custom event for cross-tab navigation.
- `app/api/*/route.ts` - API routes (AI, auth, user data, media generation)
- `app/copywriting-review/page.tsx` - Separate copywriting review flow
- `app/gallery/page.tsx` - User gallery view
- `app/api/story-collab/route.ts` - Story collaboration/peer review

### Writing Modes
Each mode in `components/stages/` follows a stage pipeline. `*-no-ai.tsx` variants are standalone alternatives.

| Mode | Stage Components | API Routes |
|------|-----------------|------------|
| Story | character-creation, plot-brainstorm, story-structure, guided-writing, story-review, story-edit, story-chatbot, story-collab | dify-chat, dify-writing-evaluation, story-collab |
| Book Review | book-review-welcome, book-review-type-selection, book-selection, book-review-loading, book-review-writing, book-review-edit, book-review-complete | dify-book-selection, dify-book-summary, dify-book-writing-aid |
| Letter | letter-game, letter-adventure, letter-puzzle, letter-edit, letter-complete | dify-letter-setup, dify-letter-guide, dify-letter-grammar-review, send-letter-email |
| Drama | drama-welcome, drama-writing, drama-book, drama-complete | dify-drama-summary, generate-drama |
| Poetry | poetry-writing, poetry-form, poetry-topic, poetry-editor, poetry-review | dify (unified endpoint) |

### AI Integration
- **Primary**: `lib/deepseek.ts` exports `chat()` (non-streaming) and `streamChat()` (streaming). Used by `app/api/dify/route.ts`.
- **Central route**: `app/api/dify/route.ts` is a `switch(action)` router that handles Poetry/Drama/Book Review type routing via DeepSeek.
- **Feature routes**: `app/api/dify-*/route.ts` (one file per feature) call the central route or DeepSeek directly.
- **Level suffix**: `lib/level-details.ts` exports `getLevelPromptSuffix()` — prepends grade-appropriate system prompts to AI calls (1–5 scale).
- **Image generation**: image routes use Volcano Ark / Doubao Seedream via `lib/ark-images.ts`.

### State Management
- `lib/interactions-store.ts` - User interactions tracking
- `lib/drama-store.ts` / `lib/poetry-store.ts` - Feature-specific state
- `lib/prisma.ts` - Prisma client singleton

### Data Model (Prisma)
```
User → Interaction → { Story | Review | Letter | Drama | Poetry }
User → UserProfile (avatar, trees/gamification, lastMetrics)
User ↔ User (WorkReview peer reviews)
```
Trees stored as JSON in `UserProfile.trees` (max 12, each { id, stage: 1-6 }).
`lastMetrics` tracks vocabRichness, descriptiveAccuracy, logicalCoherence for gamification.

## Key Patterns

1. **Component variants**: `*-no-ai.tsx` files are standalone alternatives, not conditionally rendered
2. **API responses**: Routes return `{ result }` or parsed structured data
3. **Level system**: `lib/level-details.ts` provides grade-appropriate prompts (1-5 scale)
4. **Image generation**: image routes share Volcano Ark helpers in `lib/ark-images.ts`
5. **Cagent mascot**: The pet in `components/cagent/` has a `CagentMood` driven by `setCagentMood` in `page.tsx`. Moods: "normal", "happy", "sleep", "like", "sit", "hang". A `RedFlashOverlay` fires on negative value feedback events.
6. **Cross-tab navigation**: `app/write/page.tsx` uses a custom `navigateToWriteTypeSelection` event on `window`; `app/page.tsx` listens for it.

## Environment Variables

```bash
# Primary AI
DEEPSEEK_API_KEY=sk-...              # DeepSeek API key (primary)

# Database
DATABASE_URL=postgresql://...         # PostgreSQL connection

# Legacy / optional
DIFY_API_KEY=app-...                  # Dify platform (still used by some routes)
# Resend for email, Vercel for deployment (optional)
```

## Decision Library (Supermemory)

> **Note**: Requires Supermemory MCP server configured in `.claude/settings.json`. If not configured, skip this section.

When Supermemory is available, query it via `mcp__mcp-supermemory-ai__recall` with `containerTag: "cwritev5-decisions"` before reading code for architecture, AI integration, or "why" questions.

**Key trigger conditions:**
- Any "why does X work this way?" → recall the relevant topic
- Changes to `app/page.tsx` → recall "ARCH-001 monolithic orchestrator"
- Changes to AI routes or `lib/deepseek.ts` → recall "AI integration DeepSeek Dify migration"
- Changes to `prisma/schema.prisma` → recall "database schema interaction log"
- Technical debt questions → recall "technical debt known issues"

**Decision ID map:** ARCH-*, UX-* (architecture/flow) · AI-* (AI integration) · EDU-* (educational framework) · MEDIA-* (media generation) · DATA-* (database) · AUTH-* (auth) · BUILD-* (build/deploy) · GAME-* (gamification) · DEBT-* (tech debt)
