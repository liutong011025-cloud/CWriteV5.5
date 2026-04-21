export function isDatabaseConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  const code =
    error && typeof error === "object" && "code" in error ? (error as { code?: string }).code ?? "" : ""

  return (
    code === "P1001" ||
    code === "P2024" ||
    code === "P2037" ||
    /Can't reach database|database connection|connection refused|too many connections|Prisma Accelerate|placeholder/i.test(
      message,
    )
  )
}
