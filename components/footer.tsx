"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"
import { useMainStage } from "@/hooks/use-main-stage"

export default function Footer() {
  const pathname = usePathname()
  const stage = useMainStage()

  // Hide footer on admin routes
  if (pathname?.startsWith('/admin')) {
    return null
  }

  // 教师工作台：与首页沉浸像素场景一致，隐藏底部 EdUHK 横条
  if (stage === "dashboard") {
    return null
  }

  const footerHeight = "calc(100vw * 1444 / 12000)"
  const overlapsMain = stage === "login"

  return (
    <footer
      className="relative z-20 mt-auto w-full overflow-hidden bg-transparent"
      style={{
        marginTop: overlapsMain ? `calc(${footerHeight} * -0.2)` : undefined,
      }}
    >
      <Image
        src="/footer.png"
        alt="Strategic Plan Start-up Project @EdUHK footer"
        width={12000}
        height={1444}
        className="block h-auto w-full"
        priority={false}
      />
    </footer>
  )
}


