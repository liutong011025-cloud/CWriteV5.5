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
      className="relative mt-auto w-full overflow-hidden border-t-2 border-[#f7d77a]/35 text-[#fff8dc]"
      style={{
        background:
          "linear-gradient(180deg, rgba(42, 59, 33, 0.78) 0%, rgba(64, 49, 30, 0.94) 42%, rgba(39, 25, 15, 0.98) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 8% 28%, rgba(255, 238, 166, 0.42) 0 1px, transparent 2px), radial-gradient(circle at 22% 62%, rgba(255, 255, 255, 0.28) 0 1px, transparent 2px), radial-gradient(circle at 76% 30%, rgba(255, 238, 166, 0.35) 0 1px, transparent 2px), radial-gradient(circle at 91% 66%, rgba(255, 255, 255, 0.24) 0 1px, transparent 2px)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-10 opacity-50"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255, 220, 121, 0.16) 18%, rgba(255, 220, 121, 0.34) 50%, rgba(255, 220, 121, 0.16) 82%, transparent 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-4 left-1/2 h-[3px] w-[52vw] -translate-x-1/2 opacity-55"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(255, 232, 150, 0.9) 0px, rgba(255, 232, 150, 0.9) 18px, transparent 18px, transparent 34px)",
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
          <p className="text-sm font-black leading-5 text-[#fff1b8] sm:text-base">
            Strategic Plan Start-up Project @EdUHK
          </p>
          <p className="mt-0.5 text-sm font-extrabold leading-5 text-[#fff8dc] sm:text-[15px]">
            Copyright © 2026 The Education University of Hong Kong. All Rights Reserved.
          </p>
          <p className="ml-auto mt-1 max-w-4xl text-[10px] font-medium leading-3 text-[#f9e7ba]/68 sm:text-[11px]">
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


