import { NextRequest } from "next/server"
import fs from "fs/promises"
import path from "path"

export async function GET(
  _request: NextRequest,
  context: { params: { file: string } }
) {
  // Next 傳進來的參數可能仍是 URL 編碼的（包含 %20、%2C 等）
  // 我們這裡做一次 decode，確保能對應到實際文件名
  let fileName = context.params.file
  try {
    fileName = decodeURIComponent(fileName)
  } catch {
    // decode 失敗就用原始字串，後面會得到 404
  }

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

