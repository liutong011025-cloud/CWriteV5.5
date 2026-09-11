import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { ensureProcessEventsTable, ensureTeacherResearchSettingsTable } from "@/lib/ensure-research-tables"
import { isMissingDatabaseTableError } from "@/lib/prisma-errors"
import { PROCESS_CODING_LEGEND } from "@/lib/process-coding"
import { resolveTeacher, UNASSIGNED_CLASS_ID } from "@/lib/teacher-classes"

export const dynamic = "force-dynamic"

async function readExportEnabled(teacherId: string): Promise<boolean> {
  try {
    await ensureTeacherResearchSettingsTable()
  } catch (error) {
    console.warn("teacher_research_settings ensure skipped:", error)
  }
  try {
    const row = await prisma.teacherResearchSetting.findUnique({
      where: { teacherId },
      select: { exportEnabled: true },
    })
    return !!row?.exportEnabled
  } catch (error) {
    if (!isMissingDatabaseTableError(error)) {
      console.warn("teacher research setting read skipped:", error)
    }
    try {
      const rows = await prisma.$queryRaw<Array<{ exportEnabled: boolean }>>`
        SELECT "exportEnabled" FROM "teacher_research_settings" WHERE "teacherId" = ${teacherId} LIMIT 1
      `
      return !!rows[0]?.exportEnabled
    } catch (rawError) {
      if (!isMissingDatabaseTableError(rawError)) {
        console.warn("teacher research setting raw read skipped:", rawError)
      }
      return false
    }
  }
}

function csvEscape(value: unknown): string {
  const text = value == null ? "" : String(value)
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function toCsv(rows: Array<Record<string, unknown>>, columns: string[]): string {
  const header = columns.join(",")
  const lines = rows.map((row) => columns.map((col) => csvEscape(row[col])).join(","))
  return [header, ...lines].join("\n")
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const teacherUsername = url.searchParams.get("teacher")?.trim() ?? ""
    const classId = url.searchParams.get("classId")?.trim() ?? ""
    const format = url.searchParams.get("format")?.trim() || "json"
    const settingsOnly = url.searchParams.get("settings") === "1"

    const teacher = teacherUsername ? await resolveTeacher(teacherUsername) : null
    if (!teacher) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const exportEnabled = await readExportEnabled(teacher.id)
    if (settingsOnly) {
      return NextResponse.json({ exportEnabled })
    }

    if (!exportEnabled) {
      return NextResponse.json({ error: "Export is turned off" }, { status: 403 })
    }

    let studentIds: string[] = []
    let className = "all"

    if (classId && classId !== UNASSIGNED_CLASS_ID) {
      const cls = await prisma.teacherClass.findFirst({
        where: { id: classId, teacherId: teacher.id },
        include: { members: { select: { studentId: true } } },
      })
      if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 })
      studentIds = cls.members.map((m) => m.studentId)
      className = cls.name
    } else {
      const classes = await prisma.teacherClass.findMany({
        where: { teacherId: teacher.id },
        include: { members: { select: { studentId: true } } },
      })
      const assigned = new Set(classes.flatMap((c) => c.members.map((m) => m.studentId)))
      if (classId === UNASSIGNED_CLASS_ID) {
        const students = await prisma.user.findMany({
          where: { role: "student", id: { notIn: Array.from(assigned) } },
          select: { id: true },
        })
        studentIds = students.map((s) => s.id)
        className = "unassigned"
      } else {
        studentIds = Array.from(assigned)
        className = "all-classes"
      }
    }

    if (studentIds.length === 0) {
      const empty = { className, students: [], events: [], sequences: [], writings: [], legend: PROCESS_CODING_LEGEND }
      if (format === "csv") {
        return new NextResponse("username,sessionId,clientTs,eventId,category,functionalCode,stage,phase,durationMs,payload\n", {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="process-events-${className}.csv"`,
          },
        })
      }
      return NextResponse.json(empty)
    }

    const users = await prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: {
        id: true,
        username: true,
        stories: { select: { id: true, content: true, updatedAt: true } },
        reviews: { select: { id: true, content: true, bookTitle: true, updatedAt: true } },
        letters: { select: { id: true, content: true, recipient: true, occasion: true, updatedAt: true } },
        dramas: { select: { id: true, content: true, title: true, updatedAt: true } },
        poetries: { select: { id: true, content: true, form: true, topic: true, updatedAt: true } },
      },
    })

    let events: Array<{
      userId: string
      sessionId: string
      workType: string
      eventId: string
      functionalCode: string
      category: string
      stage: string | null
      phase: string | null
      durationMs: number | null
      payload: unknown
      clientTs: Date
    }> = []
    try {
      await ensureProcessEventsTable()
    } catch (error) {
      console.warn("process_events ensure skipped:", error)
    }
    try {
      events = await prisma.processEvent.findMany({
        where: { userId: { in: studentIds } },
        orderBy: { clientTs: "asc" },
      })
    } catch (error) {
      if (!isMissingDatabaseTableError(error)) {
        console.warn("process-export events skipped:", error)
      }
    }

    const usernameById = new Map(users.map((u) => [u.id, u.username]))
    const eventRows = events.map((ev) => ({
      username: usernameById.get(ev.userId) ?? ev.userId,
      sessionId: ev.sessionId,
      clientTs: ev.clientTs.toISOString(),
      workType: ev.workType,
      eventId: ev.eventId,
      functionalCode: ev.functionalCode,
      category: ev.category,
      stage: ev.stage,
      phase: ev.phase,
      durationMs: ev.durationMs,
      payload: ev.payload,
    }))

    const sequences = Object.values(
      eventRows.reduce<Record<string, {
        username: string
        sessionId: string
        eventIds: string[]
        categories: string[]
        startedAt: string
        endedAt: string
      }>>((acc, row) => {
        const key = `${row.username}::${row.sessionId}`
        if (!acc[key]) {
          acc[key] = {
            username: row.username,
            sessionId: row.sessionId,
            eventIds: [],
            categories: [],
            startedAt: row.clientTs,
            endedAt: row.clientTs,
          }
        }
        acc[key].eventIds.push(row.eventId)
        acc[key].categories.push(row.category)
        acc[key].endedAt = row.clientTs
        return acc
      }, {}),
    )

    const writings = users.map((u) => ({
      username: u.username,
      stories: u.stories,
      reviews: u.reviews,
      letters: u.letters,
      dramas: u.dramas,
      poetries: u.poetries,
    }))

    if (format === "csv") {
      const csv = toCsv(
        eventRows.map((row) => ({
          ...row,
          payload: JSON.stringify(row.payload ?? {}),
        })),
        ["username", "sessionId", "clientTs", "workType", "eventId", "category", "functionalCode", "stage", "phase", "durationMs", "payload"],
      )
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="process-events-${className}.csv"`,
        },
      })
    }

    return NextResponse.json({
      className,
      exportedAt: new Date().toISOString(),
      legend: PROCESS_CODING_LEGEND,
      events: eventRows,
      sequences,
      writings,
    })
  } catch (error) {
    console.warn("process-export failed:", error)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) as {
      teacherUsername?: string
      enabled?: boolean
    } | null
    const teacherUsername = body?.teacherUsername?.trim() ?? ""
    const teacher = teacherUsername ? await resolveTeacher(teacherUsername) : null
    if (!teacher) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const enabled = !!body?.enabled
    try {
      await ensureTeacherResearchSettingsTable()
    } catch (error) {
      console.warn("teacher_research_settings ensure skipped:", error)
    }

    try {
      const row = await prisma.teacherResearchSetting.upsert({
        where: { teacherId: teacher.id },
        update: { exportEnabled: enabled },
        create: { teacherId: teacher.id, exportEnabled: enabled },
      })
      return NextResponse.json({ exportEnabled: row.exportEnabled })
    } catch (error) {
      try {
        const id = `trs_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
        await prisma.$executeRaw`
          INSERT INTO "teacher_research_settings" ("id", "teacherId", "exportEnabled", "updatedAt")
          VALUES (${id}, ${teacher.id}, ${enabled}, NOW())
          ON CONFLICT ("teacherId") DO UPDATE SET
            "exportEnabled" = EXCLUDED."exportEnabled",
            "updatedAt" = NOW()
        `
        return NextResponse.json({ exportEnabled: enabled })
      } catch (rawError) {
        console.warn("process-export toggle failed:", error, rawError)
        return NextResponse.json(
          { exportEnabled: false, skipped: true, error: "Could not save export switch" },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.warn("process-export toggle failed:", error)
    return NextResponse.json(
      { exportEnabled: false, skipped: true, error: "Could not save export switch" },
      { status: 500 },
    )
  }
}
