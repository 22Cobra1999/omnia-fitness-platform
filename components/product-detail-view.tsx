"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Star, Video, DollarSign, MessageCircle, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { VimeoEmbed } from "@/components/vimeo-embed"
import { extractVimeoId } from "@/utils/vimeo-utils"
import { useToast } from "@/components/ui/use-toast"
import { PurchaseActivityModal } from "@/components/purchase-activity-modal"
import { getSupabaseClient } from "@/lib/supabase-singleton"
import type { Activity } from "@/types/activity"

interface ProductDetailViewProps {
  activityId: string
}

export function ProductDetailView({ activityId }: ProductDetailViewProps) {
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const supabase = getSupabaseClient()
  const { toast } = useToast()

  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: activity, error } = await supabase
          .from("activities")
          .select("*")
          .eq("id", activityId)
          .single()

        if (error) {
          throw error
        }

        if (!activity) {
          setError("Actividad no encontrada.")
          return
        }

        // Flatten the nested objects if they are arrays
        const formattedActivity: Activity = {
          ...activity,
          availability: activity.availability ? activity.availability[0] : null,
          consultation_info: activity.consultation_info ? activity.consultation_info[0] : null,
          program_info: activity.program_info ? activity.program_info[0] : null,
          media: activity.media ? activity.media[0] : null,
          coach_name: activity.coaches?.full_name || null,
          coach_whatsapp: activity.coaches?.whatsapp || null,
          coach_avatar_url: activity.coaches?.avatar_url || null,
        }

        setActivity(formattedActivity)

        // Check if client is already enrolled
        const { data: user, error: userError } = await supabase.auth.getUser()
        if (userError || !user?.user) {
          console.warn("User not authenticated, cannot check enrollment status.")
          setIsEnrolled(false)
        } else {
          const { data: enrollmentData, error: enrollmentError } = await supabase
            .from("activity_enrollments")
            .select("id")
            .eq("client_id", user.user.id)
            .eq("activity_id", activityId)
            .in("status", ["active", "enrolled", "pending"])
            .single()

          if (enrollmentError && enrollmentError.code !== "PGRST116") {
            // PGRST116 means no rows found, which is fine
            console.error("Error checking enrollment:", enrollmentError)
            // Don't throw, just set isEnrolled to false
          }
          setIsEnrolled(!!enrollmentData)
        }
      } catch (err: any) {
        console.error("Error fetching activity:", err)
        setError(err.message || "Error al cargar los detalles de la actividad.")
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [activityId, supabase])

  const handlePurchaseClick = () => {
    if (activity) {
      setPurchaseModalOpen(true)
    }
  }

  const handlePurchaseComplete = (enrollment: any) => {
    console.log("Purchase completed:", enrollment)
    setPurchaseModalOpen(false)
    setIsEnrolled(true) // Mark as enrolled after successful purchase
    toast({
      title: "¡Compra exitosa!",
      description: `Has adquirido "${activity?.title}" correctamente.`,
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 p-4">
        <Loader2 className="h-12 w-12 text-orange-500 animate-spin mb-4" />
        <p className="text-gray-400">Cargando detalles de la actividad...</p>
      </div>
    )
  }

  if (error || !activity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 p-4 text-white">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error al cargar</h2>
        <p className="text-gray-400 text-center mb-6">{error || "No se pudo encontrar la actividad."}</p>
        <Button onClick={() => window.location.reload()} className="bg-orange-500 hover:bg-orange-600">
          Reintentar
        </Button>
      </div>
    )
  }

  const hasVideoContent = !!(activity.media?.vimeo_id || activity.media?.video_url)
  const vimeoId = hasVideoContent ? extractVimeoId(activity.media?.video_url || activity.media?.vimeo_id || "") : null

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        {hasVideoContent && vimeoId ? (
          <VimeoEmbed
            videoContent={activity.media?.video_url || activity.media?.vimeo_id || ""}
            title={activity.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <Image
            src={activity.media?.image_url || "/placeholder.svg?height=800&width=1200&query=fitness activity"}
            alt={activity.title}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2 leading-tight">{activity.title}</h1>
          <p className="text-gray-300 text-lg md:text-xl mb-4">{activity.description}</p>
          <div className="flex items-center space-x-4">
            <Badge className="bg-orange-500 text-white text-sm px-3 py-1 rounded-full">
              {activity.type.toUpperCase()}
            </Badge>
            {activity.difficulty && (
              <Badge variant="outline" className="border-gray-700 text-gray-300 text-sm px-3 py-1 rounded-full">
                {activity.difficulty.charAt(0).toUpperCase() + activity.difficulty.slice(1)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Coach Info & Rating */}
        <Card className="bg-gray-900 border-gray-800 text-white mb-8">
          <CardContent className="flex items-center p-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-orange-500">
              <Image
                src={activity.coach_avatar_url || "/placeholder.svg?height=64&width=64&query=coach avatar"}
                alt={activity.coach_name || "Coach"}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{activity.coach_name || "Coach Desconocido"}</h3>
              <div className="flex items-center text-sm text-gray-400">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span>{activity.coach_rating?.toFixed(1) || "N/A"}</span>
                {activity.coach_whatsapp && (
                  <a
                    href={`https://wa.me/${activity.coach_whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 text-green-500 hover:text-green-400"
                    aria-label="Chat with coach on WhatsApp"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Program Info / Details */}
        {activity.program_info && (
          <Card className="bg-gray-900 border-gray-800 text-white mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Detalles del Programa</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activity.program_info.program_duration && (
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-orange-500 mr-2" />
                  <span>Duración: {activity.program_info.program_duration} meses</span>
                </div>
              )}
              {activity.program_info.duration && (
                <div className="flex items-center">
                  <Video className="h-5 w-5 text-orange-500 mr-2" />
                  <span>Sesiones: {activity.program_info.duration}</span>
                </div>
              )}
              {activity.program_info.calories && (
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-orange-500 mr-2"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20V10"></path>
                    <path d="M18 20V4"></path>
                    <path d="M6 20v-6"></path>
                  </svg>
                  <span>Calorías estimadas: {activity.program_info.calories} kcal</span>
                </div>
              )}
              {activity.program_info.rich_description && (
                <div className="md:col-span-2">
                  <h4 className="font-semibold mb-2">Descripción detallada:</h4>
                  <div
                    className="prose prose-invert max-w-none text-gray-300"
                    dangerouslySetInnerHTML={{ __html: activity.program_info.rich_description }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tags Section */}
        {activity.tags && activity.tags.length > 0 && (
          <Card className="bg-gray-900 border-gray-800 text-white mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Etiquetas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {activity.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="bg-gray-800 text-gray-200">
                  {tag.tag_value}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Purchase Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 p-4 shadow-lg flex justify-center z-20">
          {isEnrolled ? (
            <Button asChild className="w-full max-w-md bg-green-600 hover:bg-green-700 text-white text-lg py-3">
              <Link href={`/program-tracker/${activity.id}`}>
                <CheckCircle className="h-6 w-6 mr-2" />
                Ya estás inscrito - Continuar
              </Link>
            </Button>
          ) : (
            <Button
              onClick={handlePurchaseClick}
              className="w-full max-w-md bg-orange-500 hover:bg-orange-600 text-white text-lg py-3"
            >
              <DollarSign className="h-6 w-6 mr-2" />
              Comprar ahora por ${activity.price}
            </Button>
          )}
        </div>
      </div>

      {activity && (
        <PurchaseActivityModal
          isOpen={purchaseModalOpen}
          onClose={() => setPurchaseModalOpen(false)}
          activity={activity}
          onPurchaseComplete={handlePurchaseComplete}
        />
      )}
    </div>
  )
}
