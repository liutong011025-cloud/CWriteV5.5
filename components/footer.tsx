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
      className="w-full mt-auto px-4 pb-4 pt-2 sm:px-6 lg:px-8"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(15,23,42,0.18) 34%, rgba(15,23,42,0.38) 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/25 bg-slate-950/[0.88] shadow-[0_24px_70px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="h-1 w-full bg-gradient-to-r from-sky-300 via-violet-300 to-amber-200" />

        <div className="grid gap-6 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(320px,0.92fr)_1.35fr] lg:items-center lg:px-10 lg:py-7">
          <div className="flex flex-col gap-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-100/75">
              In collaboration with
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex h-20 min-w-[230px] items-center justify-center rounded-2xl border border-white/15 bg-white/[0.08] px-5 shadow-inner shadow-white/5">
                <Image
                  src="/EdUHK_Signature_RGBWhite@4x-1-1024x336.webp"
                  alt="The Education University of Hong Kong logo"
                  width={260}
                  height={85}
                  className="h-auto w-[230px] object-contain sm:w-[250px]"
                  priority={false}
                />
              </div>

              <div className="flex h-[4.25rem] min-w-[176px] items-center justify-center rounded-2xl border border-white/70 bg-white px-5 shadow-sm shadow-slate-950/10">
                <Image
                  src="/MIT_Logo2-1024x290.webp"
                  alt="MIT logo"
                  width={190}
                  height={54}
                  className="h-auto w-[168px] object-contain sm:w-[178px]"
                  priority={false}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/[0.12] bg-white/[0.07] p-5 text-center shadow-inner shadow-white/5 lg:text-left">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-amber-100">
              Disclaimer
            </p>
            <p className="text-sm leading-6 text-slate-100/90 sm:text-[15px]">
              This website uses AI to help you learn and create. Sometimes AI may make mistakes or give incorrect
              information. Please think carefully, check important information, and ask a teacher or parent if you are
              unsure. By using this website, you understand that AI is not always perfect.
            </p>

            <div className="mt-5 flex flex-col gap-2 border-t border-white/[0.12] pt-4 text-xs font-medium leading-5 text-slate-200/80 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p>Strategic Plan Start-up Project @EdUHK</p>
              <p>Copyright © 2026 The Education University of Hong Kong. All Rights Reserved.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-white/[0.04] px-6 py-3 text-center text-[11px] tracking-wide text-slate-300/75">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-300/80" />
          <p>AI-assisted creative writing for thoughtful young learners</p>
        </div>
      </div>
    </footer>
  )
}


