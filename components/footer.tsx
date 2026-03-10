"use client"

import Image from "next/image"

export default function Footer() {
  return (
    <footer
      className="w-full mt-auto"
      style={{
        background: '#3b82f6',
        borderTop: '3px solid #1a1a1a',
      }}
    >
      <div className="max-w-7xl mx-auto px-8 lg:px-12 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Logo区域 */}
          <div className="flex items-center gap-10 lg:gap-12">
            {/* EdUHK Logo - 大一些 */}
            <div className="flex-shrink-0">
              <Image
                src="/EdUHK_Signature_RGBWhite@4x-1-1024x336.png"
                alt="EdUHK Logo"
                width={300}
                height={98}
                className="object-contain"
                unoptimized
              />
            </div>
            
            {/* MIT Logo - 小一些 */}
            <div className="flex-shrink-0">
              <Image
                src="/MIT_Logo2-1024x290.png"
                alt="MIT Logo"
                width={180}
                height={51}
                className="object-contain opacity-90"
                unoptimized
              />
            </div>
          </div>
          
          {/* 文本信息 - Neo-brutalist style */}
          <div className="flex-1 text-center lg:text-right space-y-3 max-w-md lg:max-w-none">
            <p className="text-white text-base leading-relaxed font-medium">
              Strategic Plan Start-up Support @EdUHK
            </p>
            <p className="text-white/90 text-base leading-relaxed">
              Department of Mathematics and Information Technology
            </p>
            <p className="text-white text-base font-bold mt-3 inline-block px-3 py-1 rounded-full" style={{
              background: '#facc15',
              color: '#1a1a1a',
              border: '2px solid #1a1a1a'
            }}>
              © EdUHK
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}


