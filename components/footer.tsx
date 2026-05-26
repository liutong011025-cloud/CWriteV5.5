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
        height: footerHeight,
        marginTop: overlapsMain ? `calc(${footerHeight} * -0.72)` : undefined,
      }}
    >
      <Image
        src="/footer.png"
        alt="Strategic Plan Start-up Project @EdUHK footer"
        width={12000}
        height={1444}
        className="block h-full w-full"
        priority={false}
      />
      <div className="absolute inset-0 z-10 flex items-center px-[1.4vw] pr-[13vw]">
        <div className="flex shrink-0 items-center gap-[1.2vw]">
          <Image
            src="/EdUHK_Signature_RGBWhite@4x-1-1024x336.webp"
            alt="The Education University of Hong Kong logo"
            width={280}
            height={92}
            className="h-auto w-[clamp(150px,17vw,300px)] object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,0.32)]"
            priority={false}
          />
          <Image
            src="/MIT_Logo2-1024x290.webp"
            alt="MIT logo"
            width={210}
            height={60}
            className="h-auto w-[clamp(125px,14vw,245px)] object-contain drop-shadow-[0_2px_2px_rgba(0,0,0,0.28)]"
            priority={false}
          />
        </div>

        <div className="ml-auto max-w-[52vw] text-center text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.45)]">
          <p className="text-[clamp(10px,0.88vw,17px)] font-bold leading-tight">
            Strategic Plan Start-up Project @EdUHK
          </p>
          <p className="mt-[0.2vw] text-[clamp(10px,0.88vw,17px)] font-bold leading-tight">
            Copyright © 2026 The Education University of Hong Kong. All Rights Reserved.
          </p>
          <p className="mx-auto mt-[0.42vw] max-w-[46vw] text-[clamp(7px,0.52vw,11px)] font-medium leading-tight text-white/90">
            <span className="font-bold">Disclaimer:</span>{" "}
            This website uses AI to help you learn and create. Sometimes AI may make mistakes or give incorrect information.
            Please think carefully, check important information, and ask a teacher or parent if you are unsure. By using this
            website, you understand that AI is not always perfect.
          </p>
        </div>
      </div>
    </footer>
  )
}


