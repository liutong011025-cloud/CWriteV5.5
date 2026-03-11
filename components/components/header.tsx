"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"

type HeaderLanguage = "en" | "zh"

type HeaderUserInfo = {
  username: string
  avatarUrl?: string | null
  avatarEmoji?: string | null
  unreadCount: number
} | null

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isAtTop, setIsAtTop] = useState(true)
  const [isHovering, setIsHovering] = useState(false)
  const [aboutMenuOpen, setAboutMenuOpen] = useState(false)
  const [currentStage, setCurrentStage] = useState<string | null>(null)
  const [language, setLanguage] = useState<HeaderLanguage>("en") // 默认英语
  const [userInfo, setUserInfo] = useState<HeaderUserInfo>(null)
  const pathname = usePathname()
  const router = useRouter()

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


  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      // 更早折叠：降低阈值，让header在更早的滚动位置就变成窄的
      setIsScrolled(scrollTop > 15)
      setIsAtTop(scrollTop < 5)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

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


  // 逻辑：
  // 1. 如果在顶部（isAtTop = true），背景始终透明，不显示背景色
  // 2. 如果向下滚动（isScrolled = true），显示背景和窄窄的header
  // 3. 顶部时，文字为黑色；滚动后，文字根据背景调整
  const isHomePage = currentStage === 'home' || pathname === '/'
  const isAboutPage = currentStage?.startsWith('about') || false
  const isGalleryPage = currentStage === 'gallery' || pathname === '/gallery' || pathname?.includes('gallery')
  const showBackground = isScrolled || isAboutPage || isGalleryPage // About 和 Gallery 页面始终显示背景
  const showLogo = isHomePage && isAtTop && !isHovering && !isAboutPage && !isGalleryPage // 只在首页顶部且未悬停时显示logo

  // 处理导航点击
  const handleNavClick = (item: typeof navItems[0], e: React.MouseEvent) => {
    e.preventDefault()
    item.action()
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isAboutPage || isGalleryPage
          ? 'h-16 shadow-xl' // About 和 Gallery 页面使用中等高度的header
          : isHomePage 
          ? (isScrolled ? 'h-14 shadow-xl' : 'h-32')
          : 'h-12 shadow-lg' // 非首页始终保持窄的header
      }`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        overflow: 'visible',
        background: showBackground
          ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 58, 138, 0.95) 50%, rgba(15, 23, 42, 0.98) 100%)'
          : 'transparent',
        backdropFilter: showBackground ? 'blur(12px) saturate(180%)' : 'none',
        borderBottom: showBackground ? '1px solid rgba(59, 130, 246, 0.3)' : 'none',
        boxShadow: showBackground 
          ? '0 4px 20px rgba(15, 23, 42, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
          : 'none',
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
            {isHomePage && showLogo ? (
              // 首页顶部显示 logosmall
              <Image
                src="/logosmall.png"
                alt="CWrite"
                width={96}
                height={96}
                className="object-contain w-auto"
                priority
                unoptimized
                style={{ maxHeight: '100%', height: '100%', objectFit: 'contain', width: 'auto' }}
              />
             ) : isHomePage ? (
               // 首页：在顶部悬停时显示 logobig，滚动压缩后显示白色 logo
               isAtTop ? (
                 <Image
                   src="/logobig.png"
                   alt="CWrite"
                   width={120}
                   height={40}
                   className="object-contain h-full w-auto"
                   unoptimized
                   style={{ maxHeight: '100%', height: '100%', objectFit: 'contain', width: 'auto' }}
                 />
               ) : (
                 <Image
                   src="/logo 白.png"
                   alt="CWrite"
                   width={120}
                   height={40}
                   className="object-contain h-full w-auto"
                   unoptimized
                   style={{ maxHeight: '100%', height: '100%', objectFit: 'contain', width: 'auto' }}
                 />
               )
             ) : isGalleryPage ? (
               // Gallery 页面使用白色 logo
               <Image
                 src="/logo 白.png"
                 alt="CWrite"
                 width={120}
                 height={40}
                 className="object-contain h-full w-auto"
                 unoptimized
                 style={{ maxHeight: '100%', height: '100%', objectFit: 'contain', width: 'auto' }}
               />
             ) : (
               // 其他非首页压缩状态使用白色 logo
               <Image
                 src="/logo 白.png"
                 alt="CWrite"
                 width={120}
                 height={40}
                 className="object-contain h-full w-auto"
                 unoptimized
                 style={{ maxHeight: '100%', height: '100%', objectFit: 'contain', width: 'auto' }}
               />
             )}
          </Link>
        </div>

               {/* Navigation Links + 用户头像 + 语言 */}
               <nav className="flex items-center gap-2 sm:gap-3 flex-shrink-0 min-w-0">
                 <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap justify-end">
                 {navItems.map((item) => {
                   // 检查是否激活
                  const isHomePageActive = (currentStage === 'home' || pathname === '/') && item.href === "/"
                  const isAboutPageActive = false
                  const isWritePageActive = currentStage === 'writeTypeSelection' && item.href === "/write"
                  const isGalleryPageActive = isGalleryPage && (item.href === "/gallery" || item.label === "Luminai Library")
                  const isActive = isHomePageActive || isAboutPageActive || isWritePageActive || isGalleryPageActive
                   return (
                     <Link
                       key={item.href}
                       href={item.href}
                       onClick={(e) => handleNavClick(item, e)}
                       className={`px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-200 whitespace-nowrap ${
                         isGalleryPage
                           ? isActive
                             ? 'text-yellow-200 hover:text-yellow-100' // Gallery 页面激活时显示黄色
                             : 'text-white hover:text-yellow-200' // Gallery 页面未激活按钮显示白色，hover 时变黄色
                           : isActive
                           ? showBackground
                             ? 'text-yellow-200' // 其他页面在滚动后显示低饱和度黄色，不显示按钮背景
                             : 'text-black' // 顶部时不显示背景，只显示文字
                           : showBackground
                           ? 'text-blue-100 hover:text-white' // 其他页面未激活按钮
                           : 'text-black drop-shadow-sm hover:text-gray-700' // 顶部时显示黑色文字
                       }`}
                     >
                       {item.label}
                     </Link>
                   )
                 })}
                {/* About us 下拉菜單 */}
                 <div className="relative">
                   <button
                     type="button"
                     onClick={() => setAboutMenuOpen((open) => !open)}
                     onMouseEnter={() => setAboutMenuOpen(true)}
                    className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-200 whitespace-nowrap ${
                       isAboutPage
                         ? showBackground
                           ? "text-yellow-200"
                           : "text-black"
                         : showBackground
                         ? "text-blue-100 hover:text-white"
                         : "text-black drop-shadow-sm hover:text-gray-700"
                     }`}
                   >
                     About us
                   </button>
                   {aboutMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 rounded-2xl border border-blue-200/30 bg-gradient-to-br from-slate-900/95 via-blue-950/95 to-slate-900/95 text-sm text-slate-100 shadow-2xl py-2 z-50 backdrop-blur-md"
                       onMouseLeave={() => setAboutMenuOpen(false)}
                     >
                       <button
                         type="button"
                        className="w-full px-4 py-3 text-left hover:bg-white/10 transition-all duration-200"
                         onClick={() => {
                           setAboutMenuOpen(false)
                           if (typeof window !== "undefined") {
                             window.dispatchEvent(new CustomEvent("navigateToAboutVision"))
                           }
                         }}
                       >
                        <span className="inline-flex items-center gap-2 font-semibold">
                          <span className="h-2 w-2 rounded-full bg-fuchsia-300" />
                          Vision &amp; Philosophy
                        </span>
                       </button>
                       <button
                         type="button"
                        className="w-full px-4 py-3 text-left hover:bg-white/10 transition-all duration-200"
                         onClick={() => {
                           setAboutMenuOpen(false)
                           if (typeof window !== "undefined") {
                             window.dispatchEvent(new CustomEvent("navigateToAboutResearchTeam"))
                           }
                         }}
                       >
                        <span className="inline-flex items-center gap-2 font-semibold">
                          <span className="h-2 w-2 rounded-full bg-cyan-300" />
                          Research Team
                        </span>
                       </button>
                     </div>
                   )}
                 </div>
                 </div>
                 
                {/* My Farm 文字按钮 - 登录后显示，点击进入农场 */}
                 {userInfo && (
                   <button
                     type="button"
                     onClick={() => window.dispatchEvent(new CustomEvent("navigateToUserProfile"))}
                    className="relative flex-shrink-0 ml-1 rounded-xl px-4 py-2 bg-white/10 text-white font-bold hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-slate-900/50"
                     aria-label="Go to My Farm"
                   >
                    My Farm
                     {userInfo.unreadCount > 0 && (
                       <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                         {userInfo.unreadCount > 99 ? "99+" : userInfo.unreadCount}
                       </span>
                     )}
                   </button>
                 )}

                 {/* Language Selector - 所有页面都显示 */}
                 <div className="flex gap-2 ml-2 flex-shrink-0">
                   <Button
                     onClick={() => handleLanguageChange("en")}
                     variant={language === "en" ? "default" : "outline"}
                     size="sm"
                     className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                       language === "en"
                         ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg border-0"
                         : showBackground
                         ? isGalleryPage
                           ? "bg-transparent border-2 border-blue-300 text-white hover:bg-blue-700/60"
                           : "bg-transparent border-2 border-blue-300 text-blue-100 hover:bg-blue-700/60"
                         : "bg-white/80 border-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                     }`}
                   >
                     ENG
                   </Button>
                   <Button
                     onClick={() => handleLanguageChange("zh")}
                     variant={language === "zh" ? "default" : "outline"}
                     size="sm"
                     className={`px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                       language === "zh"
                         ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg border-0"
                         : showBackground
                         ? isGalleryPage
                           ? "bg-transparent border-2 border-blue-300 text-white hover:bg-blue-700/60"
                           : "bg-transparent border-2 border-blue-300 text-blue-100 hover:bg-blue-700/60"
                         : "bg-white/80 border-2 border-purple-200 text-purple-700 hover:bg-purple-50"
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

