"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Clock, User, DollarSign, ChevronLeft, Dumbbell, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VimeoPlayer } from "@/components/vimeo-player"
import { extractVimeoId } from "@/utils/vimeo-utils"
import { SimpleStartButton } from "@/components/simple-start-button"
import { createClient } from '@/lib/supabase-browser'

interface Activity {
  id: number
  title: string
  description: string
  image_url: string
  video_url: string
  vimeo_id: string
  price: number
  duration: number
  coach_id: string
  coach_name?: string
  type: string
  difficulty: string
  calories: number
  session_type: string
}

interface ActivityDetailViewProps {
  activity: Activity
  onEnroll?: (activityId: number) => void
  showBackButton?: boolean
  isEnrolled?: boolean
}

export function ActivityDetailView({
  activity,
  onEnroll,
  showBackButton = false,
  isEnrolled = false,
}: ActivityDetailViewProps) {
  const router = useRouter()
  const [coachName, setCoachName] = useState<string>("")
  const [isClient, setIsClient] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setIsClient(true)
    fetchCoachName()
  }, [activity.coach_id])

  const fetchCoachName = async () => {
    if (!activity.coach_id) return

    try {
      const { data, error } = await supabase
        .from("coaches")
        .select("users(name)")
        .eq("user_id", activity.coach_id)
        .single()

      if (error) throw error
      if (data && data.users) {
        setCoachName(data.users.name)
      }
    } catch (error) {
      console.error("Error fetching coach name:", error)
    }
  }

  const handleBack = () => {
    router.back()
  }

  const handleEnroll = () => {
    if (onEnroll) {
      onEnroll(activity.id)
    }
  }

  const vimeoId = activity.vimeo_id || extractVimeoId(activity.video_url || "")

  return (
    <div className="bg-[#121212] text-white rounded-lg overflow-hidden">
      {showBackButton && (
        <div className="p-4">
          <button onClick={handleBack} className="flex items-center text-gray-400 hover:text-white transition-colors">
            <ChevronLeft className="h-5 w-5 mr-1" />
            Volver
          </button>
        </div>
      )}

      <div className="relative aspect-video w-full overflow-hidden">
        {vimeoId && isClient ? (
          <VimeoPlayer vimeoId={vimeoId} />
        ) : (
          <Image
            src={activity.image_url || "/placeholder.svg?height=400&width=800&query=fitness"}
            alt={activity.title}
            className="object-cover"
            fill
            priority
          />
        )}
      </div>

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">{activity.title}</h1>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center text-gray-400">
            <User className="h-4 w-4 mr-1" />
            <span>{coachName || "Coach"}</span>
          </div>
          <div className="flex items-center text-gray-400">
            <Clock className="h-4 w-4 mr-1" />
            <span>{activity.duration} min</span>
          </div>
          <div className="flex items-center text-gray-400">
            <Dumbbell className="h-4 w-4 mr-1" />
            <span>{activity.difficulty || "Intermedio"}</span>
          </div>
          {activity.calories && (
            <div className="flex items-center text-gray-400">
              <BarChart3 className="h-4 w-4 mr-1" />
              <span>{activity.calories} cal</span>
            </div>
          )}
          {activity.price > 0 && (
            <div className="flex items-center text-gray-400">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>${activity.price}</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Descripción</h2>
          <p className="text-gray-300">{activity.description}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isEnrolled ? (
            <SimpleStartButton
              activityId={activity.id}
            />
          ) : (
            <Button
              className="flex items-center gap-2 bg-[#FF7939] hover:bg-[#E66829] text-white"
              onClick={handleEnroll}
            >
              <DollarSign className="h-4 w-4" />
              {activity.price > 0 ? `Comprar por $${activity.price}` : "Inscribirse Gratis"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
