"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import SpotlightCard from "@/components/ui/spotlight-card"

/**
 * 锁定构图：以浏览器 67% 缩放、参考屏 1920×1080 时的 CSS 视口为设计稿。
 * 舞台用 cover 等比放大铺满视口（永不露底色）；背景同样 cover，裁切但不留空。
 */
const DESIGN_W = Math.round(1920 / 0.67) // ≈ 2866
const DESIGN_H = Math.round(1080 / 0.67) // ≈ 1612

const LOCKED_LAYOUT = {
  bgPosX: 49,
  bgPosY: 90,
  panelWidth: 478,
  panelScale: 1.38,
  panelRight: 493,
  panelTop: 50,
  glassOpacity: 0.12,
  logoSize: 337,
} as const

interface LoginUser {
  username: string
  role: "teacher" | "student"
  noAi?: boolean
  // 文案專用帳號標記（copywriting）
  isCopywriter?: boolean
}

interface LoginPageProps {
  onLogin: (user: LoginUser, showContinueDialog?: boolean) => void
}

// 新用户注册开关（学生 + 教师）
const REGISTRATION_ENABLED = true
const TEACHER_REGISTRATION_ENABLED = true
const REGISTRATION_DISABLED_MESSAGE = "New user registration: Function is not available."

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [entryStep, setEntryStep] = useState<"role" | "auth">("role")
  const [selectedRole, setSelectedRole] = useState<"teacher" | "student" | null>(null)
  const [username, setUsername] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [stageScale, setStageScale] = useState(1)
  const [bgReady, setBgReady] = useState(false)

  useEffect(() => {
    const updateScale = () => {
      // cover：取较大缩放，舞台永远盖满视口，不会露出非背景区域
      const scale = Math.max(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H)
      setStageScale(scale)
    }
    updateScale()
    window.addEventListener("resize", updateScale)
    window.visualViewport?.addEventListener("resize", updateScale)
    return () => {
      window.removeEventListener("resize", updateScale)
      window.visualViewport?.removeEventListener("resize", updateScale)
    }
  }, [])

  // 预加载登录背景，就绪后再展示登录 UI
  useEffect(() => {
    let cancelled = false
    const img = new window.Image()
    const finish = () => {
      if (!cancelled) setBgReady(true)
    }
    img.onload = finish
    img.onerror = finish
    img.src = "/Background1.png"
    if (img.complete) finish()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const warmAudioCache = () => {
      const audioSources = [
        "/yoshiyuki_tatsuya-pixel-hearts-foreverwav-427383.mp3",
        "/soundreality-finger-snap-179180.mp3",
      ]

      audioSources.forEach((src) => {
        try {
          const audio = new Audio(src)
          audio.preload = "auto"
          audio.load?.()
        } catch {
          // ignore preload failures on unsupported browsers
        }
      })
    }

    if (typeof window === "undefined") return

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(warmAudioCache, { timeout: 1500 })
      return () => window.cancelIdleCallback(idleId)
    }

    const timeoutId = globalThis.setTimeout(warmAudioCache, 300)
    return () => globalThis.clearTimeout(timeoutId)
  }, [])

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter both username and password")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        // 如果响应不成功，尝试读取错误信息
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }))
        toast.error(errorData.error || errorData.hint || `Login failed (${response.status})`)
        return
      }

      const data = await response.json()

      if (data.success) {
        if (selectedRole && data.user.role !== selectedRole) {
          toast.error(
            selectedRole === "teacher"
              ? "This account is not a teacher account."
              : "This account is not a student account.",
          )
          return
        }
        toast.success(`Welcome, ${data.user.username}!`)
        // 传递 true 表示需要显示继续作品对话框
        onLogin(data.user, true)
      } else {
        toast.error(data.error || "Login failed")
      }
    } catch (error) {
      console.error("Login error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(`Login failed: ${errorMessage}. Please check if the server is running.`)
    } finally {
      setIsLoading(false)
    }
  }

  const registrationAllowed =
    REGISTRATION_ENABLED && (selectedRole !== "teacher" || TEACHER_REGISTRATION_ENABLED)

  const handleRegister = async () => {
    if (!REGISTRATION_ENABLED) {
      toast.error(REGISTRATION_DISABLED_MESSAGE)
      return
    }

    if (selectedRole === "teacher" && !TEACHER_REGISTRATION_ENABLED) {
      toast.error("Teacher registration is not available.")
      return
    }

    if (!selectedRole) {
      toast.error("Please choose Teacher or Student first")
      return
    }

    if (!registerName.trim() || !registerEmail.trim() || !password.trim()) {
      toast.error("Please enter your name, email, and password")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "register",
          name: registerName,
          email: registerEmail,
          password,
          role: selectedRole,
        }),
      })

      const data = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }))

      if (!response.ok || !data.success) {
        toast.error(data.error || data.hint || `Register failed (${response.status})`)
        return
      }

      if (data.user.role !== selectedRole) {
        toast.error(
          selectedRole === "teacher"
            ? "This account was not created as a teacher account."
            : "This account was not created as a student account.",
        )
        return
      }

      toast.success(`Welcome, ${data.user.username}! Your account is ready.`)
      onLogin(data.user, false)
    } catch (error) {
      console.error("Register error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      toast.error(`Register failed: ${errorMessage}. Please check if the server is running.`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!bgReady) {
    return (
      <div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-sky-200 login-page"
        data-login-page
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

  return (
    <div className="fixed inset-0 overflow-hidden login-page" data-login-page>
      {/* 底层保险：视口级 cover，任何缝隙也是背景图 */}
      <div
        className="absolute inset-0 bg-no-repeat"
        style={{
          backgroundImage: "url(/Background1.png)",
          backgroundPosition: `${LOCKED_LAYOUT.bgPosX}% ${LOCKED_LAYOUT.bgPosY}%`,
          backgroundSize: "cover",
        }}
      />

      {/* 锁定构图舞台：cover 缩放，换设备/缩放只整体缩放，相对位置不变 */}
      <div
        className="absolute left-1/2 top-1/2 shrink-0 overflow-hidden"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform: `translate(-50%, -50%) scale(${stageScale})`,
          transformOrigin: "center center",
        }}
      >
        <div
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: "url(/Background1.png)",
            backgroundPosition: `${LOCKED_LAYOUT.bgPosX}% ${LOCKED_LAYOUT.bgPosY}%`,
            backgroundSize: "cover",
          }}
        />

        <div
          className="absolute z-10"
          style={{
            width: LOCKED_LAYOUT.panelWidth,
            right: LOCKED_LAYOUT.panelRight,
            top: `${LOCKED_LAYOUT.panelTop}%`,
            transform: `translateY(-50%) scale(${LOCKED_LAYOUT.panelScale})`,
            transformOrigin: "right center",
          }}
        >
          <SpotlightCard
            className="px-14 py-10 shadow-2xl"
            glassOpacity={LOCKED_LAYOUT.glassOpacity}
            spotlightColor="rgba(0, 229, 255, 0.15)"
          >
            {entryStep === "role" ? (
              <div className="space-y-5 py-4">
                <div className="text-center mb-2">
                  <div className="mb-2 mt-2 flex justify-center">
                    <Image
                      src="/logo.gif"
                      alt="CWrite Logo"
                      width={LOCKED_LAYOUT.logoSize}
                      height={LOCKED_LAYOUT.logoSize}
                      className="object-contain"
                      style={{ width: LOCKED_LAYOUT.logoSize, height: LOCKED_LAYOUT.logoSize }}
                      priority
                    />
                  </div>
                  <p className="text-white font-semibold text-lg drop-shadow">Choose your role to continue</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole("teacher")
                      setEntryStep("auth")
                    }}
                    className="w-full rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50/95 to-orange-100/95 px-4 py-7 text-center text-amber-950 shadow-xl backdrop-blur-md transition hover:from-amber-100 hover:to-orange-100"
                  >
                    <div className="text-3xl mb-2">🧑‍🏫</div>
                    <div className="text-xl font-bold text-amber-950">I am a Teacher</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole("student")
                      setEntryStep("auth")
                    }}
                    className="w-full rounded-2xl border border-sky-200/80 bg-gradient-to-b from-sky-50/95 to-blue-100/95 px-4 py-7 text-center text-sky-950 shadow-xl backdrop-blur-md transition hover:from-sky-100 hover:to-blue-100"
                  >
                    <div className="text-3xl mb-2">🧑‍🎓</div>
                    <div className="text-xl font-bold text-sky-950">I am a Student</div>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="mb-2 mt-2 flex justify-center">
                    <Image
                      src="/logo.gif"
                      alt="CWrite Logo"
                      width={LOCKED_LAYOUT.logoSize}
                      height={LOCKED_LAYOUT.logoSize}
                      className="object-contain"
                      style={{ width: LOCKED_LAYOUT.logoSize, height: LOCKED_LAYOUT.logoSize }}
                      priority
                    />
                  </div>
                  <p className="text-white font-semibold text-base md:text-lg drop-shadow">
                    {selectedRole === "teacher" ? "Teacher Portal" : "Student Portal"} ·{" "}
                    {mode === "login" ? "Login to start your creative journey" : "Register to begin your creative journey"}
                  </p>
                </div>

                <div className="space-y-5">
                  {mode === "login" ? (
                    <>
                      <div>
                        <label className="block text-sm font-bold mb-2 text-white drop-shadow">Username</label>
                        <Input
                          type="text"
                          placeholder="Enter your username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleLogin()
                          }}
                          className="text-base py-3 border-2 border-purple-200 focus:border-purple-500 rounded-xl bg-white/80 focus:bg-white text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2 text-white drop-shadow">Password</label>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleLogin()
                          }}
                          className="text-base py-3 border-2 border-pink-200 focus:border-pink-500 rounded-xl bg-white/80 focus:bg-white text-gray-900"
                        />
                      </div>

                      <Button
                        onClick={handleLogin}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white border-0 shadow-xl py-6 text-lg font-bold disabled:opacity-50"
                      >
                        {isLoading ? "Logging in..." : "🚀 Login"}
                      </Button>

                      {registrationAllowed ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMode("register")
                            setPassword("")
                          }}
                          className="w-full rounded-xl border border-white/40 bg-white/10 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
                        >
                          Create a new {selectedRole === "teacher" ? "teacher" : "student"} account
                        </button>
                      ) : (
                        <p className="w-full rounded-xl border border-white/30 bg-white/10 py-3 px-4 text-center text-sm text-white/90 backdrop-blur-md">
                          {!REGISTRATION_ENABLED ? REGISTRATION_DISABLED_MESSAGE : "Teacher registration is not available."}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-bold mb-2 text-white drop-shadow">Email</label>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          className="text-base py-3 border-2 border-cyan-200 focus:border-cyan-500 rounded-xl bg-white/80 focus:bg-white text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2 text-white drop-shadow">Name</label>
                        <Input
                          type="text"
                          placeholder="Enter your name"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          className="text-base py-3 border-2 border-purple-200 focus:border-purple-500 rounded-xl bg-white/80 focus:bg-white text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2 text-white drop-shadow">Password</label>
                        <Input
                          type="password"
                          placeholder="Create your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRegister()
                          }}
                          className="text-base py-3 border-2 border-pink-200 focus:border-pink-500 rounded-xl bg-white/80 focus:bg-white text-gray-900"
                        />
                      </div>

                      <Button
                        onClick={handleRegister}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-cyan-500 via-purple-600 to-pink-600 hover:from-cyan-600 hover:via-purple-700 hover:to-pink-700 text-white border-0 shadow-xl py-6 text-lg font-bold disabled:opacity-50"
                      >
                        {isLoading ? "Creating account..." : "✨ Register"}
                      </Button>

                      <button
                        type="button"
                        onClick={() => {
                          setMode("login")
                          setUsername(registerName)
                          setPassword("")
                        }}
                        className="w-full rounded-xl border border-white/40 bg-white/10 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
                      >
                        Back to login
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setEntryStep("role")}
                    className="w-full rounded-xl border border-white/30 bg-white/10 py-2.5 text-xs font-semibold text-white hover:bg-white/20"
                  >
                    ← Back to role selection
                  </button>
                </div>
              </>
            )}
          </SpotlightCard>
        </div>
      </div>
    </div>
  )
}
