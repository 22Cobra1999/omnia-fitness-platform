"use client"

import { useState } from 'react'
import { Upload, Trash2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/auth-context'

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  onAvatarChange?: (newUrl: string | null) => void
}

export function AvatarUpload({ currentAvatarUrl, onAvatarChange }: AvatarUploadProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return
      }

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp']

      if (!allowedExtensions.includes(fileExt?.toLowerCase() || '')) {
        alert('Solo se permiten imágenes JPG, PNG o WEBP')
        return
      }

      // Validar tamaño (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar 2MB')
        return
      }

      setUploading(true)

      // 1. Eliminar avatar anterior si existe
      if (avatarUrl) {
        try {
          // Extraer path del avatar anterior desde la URL
          const urlParts = avatarUrl.split('/storage/v1/object/public/product-media/')
          if (urlParts.length > 1) {
            const oldPath = urlParts[1]
            console.log('🗑️ Eliminando avatar anterior:', oldPath)
            
            const { error: deleteError } = await supabase.storage
              .from('product-media')
              .remove([oldPath])
            
            if (deleteError) {
              console.warn('⚠️ Error eliminando avatar anterior:', deleteError)
            } else {
              console.log('✅ Avatar anterior eliminado del bucket')
            }
          }
        } catch (error) {
          console.warn('⚠️ Error procesando eliminación del avatar anterior:', error)
        }
      }

      // 2. Subir nuevo avatar
      const filePath = `avatars/${user!.id}.${fileExt}`
      console.log('📤 Subiendo nuevo avatar:', filePath)

      const { error: uploadError } = await supabase.storage
        .from('product-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Reemplaza si existe
        })

      if (uploadError) {
        throw uploadError
      }

      // 3. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('product-media')
        .getPublicUrl(filePath)

      console.log('✅ Avatar subido:', publicUrl)

      // 4. Actualizar perfil en la base de datos
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user!.id)

      if (updateError) {
        throw updateError
      }

      setAvatarUrl(publicUrl)
      onAvatarChange?.(publicUrl)
      alert('Avatar actualizado correctamente')

    } catch (error) {
      console.error('❌ Error subiendo avatar:', error)
      alert('Error al subir el avatar')
    } finally {
      setUploading(false)
    }
  }

  const deleteAvatar = async () => {
    if (!avatarUrl) return

    try {
      if (!confirm('¿Estás seguro de eliminar tu avatar?')) return

      setUploading(true)

      // 1. Eliminar del bucket
      try {
        const urlParts = avatarUrl.split('/storage/v1/object/public/product-media/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          console.log('🗑️ Eliminando avatar:', filePath)

          const { error: deleteError } = await supabase.storage
            .from('product-media')
            .remove([filePath])

          if (deleteError) {
            throw deleteError
          }

          console.log('✅ Avatar eliminado del bucket product-media')
        }
      } catch (error) {
        console.error('Error eliminando del storage:', error)
      }

      // 2. Limpiar URL en perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user!.id)

      if (updateError) {
        throw updateError
      }

      console.log('✅ Avatar eliminado del perfil')
      setAvatarUrl(null)
      onAvatarChange?.(null)
      alert('Avatar eliminado correctamente')

    } catch (error) {
      console.error('❌ Error eliminando avatar:', error)
      alert('Error al eliminar el avatar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Preview del avatar */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-[#2A2A2A] border-4 border-[#FF7939] flex items-center justify-center">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              className="w-full h-full object-cover"
              onError={() => {
                console.error('Error cargando imagen del avatar')
                setAvatarUrl(null)
              }}
            />
          ) : (
            <User className="w-16 h-16 text-gray-500" />
          )}
        </div>

        {/* Indicador de carga */}
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="text-white text-sm">Subiendo...</div>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-2">
        {/* Botón de subir/cambiar */}
        <label
          htmlFor="avatar-upload"
          className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
            uploading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-[#FF7939] hover:bg-[#FF6B35]'
          } text-white text-sm font-medium`}
        >
          <Upload className="w-4 h-4" />
          {avatarUrl ? 'Cambiar' : 'Subir'}
          <input
            id="avatar-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={uploadAvatar}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {/* Botón de eliminar */}
        {avatarUrl && (
          <button
            onClick={deleteAvatar}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        )}
      </div>

      {/* Indicaciones */}
      <div className="text-center text-xs text-gray-400">
        <p>JPG, PNG o WEBP</p>
        <p>Máximo 2MB</p>
      </div>
    </div>
  )
}

