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

  return (
    <footer className="mt-auto w-full overflow-hidden bg-[#103565]">
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


