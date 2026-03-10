"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type HeaderLanguage = "en" | "zh"

type HeaderUserInfo = {
  username: string
  avatarUrl?: string | null
  avatarEmoji?: string | null
  unreadCount: number
} | null

export default function Header() {
  const [currentStage, setCurrentStage] = useState<string | null>(null)
  const [language, setLanguage] = useState<HeaderLanguage>("en") // 默认英语
  const [userInfo, setUserInfo] = useState<HeaderUserInfo>(null)
  const pathname = usePathname()

  useEffect(() => {
    const onUserInfo = (e: Event) => {
      const detail = (e as CustomEvent<HeaderUserInfo>).detail
      setUserInfo(detail ?? null)
    }
    window.addEventListener("headerUserInfo", onUserInfo)
    return () => window.removeEventListener("headerUserInfo", onUserInfo)
  }, [])

  // 只要能看到 Header，就認為已登入：啟動時從 localStorage 自動恢復用戶並拉取頭像
  useEffect(() => {
    if (typeof window === "undefined") return
    // 優先使用主頁持久化的用戶資訊
    try {
      const savedUser = localStorage.getItem("cwriteUser")
      if (savedUser) {
        const parsed = JSON.parse(savedUser) as { username: string }
        if (parsed?.username) {
          const baseInfo: HeaderUserInfo = {
            username: parsed.username,
            avatarUrl: null,
            avatarEmoji: null,
            unreadCount: 0,
          }
          setUserInfo((prev) => prev ?? baseInfo)
          // 再用 /api/user-profile 補齊頭像與表情
          fetch(`/api/user-profile?user_id=${encodeURIComponent(parsed.username)}`)
            .then((r) => r.json())
            .then((data) => {
              if (data && !data.error) {
                setUserInfo((prevInfo) => ({
                  username: parsed.username,
                  avatarUrl: data.avatarUrl ?? prevInfo?.avatarUrl ?? null,
                  avatarEmoji: data.avatarEmoji ?? prevInfo?.avatarEmoji ?? null,
                  unreadCount: prevInfo?.unreadCount ?? 0,
                }))
              }
            })
            .catch(() => {
              // 失敗時保留基本 username，仍然顯示縮寫頭像
            })
        }
      }
    } catch {
      // ignore
    }
  }, [])

  // 监听 stage 变化
  useEffect(() => {
    const checkStage = () => {
      // 检查 main 元素
      const mainElement = document.querySelector('main[data-stage]')
      let stage = mainElement?.getAttribute('data-stage')
      
      // 如果没有在 main 上找到，检查所有带有 data-stage 的元素（包括 gallery-page 的 div）
      if (!stage) {
        const anyElement = document.querySelector('[data-stage]')
        stage = anyElement?.getAttribute('data-stage') || null
      }
      
      // 如果 pathname 是 /gallery，也设置为 gallery
      if (pathname === '/gallery' || pathname?.includes('gallery')) {
        stage = 'gallery'
      }
      
      setCurrentStage(stage || null)
    }

    checkStage()
    const observer = new MutationObserver(checkStage)
    if (typeof window !== 'undefined' && document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-stage']
      })
    }

    return () => observer.disconnect()
  }, [pathname])

  const navItems = [
    { label: "Home", href: "/", action: () => {
      // 触发自定义事件来通知主页面切换到home
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('navigateToHome'))
      }
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } },
    { label: "New Writing", href: "/write", action: () => {
      // 触发自定义事件来通知主页面直接进入地图
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('navigateToJourneyMap'))
      }
    } },
    { label: "Luminai Library", href: "/gallery", action: () => {
      // 触发自定义事件来通知主页面切换到gallery
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('navigateToGallery'))
      }
    } },
    { label: "Resource", href: "/research", action: () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("navigateToResearch"))
      }
    } },
    { label: "About us", href: "/#about", action: () => {
      // 触发自定义事件来通知主页面切换到about
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('navigateToAbout'))
      }
    } },
  ]

  const handleLanguageChange = (lang: HeaderLanguage) => {
    console.log('Header language change clicked:', lang)
    setLanguage(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('siteLanguage', lang)
      // 触发全局语言切换事件，让所有页面都能响应
      // 确保传递的是 "en" | "zh"，与主页面一致
      const event = new CustomEvent('headerLanguageChange', { detail: lang })
      console.log('Dispatching headerLanguageChange event with detail:', lang)
      window.dispatchEvent(event)
    }
  }

  // 从localStorage读取语言设置，默认英语
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('siteLanguage') as HeaderLanguage | null
      // 兼容旧数据：将 "yue" 转换为 "zh"
      if (savedLang === 'yue') {
        setLanguage('zh')
        localStorage.setItem('siteLanguage', 'zh')
      } else if (savedLang && (savedLang === 'en' || savedLang === 'zh')) {
        setLanguage(savedLang)
      } else {
        // 如果没有保存的语言设置，默认使用英语
        setLanguage('en')
        localStorage.setItem('siteLanguage', 'en')
      }
    }
  }, [])


  // Page detection for navigation highlighting
  const isHomePage = currentStage === 'home' || pathname === '/'
  const isAboutPage = currentStage === 'about' || pathname === '/#about'
  const isGalleryPage = currentStage === 'gallery' || pathname === '/gallery' || pathname?.includes('gallery')
  // Note: showBackground and showLogo removed - neo-brutalist header is always visible with cream background

  // 处理导航点击
  const handleNavClick = (item: typeof navItems[0], e: React.MouseEvent) => {
    e.preventDefault()
    item.action()
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16`}
      style={{
        overflow: 'visible',
        background: '#fffbeb', /* Warm cream/yellow background like reference */
        borderBottom: '3px solid #1a1a1a',
        boxShadow: '0 4px 0 0 rgba(0,0,0,0.1)',
      }}
    >
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo or Title */}
        <div className="flex items-center h-full">
          <Link 
            href="/" 
            onClick={(e) => {
              e.preventDefault()
              // 如果点击CWrite，跳转到About页面
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('navigateToAbout'))
              }
            }}
            className="transition-all duration-200 flex items-center h-full"
          >
            {/* Always use the color logo on the cream background */}
            <Image
              src="/logobig.png"
              alt="CWrite"
              width={120}
              height={48}
              className="object-contain h-10 w-auto"
              priority
              unoptimized
            />
          </Link>
        </div>

               {/* Navigation Links + 用户头像 + 语言 - Neo-brutalist pill style */}
               <nav className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
                 <div className="flex items-center gap-2 min-w-0 flex-wrap justify-end">
                 {navItems.map((item) => {
                   // 检查是否激活
                  const isHomePageActive = (currentStage === 'home' || pathname === '/') && item.href === "/"
                  const isAboutPageActive = (currentStage === 'about' || pathname === '/#about') && item.href === "/#about"
                  const isWritePageActive = currentStage === 'writeTypeSelection' && item.href === "/write"
                  const isGalleryPageActive = isGalleryPage && (item.href === "/gallery" || item.label === "Luminai Library")
                  const isActive = isHomePageActive || isAboutPageActive || isWritePageActive || isGalleryPageActive
                   return (
                     <Link
                       key={item.href}
                       href={item.href}
                       onClick={(e) => handleNavClick(item, e)}
                       className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-150 whitespace-nowrap border-2 ${
                         isActive
                           ? 'bg-[#ec4899] text-white border-[#1a1a1a] shadow-[2px_2px_0_0_#1a1a1a]'
                           : 'bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#fef3c7] hover:shadow-[2px_2px_0_0_#1a1a1a]'
                       }`}
                     >
                       {item.label}
                     </Link>
                   )
                 })}
                 </div>
                 
                 {/* User avatar - 登录后显示，点击进入用户资料 */}
                 {userInfo && (
                   <button
                     type="button"
                     onClick={() => window.dispatchEvent(new CustomEvent("navigateToUserProfile"))}
                     className="relative flex-shrink-0 ml-1 rounded-full ring-2 ring-transparent hover:ring-[#ec4899] focus:outline-none focus:ring-2 focus:ring-[#ec4899]"
                     aria-label="Open profile"
                   >
                     <Avatar className="h-9 w-9 rounded-full border-2 border-[#1a1a1a] flex-shrink-0 bg-white">
                       <AvatarImage src={userInfo.avatarUrl || undefined} alt={userInfo.username} />
                       <AvatarFallback className="rounded-full text-sm font-bold bg-[#facc15] text-[#1a1a1a]">
                         {userInfo.avatarEmoji || (userInfo.username || "?").slice(0, 2).toUpperCase()}
                       </AvatarFallback>
                     </Avatar>
                     {userInfo.unreadCount > 0 && (
                       <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white border border-[#1a1a1a]">
                         {userInfo.unreadCount > 99 ? "99+" : userInfo.unreadCount}
                       </span>
                     )}
                   </button>
                 )}

                 {/* Language Selector - Neo-brutalist style */}
                 <div className="flex gap-1 ml-2 flex-shrink-0">
                   <Button
                     onClick={() => handleLanguageChange("en")}
                     variant={language === "en" ? "default" : "outline"}
                     size="sm"
                     className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all border-2 ${
                       language === "en"
                         ? "bg-[#3b82f6] text-white border-[#1a1a1a] shadow-[2px_2px_0_0_#1a1a1a]"
                         : "bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#fef3c7]"
                     }`}
                   >
                     ENG
                   </Button>
                   <Button
                     onClick={() => handleLanguageChange("zh")}
                     variant={language === "zh" ? "default" : "outline"}
                     size="sm"
                     className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all border-2 ${
                       language === "zh"
                         ? "bg-[#3b82f6] text-white border-[#1a1a1a] shadow-[2px_2px_0_0_#1a1a1a]"
                         : "bg-white text-[#1a1a1a] border-[#1a1a1a] hover:bg-[#fef3c7]"
                     }`}
                   >
                     中文
                   </Button>
                 </div>
               </nav>
      </div>
    </header>
  )
}

