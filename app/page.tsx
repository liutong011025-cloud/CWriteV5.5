"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import LoginPage from "@/components/auth/login-page"
import {
  getPostLoginPath,
  getStoredUser,
  setStoredUser,
  type ClientAuthUser,
} from "@/lib/client-auth"

function LoginBootScreen() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-sky-200"
      aria-busy="true"
      aria-live="polite"
    >
      <Image
        src="/Cagenthang.webp"
        alt="Loading"
        width={160}
        height={160}
        priority
        className="h-32 w-32 object-contain animate-spin md:h-40 md:w-40"
        style={{ animationDuration: "1.4s" }}
      />
      <p className="mt-5 text-lg font-bold tracking-wide text-slate-800 md:text-xl">loading</p>
    </div>
  )
}

export default function PublicLoginPage() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const stored = getStoredUser()
    if (stored) {
      // 硬跳转，避免仍停在旧 homepage / 客户端路由缓存
      window.location.replace(getPostLoginPath(stored))
      return
    }
    setReady(true)
  }, [])

  if (!ready) {
    return <LoginBootScreen />
  }

  return (
    <LoginPage
      onLogin={(userData) => {
        const user = userData as ClientAuthUser
        setStoredUser(user)
        // 学生默认进 My Farm；教师进 dashboard（硬跳转确保一定离开登录页）
        window.location.replace(getPostLoginPath(user))
      }}
    />
  )
}
