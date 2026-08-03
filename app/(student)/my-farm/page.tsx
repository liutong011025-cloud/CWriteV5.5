"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import UserProfilePage from "@/components/stages/user-profile-page"
import UserSettingsPage from "@/components/stages/user-settings-page"
import NavigationPage from "@/components/stages/navigation-page"
import { getStoredUser, type ClientAuthUser } from "@/lib/client-auth"

type FarmView = "farm" | "settings" | "navigation" | "otherFarm"

export default function MyFarmPage() {
  const router = useRouter()
  const [user, setUser] = useState<ClientAuthUser | null>(null)
  const [view, setView] = useState<FarmView>("farm")
  const [otherUsername, setOtherUsername] = useState<string | null>(null)
  const [headerProfile, setHeaderProfile] = useState<{
    avatarUrl?: string | null
    avatarEmoji?: string | null
  }>({})

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  useEffect(() => {
    if (!user?.username) return
    fetch(`/api/user-profile?user_id=${encodeURIComponent(user.username)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setHeaderProfile({
            avatarUrl: data.avatarUrl ?? null,
            avatarEmoji: data.avatarEmoji ?? null,
          })
          window.dispatchEvent(
            new CustomEvent("headerUserInfo", {
              detail: {
                username: user.username,
                avatarUrl: data.avatarUrl ?? null,
                avatarEmoji: data.avatarEmoji ?? null,
                unreadCount: 0,
              },
            }),
          )
        }
      })
      .catch(() => {})
  }, [user?.username])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-700 font-semibold">
        Loading…
      </div>
    )
  }

  if (view === "settings") {
    return (
      <UserSettingsPage
        userId={user.username}
        backLabel="Back to Farm"
        onBack={() => setView("farm")}
        onProfileUpdated={(profile) => {
          setHeaderProfile((prev) => ({ ...prev, ...profile }))
          window.dispatchEvent(
            new CustomEvent("headerUserInfo", {
              detail: {
                username: user.username,
                unreadCount: 0,
                ...profile,
              },
            }),
          )
        }}
      />
    )
  }

  if (view === "navigation") {
    return (
      <NavigationPage
        currentUsername={user.username}
        onBack={() => setView("farm")}
        onSelectFarm={(friendName) => {
          setOtherUsername(friendName)
          setView("otherFarm")
        }}
      />
    )
  }

  if (view === "otherFarm" && otherUsername) {
    return (
      <UserProfilePage
        userId={otherUsername}
        userRole="student"
        currentUsername={user.username}
        currentUserRole={user.role}
        onBack={() => {
          setOtherUsername(null)
          setView("navigation")
        }}
        onOpenSettings={() => setView("settings")}
        onVisitOthersFarm={() => setView("navigation")}
        isOtherFarm
      />
    )
  }

  return (
    <main data-stage="userProfile">
      <UserProfilePage
        userId={user.username}
        userRole={user.role}
        currentUsername={user.username}
        currentUserRole={user.role}
        avatarUrl={headerProfile.avatarUrl}
        avatarEmoji={headerProfile.avatarEmoji}
        onBack={() => router.push("/writing")}
        onOpenSettings={() => setView("settings")}
        onVisitOthersFarm={() => setView("navigation")}
      />
    </main>
  )
}
