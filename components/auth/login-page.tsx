"use client"

import React, { useEffect, useState } from "react"
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

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login")
  const [entryStep, setEntryStep] = useState<"role" | "auth">("role")
  const [selectedRole, setSelectedRole] = useState<"teacher" | "student" | null>(null)
  const [username, setUsername] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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

    const timeoutId = window.setTimeout(warmAudioCache, 300)
    return () => window.clearTimeout(timeoutId)
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

  const handleRegister = async () => {
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
        }),
      })

      const data = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }))

      if (!response.ok || !data.success) {
        toast.error(data.error || data.hint || `Register failed (${response.status})`)
        return
      }

      if (selectedRole === "teacher" && data.user.role !== "teacher") {
        toast.error("Teacher registration is not enabled in this flow.")
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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden login-page" data-login-page>
      {/* 背景图片 - 左上部分 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-full h-full bg-cover bg-no-repeat"
          style={{
            backgroundImage: 'url(/Background.webp)',
            backgroundPosition: 'left top',
            backgroundSize: 'cover',
            filter: 'blur(4px) brightness(0.8)',
            transform: 'scale(1.1)',
          }}
        />
        {/* 渐变遮罩让背景更柔和，保证内容清晰 */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-indigo-800/40 to-pink-900/50" />
        {/* 额外的半透明遮罩 */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* 装饰性背景元素 - 降低透明度 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-sm w-full relative z-10">
        <SpotlightCard className="px-10 py-6 shadow-2xl" spotlightColor="rgba(0, 229, 255, 0.2)">
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

                <button
                  type="button"
                  onClick={() => {
                    setMode("register")
                    setPassword("")
                  }}
                  className="w-full rounded-xl border border-white/40 bg-white/10 py-3 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20"
                >
                  Create a new account
                </button>
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
    </div>
  )
}
