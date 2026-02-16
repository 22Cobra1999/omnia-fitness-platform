"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Star, Video, DollarSign, MessageCircle, CheckCircle, AlertCircle, Loader2, MapPin, Calendar, Users } from "lucide-react"
import { VimeoEmbed } from '@/components/shared/video/vimeo-embed'
import { extractVimeoId } from "@/utils/vimeo-utils"
import { useToast } from "@/components/ui/use-toast"
import { PurchaseActivityModal } from '@/components/shared/activities/purchase-activity-modal'
import { getSupabaseClient } from '@/lib/supabase/supabase-client'
import type { Activity } from "@/types/activity"

interface ProductDetailViewProps {
  activityId: string
}

export function ProductDetailView({ activityId }: ProductDetailViewProps) {
  const [activity, setActivity] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [workshopThemes, setWorkshopThemes] = useState<any[]>([])
  const [loadingThemes, setLoadingThemes] = useState(false)
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

    const fetchWorkshopThemes = async (id: string) => {
      setLoadingThemes(true)
      try {
        const { data, error } = await supabase
          .from("taller_detalles")
          .select("*")
          .eq("actividad_id", parseInt(id))
          .eq("activo", true)
          .order("id", { ascending: true })

        if (error) throw error
        setWorkshopThemes(data || [])
      } catch (err) {
        console.error("Error fetching workshop themes:", err)
      } finally {
        setLoadingThemes(false)
      }
    }

    fetchActivity()
    fetchWorkshopThemes(activityId)
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
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 -mt-12 relative z-10 pb-24">
        {/* 1. Title - Minimalist and smaller */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-[#FF7939] text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm">
              {activity.type.toUpperCase()}
            </Badge>
            {activity.categoria && (
              <Badge variant="outline" className="border-[#FF7939]/30 text-[#FF7939] text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                {activity.categoria.toUpperCase()}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 tracking-tighter leading-none">
            {activity.title}
          </h1>
        </div>

        {/* 2. Coach Intro - Very compact, below title */}
        <div className="flex items-center gap-2 mb-6 opacity-90">
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/10">
            <Image
              src={activity.coach_avatar_url || "/placeholder.svg?height=40&width=40&query=coach"}
              alt={activity.coach_name || "Coach"}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-300">{activity.coach_name || "Coach"}</h3>
            {activity.coach_rating !== null && activity.coach_rating !== undefined && activity.coach_rating > 0 && (
              <div className="flex items-center text-[10px] text-yellow-500 opacity-80">
                <Star className="h-2.5 w-2.5 fill-yellow-500 mr-1" />
                <span>{activity.coach_rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Description Section - Minimalist */}
        <div className="max-w-2xl mb-10">
          <p className="text-gray-400 text-base leading-relaxed">
            {activity.description || ''}
          </p>
        </div>

        {/* 4. Stats Grid - Minimalist approach */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-12">
          <div className="p-3">
            <div className="flex items-center gap-1.5 opacity-60 mb-1">
              <Calendar className="w-3 h-3 text-[#FF7939]" />
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Sesiones</span>
            </div>
            <span className="text-sm font-black text-white">{activity.sesiones_dias_totales || 0}</span>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-1.5 opacity-60 mb-1">
              <Clock className="w-3 h-3 text-[#FF7939]" />
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Semanas</span>
            </div>
            <span className="text-sm font-black text-white">{activity.semanas_totales || 0}</span>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-1.5 opacity-60 mb-1">
              <Video className="w-3 h-3 text-[#FF7939]" />
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Temas</span>
            </div>
            <span className="text-sm font-black text-white">{activity.items_unicos || 0}</span>
          </div>
          <div className="p-3">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Nivel</span>
            <span className="text-sm font-black text-white capitalize">{activity.difficulty || 'Intermedio'}</span>
          </div>
          <div className="p-3">
            <div className="flex items-center gap-1.5 opacity-60 mb-1">
              <Users className="w-3 h-3 text-[#FF7939]" />
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Cupos</span>
            </div>
            <span className="text-sm font-black text-white">{activity.capacity || '∞'}</span>
          </div>
          <div className="p-3 relative group/modalidad">
            <div className="flex items-center gap-1.5 opacity-60 mb-1">
              <MapPin className="w-3 h-3 text-[#FF7939]" />
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Modalidad</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-white truncate max-w-[100px]">{activity.location_name || activity.modality || 'Online'}</span>
              {(activity.modality === 'presencial' || activity.modality === 'hibrido') && activity.location_url && (
                <a
                  href={activity.location_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF7939] hover:text-[#FF7939]/80 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"
                >
                  <MapPin className="h-2.5 w-2.5" />
                  Ver
                </a>
              )}
            </div>
          </div>
        </div>


        {/* 6. Workshop Themes Section - Simple List */}
        {activity.type === 'workshop' && (
          <div className="mb-12 border-t border-white/5 pt-10">
            <div className="flex items-center gap-2 mb-8 border-l-2 border-[#FF7939] pl-3">
              <h2 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Temas y Horarios</h2>
            </div>

            {loadingThemes ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Cargando...</span>
              </div>
            ) : workshopThemes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                {workshopThemes.map((theme, i) => (
                  <div key={theme.id} className="group">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-[#FF7939] font-black text-sm">{(i + 1).toString().padStart(2, '0')}</span>
                      <h4 className="text-white font-bold text-lg group-hover:text-[#FF7939] transition-colors">{theme.nombre}</h4>
                    </div>

                    {theme.descripcion && (
                      <p className="text-gray-500 text-xs mb-4 ml-8 max-w-xl leading-relaxed italic opacity-80">"{theme.descripcion}"</p>
                    )}

                    <div className="ml-8 space-y-2">
                      {theme.originales?.fechas_horarios?.map((horario: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-6 text-[10px] tracking-wide">
                          <div className="flex items-center gap-2 text-gray-400 font-bold uppercase min-w-[120px]">
                            <Calendar className="w-3 h-3 opacity-40" />
                            <span>
                              {new Date(horario.fecha).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 font-medium bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/5">
                            <Clock className="w-3 h-3 opacity-30" />
                            <span>
                              {horario.inicio} - {horario.fin}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">No hay temas programados.</p>
            )}
          </div>
        )}

        <div className="mb-24 pt-8 border-t border-white/5">
          <h3 className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-6 border-l-2 border-[#FF7939] pl-3">Logros</h3>
          <div className="flex flex-wrap gap-3">
            {activity.objetivos && activity.objetivos.map((obj: string, i: number) => (
              <div key={i} className="bg-white/[0.03] border border-white/10 px-4 py-2 rounded-xl">
                <span className="text-gray-300 text-[10px] font-bold uppercase tracking-wider">
                  {obj}
                </span>
              </div>
            ))}
          </div>
        </div>

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
