"use client"

import { getStoredUser } from "@/lib/client-auth"
import {
  derivedPrePauseEventId,
  pauseEventIdFor,
  resolveInputEventId,
} from "@/lib/process-coding"

const SESSION_KEY = "cwriteProcessSession"
const QUEUE_MAX = 200
const FLUSH_SIZE = 20
const FLUSH_MS = 2000
const INPUT_DEBOUNCE_MS = 800
const SNAPSHOT_MAX = 8000

type QueuedEvent = {
  eventId: string
  clientTs: number
  durationMs?: number
  stage?: string
  phase?: string
  payload?: Record<string, unknown>
}

let queue: QueuedEvent[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
let flushing = false
let lastActivityAt = Date.now()
let lastEventId: string | null = null
let listenersBound = false
const inputTimers = new Map<string, ReturnType<typeof setTimeout>>()
const lastInputText = new Map<string, string>()

function swallow(_error?: unknown) {
  // Research logging must never surface to the writing UI.
}

function loggingAllowed(): boolean {
  try {
    if (typeof window === "undefined") return false
    if (window.localStorage.getItem("cwriteProcessLogging") === "off") return false
    const user = getStoredUser()
    if (!user?.username) return false
    if (user.role === "teacher") return false
    return true
  } catch {
    return false
  }
}

export function getProcessSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)
    if (existing) return existing
    const id = `ps_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem(SESSION_KEY, id)
    return id
  } catch {
    return `ps_tmp_${Date.now().toString(36)}`
  }
}

export function startProcessSession(): string {
  try {
    const id = `ps_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem(SESSION_KEY, id)
    lastActivityAt = Date.now()
    lastEventId = null
    return id
  } catch {
    return getProcessSessionId()
  }
}

function ensureListeners() {
  if (listenersBound || typeof window === "undefined") return
  listenersBound = true
  try {
    window.addEventListener("visibilitychange", () => {
      try {
        if (document.visibilityState === "hidden") void flushProcessEvents()
      } catch {
        swallow()
      }
    })
    window.addEventListener("pagehide", () => {
      void flushProcessEvents()
    })
  } catch {
    swallow()
  }
}

function enqueue(event: QueuedEvent) {
  try {
    ensureListeners()
    if (queue.length >= QUEUE_MAX) queue.shift()
    queue.push(event)
    if (queue.length >= FLUSH_SIZE) {
      void flushProcessEvents()
      return
    }
    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null
        void flushProcessEvents()
      }, FLUSH_MS)
    }
  } catch {
    swallow()
  }
}

async function flushProcessEvents() {
  if (flushing) return
  if (queue.length === 0) return
  flushing = true
  const batch = queue.splice(0, queue.length)
  try {
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
    const user = getStoredUser()
    if (!user?.username) return
    await fetch("/api/process-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.username,
        session_id: getProcessSessionId(),
        events: batch,
      }),
      keepalive: true,
    }).catch(swallow)
  } catch {
    swallow()
  } finally {
    flushing = false
  }
}

function emitPauseIfNeeded(followingEventId: string, payload?: Record<string, unknown>, meta?: { stage?: string; phase?: string }) {
  try {
    const now = Date.now()
    const gap = now - lastActivityAt
    const pauseId = pauseEventIdFor(followingEventId, gap)
    if (!pauseId) return
    enqueue({
      eventId: pauseId,
      clientTs: lastActivityAt + 1,
      durationMs: gap,
      stage: meta?.stage,
      phase: meta?.phase,
      payload: {
        pause_ms: gap,
        preceding_event: lastEventId,
        following_event: followingEventId,
        ...(payload ?? {}),
      },
    })
    const derived = derivedPrePauseEventId(followingEventId)
    if (derived) {
      enqueue({
        eventId: derived,
        clientTs: lastActivityAt + 2,
        durationMs: gap,
        stage: meta?.stage,
        phase: meta?.phase,
        payload: {
          pause_ms: gap,
          preceding_event: lastEventId,
          following_event: followingEventId,
          ...(payload ?? {}),
        },
      })
    }
  } catch {
    swallow()
  }
}

export function trackProcess(
  eventId: string,
  payload?: Record<string, unknown>,
  meta?: { stage?: string; phase?: string; durationMs?: number },
): void {
  try {
    if (!eventId || !loggingAllowed()) return
    emitPauseIfNeeded(eventId, payload, meta)
    const now = Date.now()
    enqueue({
      eventId,
      clientTs: now,
      durationMs: meta?.durationMs,
      stage: meta?.stage,
      phase: meta?.phase,
      payload,
    })
    lastActivityAt = now
    lastEventId = eventId
  } catch {
    swallow()
  }
}

export function trackProcessInput(
  draftEventId: string,
  text: string,
  extra?: Record<string, unknown>,
  meta?: { stage?: string; phase?: string },
): void {
  try {
    if (!draftEventId || !loggingAllowed()) return
    const key = `${draftEventId}:${String(extra?.section_index ?? extra?.line_index ?? extra?.field ?? "")}`
    const prevTimer = inputTimers.get(key)
    if (prevTimer) clearTimeout(prevTimer)
    const snapshot = typeof text === "string" ? text : String(text ?? "")
    const timer = setTimeout(() => {
      try {
        const prev = lastInputText.get(key) ?? ""
        const delta = snapshot.length - prev.length
        const eventId = resolveInputEventId(draftEventId, delta, prev.length > 0)
        trackProcess(
          eventId,
          {
            text_snapshot: snapshot.slice(0, SNAPSHOT_MAX),
            delta_chars: delta,
            ...(extra ?? {}),
          },
          meta,
        )
        lastInputText.set(key, snapshot)
      } catch {
        swallow()
      }
    }, INPUT_DEBOUNCE_MS)
    inputTimers.set(key, timer)
  } catch {
    swallow()
  }
}
