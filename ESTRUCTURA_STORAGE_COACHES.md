# 📂 Estructura de Storage Organizada por Coach

## 🎯 Objetivo

Organizar todos los archivos de media (imágenes, videos, certificados) por coach para:
- ✅ Fácil identificación del propietario de cada archivo
- ✅ Mejor organización y navegación en Supabase Storage
- ✅ Facilitar la limpieza y eliminación de archivos por coach
- ✅ Preparar el sistema para el crecimiento de la plataforma

## 📁 Nueva Estructura de Carpetas

### **Bucket: `product-media`**
```
product-media/
  coaches/
    {coach_id}/
      images/
        {timestamp}_{filename}
      videos/
        {timestamp}_{filename}
      exercises/
        {timestamp}_{filename}
```

### **Bucket: `user-media`**
```
user-media/
  coaches/
    {coach_id}/
      avatar/
        {timestamp}_{filename}
      certificates/
        {timestamp}_{filename}
  clients/
    {client_id}/
      avatar/
        {timestamp}_{filename}
```

## 🔧 Componentes Implementados

### 1. **API de Upload Organizado** (`/api/upload-organized`)

**Cambios principales:**
- ✅ Obtiene el `coach_id` del usuario autenticado
- ✅ Verifica el perfil y rol del usuario
- ✅ Organiza archivos en carpetas por coach
- ✅ Incluye información del coach en la respuesta

**Estructura de carpetas por categoría:**

| Categoría | MediaType | Ruta |
|-----------|-----------|------|
| `product` | `image` | `coaches/{coach_id}/images/{filename}` |
| `product` | `video` | `coaches/{coach_id}/videos/{filename}` |
| `exercise` | `video` | `coaches/{coach_id}/exercises/{filename}` |
| `user` | `avatar` | `coaches/{coach_id}/avatar/{filename}` |
| `user` | `certificate` | `coaches/{coach_id}/certificates/{filename}` |

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "url": "https://...supabase.co/storage/v1/object/public/product-media/coaches/abc-123/images/1234567_video.mp4",
  "path": "coaches/abc-123/images/1234567_video.mp4",
  "bucket": "product-media",
  "coach": {
    "id": "abc-123",
    "name": "Juan Pérez",
    "role": "coach"
  },
  "folderStructure": {
    "coachId": "abc-123",
    "category": "product",
    "mediaType": "image",
    "fullPath": "coaches/abc-123/images/1234567_video.mp4",
    "structure": "product-media/coaches/abc-123/images/1234567_video.mp4"
  }
}
```

### 2. **API de Inicialización de Storage** (`/api/coach/initialize-storage`)

**Métodos:**

#### **POST** - Inicializar estructura
Crea la estructura de carpetas para un nuevo coach:

```bash
POST /api/coach/initialize-storage
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Estructura de carpetas inicializada correctamente",
  "coach": {
    "id": "abc-123",
    "name": "Juan Pérez"
  },
  "folders": [
    { "bucket": "product-media", "type": "images", "status": "created" },
    { "bucket": "product-media", "type": "videos", "status": "created" },
    { "bucket": "product-media", "type": "exercises", "status": "created" },
    { "bucket": "user-media", "type": "avatar", "status": "created" },
    { "bucket": "user-media", "type": "certificates", "status": "created" }
  ],
  "structure": {
    "product-media": "coaches/abc-123",
    "user-media": "coaches/abc-123"
  }
}
```

#### **GET** - Verificar inicialización
Verifica si un coach ya tiene su estructura creada:

```bash
GET /api/coach/initialize-storage
```

**Respuesta:**
```json
{
  "initialized": true,
  "coachId": "abc-123",
  "metadata": {
    "coach_id": "abc-123",
    "storage_initialized": true,
    "initialization_date": "2025-01-07T12:00:00Z",
    "folder_structure": {
      "product-media": "coaches/abc-123",
      "user-media": "coaches/abc-123"
    }
  }
}
```

### 3. **Hook de Inicialización Automática**

**Archivo:** `hooks/use-coach-storage-initialization.ts`

```typescript
import { useCoachStorageInitialization } from '@/hooks/use-coach-storage-initialization'

function CoachDashboard() {
  const { initialized, loading, error } = useCoachStorageInitialization()
  
  // Se ejecuta automáticamente al iniciar sesión
  // Inicializa la estructura de carpetas si es necesario
  
  return (...)
}
```

**Características:**
- ✅ Se ejecuta automáticamente al iniciar sesión
- ✅ Verifica si el coach ya tiene estructura creada
- ✅ Crea la estructura solo si es necesario
- ✅ Maneja estados de loading y error

## 🚀 Flujo de Trabajo

### **1. Nuevo Coach se Registra**

1. Coach completa el registro
2. Inicia sesión por primera vez
3. El hook `useCoachStorageInitialization` se ejecuta automáticamente
4. Verifica si el storage está inicializado (GET)
5. Si no está inicializado, crea la estructura (POST)
6. Crea carpetas placeholder en:
   - `product-media/coaches/{coach_id}/images/`
   - `product-media/coaches/{coach_id}/videos/`
   - `product-media/coaches/{coach_id}/exercises/`
   - `user-media/coaches/{coach_id}/avatar/`
   - `user-media/coaches/{coach_id}/certificates/`

### **2. Coach Sube un Archivo**

1. Coach selecciona un archivo en el modal
2. Frontend envía el archivo a `/api/upload-organized`
3. API verifica la autenticación y obtiene el `coach_id`
4. Crea la ruta: `coaches/{coach_id}/{tipo}/{timestamp}_{filename}`
5. Sube el archivo a Supabase Storage
6. Retorna la URL pública con información del coach

### **3. Búsqueda de Archivos por Coach**

En Supabase Storage, ahora puedes navegar:
```
product-media/
  coaches/
    abc-123-def-456/  <- ID del Coach A
      images/
      videos/
    xyz-789-ghi-012/  <- ID del Coach B
      images/
      videos/
```

## 📊 Tabla de Metadata (Opcional)

Para mejor tracking, puedes crear una tabla `coach_storage_metadata`:

```sql
CREATE TABLE coach_storage_metadata (
  coach_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  storage_initialized BOOLEAN DEFAULT false,
  initialization_date TIMESTAMPTZ,
  folder_structure JSONB,
  total_files_count INTEGER DEFAULT 0,
  total_storage_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE coach_storage_metadata ENABLE ROW LEVEL SECURITY;

-- Policy: coaches solo pueden ver su propia metadata
CREATE POLICY "Coaches can view own storage metadata"
  ON coach_storage_metadata
  FOR SELECT
  USING (auth.uid() = coach_id);

-- Policy: coaches solo pueden actualizar su propia metadata
CREATE POLICY "Coaches can update own storage metadata"
  ON coach_storage_metadata
  FOR ALL
  USING (auth.uid() = coach_id);
```

## 🔐 Seguridad

### **Autenticación y Autorización**

1. **Upload Endpoint:**
   - ✅ Verifica token de autenticación
   - ✅ Obtiene `coach_id` del usuario autenticado
   - ✅ No permite especificar un `coach_id` diferente
   - ✅ Usa Service Key solo para operaciones de storage

2. **Initialize Endpoint:**
   - ✅ Verifica que el usuario sea un coach
   - ✅ Solo permite inicializar la estructura del propio usuario
   - ✅ Previene crear carpetas para otros usuarios

### **Storage Policies (RLS)**

Configurar en Supabase Storage:

```sql
-- Policy para product-media
CREATE POLICY "Coaches can upload to own folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-media' AND
    (storage.foldername(name))[1] = 'coaches' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Coaches can read own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'product-media' AND
    (storage.foldername(name))[1] = 'coaches' AND
    (storage.foldername(name))[2] = auth.uid()::text
  );

-- Policies similares para user-media
```

## 📈 Beneficios

### **Para Administradores:**
- ✅ Fácil identificación del propietario de archivos
- ✅ Limpieza selectiva por coach
- ✅ Auditoría y tracking mejorado
- ✅ Mejor gestión del espacio de storage

### **Para Coaches:**
- ✅ Archivos organizados y separados
- ✅ No hay conflictos de nombres con otros coaches
- ✅ Inicialización automática transparente
- ✅ Mejor rendimiento en búsquedas

### **Para el Sistema:**
- ✅ Escalabilidad mejorada
- ✅ Estructura predecible y mantenible
- ✅ Preparado para crecimiento
- ✅ Fácil migración de archivos existentes

## 🔄 Migración de Archivos Existentes

Si tienes archivos en la estructura antigua, puedes migrarlos:

1. Identificar archivos en `activity_media` por `activity_id`
2. Obtener `coach_id` desde `activities` table
3. Mover archivos a la nueva estructura:
   ```
   FROM: images/products/{filename}
   TO:   coaches/{coach_id}/images/{filename}
   ```

## 🎯 Próximos Pasos

1. ✅ **Implementado:** Upload organizado por coach
2. ✅ **Implementado:** Inicialización automática
3. ✅ **Implementado:** Hook de React para auto-init
4. 🔄 **Pendiente:** Crear tabla `coach_storage_metadata`
5. 🔄 **Pendiente:** Configurar RLS policies en Storage
6. 🔄 **Pendiente:** Migrar archivos existentes
7. 🔄 **Pendiente:** Dashboard de storage para coaches

## 📝 Uso en el Código

### **Componente que sube archivos:**

```typescript
// El upload ahora incluye automáticamente el coach_id
const formData = new FormData()
formData.append('file', file)
formData.append('mediaType', 'image')
formData.append('category', 'product')

const response = await fetch('/api/upload-organized', {
  method: 'POST',
  body: formData
})

const data = await response.json()
// data.coach.id -> ID del coach
// data.folderStructure.fullPath -> Ruta completa con coach_id
```

### **Dashboard del Coach:**

```typescript
import { useCoachStorageInitialization } from '@/hooks/use-coach-storage-initialization'

function CoachDashboard() {
  const { initialized, loading } = useCoachStorageInitialization()
  
  if (loading) {
    return <div>Preparando tu espacio de trabajo...</div>
  }
  
  if (!initialized) {
    return <div>Error inicializando storage</div>
  }
  
  return <div>Dashboard listo</div>
}
```

---

**Última actualización:** 7 de Octubre, 2025
**Versión:** 1.0
**Estado:** ✅ Implementado y listo para usar





