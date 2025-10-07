"use client"

import { CoachAvailabilityPage } from "@/components/coach/coach-availability-page"
import { useUser } from "@supabase/auth-helpers-react"
import { Loader2 } from "lucide-react"

export default function AvailabilityPage() {
  const user = useUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <CoachAvailabilityPage coachId={user.id} />
}
