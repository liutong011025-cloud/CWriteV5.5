import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isVirtualClassId, resolveTeacher } from "@/lib/teacher-classes"

type RouteParams = { params: Promise<{ classId: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { classId } = await params
    if (isVirtualClassId(classId)) {
      return NextResponse.json({ error: "Cannot rename the Unassigned group" }, { status: 400 })
    }

    const body = (await request.json()) as { teacherUsername?: string; name?: string }
    const teacherUsername = body.teacherUsername?.trim()
    const name = body.name?.trim()

    if (!teacherUsername || !name) {
      return NextResponse.json({ error: "teacherUsername and name are required" }, { status: 400 })
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

    const duplicate = await prisma.teacherClass.findFirst({
      where: { teacherId: teacher.id, name, id: { not: classId } },
    })
    if (duplicate) {
      return NextResponse.json({ error: "A class with this name already exists" }, { status: 409 })
    }

    const updated = await prisma.teacherClass.update({
      where: { id: classId },
      data: { name },
    })

    return NextResponse.json({ class: { id: updated.id, name: updated.name } })
  } catch (error) {
    console.error("[teacher classes] PATCH failed:", error)
    return NextResponse.json({ error: "Failed to rename class" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { classId } = await params
    if (isVirtualClassId(classId)) {
      return NextResponse.json({ error: "Cannot delete the Unassigned group" }, { status: 400 })
    }

    const teacherUsername = new URL(request.url).searchParams.get("teacher")?.trim()
    if (!teacherUsername) {
      return NextResponse.json({ error: "teacher query param is required" }, { status: 400 })
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

    await prisma.teacherClass.delete({ where: { id: classId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[teacher classes] DELETE failed:", error)
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 })
  }
}
