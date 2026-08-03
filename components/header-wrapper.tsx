"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Header from "./header"

export default function HeaderWrapper() {
  const pathname = usePathname()
  const [shouldShowHeader, setShouldShowHeader] = useState(true)

  // 一律先跑完 hooks，再决定是否渲染（避免条件 return 导致 hooks 数量不一致、Header 整页崩掉）
  const hideByPath =
    pathname?.startsWith("/admin") ||
    pathname === "/" ||
    pathname?.startsWith("/teacher")

  // 学生主区始终显示全局 Header（journey 沉浸页用 data-no-header 临时关掉）
  const forceShowStudentNav =
    pathname === "/my-farm" ||
    pathname === "/writing" ||
    pathname === "/library" ||
    pathname === "/write" ||
    pathname === "/gallery"

  useEffect(() => {
    if (hideByPath) {
      setShouldShowHeader(false)
      return
    }

    const check = () => {
      if (forceShowStudentNav) {
        const noHeader = document.querySelector("[data-no-header]")
        // writing 流程里 journey / book-selection 可临时隐藏；farm / library 始终显示
        if (pathname === "/writing" || pathname === "/write") {
          setShouldShowHeader(!noHeader)
          return
        }
        setShouldShowHeader(true)
        return
      }

      const mainElement = document.querySelector("main[data-stage]")
      const stage = mainElement?.getAttribute("data-stage")
      const loginElements = document.querySelectorAll("[data-login-page]")
      const noHeaderElements = document.querySelectorAll("[data-no-header]")

      if (stage === "login" || stage === "dashboard") {
        setShouldShowHeader(false)
        return
      }

      if (loginElements.length > 0 || noHeaderElements.length > 0) {
        setShouldShowHeader(false)
        return
      }

      setShouldShowHeader(true)
    }

    check()
    const timeoutId = setTimeout(check, 50)
    const intervalId = setInterval(check, 400)

    const observer = new MutationObserver(check)
    if (typeof document !== "undefined" && document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-stage", "data-login-page", "data-no-header"],
      })
    }

    return () => {
      clearTimeout(timeoutId)
      clearInterval(intervalId)
      observer.disconnect()
    }
  }, [pathname, hideByPath, forceShowStudentNav])

  if (hideByPath || !shouldShowHeader) {
    return null
  }

  return <Header />
}
