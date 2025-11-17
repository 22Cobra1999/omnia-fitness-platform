"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VimeoPlayer } from '@/components/shared/video/vimeo-player'
import { FileText, Video, Users, Clock, CalendarIcon } from "lucide-react"

interface Activity {
  id?: number
  title: string
  description: string
  rich_description?: string
  type: string
  difficulty?: string
  duration?: number | null
  price: number
  image_url: string | null
  video_url: string | null
  vimeo_id?: string | null
  is_public: boolean
  pdf_url?: string | null
  session_type?: string
  available_slots?: number
  available_times?: { date: string; start_time: string; end_time: string }[]
}

interface ProductPreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  activity: Activity | null
}

export function ProductPreviewDialog({ isOpen, onClose, activity }: ProductPreviewDialogProps) {
  if (!activity) return null

  const extractVimeoId = (url: string): string | null => {
    if (!url) return null

    // Patrones comunes de URLs de Vimeo
    const patterns = [
      /vimeo\.com\/(\d+)/, // https://vimeo.com/123456789
      /vimeo\.com\/video\/(\d+)/, // https://vimeo.com/video/123456789
      /player\.vimeo\.com\/video\/(\d+)/, // https://player\.vimeo\.com\/video\/123456789
      /vimeo\.com\/channels\/[^/]+\/(\d+)/, // https://vimeo.com/channels/staffpicks/123456789
      /vimeo\.com\/groups\/[^/]+\/videos\/(\d+)/, // https://vimeo.com/groups/name/videos/123456789
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  // Usar el ID de Vimeo almacenado o extraerlo de la URL del video
  const previewVimeoId = activity.vimeo_id || (activity.video_url ? extractVimeoId(activity.video_url) : null)

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "document":
        return "PDF"
      case "video":
        return "Video"
      case "workshop":
        return "Taller"
      case "program":
        return "Programa"
      case "individual":
        return "Individual"
      default:
        return type
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="h-5 w-5" />
      case "video":
        return <Video className="h-5 w-5" />
      case "workshop":
        return <Users className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const renderProductContent = () => {
    switch (activity.type) {
      case "document":
        return (
          <div className="mt-4 border rounded-md p-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Documento PDF</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Este producto incluye un documento PDF con contenido exclusivo.
            </p>
          </div>
        )
      case "video":
        return (
          <div className="mt-4 border rounded-md p-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <Video className="h-5 w-5 text-blue-500" />
              <span className="font-medium">Video</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Este producto incluye un video completo con contenido exclusivo.
            </p>
          </div>
        )
      case "workshop":
        return (
          <div className="mt-4 border rounded-md p-4 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="font-medium">
                Taller {activity.session_type === "individual" ? "Individual" : "Grupal"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
              <Clock className="h-4 w-4" />
              <span>Cupos disponibles: {activity.available_slots || 0}</span>
            </div>
            {activity.available_times && activity.available_times.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Próximas fechas:</p>
                <div className="grid grid-cols-1 gap-1">
                  {activity.available_times.slice(0, 2).map((time, index) => (
                    <div key={index} className="flex items-center gap-1 text-xs">
                      <CalendarIcon className="h-3 w-3" />
                      <span>
                        {time.date} ({time.start_time} - {time.end_time})
                      </span>
                    </div>
                  ))}
                  {activity.available_times.length > 2 && (
                    <p className="text-xs text-gray-500">Y {activity.available_times.length - 2} fechas más...</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  // Extraer el contenido enriquecido si existe
  const richContentMatch = activity.description?.match(/\[RICH_CONTENT\](.*?)\[\/RICH_CONTENT\]/s)
  const richContent = richContentMatch ? richContentMatch[1] : null

  // Limpiar la descripción de todos los marcadores especiales
  let cleanDescription = activity.description || ""
  cleanDescription = cleanDescription.replace(/\[CONSULTAS_INCLUIDAS\]/g, "")
  cleanDescription = cleanDescription.replace(/\[NOTA_CONSULTA\].*?\[\/NOTA_CONSULTA\]/gs, "")
  cleanDescription = cleanDescription.replace(/\[SESSIONS_COUNT\]\d+\[\/SESSIONS_COUNT\]/gs, "")
  cleanDescription = cleanDescription.replace(/\[RICH_CONTENT\].*?\[\/RICH_CONTENT\]/gs, "")
  cleanDescription = cleanDescription.trim()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Vista previa: {activity.title}</span>
            <Badge>{getTypeLabel(activity.type)}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Video de presentación */}
          {previewVimeoId ? (
            <div className="aspect-video rounded-md overflow-hidden">
              <VimeoPlayer videoId={previewVimeoId} title={activity.title} className="w-full" />
            </div>
          ) : activity.image_url ? (
            <div className="aspect-video rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={activity.image_url || "/placeholder.svg"}
                alt={activity.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {getTypeIcon(activity.type)}
              <p className="text-gray-500 ml-2">No hay video de presentación</p>
            </div>
          )}

          {/* Título y precio */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">{activity.title}</h3>
              <div className="text-xl font-bold text-green-600">${activity.price.toFixed(2)}</div>
            </div>

            {/* Descripción */}
            {activity.rich_description && activity.rich_description.trim() ? (
              <div
                className="text-white prose prose-sm max-w-none prose-invert"
                dangerouslySetInnerHTML={{ __html: activity.rich_description }}
              />
            ) : richContent && richContent.trim() ? (
              <div
                className="text-white prose prose-sm max-w-none prose-invert"
                dangerouslySetInnerHTML={{ __html: richContent }}
              />
            ) : cleanDescription.trim() ? (
              <p className="text-white">{cleanDescription}</p>
            ) : (
              <p className="text-white italic">Sin descripción</p>
            )}
          </div>

          {/* Contenido específico según el tipo */}
          {renderProductContent()}

          {/* Botón de compra (simulado) */}
          <div className="mt-6">
            <Button className="w-full bg-[#FF7939] hover:bg-[#E86A2D]">Comprar ahora</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
