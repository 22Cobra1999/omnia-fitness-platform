# 📦 Estrategia de Buckets de Supabase Storage

## 🎯 Buckets Disponibles

### 1. **`coach-content`** (Público)
- **Propósito**: Contenido multimedia de coaches (videos, imágenes, documentos)
- **Estado**: ✅ Funcional
- **Restricciones**: Solo archivos multimedia (image/*, video/*, application/pdf)
- **Uso recomendado**: Videos de entrenamiento, contenido educativo

### 2. **`product-images`** (Público) 
- **Propósito**: Imágenes y videos de productos/actividades
- **Estado**: ✅ **FUNCIONAL** (confirmado por diagnóstico)
- **Restricciones**: Solo archivos multimedia
- **Uso recomendado**: **PRINCIPAL** para productos, actividades, media

### 3. **`avatars`** (Público)
- **Propósito**: Avatares de usuarios (coaches, clientes)
- **Estado**: ❌ Restricciones MIME (no permite text/plain)
- **Restricciones**: Solo imágenes de perfil
- **Uso recomendado**: Fotos de perfil únicamente

### 4. **`public`** (Público)
- **Propósito**: Archivos públicos generales
- **Estado**: ❌ Restricciones MIME (no permite text/plain)
- **Restricciones**: Solo archivos multimedia
- **Uso recomendado**: Archivos públicos generales

## 🎯 Estrategia de Uso Recomendada

### **BUCKET PRINCIPAL: `product-images`**
```typescript
// ✅ USAR SIEMPRE para:
- Imágenes de productos/actividades
- Videos de productos/actividades  
- PDFs de productos/actividades
- Cualquier media relacionado con productos
```

### **BUCKET SECUNDARIO: `coach-content`**
```typescript
// ✅ USAR para:
- Videos de entrenamiento de coaches
- Contenido educativo adicional
- Material de apoyo de coaches
```

### **BUCKET ESPECÍFICO: `avatars`**
```typescript
// ✅ USAR para:
- Fotos de perfil de coaches
- Fotos de perfil de clientes
- Solo imágenes (no videos)
```

### **BUCKET GENERAL: `public`**
```typescript
// ✅ USAR para:
- Archivos públicos generales
- Documentos compartidos
- Assets estáticos de la aplicación
```

## 🛠️ Implementación en Código

### **Endpoint `/api/upload-media`**
```typescript
// Estrategia de buckets por tipo de archivo:
const getBucketForMediaType = (mediaType: string, fileType: string) => {
  // Para productos/actividades (PRINCIPAL)
  if (mediaType === 'product' || mediaType === 'activity') {
    return 'product-images'
  }
  
  // Para avatares
  if (mediaType === 'avatar' && fileType.startsWith('image/')) {
    return 'avatars'
  }
  
  // Para contenido de coach
  if (mediaType === 'coach-content') {
    return 'coach-content'
  }
  
  // Por defecto, usar product-images (más confiable)
  return 'product-images'
}
```

### **Estructura de Paths**
```
product-images/
├── images/
│   ├── products/
│   └── activities/
├── videos/
│   ├── products/
│   └── activities/
└── documents/
    └── pdfs/

avatars/
├── coaches/
└── clients/

coach-content/
├── videos/
├── images/
└── documents/

public/
├── assets/
└── shared/
```

## 🚨 Reglas de Uso

### ✅ **SIEMPRE USAR**
- **`product-images`** para cualquier media de productos/actividades
- **`avatars`** solo para fotos de perfil
- **`coach-content`** para contenido educativo de coaches

### ❌ **NUNCA USAR**
- **`avatars`** para videos o documentos
- **`public`** como bucket principal (tiene restricciones)
- Múltiples buckets para el mismo tipo de contenido

### 🔄 **FALLBACK STRATEGY**
```typescript
// Si product-images falla, NO usar fallback
// Mejor mostrar error claro al usuario
// Los otros buckets tienen restricciones que causan problemas
```

## 📊 Estado Actual

| Bucket | Estado | Confiabilidad | Uso Recomendado |
|--------|--------|---------------|------------------|
| `product-images` | ✅ Funcional | 🟢 Alta | **PRINCIPAL** |
| `coach-content` | ✅ Funcional | 🟢 Alta | Secundario |
| `avatars` | ⚠️ Restricciones | 🟡 Media | Solo avatares |
| `public` | ⚠️ Restricciones | 🟡 Media | Archivos generales |

## 🎯 Próximos Pasos

1. **Simplificar `/api/upload-media`** para usar solo `product-images`
2. **Crear endpoints específicos** para avatares (`/api/upload-avatar`)
3. **Documentar** la estrategia en el código
4. **Monitorear** el uso de cada bucket
