"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VideoUrlInput } from "@/components/video-url-input"
import { VimeoPlayer } from "@/components/vimeo-player"

export default function VideoTestPage() {
  const [videoUrl, setVideoUrl] = useState("")
  const [vimeoId, setVimeoId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value)
    setShowPreview(false)
  }

  const handlePreview = () => {
    // Extraer el ID de Vimeo de la URL
    const patterns = [
      /vimeo\.com\/(\d+)/,
      /vimeo\.com\/channels\/[^/]+\/(\d+)/,
      /vimeo\.com\/groups\/[^/]+\/videos\/(\d+)/,
      /vimeo\.com\/album\/[^/]+\/video\/(\d+)/,
      /vimeo\.com\/showcase\/[^/]+\/video\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/,
    ]

    let id = null
    for (const pattern of patterns) {
      const match = videoUrl.match(pattern)
      if (match && match[1]) {
        id = match[1]
        break
      }
    }

    if (id) {
      setVimeoId(id)
      setShowPreview(true)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de Videos de Vimeo</CardTitle>
          <CardDescription>
            Pega la URL de un video de Vimeo para verificar que se muestra correctamente en la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <VideoUrlInput
            id="video-url"
            name="video-url"
            value={videoUrl}
            onChange={handleChange}
            label="URL del video de Vimeo"
            placeholder="https://vimeo.com/123456789"
          />

          <Button onClick={handlePreview} disabled={!videoUrl}>
            Vista previa
          </Button>

          {showPreview && vimeoId && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Vista previa del video</h3>
              <VimeoPlayer videoId={vimeoId} />
            </div>
          )}

          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Instrucciones para coaches</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Sube tu video a tu cuenta de Vimeo</li>
              <li>Configura la privacidad del video como "Cualquiera con el enlace"</li>
              <li>Asegúrate de que la opción "Permitir incrustar" esté activada</li>
              <li>Copia la URL del video (ej: https://vimeo.com/123456789)</li>
              <li>Pega la URL en el campo de arriba y haz clic en "Vista previa"</li>
              <li>Verifica que el video se reproduzca correctamente</li>
              <li>Usa esta misma URL al crear un producto de tipo "Video" en la plataforma</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
