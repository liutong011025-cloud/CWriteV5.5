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
      className="relative z-20 mt-auto w-full overflow-hidden bg-[#173b69]"
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
      <div className="absolute inset-0 z-10 flex items-center px-[1.5vw]">
        <div className="flex w-[34vw] shrink-0 items-center gap-[1.6vw]">
          <Image
            src="/EdUHK_Signature_RGBWhite@4x-1-1024x336.webp"
            alt="The Education University of Hong Kong logo"
            width={280}
            height={92}
            className="h-auto w-[17vw] object-contain"
            priority={false}
          />
          <Image
            src="/MIT_Logo2-1024x290.webp"
            alt="MIT logo"
            width={210}
            height={60}
            className="h-auto w-[15vw] object-contain"
            priority={false}
          />
        </div>

        <div className="ml-auto mr-[10vw] w-[52vw] text-center text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
          <p className="text-[clamp(8px,0.85vw,17px)] font-bold leading-tight">
            Strategic Plan Start-up Project @EdUHK
          </p>
          <p className="mt-[0.18vw] text-[clamp(8px,0.8vw,16px)] font-bold leading-tight">
            Copyright © 2026 The Education University of Hong Kong. All Rights Reserved.
          </p>
          <p className="mx-auto mt-[0.45vw] max-w-[46vw] text-[clamp(5px,0.42vw,9px)] font-medium leading-tight text-white/85">
            <span className="font-bold">Disclaimer:</span>
            {" "}This website uses AI to help you learn and create. Sometimes AI may make mistakes or give incorrect information.
            Please think carefully, check important information, and ask a teacher or parent if you are unsure. By using this
            website, you understand that AI is not always perfect.
          </p>
        </div>
      </div>
    </footer>
  )
}


