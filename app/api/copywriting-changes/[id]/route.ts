import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// 刪除一筆 copywriting 修改記錄
// DELETE /api/copywriting-changes/:id

interface RouteParams {
  params: {
    id: string
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const id = params.id
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

