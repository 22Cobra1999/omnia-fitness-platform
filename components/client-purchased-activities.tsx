"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, CalendarClock, Video, X, RefreshCw, Search, Filter, Clock } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useToast } from "@/components/ui/use-toast"
import { ActivitySkeletonLoader } from "@/components/activity-skeleton-loader"
import { getSupabaseClient } from "@/lib/supabase-singleton"
import { PurchaseActivityModal } from "@/components/purchase-activity-modal"
import { extractVimeoId } from "@/utils/vimeo-utils"
import { VimeoPlayer } from "@/components/vimeo-player"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import type { Activity, Enrollment } from "@/types/activity" // Import updated types

interface ClientPurchasedActivitiesProps {
  clientId: string
}

export function ClientPurchasedActivities({ clientId }: ClientPurchasedActivitiesProps) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("active")
  const [scheduledItems, setScheduledItems] = useState<Record<string, any>>({})
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const supabase = getSupabaseClient()
  const { toast } = useToast()
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false)
  const [selectedPurchaseActivity, setSelectedPurchaseActivity] = useState<Activity | null>(null)

  useEffect(() => {
    const loadScheduledItems = () => {
      try {
        const storedItems = localStorage.getItem("scheduledItems")
        if (storedItems) {
          setScheduledItems(JSON.parse(storedItems))
        }
      } catch (e) {
        console.error("Failed to load scheduled items from localStorage", e)
      }
    }
    loadScheduledItems()
    fetchUserEnrollments()
  }, [clientId])

  const fetchUserEnrollments = async (silentUpdate = false) => {
    if (silentUpdate) {
      setRefreshing(true)
    } else {
      setIsLoading(true)
      setError(null)
    }

    try {
      const { data, error: enrollmentsError } = await supabase
        .from("activity_enrollments")
        .select(
          `
          id,
          activity_id,
          client_id,
          status,
          amount_paid,
          payment_method,
          payment_date,
          created_at,
          activity:activities!activity_enrollments_activity_id_fkey (
            id,
            title,
            description,
            type,
            difficulty,
            price,
            coach_id,
            media:activity_media!activity_media_activity_id_fkey (image_url, video_url, vimeo_id)
          )
        `,
        )
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })

      if (enrollmentsError) {
        throw enrollmentsError
      }

      console.log("[ClientPurchasedActivities] Raw enrollments from Supabase:", data)

      const formattedEnrollments = data
        .map((enrollment) => {
          if (!enrollment.activity) {
            console.warn(`Enrollment ${enrollment.id} has no activities data`)
            return null
          }
          return {
            ...enrollment,
            activity: {
              ...enrollment.activity,
              media: enrollment.activity.media ? enrollment.activity.media[0] : null,
              // program_info no existe en el nuevo esquema
              program_info: null,
              category: getCategoryFromType(enrollment.activity.type || ""),
            },
          }
        })
        .filter(Boolean) as Enrollment[]

      console.log("[ClientPurchasedActivities] Formatted enrollments (after filtering nulls):", formattedEnrollments)

      setEnrollments(formattedEnrollments)
    } catch (error) {
      console.error("Error fetching enrollments:", error)
      if (!silentUpdate) {
        setError("No se pudieron cargar tus actividades. Por favor, intenta de nuevo más tarde.")
      }
    } finally {
      if (silentUpdate) {
        setRefreshing(false)
      } else {
        setIsLoading(false)
      }
    }
  }

  const getCategoryFromType = (type: string): string => {
    const fitnessTypes = ["program", "workout", "training", "exercise", "gym"]
    const nutritionTypes = ["nutrition", "diet", "meal", "food", "recipe"]

    const lowerType = type.toLowerCase()

    if (fitnessTypes.some((t) => lowerType.includes(t))) {
      return "fitness"
    } else if (nutritionTypes.some((t) => lowerType.includes(t))) {
      return "nutrition"
    }
    return "other"
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "enrolled":
        return "Inscrito"
      case "active":
        return "Activo"
      case "completed":
        return "Completado"
      case "cancelled":
        return "Cancelado"
      case "pending":
        return "Pendiente"
      default:
        return status
    }
  }

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "completed":
        return "success"
      case "cancelled":
        return "destructive"
      case "pending":
        return "secondary"
      default:
        return "outline"
    }
  }

  const hasVideo = (activity: Activity) => {
    return !!(
      activity.media?.vimeo_id ||
      (activity.media?.video_url &&
        (activity.media.video_url.includes("vimeo.com") ||
          activity.media.video_url.includes("player.vimeo.com") ||
          activity.media.video_url.includes("youtube.com") ||
          activity.media.video_url.includes("youtu.be")))
    )
  }

  // MODIFICACIÓN CLAVE: Siempre redirigir a la página de seguimiento del programa
  const openActivityDetails = (activity: Activity) => {
    // For purchased activities, always navigate to the program tracker page
    window.location.href = `/program-tracker/${activity.id}`
  }

  const getVimeoId = (activity: Activity) => {
    if (!activity) return null
    if (activity.media?.vimeo_id) return activity.media.vimeo_id
    if (activity.media?.video_url) {
      try {
        return extractVimeoId(activity.media.video_url)
      } catch (error) {
        console.error("Error extracting Vimeo ID:", error)
        return null
      }
    }
    return null
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
    } catch (error) {
      return "Fecha desconocida"
    }
  }

  const processDescription = (description: string | null | undefined) => {
    if (!description) return "Sin descripción disponible"
    let processedHtml = description
    processedHtml = processedHtml.replace(
      /\[CONSULTAS_INCLUIDAS\]/g,
      `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]">Consultas Incluidas</span>`,
    )
    processedHtml = processedHtml.replace(
      /\[DURATION\]/g,
      `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]">Duración Variable</span>`,
    )
    return processedHtml
  }

  const filterActivitiesBySearch = (activities: Enrollment[]) => {
    if (!searchTerm.trim()) return activities
    return activities.filter(
      (enrollment) =>
        enrollment.activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.activity.type?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }

  const activeActivities = filterActivitiesBySearch(
    enrollments.filter((e) => e.status === "active" || e.status === "enrolled"),
  )
  const completedActivities = filterActivitiesBySearch(enrollments.filter((e) => e.status === "completed"))
  const cancelledActivities = filterActivitiesBySearch(enrollments.filter((e) => e.status === "cancelled"))
  const pendingActivities = filterActivitiesBySearch(enrollments.filter((e) => e.status === "pending"))

  const handlePurchaseComplete = (enrollment: any) => {
    console.log("Purchase completed in ClientPurchasedActivities:", enrollment)
    fetchUserEnrollments(true) // Refresh enrollments silently
    setPurchaseModalOpen(false)
    setSelectedPurchaseActivity(null)
    toast({
      title: "¡Compra exitosa!",
      description: `Has adquirido "${selectedPurchaseActivity?.title}" correctamente.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#2A2A2A] border-[#3A3A3A] text-white placeholder:text-gray-400 w-full p-2 rounded-md"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="border-[#3A3A3A] text-gray-400 hover:text-white bg-transparent"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="border-[#3A3A3A] text-gray-400 hover:text-white bg-transparent"
          onClick={() => fetchUserEnrollments(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {showFilters && (
        <div className="bg-[#1E1E1E] rounded-lg p-3 mb-4">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-[#2A2A2A] hover:bg-[#3A3A3A] cursor-pointer">Recientes</Badge>
            <Badge className="bg-[#2A2A2A] hover:bg-[#3A3A3A] cursor-pointer">Populares</Badge>
            <Badge className="bg-[#2A2A2A] hover:bg-[#3A3A3A] cursor-pointer">En progreso</Badge>
            <Badge className="bg-[#2A2A2A] hover:bg-[#3A3A3A] cursor-pointer">Completados</Badge>
          </div>
        </div>
      )}

      <Tabs defaultValue="active" value={activeTab} onValueChange={(value) => {
  setActiveTab(value)
  // Scroll hacia arriba cuando se cambia de tab
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 100)
}} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#1E1E1E] p-1 rounded-xl">
          <TabsTrigger
            value="pending"
            className="rounded-lg data-[state=active]:bg-[#FF7939] data-[state=active]:text-white py-2.5 text-xs"
          >
            Pendientes ({pendingActivities.length})
          </TabsTrigger>
          <TabsTrigger
            value="active"
            className="rounded-lg data-[state=active]:bg-[#FF7939] data-[state=active]:text-white py-2.5 text-xs"
          >
            Activas ({activeActivities.length})
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="rounded-lg data-[state=active]:bg-[#FF7939] data-[state=active]:text-white py-2.5 text-xs"
          >
            Completadas ({completedActivities.length})
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            className="rounded-lg data-[state=active]:bg-[#FF7939] data-[state=active]:text-white py-2.5 text-xs"
          >
            Canceladas ({cancelledActivities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {isLoading ? (
            <ActivitySkeletonLoader />
          ) : pendingActivities.length === 0 ? (
            <div className="text-center py-10 bg-[#1E1E1E] rounded-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2A2A2A] mb-4">
                <Play className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No tienes actividades pendientes</h3>
              <p className="text-gray-400 mb-4">Compra un programa para verlo aquí.</p>
              <Button asChild className="bg-[#FF7939] hover:bg-[#E66829]">
                <Link href="/activities">Explorar Productos</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingActivities.map((enrollment) => (
                <Card
                  key={enrollment.id}
                  className="bg-[#1E1E1E] rounded-xl overflow-hidden hover:shadow-lg hover:shadow-[#FF7939]/10 transition-all cursor-pointer"
                  onClick={() => openActivityDetails(enrollment.activity)}
                >
                  <div className="relative">
                    <Image
                      src={
                        enrollment.activity.media?.image_url
                          ? enrollment.activity.media.image_url
                          : "/placeholder.svg?height=180&width=350&query=fitness activity"
                      }
                      alt={enrollment.activity.title}
                      width={350}
                      height={180}
                      className="w-full h-40 object-cover"
                    />
                    {hasVideo(enrollment.activity) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
                          <Play className="h-8 w-8 text-white" fill="white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/60 rounded-full px-3 py-1">
                      <Badge
                        variant={getBadgeVariant(enrollment.status)}
                        className="bg-[#FF7939] text-white border-none"
                      >
                        {getStatusText(enrollment.status)}
                      </Badge>
                    </div>
                    {hasVideo(enrollment.activity) && (
                      <div className="absolute bottom-3 right-3 bg-[#FF7939] rounded-full px-2 py-1 flex items-center">
                        <Video className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Video Completo</span>
                      </div>
                    )}
                    {scheduledItems[`activity-${enrollment.id}`] && (
                      <div className="absolute bottom-3 left-3 bg-[#FF7939]/80 rounded-full px-2 py-1 flex items-center">
                        <CalendarClock className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Programado</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{enrollment.activity.title}</h3>
                    <p
                      className="text-sm text-gray-400 mb-3 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: processDescription(enrollment.activity.description),
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Comprado {formatDate(enrollment.created_at)}</span>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 bg-[#FF7939] hover:bg-[#E66829]"
                        onClick={async (e) => {
                          e.stopPropagation()
                          toast({
                            title: "Iniciando actividad...",
                            description: "Por favor espera mientras preparamos tu programa.",
                          })
                          try {
                            const response = await fetch("/api/start-activity", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                activityId: enrollment.activity.id,
                                enrollmentId: enrollment.id,
                                clientId: enrollment.client_id,
                              }),
                            })
                            if (!response.ok) {
                              const errorData = await response.json()
                              throw new Error(errorData.error || "Failed to start activity")
                            }
                            toast({
                              title: "¡Actividad iniciada!",
                              description: "Tu programa ha sido activado y las fechas programadas.",
                            })
                            fetchUserEnrollments(true) // Refresh to move it to active tab
                          } catch (err: any) {
                            toast({
                              title: "Error al iniciar actividad",
                              description: err.message || "No se pudo iniciar la actividad.",
                              variant: "destructive",
                            })
                          }
                        }}
                      >
                        Iniciar Actividad
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {isLoading ? (
            <ActivitySkeletonLoader />
          ) : activeActivities.length === 0 ? (
            <div className="text-center py-10 bg-[#1E1E1E] rounded-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2A2A2A] mb-4">
                <Play className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No tienes actividades activas</h3>
              <p className="text-gray-400 mb-4">Inicia un programa para verlo aquí.</p>
              <Button asChild className="bg-[#FF7939] hover:bg-[#E66829]">
                <Link href="/activities">Explorar Productos</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeActivities.map((enrollment) => (
                <Card
                  key={enrollment.id}
                  className="bg-[#1E1E1E] rounded-xl overflow-hidden hover:shadow-lg hover:shadow-[#FF7939]/10 transition-all cursor-pointer"
                  onClick={() => openActivityDetails(enrollment.activity)}
                >
                  <div className="relative">
                    <Image
                      src={
                        enrollment.activity.media?.image_url
                          ? enrollment.activity.media.image_url
                          : "/placeholder.svg?height=180&width=350&query=fitness activity"
                      }
                      alt={enrollment.activity.title}
                      width={350}
                      height={180}
                      className="w-full h-40 object-cover"
                    />
                    {hasVideo(enrollment.activity) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
                          <Play className="h-8 w-8 text-white" fill="white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/60 rounded-full px-3 py-1">
                      <Badge
                        variant={getBadgeVariant(enrollment.status)}
                        className="bg-[#FF7939] text-white border-none"
                      >
                        {getStatusText(enrollment.status)}
                      </Badge>
                    </div>
                    {hasVideo(enrollment.activity) && (
                      <div className="absolute bottom-3 right-3 bg-[#FF7939] rounded-full px-2 py-1 flex items-center">
                        <Video className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Video Completo</span>
                      </div>
                    )}
                    {scheduledItems[`activity-${enrollment.id}`] && (
                      <div className="absolute bottom-3 left-3 bg-[#FF7939]/80 rounded-full px-2 py-1 flex items-center">
                        <CalendarClock className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Programado</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{enrollment.activity.title}</h3>
                    <p
                      className="text-sm text-gray-400 mb-3 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: processDescription(enrollment.activity.description),
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Comprado {formatDate(enrollment.created_at)}</span>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 bg-[#FF7939] hover:bg-[#E66829]"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `/program-tracker/${enrollment.activity.id}`
                        }}
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {isLoading ? (
            <ActivitySkeletonLoader />
          ) : completedActivities.length === 0 ? (
            <div className="text-center py-10 bg-[#1E1E1E] rounded-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2A2A2A] mb-4">
                <Play className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No tienes actividades completadas</h3>
              <p className="text-gray-400 mb-4">Completa un programa para verlo aquí.</p>
              <Button asChild className="bg-[#FF7939] hover:bg-[#E66829]">
                <Link href="/activities">Explorar Productos</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {completedActivities.map((enrollment) => (
                <Card
                  key={enrollment.id}
                  className="bg-[#1E1E1E] rounded-xl overflow-hidden hover:shadow-lg hover:shadow-[#FF7939]/10 transition-all cursor-pointer"
                  onClick={() => openActivityDetails(enrollment.activity)}
                >
                  <div className="relative">
                    <Image
                      src={
                        enrollment.activity.media?.image_url
                          ? enrollment.activity.media.image_url
                          : "/placeholder.svg?height=180&width=350&query=fitness activity"
                      }
                      alt={enrollment.activity.title}
                      width={350}
                      height={180}
                      className="w-full h-40 object-cover"
                    />
                    {hasVideo(enrollment.activity) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
                          <Play className="h-8 w-8 text-white" fill="white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/60 rounded-full px-3 py-1">
                      <Badge
                        variant={getBadgeVariant(enrollment.status)}
                        className="bg-[#FF7939] text-white border-none"
                      >
                        {getStatusText(enrollment.status)}
                      </Badge>
                    </div>
                    {hasVideo(enrollment.activity) && (
                      <div className="absolute bottom-3 right-3 bg-[#FF7939] rounded-full px-2 py-1 flex items-center">
                        <Video className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Video Completo</span>
                      </div>
                    )}
                    {scheduledItems[`activity-${enrollment.id}`] && (
                      <div className="absolute bottom-3 left-3 bg-[#FF7939]/80 rounded-full px-2 py-1 flex items-center">
                        <CalendarClock className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Programado</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{enrollment.activity.title}</h3>
                    <p
                      className="text-sm text-gray-400 mb-3 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: processDescription(enrollment.activity.description),
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Comprado {formatDate(enrollment.created_at)}</span>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 bg-[#FF7939] hover:bg-[#E66829]"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `/program-tracker/${enrollment.activity.id}`
                        }}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-4">
          {isLoading ? (
            <ActivitySkeletonLoader />
          ) : cancelledActivities.length === 0 ? (
            <div className="text-center py-10 bg-[#1E1E1E] rounded-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2A2A2A] mb-4">
                <Play className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No tienes actividades canceladas</h3>
              <p className="text-gray-400 mb-4">Las actividades canceladas aparecerán aquí.</p>
              <Button asChild className="bg-[#FF7939] hover:bg-[#E66829]">
                <Link href="/activities">Explorar Productos</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cancelledActivities.map((enrollment) => (
                <Card
                  key={enrollment.id}
                  className="bg-[#1E1E1E] rounded-xl overflow-hidden hover:shadow-lg hover:shadow-[#FF7939]/10 transition-all cursor-pointer"
                  onClick={() => openActivityDetails(enrollment.activity)}
                >
                  <div className="relative">
                    <Image
                      src={
                        enrollment.activity.media?.image_url
                          ? enrollment.activity.media.image_url
                          : "/placeholder.svg?height=180&width=350&query=fitness activity"
                      }
                      alt={enrollment.activity.title}
                      width={350}
                      height={180}
                      className="w-full h-40 object-cover"
                    />
                    {hasVideo(enrollment.activity) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="bg-white/20 rounded-full p-3 backdrop-blur-sm">
                          <Play className="h-8 w-8 text-white" fill="white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-black/60 rounded-full px-3 py-1">
                      <Badge
                        variant={getBadgeVariant(enrollment.status)}
                        className="bg-[#FF7939] text-white border-none"
                      >
                        {getStatusText(enrollment.status)}
                      </Badge>
                    </div>
                    {hasVideo(enrollment.activity) && (
                      <div className="absolute bottom-3 right-3 bg-[#FF7939] rounded-full px-2 py-1 flex items-center">
                        <Video className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Video Completo</span>
                      </div>
                    )}
                    {scheduledItems[`activity-${enrollment.id}`] && (
                      <div className="absolute bottom-3 left-3 bg-[#FF7939]/80 rounded-full px-2 py-1 flex items-center">
                        <CalendarClock className="h-3 w-3 mr-1" />
                        <span className="text-xs font-medium">Programado</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold mb-2">{enrollment.activity.title}</h3>
                    <p
                      className="text-sm text-gray-400 mb-3 line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: processDescription(enrollment.activity.description),
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Comprado {formatDate(enrollment.created_at)}</span>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 bg-[#FF7939] hover:bg-[#E66829]"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.location.href = `/program-tracker/${enrollment.activity.id}`
                        }}
                      >
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Video Dialog (kept for other contexts if needed, but not for purchased activities click) */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="bg-[#1E1E1E] text-white border-gray-800 sm:max-w-4xl">
          <DialogHeader>
            <h3 className="text-lg font-semibold flex items-center">
              <Video className="h-5 w-5 mr-2 text-[#FF7939]" />
              {selectedActivity?.title}
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-6 w-6 rounded-full"
              onClick={() => setVideoDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          <div className="aspect-video w-full">
            {selectedActivity && hasVideo(selectedActivity) && (
              <VimeoPlayer videoId={getVimeoId(selectedActivity) || ""} title={selectedActivity.title} />
            )}
          </div>
          {selectedActivity && (
            <div className="py-2">
              <h3 className="font-medium mb-2">{selectedActivity.title}</h3>
              <p className="text-sm text-gray-400">{selectedActivity.description || "Sin descripción disponible"}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Activity Modal */}
      <PurchaseActivityModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        activity={selectedPurchaseActivity}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </div>
  )
}
