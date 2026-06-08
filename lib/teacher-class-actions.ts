import { prisma } from "@/lib/prisma"
import { isVirtualClassId, resolveTeacher } from "@/lib/teacher-classes"

export async function createTeacherClass(teacherUsername: string, name: string) {
  const trimmedName = name.trim()
  if (!trimmedName) {
    return { ok: false as const, status: 400, error: "Class name is required" }
  }
  if (trimmedName.length > 64) {
    return { ok: false as const, status: 400, error: "Class name is too long (max 64 characters)" }
  }

  const teacher = await resolveTeacher(teacherUsername)
  if (!teacher) {
    return {
      ok: false as const,
      status: 404,
      error: `Teacher account "${teacherUsername}" not found in database. Log in with a registered teacher account (e.g. jcpst1).`,
    }
  }

  const existing = await prisma.teacherClass.findUnique({
    where: { teacherId_name: { teacherId: teacher.id, name: trimmedName } },
  })
  if (existing) {
    return { ok: false as const, status: 409, error: "A class with this name already exists" }
  }

  const created = await prisma.teacherClass.create({
    data: { teacherId: teacher.id, name: trimmedName },
  })

  return {
    ok: true as const,
    class: { id: created.id, name: created.name, memberCount: 0, members: [] as Array<{ id: string; username: string }> },
  }
}

export async function renameTeacherClass(teacherUsername: string, classId: string, name: string) {
  if (isVirtualClassId(classId)) {
    return { ok: false as const, status: 400, error: "Cannot rename the Unassigned group" }
  }

  const trimmedName = name.trim()
  if (!trimmedName) {
    return { ok: false as const, status: 400, error: "Class name is required" }
  }

  const teacher = await resolveTeacher(teacherUsername)
  if (!teacher) {
    return { ok: false as const, status: 404, error: "Teacher not found" }
  }

  const cls = await prisma.teacherClass.findFirst({
    where: { id: classId, teacherId: teacher.id },
  })
  if (!cls) {
    return { ok: false as const, status: 404, error: "Class not found" }
  }

  const duplicate = await prisma.teacherClass.findFirst({
    where: { teacherId: teacher.id, name: trimmedName, id: { not: classId } },
  })
  if (duplicate) {
    return { ok: false as const, status: 409, error: "A class with this name already exists" }
  }

  const updated = await prisma.teacherClass.update({
    where: { id: classId },
    data: { name: trimmedName },
  })

  return { ok: true as const, class: { id: updated.id, name: updated.name } }
}

export async function deleteTeacherClass(teacherUsername: string, classId: string) {
  if (isVirtualClassId(classId)) {
    return { ok: false as const, status: 400, error: "Cannot delete the Unassigned group" }
  }

  const teacher = await resolveTeacher(teacherUsername)
  if (!teacher) {
    return { ok: false as const, status: 404, error: "Teacher not found" }
  }

  const cls = await prisma.teacherClass.findFirst({
    where: { id: classId, teacherId: teacher.id },
  })
  if (!cls) {
    return { ok: false as const, status: 404, error: "Class not found" }
  }

  await prisma.teacherClass.delete({ where: { id: classId } })
  return { ok: true as const }
}

export async function addStudentsToClass(
  teacherUsername: string,
  classId: string,
  studentUsernames: string[],
) {
  if (isVirtualClassId(classId)) {
    return { ok: false as const, status: 400, error: "Select a real class to add students" }
  }

  const teacher = await resolveTeacher(teacherUsername)
  if (!teacher) {
    return { ok: false as const, status: 404, error: "Teacher not found" }
  }

  const cls = await prisma.teacherClass.findFirst({
    where: { id: classId, teacherId: teacher.id },
  })
  if (!cls) {
    return { ok: false as const, status: 404, error: "Class not found" }
  }

  const students = await prisma.user.findMany({
    where: { username: { in: studentUsernames }, role: "student" },
    select: { id: true, username: true },
  })
  if (students.length === 0) {
    return { ok: false as const, status: 400, error: "No valid student accounts found" }
  }

  const studentIds = students.map((s) => s.id)

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

  await Promise.all(
    students.map((s) =>
      prisma.userProfile.upsert({
        where: { userId: s.id },
        create: { userId: s.id, grade: cls.name },
        update: { grade: cls.name },
      }),
    ),
  )

  return {
    ok: true as const,
    added: students.map((s) => s.username),
    memberCount: await prisma.classMember.count({ where: { classId } }),
  }
}

export async function removeStudentFromClass(
  teacherUsername: string,
  classId: string,
  studentUsername: string,
) {
  if (isVirtualClassId(classId)) {
    return { ok: false as const, status: 400, error: "Cannot remove from Unassigned directly" }
  }

  const teacher = await resolveTeacher(teacherUsername)
  if (!teacher) {
    return { ok: false as const, status: 404, error: "Teacher not found" }
  }

  const cls = await prisma.teacherClass.findFirst({
    where: { id: classId, teacherId: teacher.id },
  })
  if (!cls) {
    return { ok: false as const, status: 404, error: "Class not found" }
  }

  const student = await prisma.user.findUnique({ where: { username: studentUsername } })
  if (!student) {
    return { ok: false as const, status: 404, error: "Student not found" }
  }

  await prisma.classMember.deleteMany({
    where: { classId, studentId: student.id },
  })

  return { ok: true as const }
}

export async function updateClassRoster(
  teacherUsername: string,
  classId: string,
  desiredUsernames: string[],
  currentUsernames: string[],
) {
  const desired = new Set(desiredUsernames)
  const current = new Set(currentUsernames)
  const toAdd = [...desired].filter((u) => !current.has(u))
  const toRemove = [...current].filter((u) => !desired.has(u))

  if (toAdd.length > 0) {
    const addResult = await addStudentsToClass(teacherUsername, classId, toAdd)
    if (!addResult.ok) return addResult
  }

  for (const studentUsername of toRemove) {
    const removeResult = await removeStudentFromClass(teacherUsername, classId, studentUsername)
    if (!removeResult.ok) return removeResult
  }

  return { ok: true as const }
}
