"use client"

import React, { useState, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface Position {
  x: number;
  y: number;
}

interface LoginPageProps {
  onLogin: (user: { username: string; role: 'teacher' | 'student'; noAi?: boolean }, showContinueDialog?: boolean) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const divRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState<number>(0)

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = e => {
    if (!divRef.current || isFocused) return

    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleFocus = () => {
    setIsFocused(true)
    setOpacity(0.6)
  }

  const handleBlur = () => {
    setIsFocused(false)
    setOpacity(0)
  }

  const handleMouseEnter = () => {
    setOpacity(0.6)
  }

  const handleMouseLeave = () => {
    setOpacity(0)
  }

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
        toast.error(errorData.error || `Login failed (${response.status})`)
        return
      }

      const data = await response.json()

      if (data.success) {
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden login-page" data-login-page>
      {/* 背景图片 - 左上部分 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 w-full h-full bg-cover bg-no-repeat"
          style={{
            backgroundImage: 'url(/Background.png)',
            backgroundPosition: 'left top',
            backgroundSize: 'cover',
            filter: 'blur(8px) brightness(0.7)',
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

      <div className="max-w-md w-full relative z-10">
        <div
          ref={divRef}
          onMouseMove={handleMouseMove}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative rounded-3xl border border-neutral-700 bg-neutral-800/80 backdrop-blur-sm overflow-hidden p-8"
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
            style={{
              opacity,
              background: `radial-gradient(circle at ${position.x}px ${position.y}px, rgba(255, 255, 255, 0.25), transparent 80%)`
            }}
          />
          <div className="text-center mb-6">
            <div className="mb-3 mt-6 flex justify-center">
              <Image
                src="/logo2.png"
                alt="CWrite Logo"
                width={350}
                height={350}
                className="object-contain animate-pulse"
                priority
                unoptimized
              />
            </div>
            <p className="text-white font-semibold">Login to start your creative journey</p>
          </div>

          <div className="space-y-5">
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
                className="text-base py-3 border-2 border-purple-200 focus:border-purple-500 rounded-xl text-white bg-neutral-700/50 placeholder:text-gray-400"
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
                className="text-base py-3 border-2 border-pink-200 focus:border-pink-500 rounded-xl text-white bg-neutral-700/50 placeholder:text-gray-400"
              />
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white border-0 shadow-xl py-6 text-lg font-bold disabled:opacity-50"
            >
              {isLoading ? "Logging in..." : "🚀 Login"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
