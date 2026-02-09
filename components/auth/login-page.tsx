"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import SpotlightCard from "@/components/ui/spotlight-card"

interface LoginPageProps {
  onLogin: (user: { username: string; role: 'teacher' | 'student'; noAi?: boolean }, showContinueDialog?: boolean) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden login-page">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <SpotlightCard 
          className="bg-neutral-900/95 backdrop-blur-xl"
          spotlightColor="rgba(255, 255, 255, 0.15)"
        >
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
            <p className="text-gray-300 font-semibold">Login to start your creative journey</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2 text-purple-400">Username</label>
              <Input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin()
                }}
                className="text-base py-3 border-2 border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus:border-purple-500 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-pink-400">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin()
                }}
                className="text-base py-3 border-2 border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-500 focus:border-pink-500 rounded-xl"
              />
            </div>

            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-xl text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </SpotlightCard>
      </div>
    </div>
  )
}
