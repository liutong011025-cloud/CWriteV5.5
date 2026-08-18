"use client"

import React, { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import SpotlightCard from "@/components/ui/spotlight-card"

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
  const [panelOffset, setPanelOffset] = useState(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 }
    try {
      const saved = localStorage.getItem("cwrite-login-panel-offset")
      if (saved) {
        const parsed = JSON.parse(saved) as { x?: number; y?: number }
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          return { x: parsed.x, y: parsed.y }
        }
      }
    } catch {
      // ignore invalid local cache
    }
    return { x: 0, y: 0 }
  })
  const [tuneOpen, setTuneOpen] = useState(true)
  const dragState = useRef<{
    pointerId: number
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem("cwrite-login-panel-offset", JSON.stringify(panelOffset))
    } catch {
      // ignore quota / private mode
    }
  }, [panelOffset])

  const nudgePanel = (dx: number, dy: number) => {
    setPanelOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
  }

  const handlePanelPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origX: panelOffset.x,
      origY: panelOffset.y,
    }
  }

  const handlePanelPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current || dragState.current.pointerId !== event.pointerId) return
    const dx = event.clientX - dragState.current.startX
    const dy = event.clientY - dragState.current.startY
    setPanelOffset({
      x: dragState.current.origX + dx,
      y: dragState.current.origY + dy,
    })
  }

  const handlePanelPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragState.current?.pointerId === event.pointerId) {
      dragState.current = null
    }
  }

  const copyPanelOffset = async () => {
    const text = `x: ${panelOffset.x}, y: ${panelOffset.y}`
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`已复制位置：${text}`)
    } catch {
      toast.message(`当前位置：${text}`)
    }
  }

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

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden login-page"
      data-login-page
    >
      {/* 背景居中铺满，无雾化 / 无遮罩 */}
      <div className="absolute inset-0 overflow-hidden bg-[#7ec8e8]">
        <img
          src="/Background1.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center select-none"
          draggable={false}
        />
      </div>

      <div
        className="max-w-sm w-full relative z-10"
        style={{ transform: `translate(${panelOffset.x}px, ${panelOffset.y}px)` }}
      >
        {tuneOpen && (
          <div
            onPointerDown={handlePanelPointerDown}
            onPointerMove={handlePanelPointerMove}
            onPointerUp={handlePanelPointerUp}
            onPointerCancel={handlePanelPointerUp}
            className="mb-2 flex cursor-grab items-center justify-center gap-2 rounded-xl border border-white/50 bg-black/55 px-3 py-1.5 text-xs font-semibold text-white shadow-lg active:cursor-grabbing"
          >
            <span aria-hidden>⋮⋮</span>
            拖动调整登录面板位置
          </div>
        )}
        <SpotlightCard className="px-10 py-6 shadow-2xl [background-color:rgba(20,16,32,0.52)]" spotlightColor="rgba(0, 229, 255, 0.2)">
          {entryStep === "role" ? (
            <div className="space-y-5 py-4">
              <div className="text-center mb-2">
                <div className="mb-2 mt-4 flex justify-center">
                  <Image
                    src="/logo.gif"
                    alt="CWrite Logo"
                    width={200}
                    height={200}
                    className="object-contain"
                    priority
                  />
                </div>
                <p className="text-white font-semibold text-lg">Choose your role to continue</p>
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
                <div className="mb-2 mt-4 flex justify-center">
                  <Image
                    src="/logo.gif"
                    alt="CWrite Logo"
                    width={220}
                    height={220}
                    className="object-contain"
                    priority
                  />
                </div>
                <p className="text-white font-semibold text-base md:text-lg">
                  {selectedRole === "teacher" ? "Teacher Portal" : "Student Portal"} ·{" "}
                  {mode === "login" ? "Login to start your creative journey" : "Register to begin your creative journey"}
                </p>
              </div>

              <div className="space-y-5">
                {mode === "login" ? (
                  <>
                <div>
                  <label className="block text-sm font-bold mb-2 text-white">Username</label>
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
                  <label className="block text-sm font-bold mb-2 text-white">Password</label>
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
                  <label className="block text-sm font-bold mb-2 text-white">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="text-base py-3 border-2 border-cyan-200 focus:border-cyan-500 rounded-xl bg-white/80 focus:bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">Name</label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="text-base py-3 border-2 border-purple-200 focus:border-purple-500 rounded-xl bg-white/80 focus:bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2 text-white">Password</label>
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

      {/* 临时位置调整工具：调好后把数值发给我，再固化并移除 */}
      <div className="absolute left-3 top-3 z-50 select-none">
        {tuneOpen ? (
          <div className="w-64 rounded-2xl border border-white/40 bg-black/75 p-3 text-white shadow-2xl backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold tracking-wide">登录面板位置工具</p>
              <button
                type="button"
                onClick={() => setTuneOpen(false)}
                className="rounded-md px-1.5 py-0.5 text-[11px] text-white/80 hover:bg-white/10"
              >
                收起
              </button>
            </div>
            <p className="mb-2 text-[11px] leading-snug text-white/75">
              可拖动面板上方的手柄，或用下方按钮微调。调好后点复制，把数值发给我。
            </p>
            <div className="space-y-2 text-[11px]">
              <label className="block">
                <span className="mb-1 flex justify-between">
                  <span>X（左右）</span>
                  <span className="font-mono">{panelOffset.x}px</span>
                </span>
                <input
                  type="range"
                  min={-480}
                  max={480}
                  value={panelOffset.x}
                  onChange={(e) => setPanelOffset((prev) => ({ ...prev, x: Number(e.target.value) }))}
                  className="w-full accent-cyan-300"
                />
              </label>
              <label className="block">
                <span className="mb-1 flex justify-between">
                  <span>Y（上下）</span>
                  <span className="font-mono">{panelOffset.y}px</span>
                </span>
                <input
                  type="range"
                  min={-360}
                  max={360}
                  value={panelOffset.y}
                  onChange={(e) => setPanelOffset((prev) => ({ ...prev, y: Number(e.target.value) }))}
                  className="w-full accent-cyan-300"
                />
              </label>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1">
              <span />
              <button type="button" onClick={() => nudgePanel(0, -8)} className="rounded-md bg-white/15 py-1 text-sm hover:bg-white/25">↑</button>
              <span />
              <button type="button" onClick={() => nudgePanel(-8, 0)} className="rounded-md bg-white/15 py-1 text-sm hover:bg-white/25">←</button>
              <button type="button" onClick={() => setPanelOffset({ x: 0, y: 0 })} className="rounded-md bg-white/15 py-1 text-[10px] hover:bg-white/25">复位</button>
              <button type="button" onClick={() => nudgePanel(8, 0)} className="rounded-md bg-white/15 py-1 text-sm hover:bg-white/25">→</button>
              <span />
              <button type="button" onClick={() => nudgePanel(0, 8)} className="rounded-md bg-white/15 py-1 text-sm hover:bg-white/25">↓</button>
              <span />
            </div>
            <div className="mt-2 rounded-lg bg-white/10 px-2 py-1.5 font-mono text-[11px]">
              x: {panelOffset.x}, y: {panelOffset.y}
            </div>
            <button
              type="button"
              onClick={copyPanelOffset}
              className="mt-2 w-full rounded-lg bg-cyan-400/90 py-1.5 text-xs font-bold text-slate-900 hover:bg-cyan-300"
            >
              复制当前位置
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setTuneOpen(true)}
            className="rounded-xl border border-white/40 bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-lg hover:bg-black/80"
          >
            显示位置工具
          </button>
        )}
      </div>
    </div>
  )
}
