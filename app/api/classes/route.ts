import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isDatabaseConnectionError } from "@/lib/prisma-errors"
import { resolveTeacher } from "@/lib/teacher-classes"

export async function GET(request: NextRequest) {
  try {
    const teacherUsername = new URL(request.url).searchParams.get("teacher")?.trim()
    if (!teacherUsername) {
      return NextResponse.json({ error: "teacher query param is required" }, { status: 400 })
    }

    const teacher = await resolveTeacher(teacherUsername)
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const classes = await prisma.teacherClass.findMany({
      where: { teacherId: teacher.id },
      orderBy: { name: "asc" },
      include: {
        members: {
          include: {
            student: { select: { id: true, username: true } },
          },
        },
      },
    })

    return NextResponse.json({
      classes: classes.map((cls) => ({
        id: cls.id,
        name: cls.name,
        memberCount: cls.members.length,
        members: cls.members.map((m) => ({
          id: m.student.id,
          username: m.student.username,
        })),
      })),
    })
  } catch (error) {
    console.error("[teacher classes] GET failed:", error)
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({ error: "Database unavailable", classes: [] }, { status: 503 })
    }
    return NextResponse.json({ error: "Failed to load classes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { teacherUsername?: string; name?: string }
    const teacherUsername = body.teacherUsername?.trim()
    const name = body.name?.trim()

    if (!teacherUsername || !name) {
      return NextResponse.json({ error: "teacherUsername and name are required" }, { status: 400 })
    }
    if (name.length > 64) {
      return NextResponse.json({ error: "Class name is too long (max 64 characters)" }, { status: 400 })
    }

    const teacher = await resolveTeacher(teacherUsername)
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const existing = await prisma.teacherClass.findUnique({
      where: { teacherId_name: { teacherId: teacher.id, name } },
    })
    if (existing) {
      return NextResponse.json({ error: "A class with this name already exists" }, { status: 409 })
    }

    const created = await prisma.teacherClass.create({
      data: { teacherId: teacher.id, name },
    })

    return NextResponse.json({ class: { id: created.id, name: created.name, memberCount: 0, members: [] } }, { status: 201 })
  } catch (error) {
    console.error("[teacher classes] POST failed:", error)
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 })
  }
}
