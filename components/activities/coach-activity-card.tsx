"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Video, Flame, MessageSquare, VideoIcon, Edit, Trash2, ChefHat, Dumbbell, Zap } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VimeoPlayer } from "@/components/vimeo-player"
import { extractVimeoId } from "@/utils/vimeo-utils"
import type { Activity } from "@/types/activity"
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface CoachActivityCardProps {
  activity: Activity | undefined
  onDeleteSuccess?: () => void
}

export function CoachActivityCard({ activity, onDeleteSuccess }: CoachActivityCardProps) {
  const router = useRouter()
  const [showVideoPreview, setShowVideoPreview] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Validación robusta para evitar errores de undefined
  if (!activity) {
    return null
  }

  const formattedDuration = activity.program_info && activity.program_info.program_duration
    ? `${activity.program_info.program_duration} meses`
    : "Duración variable"

  const displayCoachRating = activity.coach_rating ? Number(activity.coach_rating).toFixed(1) : "0.0"

  const getActualVimeoId = () => {
    if (activity.media?.vimeo_id) return activity.media.vimeo_id
    if (activity.media?.video_url) {
      try {
        return extractVimeoId(activity.media.video_url)
      } catch (error) {
        console.error("Error extracting Vimeo ID from video_url:", error)
        return null
      }
    }
    return null
  }

  const actualVimeoId = getActualVimeoId()
  const hasVideoContent = !!actualVimeoId

  const includesVideocall = activity.consultation_info?.includes_videocall || false
  const includesMessage = activity.consultation_info?.includes_message || false

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/activities/${activity.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Error al eliminar la actividad.")
      }

      toast({
        title: "Actividad eliminada",
        description: `La actividad "${activity.title}" ha sido eliminada correctamente.`,
      })
      setShowDeleteConfirm(false)
      onDeleteSuccess?.() // Callback to refresh list
    } catch (error: any) {
      console.error("Error deleting activity:", error)
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar la actividad. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const renderTypeIcon = (type: string) => {
    const lowerType = type?.toLowerCase() || ""
    if (lowerType.includes("nutrition") || lowerType.includes("meal") || lowerType.includes("diet")) {
      return <ChefHat className="h-5 w-5 text-white" />
    } else if (lowerType.includes("program") || lowerType.includes("workout") || lowerType.includes("training")) {
      return <Dumbbell className="h-5 w-5 text-white" />
    } else if (lowerType.includes("video")) {
      return <Video className="h-5 w-5 text-white" />
    } else {
      return <Zap className="h-5 w-5 text-white" />
    }
  }

  return (
    <Card className="relative overflow-hidden rounded-xl shadow-lg flex flex-col h-full bg-gray-900 text-white">
      {/* Background Image */}
      <div className="absolute inset-0">
        {activity.media?.image_url ? (
          <Image
            src={activity.media.image_url || "/placeholder.svg"}
            alt={activity.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <Image
            src="/placeholder.svg?height=400&width=600"
            alt={activity.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={true}
          />
        )}
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col h-full p-4">
        {/* Top section: Type badge and optional video/consultation badges */}
        <div className="flex justify-between items-start mb-auto">
          <Badge className="bg-[#FF7939] text-white text-xs font-semibold px-3 py-1 rounded-full">
            {activity.type.toUpperCase()}
          </Badge>
          <div className="flex gap-2">
            {hasVideoContent && (
              <Badge className="bg-black/50 text-white border-white/20 backdrop-blur-sm text-xs px-3 py-1 rounded-full">
                <Video className="h-3 w-3 mr-1" />
                Video
              </Badge>
            )}
            {includesVideocall && (
              <Badge className="bg-black/50 text-white border-white/20 backdrop-blur-sm text-xs px-3 py-1 rounded-full">
                <VideoIcon className="h-3 w-3 mr-1" />
                Videollamada
              </Badge>
            )}
            {includesMessage && (
              <Badge className="bg-black/50 text-white border-white/20 backdrop-blur-sm text-xs px-3 py-1 rounded-full">
                <MessageSquare className="h-3 w-3 mr-1" />
                Mensajes
              </Badge>
            )}
          </div>
        </div>

        {/* Middle section: Title and Duration */}
        <div className="flex flex-col items-center justify-center flex-grow text-center px-4">
          <h3 className="font-extrabold text-3xl md:text-4xl leading-tight mb-2 drop-shadow-lg">{activity.title}</h3>
          <div className="bg-white/20 backdrop-blur-md rounded-lg px-6 py-2 text-sm font-medium text-white shadow-md">
            <Clock className="inline-block h-4 w-4 mr-1" />
            {formattedDuration}
          </div>
        </div>

        {/* Bottom section: Coach info, and Buttons */}
        <div className="bg-black/70 backdrop-blur-md rounded-lg p-4 mt-auto">
          <div className="flex items-center justify-between mb-4">
            {/* Coach Info */}
            <div className="flex items-center space-x-3">
              <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-[#FF7939]">
                <Image
                  src={activity.coach_avatar_url || "/placeholder.svg?height=40&width=40&query=coach avatar"}
                  alt={activity.coach_name || "Coach"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">{activity.coach_name || "Coach Desconocido"}</span>
                <div className="flex items-center text-xs text-gray-300">
                  <Flame className="h-3 w-3 mr-1 fill-[#FF7939] text-[#FF7939]" />
                  {displayCoachRating}
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex space-x-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="flex-1 bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <Link href={`/products/${activity.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              size="sm"
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Video Preview Dialog */}
      <Dialog open={showVideoPreview} onOpenChange={setShowVideoPreview}>
        <DialogContent className="bg-[#1E1E1E] text-white border-gray-800 sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Video className="h-5 w-5 mr-2 text-[#FF7939]" />
              Vista previa - {activity.title}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {hasVideoContent && <VimeoPlayer videoId={actualVimeoId || ""} title={activity.title} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        description={`¿Estás seguro de que quieres eliminar la actividad "${activity.title}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
        isConfirming={isDeleting}
      />
    </Card>
  )
}
