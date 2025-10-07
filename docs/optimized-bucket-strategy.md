# 🎯 Estrategia Optimizada de Buckets

## 📊 Análisis de Tipos de Archivos

### **Archivos a Gestionar:**
1. **Fotos de perfil de clientes** 👤
2. **Fotos de perfil de coaches** 👨‍💼
3. **Fotos de productos** 📦
4. **Videos de productos** 🎬
5. **Videos de ejercicios** 🏃‍♂️
6. **Certificados de coaches** 🏆

## 🎯 Estrategia Recomendada: **2 BUCKETS PRINCIPALES**

### **Opción A: Estrategia por Función (RECOMENDADA)**

#### **1. `user-media` (Público)**
```
user-media/
├── avatars/
│   ├── coaches/
│   └── clients/
└── certificates/
    └── coaches/
```
**Contenido:**
- Fotos de perfil de clientes
- Fotos de perfil de coaches  
- Certificados de coaches

#### **2. `product-media` (Público)**
```
product-media/
├── images/
│   └── products/
├── videos/
│   ├── products/
│   └── exercises/
```
**Contenido:**
- Fotos de productos
- Videos de productos
- Videos de ejercicios

### **Opción B: Estrategia por Tipo de Usuario**

#### **1. `coach-content` (Público)**
```
coach-content/
├── avatars/
├── certificates/
├── exercise-videos/
└── product-videos/
```

#### **2. `client-content` (Público)**
```
client-content/
├── avatars/
└── product-images/
```

## 🏆 **RECOMENDACIÓN: Opción A (Por Función)**

### **Ventajas:**
- ✅ **Escalabilidad**: Fácil agregar nuevos tipos de contenido
- ✅ **Organización**: Lógica clara por función
- ✅ **Performance**: Menos buckets = menos complejidad
- ✅ **Mantenimiento**: Más fácil de gestionar
- ✅ **Costos**: Menos overhead de buckets

### **Implementación:**

```typescript
// Función para determinar bucket y path
const getStoragePath = (fileType: string, category: string, userId: string) => {
  const timestamp = Date.now()
  const fileName = `${userId}_${timestamp}_${file.name}`
  
  switch (category) {
    case 'user-avatar':
      return {
        bucket: 'user-media',
        path: `avatars/${fileType === 'coach' ? 'coaches' : 'clients'}/${fileName}`
      }
    
    case 'certificate':
      return {
        bucket: 'user-media', 
        path: `certificates/coaches/${fileName}`
      }
    
    case 'product-image':
      return {
        bucket: 'product-media',
        path: `images/products/${fileName}`
      }
    
    case 'product-video':
      return {
        bucket: 'product-media',
        path: `videos/products/${fileName}`
      }
    
    case 'exercise-video':
      return {
        bucket: 'product-media',
        path: `videos/exercises/${fileName}`
      }
    
    default:
      return {
        bucket: 'product-media',
        path: `misc/${fileName}`
      }
  }
}
```

## 🛠️ **Implementación Práctica**

### **Endpoint Unificado: `/api/upload-file`**

```typescript
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const category = formData.get('category') as string // 'user-avatar', 'certificate', etc.
  const userType = formData.get('userType') as string // 'coach', 'client'
  
  const { bucket, path } = getStoragePath(userType, category, userId)
  
  // Subir a bucket específico
  const result = await supabase.storage
    .from(bucket)
    .upload(path, file, options)
}
```

### **Endpoints Específicos (Opcional):**

```typescript
// /api/upload-avatar
// /api/upload-certificate  
// /api/upload-product-media
```

## 📊 **Comparación de Estrategias**

| Aspecto | 1 Bucket | 2 Buckets | 6 Buckets |
|---------|----------|-----------|-----------|
| **Simplicidad** | 🟢 Alta | 🟡 Media | 🔴 Baja |
| **Organización** | 🔴 Baja | 🟢 Alta | 🟢 Alta |
| **Performance** | 🟢 Alta | 🟢 Alta | 🔴 Baja |
| **Escalabilidad** | 🔴 Baja | 🟢 Alta | 🟡 Media |
| **Mantenimiento** | 🟢 Fácil | 🟡 Medio | 🔴 Difícil |
| **Costos** | 🟢 Bajo | 🟡 Medio | 🔴 Alto |

## 🎯 **Estrategia Final Recomendada**

### **2 BUCKETS PRINCIPALES:**

#### **`user-media`** 
- **Propósito**: Todo lo relacionado con usuarios
- **Contenido**: Avatares, certificados, documentos personales
- **Path Structure**: `{type}/{userType}/{file}`

#### **`product-media`**
- **Propósito**: Todo lo relacionado con productos/contenido
- **Contenido**: Imágenes de productos, videos, ejercicios
- **Path Structure**: `{mediaType}/{contentType}/{file}`

### **Ventajas de esta Estrategia:**
- ✅ **Balance perfecto** entre simplicidad y organización
- ✅ **Escalable** para futuros tipos de contenido
- ✅ **Fácil de mantener** y debuggear
- ✅ **Performance optimizada**
- ✅ **Costos controlados**

## 🚀 **Próximos Pasos**

1. **Crear buckets** `user-media` y `product-media`
2. **Implementar función** `getStoragePath()`
3. **Actualizar endpoints** existentes
4. **Migrar archivos** existentes a nueva estructura
5. **Documentar** nueva estrategia
