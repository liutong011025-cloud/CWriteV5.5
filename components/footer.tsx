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
      className="w-full mt-auto border-y-4 border-[#4a2f12] text-[#fff8dc] shadow-[0_-8px_0_rgba(0,0,0,0.16)]"
      style={{
        background:
          "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 72px), linear-gradient(180deg, #8b5a24 0%, #6f451b 48%, #4f2f13 100%)",
      }}
    >
      <div
        className="border-y-2 border-[#b8843c]/70"
        style={{ backgroundColor: "rgba(43, 26, 11, 0.28)" }}
      >
        <div className="mx-auto grid max-w-[1600px] gap-4 px-5 py-3 sm:px-8 lg:grid-cols-[minmax(280px,0.62fr)_1.5fr] lg:items-center lg:px-12">
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-3 lg:justify-start">
            <Image
              src="/EdUHK_Signature_RGBWhite@4x-1-1024x336.webp"
              alt="The Education University of Hong Kong logo"
              width={280}
              height={92}
              className="h-auto w-[205px] object-contain drop-shadow-[2px_3px_0_rgba(0,0,0,0.28)] sm:w-[245px]"
              priority={false}
            />

            <Image
              src="/MIT_Logo2-1024x290.webp"
              alt="MIT logo"
              width={210}
              height={60}
              className="h-auto w-[152px] object-contain drop-shadow-[2px_3px_0_rgba(0,0,0,0.22)] sm:w-[178px]"
              priority={false}
            />
          </div>

          <div
            className="border-4 border-[#3d260f] px-4 py-3 text-center text-[#3a240f] shadow-[inset_4px_4px_0_rgba(255,255,255,0.45),inset_-4px_-4px_0_rgba(92,55,18,0.18),4px_4px_0_rgba(0,0,0,0.22)] lg:text-left"
            style={{ backgroundColor: "#f7dfad" }}
          >
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7a5125]/70">
              Disclaimer
            </p>
            <p className="text-[10px] font-medium leading-4 text-[#5f4322]/75 sm:text-[11px]">
              This website uses AI to help you learn and create. Sometimes AI may make mistakes or give incorrect
              information. Please think carefully, check important information, and ask a teacher or parent if you are
              unsure. By using this website, you understand that AI is not always perfect.
            </p>

            <div className="mt-2 flex flex-col gap-1.5 border-t-2 border-[#8b5a24]/35 pt-2 text-sm font-black leading-5 text-[#4a2b0e] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:text-[15px]">
              <p>Strategic Plan Start-up Project @EdUHK</p>
              <p>Copyright © 2026 The Education University of Hong Kong. All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}


