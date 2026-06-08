import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isVirtualClassId, resolveTeacher } from "@/lib/teacher-classes"

type RouteParams = { params: Promise<{ classId: string }> }

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { classId } = await params
    if (isVirtualClassId(classId)) {
      return NextResponse.json({ error: "Select a real class to add students" }, { status: 400 })
    }

    const body = (await request.json()) as {
      teacherUsername?: string
      studentUsernames?: string[]
    }
    const teacherUsername = body.teacherUsername?.trim()
    const studentUsernames = Array.isArray(body.studentUsernames)
      ? body.studentUsernames.map((u) => u.trim()).filter(Boolean)
      : []

    if (!teacherUsername) {
      return NextResponse.json({ error: "teacherUsername is required" }, { status: 400 })
    }
    if (studentUsernames.length === 0) {
      return NextResponse.json({ error: "studentUsernames is required" }, { status: 400 })
    }

    const teacher = await resolveTeacher(teacherUsername)
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const cls = await prisma.teacherClass.findFirst({
      where: { id: classId, teacherId: teacher.id },
    })
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    const students = await prisma.user.findMany({
      where: { username: { in: studentUsernames }, role: "student" },
      select: { id: true, username: true },
    })

    if (students.length === 0) {
      return NextResponse.json({ error: "No valid student accounts found" }, { status: 400 })
    }

    const studentIds = students.map((s) => s.id)

    // Remove these students from any other class owned by this teacher first
    await prisma.classMember.deleteMany({
      where: {
        studentId: { in: studentIds },
        class: { teacherId: teacher.id },
      },
    })

    await prisma.classMember.createMany({
      data: studentIds.map((studentId) => ({ classId, studentId })),
      skipDuplicates: true,
    })

    // Keep profile.grade in sync for legacy views
    await Promise.all(
      students.map((s) =>
        prisma.userProfile.upsert({
          where: { userId: s.id },
          create: { userId: s.id, grade: cls.name },
          update: { grade: cls.name },
        }),
      ),
    )

    return NextResponse.json({
      added: students.map((s) => s.username),
      memberCount: await prisma.classMember.count({ where: { classId } }),
    })
  } catch (error) {
    console.error("[teacher classes members] POST failed:", error)
    return NextResponse.json({ error: "Failed to add students" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { classId } = await params
    if (isVirtualClassId(classId)) {
      return NextResponse.json({ error: "Cannot remove from Unassigned directly" }, { status: 400 })
    }

    const body = (await request.json()) as {
      teacherUsername?: string
      studentUsername?: string
    }
    const teacherUsername = body.teacherUsername?.trim()
    const studentUsername = body.studentUsername?.trim()

    if (!teacherUsername || !studentUsername) {
      return NextResponse.json({ error: "teacherUsername and studentUsername are required" }, { status: 400 })
    }

    const teacher = await resolveTeacher(teacherUsername)
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const cls = await prisma.teacherClass.findFirst({
      where: { id: classId, teacherId: teacher.id },
    })
    if (!cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    const student = await prisma.user.findUnique({ where: { username: studentUsername } })
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    await prisma.classMember.deleteMany({
      where: { classId, studentId: student.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[teacher classes members] DELETE failed:", error)
    return NextResponse.json({ error: "Failed to remove student" }, { status: 500 })
  }
}
