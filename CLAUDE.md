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
- **Database**: PostgreSQL via Prisma ORM
- **AI**: Dify AI platform (multiple bots per feature)

## Common Commands

```bash
# Development
npm run dev          # Start dev server at localhost:3000
npm run build        # Build for production (runs prisma generate first)
npm run lint         # ESLint check
npm run start        # Start production server

# Database (PostgreSQL)
npm run db:generate   # Generate Prisma client
npm run db:push      # Push schema changes to DB
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
npm run db:init      # Initialize DB with seed data

# Vercel deployment
vercel               # Deploy to Vercel
vercel env pull     # Pull Vercel env vars locally
```

## Architecture

### Routing & Pages
- `app/page.tsx` - Main entry (home page)
- `app/api/*/route.ts` - API routes (Dify integration, auth, user data)
- `app/copywriting-review/page.tsx` - Separate copywriting review flow

### Writing Modes
Each mode in `components/stages/` follows the pattern:
- `{mode}-welcome.tsx` → `{mode}-type-selection.tsx` → `{mode}-writing.tsx` → `{mode}-complete.tsx`
- `*-no-ai.tsx` variants skip AI assistance

| Mode | Stage Components | API Routes |
|------|-----------------|------------|
| Story | character-creation, plot-brainstorm, story-structure, guided-writing, story-review | dify-chat, dify-writing-evaluation |
| Book Review | book-review-welcome, book-review-type-selection, book-review-loading, book-review-writing, book-review-edit, book-review-complete | dify-book-selection, dify-book-summary, dify-book-writing-aid |
| Letter | letter-game, letter-adventure, letter-edit, letter-complete | dify-letter-setup, dify-letter-guide, dify-letter-grammar-review |
| Drama | drama-welcome, drama-writing, drama-complete | dify-drama-summary, generate-drama |
| Poetry | topic-setup, form-chooser, poetry-editor, poetry-review | dify (unified endpoint) |

### AI Integration
- **Dify bots** are configured in `DIFY_APPS_CONFIG.md` - each writing feature uses specific App IDs
- Central API: `app/api/dify/route.ts` handles poetry/drama actions via `switch(action)`
- Other bots: `app/api/dify-*/route.ts` (one file per bot)
- All routes use `process.env.DIFY_API_KEY` for Authorization header

### State Management
- `lib/interactions-store.ts` - User interactions tracking
- `lib/drama-store.ts` / `lib/poetry-store.ts` - Feature-specific state
- `drama&Poetry/lib/*-store.ts` - Secondary stores

### Data Model (Prisma)
```
User → Interaction → { Story | Review | Letter | Drama | Poetry }
User → UserProfile (avatar, trees/gamification, metrics)
User ↔ User (WorkReview peer reviews)
```

## Key Patterns

1. **Component variants**: `*-no-ai.tsx` files are standalone alternatives, not conditionally rendered
2. **API responses**: Dify routes return `{ result }` or parsed structured data
3. **Level system**: `lib/level-details.ts` provides grade-appropriate prompts (1-5 scale)
4. **Image generation**: `app/api/generate-image/route.ts` uses Fal.ai client

## Decision Library (Supermemory)

IMPORTANT: You MUST query the decision library via Supermemory MCP BEFORE reading code or answering questions about architecture, AI integration, or "why" questions. Use the `mcp__mcp-supermemory-ai__recall` tool with `containerTag: "cwritev5-decisions"`.

**Trigger conditions — recall FIRST, then read code:**
- Any "why does X work this way?" question → recall the relevant topic
- Any request to add/modify a writing mode → recall "stage pipeline writing mode architecture"
- Any change to `app/page.tsx` → recall "ARCH-001 monolithic orchestrator"
- Any change to `app/api/dify*` or `lib/deepseek.ts` → recall "AI integration DeepSeek Dify migration"
- Any change to `prisma/schema.prisma` → recall "database schema interaction log"
- Any change to auth → recall "authentication session"
- Any mention of technical debt or "why is this messy" → recall "technical debt known issues"

**Decision IDs for reference:**
| Area | IDs |
|------|-----|
| Architecture & stage flow | ARCH-001, UX-001, UX-002, UX-003 |
| AI integration | AI-001, AI-002, AI-003 |
| Educational framework | EDU-001, EDU-002, EDU-003 |
| Media generation | MEDIA-001, MEDIA-002 |
| Database | DATA-001, DATA-002 |
| Auth | AUTH-001 |
| Build & deploy | BUILD-001 |
| Gamification | GAME-001 |
| Tech debt | DEBT-001 |

## Environment Variables

```bash
DATABASE_URL=postgresql://...   # PostgreSQL connection
DIFY_API_KEY=app-...           # Dify platform API key
# Optional: Resend for email, Vercel for deployment
```
