'use client'

import { useState } from 'react'
import { Upload, X, Check, Loader2 } from 'lucide-react'

interface UniversalVideoUploaderProps {
  onUploadComplete: (videoData: {
    url: string
    videoId?: string
    thumbnailUrl?: string
    provider: 'bunny' | 'supabase'
  }) => void
  exerciseId?: number
  activityId?: number
  preferredProvider?: 'bunny' | 'supabase'
  maxSize?: number
  className?: string
}

export function UniversalVideoUploader({
  onUploadComplete,
  exerciseId,
  activityId,
  preferredProvider = 'bunny',
  maxSize = 500 * 1024 * 1024,
  className = '',
}: UniversalVideoUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > maxSize) {
      setError(`El archivo excede el tamaño máximo (${Math.round(maxSize / 1024 / 1024)}MB)`)
      return
    }

    const validFormats = ['mp4', 'mov', 'avi', 'webm', 'mkv']
    const extension = file.name.split('.').pop()?.toLowerCase()
    
    if (!extension || !validFormats.includes(extension)) {
      setError(`Formato no válido. Use: ${validFormats.join(', ')}`)
      return
    }

    setSelectedFile(file)
    setError(null)
  }

  const uploadToBunny = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', file.name)
    if (exerciseId) formData.append('exerciseId', exerciseId.toString())
    if (activityId) formData.append('activityId', activityId.toString())

    const response = await fetch('/api/bunny/upload-video', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error subiendo a Bunny')
    }

    return await response.json()
  }

  const uploadToSupabase = async (file: File) => {
    // Implementación existente de Supabase
    throw new Error('Upload a Supabase temporalmente deshabilitado durante migración')
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      let result
      
      if (preferredProvider === 'bunny') {
        result = await uploadToBunny(selectedFile)
        
        onUploadComplete({
          url: result.streamUrl,
          videoId: result.videoId,
          thumbnailUrl: result.thumbnailUrl,
          provider: 'bunny',
        })
      } else {
        result = await uploadToSupabase(selectedFile)
        
        onUploadComplete({
          url: result.url,
          provider: 'supabase',
        })
      }

      setProgress(100)
      setSelectedFile(null)
      
      setTimeout(() => {
        setProgress(0)
      }, 2000)

    } catch (error: any) {
      console.error('❌ Error upload:', error)
      setError(error.message || 'Error subiendo video')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 bg-gray-900/50">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Upload className="w-12 h-12 text-orange-500" />
          
          <div className="text-center">
            <p className="text-white font-medium mb-1">
              Subir video a Bunny.net
            </p>
            <p className="text-gray-400 text-sm">
              MP4, MOV, AVI, WebM (máx. {Math.round(maxSize / 1024 / 1024)}MB)
            </p>
          </div>

          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="video-upload-input"
          />
          
          <label
            htmlFor="video-upload-input"
            className={`px-6 py-2 bg-orange-500 text-white rounded-lg cursor-pointer hover:bg-orange-600 transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Seleccionar Video
          </label>
        </div>

        {selectedFile && !uploading && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded flex items-center justify-center">
                <Upload className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-white font-medium">{selectedFile.name}</p>
                <p className="text-gray-400 text-sm">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {uploading && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Subiendo a Bunny.net...</span>
              <span className="text-orange-500">{progress}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-orange-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}
      </div>

      {selectedFile && !uploading && (
        <button
          onClick={handleUpload}
          className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center space-x-2"
        >
          <Upload className="w-5 h-5" />
          <span>Subir a Bunny.net</span>
        </button>
      )}

      <div className="text-center text-xs text-gray-500">
        Provider: <span className="text-orange-500 font-medium">{preferredProvider.toUpperCase()}</span>
      </div>
    </div>
  )
}




