"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Flame, Target, Check, Clock } from "lucide-react"

interface ActivityDetailCardProps {
  id: number
  title: string
  category: string
  coachName: string
  coachAvatarUrl?: string
  description: string
  programRating: number
  totalProgramReviews: number
  price: number
  backgroundImageUrl?: string
  difficulty: string
  durationWeeks: number
  hasPdfs: boolean
  features: {
    trainingPlan: boolean
    videoCalls: boolean
    privateChat: boolean
    downloadablePdfs: boolean
  }
  testimonial?: {
    text: string
    author: string
  }
  onPurchase: (activityId: number) => void
}

export function ActivityDetailCard({
  id,
  title,
  category,
  coachName,
  coachAvatarUrl,
  description,
  programRating,
  totalProgramReviews,
  price,
  backgroundImageUrl,
  difficulty,
  durationWeeks,
  hasPdfs,
  features,
  testimonial,
  onPurchase,
}: ActivityDetailCardProps) {
  const displayProgramRating = programRating ? Number(programRating).toFixed(1) : "0.0"
  const displayTotalReviews = totalProgramReviews || 0

  return (
    <Card className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl bg-[#1E1E1E] text-white">
      {/* Background Image */}
      <div className="relative h-64 w-full">
        <Image
          src={backgroundImageUrl || "/placeholder.svg?height=256&width=400&query=fitness woman lifting weights"}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

      </div>

      {/* Content Section */}
      <div className="relative z-10 p-6 -mt-12 bg-[#1E1E1E] rounded-t-3xl">
        {/* Title and Category */}
        <div className="flex items-center mb-2">
          <Flame className="h-6 w-6 mr-2 text-[#FF7939] fill-[#FF7939]" />
          <h2 className="text-3xl font-extrabold leading-tight">{title}</h2>
        </div>
        <p className="text-gray-400 text-sm mb-4">{category}</p>

        {/* Coach Info */}
        <div className="flex items-center mb-4">
          <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-[#FF7939]">
            <Image
              src={coachAvatarUrl || "/placeholder.svg?height=40&width=40&query=coach avatar"}
              alt={coachName}
              fill
              className="object-cover"
            />
          </div>
          <span className="ml-3 text-lg font-semibold text-white">con {coachName}</span>
        </div>

        {/* Description */}
        <p className="text-gray-300 mb-3 leading-relaxed">{description}</p>

        {/* Feature Badges */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge className="bg-[#2A2A2A] text-white border border-[#3A3A3A] px-3 py-1 rounded-full text-sm font-medium">
            <Target className="h-4 w-4 mr-1 text-[#FF7939]" />
            {difficulty}
          </Badge>
          <Badge className="bg-[#2A2A2A] text-white border border-[#3A3A3A] px-3 py-1 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4 mr-1 text-[#FF7939]" />
            {durationWeeks} semanas
          </Badge>
          {hasPdfs && (
            <Badge className="bg-[#2A2A2A] text-white border border-[#3A3A3A] px-3 py-1 rounded-full text-sm font-medium">
              <Check className="h-4 w-4 mr-1 text-[#FF7939]" />
              PDFs descarg.
            </Badge>
          )}
        </div>

        {/* Included Features List */}
        <div className="grid grid-cols-2 gap-y-3 mb-6">
          {features.trainingPlan && (
            <div className="flex items-center text-gray-300 text-sm">
              <Check className="h-4 w-4 mr-2 text-[#FF7939]" />
              Plan de entrenamiento
            </div>
          )}
          {features.videoCalls && (
            <div className="flex items-center text-gray-300 text-sm">
              <Check className="h-4 w-4 mr-2 text-[#FF7939]" />
              Videollamadas
            </div>
          )}
          {features.privateChat && (
            <div className="flex items-center text-gray-300 text-sm">
              <Check className="h-4 w-4 mr-2 text-[#FF7939]" />
              Chat privado
            </div>
          )}
          {features.downloadablePdfs && (
            <div className="flex items-center text-gray-300 text-sm">
              <Check className="h-4 w-4 mr-2 text-[#FF7939]" />
              PDFs descargables
            </div>
          )}
        </div>

        {/* Testimonial */}
        {testimonial && (
          <div className="bg-[#2A2A2A] rounded-lg p-4 mb-6">
            <p className="text-gray-200 italic text-base mb-2">&quot;{testimonial.text}&quot;</p>
            <p className="text-gray-400 text-sm text-right">— {testimonial.author}</p>
          </div>
        )}

        {/* Price and Buy Button */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-700">
          <span className="text-3xl font-bold text-white">${price.toFixed(2).replace(".", ",")}</span>
          <Button
            className="bg-[#FF7939] hover:bg-[#E66829] text-white font-bold py-3 px-6 rounded-xl text-lg"
            onClick={() => onPurchase(id)}
          >
            Comprar ahora
          </Button>
        </div>
      </div>
    </Card>
  )
}
