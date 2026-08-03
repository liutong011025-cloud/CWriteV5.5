"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"
import { useMainStage } from "@/hooks/use-main-stage"

export default function Footer() {
  const pathname = usePathname()
  const stage = useMainStage()

  // Hide footer on admin / login / teacher / immersive farm
  if (
    pathname?.startsWith("/admin") ||
    pathname === "/" ||
    pathname?.startsWith("/teacher") ||
    pathname?.startsWith("/my-farm")
  ) {
    return null
  }

  // Login / 教师工作台：与沉浸式页面一致，隐藏底部 EdUHK 横条
  if (stage === "login" || stage === "dashboard" || stage === "userProfile") {
    return null
  }

  const footerHeight = "calc(100vw * 680 / 12000)"

  return (
    <footer
      className="relative z-20 mt-auto w-full overflow-hidden bg-[#173b69]"
      style={{
        height: footerHeight,
      }}
    >
      <Image
        src="/footer.png"
        alt="Strategic Plan Start-up Project @EdUHK footer"
        width={12000}
        height={1444}
        className="absolute inset-x-[-1px] bottom-[-1px] block h-full w-[calc(100%+2px)]"
        priority={false}
      />
      <div className="absolute inset-0 z-10 flex items-center px-[1.45vw]">
        <div className="flex w-[28vw] shrink-0 items-center gap-[1.2vw]">
          <Image
            src="/EdUHK_Signature_RGBWhite@4x-1-1024x336.webp"
            alt="The Education University of Hong Kong logo"
            width={280}
            height={92}
            className="h-auto w-[14vw] object-contain"
            priority={false}
          />
          <Image
            src="/MIT_Logo2-1024x290.webp"
            alt="MIT logo"
            width={210}
            height={60}
            className="h-auto w-[12vw] object-contain"
            priority={false}
          />
        </div>

        <div className="ml-auto mr-[3.2vw] w-[62vw] text-right text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
          <p className="text-[clamp(8px,0.82vw,16px)] font-bold leading-tight">
            Strategic Plan Start-up Project @EdUHK
          </p>
          <p className="mt-[0.16vw] text-[clamp(8px,0.78vw,15px)] font-bold leading-tight">
            Copyright © 2026 The Education University of Hong Kong. All Rights Reserved.
          </p>
          <p className="ml-auto mt-[0.34vw] max-w-[60vw] text-[clamp(6px,0.46vw,9.5px)] font-medium leading-tight text-white/90">
            <span className="font-bold">Disclaimer:</span>
            {" "}This website uses AI to help you learn and create. Sometimes AI may make mistakes or give incorrect information.
            Please think carefully, check important information, and ask a teacher or parent if you are unsure.
            <br />
            By using this website, you understand that AI is not always perfect.
          </p>
        </div>
      </div>
    </footer>
  )
}


