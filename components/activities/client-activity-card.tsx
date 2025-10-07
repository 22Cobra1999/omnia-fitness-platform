"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Star, Video, Flame } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VimeoPlayer } from "@/components/vimeo-player"
import { extractVimeoId } from "@/utils/vimeo-utils"
import { PurchaseActivityModal } from "@/components/purchase-activity-modal"
import { useToast } from "@/components/ui/use-toast"
import type { Activity } from "@/types/activity"

interface ClientActivityCardProps extends Activity {
  showPurchaseButton?: boolean
  onPurchase?: (activity: Activity) => void // Pass the whole activity object
  isEnrolled?: boolean // Added to control button text/visibility
}

export function ClientActivityCard({
  id,
  title,
  price,
  type,
  difficulty,
  coach_name,
  coach_rating,
  coach_avatar_url,
  program_rating,
  total_program_reviews,
  showPurchaseButton = false,
  onPurchase,
  isEnrolled = false,
  media, // Now comes from the nested media object
  program_info, // Now comes from the nested program_info object
}: ClientActivityCardProps) {
  const formattedDuration = program_info?.program_duration
    ? `${program_info.program_duration} meses`
    : "Duración variable"
  const displayProgramRating = program_rating ? Number(program_rating).toFixed(1) : "0.0"
  const displayProgramReviews = total_program_reviews || 0
  const displayCoachRating = coach_rating ? Number(coach_rating).toFixed(1) : "0.0"

  const [showVideoPreview, setShowVideoPreview] = useState(false)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const { toast } = useToast()

  const getActualVimeoId = () => {
    if (media?.vimeo_id) return media.vimeo_id
    if (media?.video_url) {
      try {
        return extractVimeoId(media.video_url)
      } catch (error) {
        console.error("Error extracting Vimeo ID from video_url:", error)
        return null
      }
    }
    return null
  }

  const actualVimeoId = getActualVimeoId()
  const hasVideoContent = !!actualVimeoId

  const handlePurchaseClick = () => {
    if (onPurchase) {
      onPurchase({
        id,
        title,
        price,
        type,
        difficulty,
        coach_name,
        coach_rating,
        coach_avatar_url,
        program_rating,
        total_program_reviews,
        media,
        program_info,
        coach_id: "", // Placeholder, ensure coach_id is passed if needed for purchase
        is_public: true,
        description: "",
        created_at: "",
        updated_at: "",
      })
    } else {
      setPurchaseModalOpen(true)
    }
  }

  const handlePurchaseComplete = (enrollment: any) => {
    console.log("Purchase completed in ClientActivityCard:", enrollment)
    setPurchaseModalOpen(false)
    toast({
      title: "¡Compra exitosa!",
      description: `Has adquirido "${title}" correctamente.`,
    })
    // Optionally, refresh the page or update state to reflect enrollment
    window.location.reload()
  }

  return (
    <Card className="relative overflow-hidden rounded-xl shadow-lg flex flex-col h-full bg-gray-900 text-white">
      {/* Background Image */}
      <div className="absolute inset-0">
        {media?.image_url ? (
          <Image
            src={media.image_url || "/placeholder.svg"}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <Image
            src="/placeholder.svg?height=400&width=600"
            alt={title}
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
        {/* Top section: Type badge and optional video badge */}
        <div className="flex justify-between items-start mb-auto">
          <Badge className="bg-[#FF7939] text-white text-xs font-semibold px-3 py-1 rounded-full">
            {type.toUpperCase()}
          </Badge>
          {hasVideoContent && (
            <Badge className="bg-black/50 text-white border-white/20 backdrop-blur-sm text-xs px-3 py-1 rounded-full">
              <Video className="h-3 w-3 mr-1" />
              Video
            </Badge>
          )}
        </div>

        {/* Middle section: Title and Duration */}
        <div className="flex flex-col items-center justify-center flex-grow text-center px-4">
          <h3 className="font-extrabold text-3xl md:text-4xl leading-tight mb-2 drop-shadow-lg">{title}</h3>
          <div className="bg-white/20 backdrop-blur-md rounded-lg px-6 py-2 text-sm font-medium text-white shadow-md">
            <Clock className="inline-block h-4 w-4 mr-1" />
            {formattedDuration}
          </div>
        </div>

        {/* Bottom section: Coach info, Program Rating, and Buttons */}
        <div className="bg-black/70 backdrop-blur-md rounded-lg p-4 mt-auto">
          <div className="flex items-center justify-between mb-4">
            {/* Coach Info */}
            <div className="flex items-center space-x-3">
              <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-[#FF7939]">
                <Image
                  src={coach_avatar_url || "/placeholder.svg?height=40&width=40&query=coach avatar"}
                  alt={coach_name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">{coach_name}</span>
                <div className="flex items-center text-xs text-gray-300">
                  <Flame className="h-3 w-3 mr-1 fill-[#FF7939] text-[#FF7939]" />
                  {displayCoachRating}
                </div>
              </div>
            </div>

            {/* Program Rating */}
            <div className="flex items-center space-x-1 text-sm text-gray-200">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>
                {displayProgramRating} ({displayProgramReviews})
              </span>
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
              <Link href={`/activities/${id}`}>Ver detalles</Link>
            </Button>
            {isEnrolled ? (
              <Button asChild size="sm" className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                <Link href={`/program-tracker/${id}`}>Continuar</Link>
              </Button>
            ) : (
              showPurchaseButton && (
                <Button
                  onClick={handlePurchaseClick}
                  size="sm"
                  className="flex-1 bg-[#FF7939] hover:bg-[#E66829] text-white font-bold"
                >
                  Comprar ${price}
                </Button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Video Preview Dialog */}
      <Dialog open={showVideoPreview} onOpenChange={setShowVideoPreview}>
        <DialogContent className="bg-[#1E1E1E] text-white border-gray-800 sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Video className="h-5 w-5 mr-2 text-[#FF7939]" />
              Vista previa - {title}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {hasVideoContent && <VimeoPlayer videoId={actualVimeoId || ""} title={title} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase Activity Modal (if onPurchase prop is not used) */}
      {!onPurchase && (
        <PurchaseActivityModal
          isOpen={purchaseModalOpen}
          onClose={() => setPurchaseModalOpen(false)}
          activity={{
            id,
            title,
            price,
            type,
            difficulty,
            coach_name,
            coach_rating,
            coach_avatar_url,
            program_rating,
            total_program_reviews,
            media,
            program_info,
            coach_id: "", // Placeholder
            is_public: true,
            description: "",
            created_at: "",
            updated_at: "",
          }}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
    </Card>
  )
}
