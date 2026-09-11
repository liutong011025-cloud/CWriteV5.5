import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isMissingDatabaseTableError } from "@/lib/prisma-errors"
import { lookupProcessEvent } from "@/lib/process-coding"

export const dynamic = "force-dynamic"

const ok = () => NextResponse.json({ ok: true })

function parseClientTs(value: unknown): Date {
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value)
  if (typeof value === "string") {
    const n = Number(value)
    if (Number.isFinite(n)) return new Date(n)
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d
  }
  return new Date()
}

export async function POST(request: NextRequest) {
  try {
    if (process.env.PROCESS_LOGGING_ENABLED === "false") return ok()

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") return ok()

    const username = typeof body.user_id === "string" ? body.user_id.trim() : ""
    const sessionId = typeof body.session_id === "string" && body.session_id.trim()
      ? body.session_id.trim().slice(0, 80)
      : "unknown"
    const events = Array.isArray(body.events) ? body.events.slice(0, 100) : []
    if (!username || events.length === 0) return ok()

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    }).catch(() => null)
    if (!user) return ok()

    const rows = []
    for (const raw of events) {
      try {
        const eventId = raw && typeof raw === "object" ? (raw as { eventId?: unknown }).eventId : null
        const def = lookupProcessEvent(eventId)
        if (!def) continue
        const ev = raw as {
          clientTs?: unknown
          durationMs?: unknown
          stage?: unknown
          phase?: unknown
          payload?: unknown
        }
        rows.push({
          userId: user.id,
          sessionId,
          workType: def.workType,
          eventId: def.eventId,
          functionalCode: def.functionalCode,
          category: def.category,
          stage: typeof ev.stage === "string" ? ev.stage.slice(0, 80) : null,
          phase: typeof ev.phase === "string" ? ev.phase.slice(0, 80) : null,
          rawType: def.rawType ?? null,
          trigger: def.trigger ?? null,
          payload: ev.payload && typeof ev.payload === "object" ? ev.payload : {},
          durationMs: typeof ev.durationMs === "number" && Number.isFinite(ev.durationMs)
            ? Math.round(ev.durationMs)
            : null,
          clientTs: parseClientTs(ev.clientTs),
        })
      } catch {
        // skip bad event
      }
    }

    if (rows.length > 0) {
      await prisma.processEvent.createMany({ data: rows }).catch((error) => {
        if (!isMissingDatabaseTableError(error)) {
          console.warn("process-events insert skipped:", error)
        }
      })
    }

    return ok()
  } catch {
    return ok()
  }
}
