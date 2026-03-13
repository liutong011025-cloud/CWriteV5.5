import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 刪除一筆 copywriting 修改記錄
// DELETE /api/copywriting-changes/:id

export async function DELETE(request: NextRequest) {
  try {
    // 某些部署環境下 Next 可能不傳入 params，改為從 URL 解析 id 更穩定
    const url = new URL(request.url)
    const segments = url.pathname.split("/").filter(Boolean)
    const id = segments[segments.length - 1]
    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 })
    }

    await prisma.interaction.delete({
      where: { id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[copywriting-changes/:id] Failed to delete:", error)
    return NextResponse.json({ success: false, error: "Failed to delete change" }, { status: 500 })
  }
}

