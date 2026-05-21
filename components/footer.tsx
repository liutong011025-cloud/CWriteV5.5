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
      style={{ background: "linear-gradient(180deg, #123f71 0%, #103565 52%, #0b2854 100%)" }}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-55"
        viewBox="0 0 1440 132"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 24C184 55 315 9 523 32C728 55 814 85 994 70C1162 56 1268 13 1440 34V132H0Z"
          fill="#123f71"
        />
        <path
          d="M0 50C220 28 376 40 568 70C761 101 945 107 1148 63C1260 39 1348 36 1440 50V132H0Z"
          fill="#0f3563"
          opacity="0.82"
        />
      </svg>
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at 5% 56%, rgba(255,255,255,0.72) 0px, rgba(255,255,255,0.72) 1px, transparent 2px), radial-gradient(circle at 10% 38%, rgba(255,229,166,0.86) 0px, rgba(255,229,166,0.86) 1.5px, transparent 3px), radial-gradient(circle at 17% 68%, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 1px, transparent 2px), radial-gradient(circle at 24% 30%, rgba(255,229,166,0.75) 0px, rgba(255,229,166,0.75) 1px, transparent 2px), radial-gradient(circle at 31% 62%, rgba(255,255,255,0.58) 0px, rgba(255,255,255,0.58) 1px, transparent 2px), radial-gradient(circle at 43% 48%, rgba(255,255,255,0.46) 0px, rgba(255,255,255,0.46) 1px, transparent 2px), radial-gradient(circle at 52% 42%, rgba(255,229,166,0.76) 0px, rgba(255,229,166,0.76) 1.5px, transparent 3px), radial-gradient(circle at 61% 66%, rgba(255,255,255,0.55) 0px, rgba(255,255,255,0.55) 1px, transparent 2px), radial-gradient(circle at 72% 35%, rgba(255,255,255,0.68) 0px, rgba(255,255,255,0.68) 1px, transparent 2px), radial-gradient(circle at 80% 58%, rgba(255,229,166,0.72) 0px, rgba(255,229,166,0.72) 1px, transparent 2px), radial-gradient(circle at 89% 62%, rgba(255,229,166,0.86) 0px, rgba(255,229,166,0.86) 1.5px, transparent 3px), radial-gradient(circle at 96% 42%, rgba(255,255,255,0.58) 0px, rgba(255,255,255,0.58) 1px, transparent 2px)",
        }}
      />
      <svg
        className="pointer-events-none absolute bottom-0 right-0 z-[1] h-auto w-[40vw] min-w-[270px] max-w-[560px] opacity-100"
        viewBox="0 0 520 150"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <path
          d="M218 150C247 109 286 80 345 54C405 28 461 9 520 0V150Z"
          fill="rgb(232, 184, 140)"
        />
        <path
          d="M280 150C306 113 336 88 382 66C428 44 471 21 512 2"
          fill="none"
          stroke="rgb(247, 215, 186)"
          strokeWidth="24"
          strokeLinecap="round"
          opacity="0.28"
        />
        <path
          d="M318 142C332 124 346 108 365 94M385 81C404 68 423 57 445 45M464 34C482 24 497 15 512 8"
          fill="none"
          stroke="rgba(255,255,255,0.86)"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 mx-auto flex max-w-[1600px] flex-col gap-3 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-12">
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

        <div className="ml-auto w-full min-w-0 max-w-[860px] text-center drop-shadow-[0_2px_3px_rgba(0,0,0,0.38)] lg:text-right">
          <p className="text-sm font-medium leading-5 text-sky-50 sm:text-base">
            Strategic Plan Start-up Project @EdUHK
          </p>
          <p className="mt-0.5 break-words text-sm font-medium leading-5 text-white sm:text-[15px]">
            Copyright © 2026 The Education University of Hong Kong. All Rights Reserved.
          </p>
          <p className="ml-auto mt-1 max-w-[780px] break-words text-[10px] font-medium leading-3 text-sky-50/65 sm:text-[11px]">
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


