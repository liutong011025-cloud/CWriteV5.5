import { prisma } from "@/lib/prisma"

export type RevisionWorkType = "story" | "review" | "letter"

/** Append one revision when content changed; skip duplicate consecutive snapshots. Returns new version or last unchanged version. */
export async function appendWritingEditRevision(
  workType: RevisionWorkType,
  workId: string,
  content: string,
): Promise<number | null> {
  const trimmed = typeof content === "string" ? content : ""
  if (!workId || !trimmed) return null

  const last = await prisma.writingEditRevision.findFirst({
    where: { workType, workId },
    orderBy: { version: "desc" },
    select: { version: true, content: true },
  })
  if (last && last.content === trimmed) return last.version

  const nextVersion = (last?.version ?? 0) + 1
  await prisma.writingEditRevision.create({
    data: { workType, workId, version: nextVersion, content: trimmed },
  })
  return nextVersion
}
