"use client"

import { useEffect, useState } from "react"
import GalleryPage from "@/components/stages/gallery-page"
import { getStoredUser, type ClientAuthUser } from "@/lib/client-auth"

export default function LibraryPage() {
  const [user, setUser] = useState<ClientAuthUser | null>(null)

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  return (
    <main data-stage="gallery">
      <GalleryPage
        currentUser={user?.username ?? null}
        currentUserRole={user?.role ?? null}
      />
    </main>
  )
}
