import { NextRequest, NextResponse } from "next/server"
import { isDatabaseConnectionError } from "@/lib/prisma-errors"
import { fetchPeerFarmUsers } from "@/lib/teacher-classes"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const username = new URL(request.url).searchParams.get("username")?.trim() ?? ""
    if (!username) {
      return NextResponse.json({ error: "username is required" }, { status: 400 })
    }

    const result = await fetchPeerFarmUsers(username)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[classmates] GET failed:", error)
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({ error: "Database unavailable", users: [], scope: "unassigned" }, { status: 503 })
    }
    return NextResponse.json({ error: "Failed to load classmates" }, { status: 500 })
  }
}
