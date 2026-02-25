import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"

function formatTitleFromFilename(fileName: string): string {
  const base = fileName.replace(/\.pdf$/i, "")
  const withSpaces = base.replace(/[-_]+/g, " ")
  // 首字母大寫
  return withSpaces
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export async function GET(_request: NextRequest) {
  try {
    const researchDir = path.join(process.cwd(), "research")
    const entries = await fs.readdir(researchDir)
    const pdfFiles = entries.filter((name) => name.toLowerCase().endsWith(".pdf"))

    const books = pdfFiles.map((fileName, index) => {
      const title = formatTitleFromFilename(fileName)
      return {
        id: index + 1,
        title,
        description: `Open the research book "${title}".`,
        fileName,
      }
    })

    return NextResponse.json({ books })
  } catch (err) {
    console.error("Error listing research PDFs:", err)
    // 出錯時返回空列表，前端會顯示提示
    return NextResponse.json({ books: [] })
  }
}

