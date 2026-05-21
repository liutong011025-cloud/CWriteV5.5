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
      className="relative mt-auto w-full overflow-hidden text-white"
      style={{
        background: "linear-gradient(180deg, #123f71 0%, #103565 48%, #0b2854 100%)",
      }}
    >
      <svg
        className="pointer-events-none absolute inset-x-0 top-0 z-20 h-8 w-full text-white"
        viewBox="0 0 1440 56"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 0H1440V18C1280 2 1180 8 1040 22C870 39 742 38 580 23C387 5 250 12 0 28Z"
          fill="currentColor"
        />
      </svg>
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 132"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 28C180 58 314 12 520 35C726 58 810 86 990 72C1158 59 1267 16 1440 37V132H0Z"
          fill="#123f71"
        />
        <path
          d="M0 50C220 28 376 40 568 70C761 101 945 107 1148 63C1260 39 1348 36 1440 50V132H0Z"
          fill="#0f3563"
          opacity="0.82"
        />
      </svg>
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 6% 54%, rgba(255,255,255,0.7) 0px, rgba(255,255,255,0.7) 1px, transparent 2px), radial-gradient(circle at 15% 32%, rgba(255,229,166,0.9) 0px, rgba(255,229,166,0.9) 1.5px, transparent 3px), radial-gradient(circle at 28% 62%, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 1px, transparent 2px), radial-gradient(circle at 52% 42%, rgba(255,229,166,0.7) 0px, rgba(255,229,166,0.7) 1.5px, transparent 3px), radial-gradient(circle at 72% 35%, rgba(255,255,255,0.65) 0px, rgba(255,255,255,0.65) 1px, transparent 2px), radial-gradient(circle at 88% 58%, rgba(255,229,166,0.85) 0px, rgba(255,229,166,0.85) 1.5px, transparent 3px)",
        }}
      />
      <svg
        className="pointer-events-none absolute bottom-0 right-0 h-auto w-[38vw] min-w-[250px] max-w-[520px] opacity-45 lg:opacity-55"
        viewBox="0 0 460 150"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <path
          d="M184 150C215 111 254 82 312 55C365 30 401 12 431 0H460V150Z"
          fill="rgb(232, 184, 140)"
        />
        <path
          d="M230 150C259 111 291 85 333 63C378 39 411 18 440 0"
          fill="none"
          stroke="rgb(246, 214, 184)"
          strokeWidth="22"
          strokeLinecap="round"
          opacity="0.35"
        />
        <path
          d="M266 143C279 125 292 109 309 96M327 84C345 70 363 59 383 48M400 36C415 27 426 19 438 10"
          fill="none"
          stroke="rgba(255,255,255,0.86)"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 mx-auto flex max-w-[1600px] flex-col gap-3 px-5 pb-4 pt-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-12">
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

        <div className="ml-auto max-w-5xl text-center drop-shadow-[0_2px_3px_rgba(0,0,0,0.38)] lg:text-right">
          <p className="text-sm font-medium leading-5 text-sky-50 sm:text-base">
            Strategic Plan Start-up Project @EdUHK
          </p>
          <p className="mt-0.5 text-sm font-medium leading-5 text-white sm:text-[15px]">
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


