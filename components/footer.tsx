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
    <footer
      className="relative mt-auto w-full overflow-hidden border-t-2 border-white/25 text-white"
      style={{
        background:
          "linear-gradient(180deg, rgba(22, 78, 99, 0.9) 0%, rgba(30, 96, 103, 0.94) 48%, rgba(28, 83, 64, 0.96) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          background:
            "radial-gradient(circle at 8% 28%, rgba(255, 255, 255, 0.55) 0px, rgba(255, 255, 255, 0.55) 1px, transparent 2px), radial-gradient(circle at 22% 62%, rgba(186, 230, 253, 0.45) 0px, rgba(186, 230, 253, 0.45) 1px, transparent 2px), radial-gradient(circle at 76% 30%, rgba(255, 255, 255, 0.42) 0px, rgba(255, 255, 255, 0.42) 1px, transparent 2px), radial-gradient(circle at 91% 66%, rgba(186, 230, 253, 0.35) 0px, rgba(186, 230, 253, 0.35) 1px, transparent 2px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 opacity-35"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(125, 211, 252, 0.18) 18%, rgba(167, 243, 208, 0.28) 50%, rgba(125, 211, 252, 0.18) 82%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto flex max-w-[1600px] flex-col gap-3 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-12">
        <div className="flex shrink-0 items-center justify-center gap-4 sm:gap-7 lg:justify-start">
          <Image
            src="/EdUHK_Signature_RGBWhite@4x-1-1024x336.webp"
            alt="The Education University of Hong Kong logo"
            width={280}
            height={92}
            className="h-auto w-[48vw] max-w-[245px] min-w-[150px] object-contain drop-shadow-[2px_3px_0_rgba(0,0,0,0.28)]"
            priority={false}
          />

          <Image
            src="/MIT_Logo2-1024x290.webp"
            alt="MIT logo"
            width={210}
            height={60}
            className="h-auto w-[34vw] max-w-[178px] min-w-[108px] object-contain drop-shadow-[2px_3px_0_rgba(0,0,0,0.22)]"
            priority={false}
          />
        </div>

        <div className="ml-auto max-w-5xl text-center lg:text-right">
          <p className="text-sm font-black leading-5 text-sky-50 sm:text-base">
            Strategic Plan Start-up Project @EdUHK
          </p>
          <p className="mt-0.5 text-sm font-extrabold leading-5 text-white sm:text-[15px]">
            Copyright © 2026 The Education University of Hong Kong. All Rights Reserved.
          </p>
          <p className="ml-auto mt-1 max-w-4xl text-[10px] font-medium leading-3 text-sky-50/65 sm:text-[11px]">
            <span className="font-bold uppercase tracking-[0.14em]">Disclaimer</span>
            {" "}This website uses AI to help you learn and create. Sometimes AI may make mistakes or give incorrect
            information. Please think carefully, check important information, and ask a teacher or parent if you are
            unsure. By using this website, you understand that AI is not always perfect.
          </p>
        </div>
      </div>
    </footer>
  )
}


