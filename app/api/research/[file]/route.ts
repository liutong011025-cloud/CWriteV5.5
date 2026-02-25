import { NextRequest } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(
  _request: NextRequest,
  context: { params: { file: string } }
) {
  const fileName = context.params.file

  if (!fileName || !fileName.toLowerCase().endsWith(".pdf")) {
    return new Response("Not found", { status: 404 })
  }

  const filePath = path.join(process.cwd(), "research", fileName)

  try {
    const fileBuffer = await fs.readFile(filePath)

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`,
      },
    })
  } catch (err: any) {
    if (err && err.code === "ENOENT") {
      return new Response("Not found", { status: 404 })
    }
    console.error("Error reading research PDF:", err)
    return new Response("Internal Server Error", { status: 500 })
  }
}

