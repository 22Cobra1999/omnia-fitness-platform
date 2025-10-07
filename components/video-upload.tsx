"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from '@/lib/supabase-browser'

interface VideoUploadProps {
  onUploadComplete: (url: string) => void
  maxSizeMB?: number
}

export function VideoUpload({ onUploadComplete, maxSizeMB = 500 }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith("video/")) {
      setError("Por favor selecciona un archivo de video válido")
      return
    }

    // Validar tamaño de archivo (en bytes)
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      setError(`El archivo es demasiado grande. El tamaño máximo es ${maxSizeMB}MB`)
      return
    }

    setFileName(file.name)
    setError(null)

    // Crear una URL para previsualización
    const previewUrl = URL.createObjectURL(file)
    setVideoPreview(previewUrl)
  }

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return

    const file = fileInputRef.current.files[0]
    setUploading(true)
    setProgress(0)

    try {
      // Obtener el usuario actual
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Usuario no autenticado")
      }

      // Crear un nombre de archivo único
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
      const filePath = `videos/${fileName}`

      // Subir el archivo a Supabase Storage
      const { error, data } = await supabase.storage.from("coach-content").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        onUploadProgress: (progress) => {
          const percent = (progress.loaded / progress.total) * 100
          setProgress(percent)
        },
      })

      if (error) throw error

      // Obtener la URL pública del archivo
      const { data: publicUrlData } = supabase.storage.from("coach-content").getPublicUrl(filePath)

      // Notificar éxito
      toast({
        title: "Video subido correctamente",
        description: "Tu video ya está disponible para tus clientes",
      })

      // Pasar la URL al componente padre
      onUploadComplete(publicUrlData.publicUrl)
    } catch (error) {
      console.error("Error al subir el video:", error)
      setError("Error al subir el video. Por favor intenta de nuevo.")
      toast({
        title: "Error al subir el video",
        description: "Ocurrió un problema durante la subida. Por favor intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleCancel = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview)
    }
    setVideoPreview(null)
    setFileName(null)
    setProgress(0)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="flex flex-col items-center justify-center">
        <h3 className="text-lg font-medium mb-2">Subir video</h3>
        <p className="text-sm text-gray-500 mb-4 text-center">
          Sube tu video para compartirlo con tus clientes. Tamaño máximo: {maxSizeMB}MB
        </p>

        {!videoPreview ? (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 w-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Haz clic para seleccionar un video o arrastra y suelta aquí</p>
            <p className="text-xs text-gray-400 mt-1">MP4, MOV, WEBM (máx. {maxSizeMB}MB)</p>
          </div>
        ) : (
          <div className="w-full">
            <div className="aspect-video bg-black rounded-lg overflow-hidden mb-2">
              <video
                src={videoPreview}
                controls
                className="w-full h-full"
                onError={() => setError("No se puede reproducir el video seleccionado")}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm truncate max-w-[200px]">{fileName}</span>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="video/mp4,video/mov,video/webm"
          className="hidden"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-2 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subiendo...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {videoPreview && !uploading && (
        <Button onClick={handleUpload} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Subir video
        </Button>
      )}

      {progress === 100 && !uploading && (
        <div className="bg-green-50 text-green-600 p-2 rounded-md flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">Video subido correctamente</span>
        </div>
      )}
    </div>
  )
}
