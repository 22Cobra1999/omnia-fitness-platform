# 👤 **Sistema de Avatar para Clientes - Especificación**

## 🎯 **Requerimientos:**

1. **Una sola imagen** por cliente
2. **Al subir nueva** → Elimina la anterior del bucket
3. **Al eliminar** → Elimina del bucket y limpia URL en perfil
4. **Storage en Supabase** → Bucket dedicado para avatares

---

## 🗂️ **Estructura de Storage:**

**Bucket:** `product-media` (ya existente)

```
product-media/
  └── avatars/
      ├── {user_id_1}.jpg
      ├── {user_id_2}.png
      └── {user_id_3}.webp
```

**Ejemplo:**
```
product-media/avatars/00dedc23-0b17-4e50-b84e-b2e8100dc93c.jpg
```

**URL Pública:**
```
https://{project}.supabase.co/storage/v1/object/public/product-media/avatars/{user_id}.{ext}
```

---

## 📊 **Base de Datos:**

### **Tabla `profiles` (ya existe):**
```sql
-- Columna que ya tienes:
avatar_url TEXT  -- URL pública del avatar
```

---

## 🔒 **Storage Policies (Supabase):**

**Usamos el bucket existente `product-media`** con la carpeta `avatars/`

```sql
-- Policy: Ver avatares (público)
CREATE POLICY "Usuarios pueden ver avatares en product-media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-media' 
  AND name LIKE 'avatars/%'
);

-- Policy: Subir solo su propio avatar
-- Path: avatars/{user_id}.{ext}
CREATE POLICY "Usuarios pueden subir su propio avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-media' 
  AND name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|webp)$')
);

-- Policy: Actualizar solo su propio avatar
CREATE POLICY "Usuarios pueden actualizar su propio avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-media' 
  AND name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|webp)$')
);

-- Policy: Eliminar solo su propio avatar
CREATE POLICY "Usuarios pueden eliminar su propio avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-media' 
  AND name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|webp)$')
);
```

**Explicación del Regex:**
```
^avatars/{user_id}\.(jpg|jpeg|png|webp)$

^ = inicio del string
avatars/ = carpeta fija
{user_id} = ID del usuario autenticado
\. = punto literal
(jpg|jpeg|png|webp) = extensiones permitidas
$ = fin del string
```

---

## 🎨 **Componente Frontend:**

### **`components/client/avatar-upload.tsx`:**

```typescript
"use client"

import { useState } from 'react'
import { Upload, Trash2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/auth-context'

interface AvatarUploadProps {
  currentAvatarUrl?: string
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
        const oldPath = avatarUrl.split('/').slice(-3).join('/')
        console.log('🗑️ Eliminando avatar anterior:', oldPath)
        
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([oldPath])
        
        if (deleteError) {
          console.warn('⚠️ Error eliminando avatar anterior:', deleteError)
        }
      }

      // 2. Subir nuevo avatar
      const filePath = `clientes/${user!.id}/avatar.${fileExt}`
      console.log('📤 Subiendo nuevo avatar:', filePath)

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Reemplaza si existe
        })

      if (uploadError) {
        throw uploadError
      }

      // 3. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
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
      if (!confirm('¿Eliminar tu avatar?')) return

      setUploading(true)

      // 1. Eliminar del bucket
      const filePath = avatarUrl.split('/').slice(-3).join('/')
      console.log('🗑️ Eliminando avatar:', filePath)

      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath])

      if (deleteError) {
        throw deleteError
      }

      // 2. Limpiar URL en perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user!.id)

      if (updateError) {
        throw updateError
      }

      console.log('✅ Avatar eliminado')
      setAvatarUrl(undefined)
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
            accept="image/jpeg,image/png,image/webp"
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
```

---

## 🔧 **Uso del Componente:**

### **En la página de perfil del cliente:**

```typescript
import { AvatarUpload } from '@/components/client/avatar-upload'

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<any>(null)

  // Cargar perfil
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user!.id)
      .single()
    
    setProfile(data)
  }

  const handleAvatarChange = (newUrl: string | null) => {
    // Actualizar estado local
    setProfile(prev => ({ ...prev, avatar_url: newUrl }))
  }

  return (
    <div className="p-4">
      <h1>Mi Perfil</h1>
      
      <AvatarUpload 
        currentAvatarUrl={profile?.avatar_url}
        onAvatarChange={handleAvatarChange}
      />
      
      {/* Resto del perfil */}
    </div>
  )
}
```

---

## 🔄 **Flujo Completo:**

### **1. Subir Primer Avatar:**
```
1. Usuario selecciona imagen
2. Valida formato y tamaño
3. Sube a: avatars/clientes/{user_id}/avatar.jpg
4. Obtiene URL pública
5. Guarda URL en profiles.avatar_url
6. Muestra avatar en UI
```

### **2. Cambiar Avatar:**
```
1. Usuario selecciona nueva imagen
2. Elimina avatar anterior del bucket
3. Sube nueva imagen (mismo path)
4. Obtiene nueva URL pública
5. Actualiza profiles.avatar_url
6. Muestra nuevo avatar
```

### **3. Eliminar Avatar:**
```
1. Usuario confirma eliminación
2. Elimina archivo del bucket
3. Limpia profiles.avatar_url (null)
4. Muestra icono por defecto
```

---

## 📝 **SQL para Supabase:**

```sql
-- Crear bucket de avatares
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso
CREATE POLICY "Avatares públicos para ver"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Usuarios pueden subir su avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Usuarios pueden actualizar su avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Usuarios pueden eliminar su avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);
```

---

## ✅ **Características Implementadas:**

- [x] Una sola imagen por usuario
- [x] Reemplazo automático al subir nueva
- [x] Eliminación del bucket al cambiar/eliminar
- [x] Validación de formato (JPG, PNG, WEBP)
- [x] Validación de tamaño (max 2MB)
- [x] Preview en tiempo real
- [x] UI con botones de Subir/Cambiar/Eliminar
- [x] Feedback visual (loading, alertas)
- [x] Storage público para fácil acceso
- [x] RLS policies para seguridad

---

## 🎯 **Ventajas de esta Implementación:**

1. **Simple**: Un solo archivo por usuario
2. **Eficiente**: Reemplaza en lugar de acumular
3. **Limpio**: Elimina archivos huérfanos
4. **Seguro**: RLS impide acceso no autorizado
5. **Rápido**: URL pública sin autenticación
6. **Escalable**: Estructura por carpetas de usuario

---

**¡Sistema de avatar listo para usar!** 🚀

