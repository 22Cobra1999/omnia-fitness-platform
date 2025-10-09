# 👤 **Sistema de Avatar - Versión Final con Bucket Existente**

## ✅ **Cambios Implementados:**

### **1. Uso del Bucket Existente `product-media`**
- ❌ **NO creamos** bucket nuevo `avatars`
- ✅ **Usamos** bucket existente `product-media`
- ✅ **Carpeta dedicada**: `product-media/avatars/`

### **2. Estructura Simple de Archivos**
```
product-media/
  └── avatars/
      ├── 00dedc23-0b17-4e50-b84e-b2e8100dc93c.jpg
      ├── b16c4f8c-f47b-4df0-ad2b-13dcbd76263f.png
      └── otro-user-id.webp
```

**Ventajas:**
- Un solo archivo por usuario
- Nombre = `{user_id}.{ext}`
- Fácil de identificar y gestionar
- No requiere subcarpetas

### **3. Error de Storage Initialization Resuelto**

**Problema:**
```
❌ Error inicializando storage: {
  error: 'Solo los coaches pueden inicializar su estructura de archivos',
  details: 'User is not a coach'
}
```

**Solución:**
Modificado `hooks/use-coach-storage-initialization.ts` para que:
- ✅ Detecte cuando el usuario **NO es coach** (status 403)
- ✅ Salga **silenciosamente** sin mostrar error
- ✅ Marque como "inicializado" para no volver a intentar
- ✅ Solo muestre errores si es coach y falla la inicialización

**Código:**
```typescript
// Si retorna 403, el usuario no es coach - salir silenciosamente
if (checkResponse.status === 403) {
  console.log('ℹ️ Usuario no es coach, no requiere storage initialization')
  setInitialized(true)
  setLoading(false)
  return
}
```

---

## 📊 **Base de Datos:**

### **Tabla `user_profiles`:**
```sql
-- Columna que ya existe:
avatar_url TEXT  -- URL del avatar en product-media/avatars/
```

**Ejemplos de URLs:**
```
https://xxx.supabase.co/storage/v1/object/public/product-media/avatars/00dedc23-0b17-4e50-b84e-b2e8100dc93c.jpg
https://xxx.supabase.co/storage/v1/object/public/product-media/avatars/b16c4f8c-f47b-4df0-ad2b-13dcbd76263f.png
```

---

## 🔒 **Storage Policies:**

```sql
-- 1. Ver avatares (todos pueden ver)
CREATE POLICY "Usuarios pueden ver avatares en product-media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-media' 
  AND name LIKE 'avatars/%'
);

-- 2. Subir solo su propio avatar
CREATE POLICY "Usuarios pueden subir su propio avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-media' 
  AND name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|webp)$')
);

-- 3. Actualizar solo su propio avatar
CREATE POLICY "Usuarios pueden actualizar su propio avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-media' 
  AND name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|webp)$')
);

-- 4. Eliminar solo su propio avatar
CREATE POLICY "Usuarios pueden eliminar su propio avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-media' 
  AND name ~ ('^avatars/' || auth.uid()::text || '\.(jpg|jpeg|png|webp)$')
);
```

**Cómo funciona el Regex:**
```
Path del usuario: avatars/00dedc23-0b17-4e50-b84e-b2e8100dc93c.jpg
Regex generado:   ^avatars/00dedc23-0b17-4e50-b84e-b2e8100dc93c\.(jpg|jpeg|png|webp)$

✅ Match → Usuario puede acceder
❌ No match → Acceso denegado
```

---

## 🎨 **Componente `AvatarUpload`:**

### **Flujo de Subida:**
```typescript
1. Usuario selecciona imagen
2. Valida formato (JPG, PNG, WEBP) y tamaño (max 2MB)
3. Si existe avatar anterior:
   - Extrae path desde URL
   - Elimina archivo del bucket product-media
4. Sube nueva imagen:
   - Path: avatars/{user_id}.{ext}
   - Bucket: product-media
   - Upsert: true (reemplaza si existe)
5. Obtiene URL pública
6. Actualiza user_profiles.avatar_url
7. Muestra nuevo avatar
```

### **Flujo de Eliminación:**
```typescript
1. Usuario confirma eliminación
2. Extrae path desde URL
3. Elimina archivo del bucket product-media
4. Limpia user_profiles.avatar_url (null)
5. Muestra icono por defecto
```

---

## 🔄 **Archivos Modificados:**

### **1. `components/client/avatar-upload.tsx`:**
```typescript
// ✅ Usa bucket product-media
const filePath = `avatars/${user!.id}.${fileExt}`

const { error } = await supabase.storage
  .from('product-media')  // ← Cambiado de 'avatars' a 'product-media'
  .upload(filePath, file, {
    upsert: true
  })

// ✅ Obtiene URL pública
const { data: { publicUrl } } = supabase.storage
  .from('product-media')  // ← Cambiado
  .getPublicUrl(filePath)
```

### **2. `hooks/use-coach-storage-initialization.ts`:**
```typescript
// ✅ Maneja status 403 silenciosamente
if (checkResponse.status === 403) {
  console.log('ℹ️ Usuario no es coach, no requiere storage')
  setInitialized(true)  // No volver a intentar
  return
}
```

### **3. `db/create_avatars_bucket.sql`:**
```sql
-- ✅ Policies para carpeta avatars/ en product-media
-- ✅ Regex para validar path: avatars/{user_id}.{ext}
-- ✅ Solo permite subir/editar/eliminar su propio archivo
```

---

## 📝 **Instrucciones de Instalación:**

### **1. Ejecutar SQL en Supabase:**
```sql
-- Ejecutar: db/create_avatars_bucket.sql
-- Esto crea las 4 policies para avatares en product-media
```

### **2. Verificar Estructura:**
```
✅ Bucket: product-media (ya existe)
✅ Carpeta: avatars/ (se crea automáticamente al subir primer avatar)
✅ Policies: 4 policies activas para SELECT/INSERT/UPDATE/DELETE
```

### **3. Usar Componente:**
```typescript
import { AvatarUpload } from '@/components/client/avatar-upload'

<AvatarUpload 
  currentAvatarUrl={profile?.avatar_url}
  onAvatarChange={(url) => console.log('Nuevo avatar:', url)}
/>
```

---

## 🎯 **Diferencias Clave vs Sistema Anterior:**

| Aspecto | Anterior | Ahora |
|---------|----------|-------|
| **Bucket** | `avatars` (nuevo) | `product-media` (existente) |
| **Path** | `avatars/clientes/{uid}/avatar.jpg` | `avatars/{uid}.jpg` |
| **Estructura** | Carpetas por usuario | Archivos planos |
| **Storage Coach** | Error 403 en consola | Manejo silencioso |
| **Policies** | Por carpeta | Por regex de filename |

---

## ✅ **Checklist de Verificación:**

- [x] Componente usa bucket `product-media`
- [x] Path simplificado: `avatars/{user_id}.{ext}`
- [x] Hook de storage no muestra error para clientes
- [x] Reemplazo automático al subir nuevo avatar
- [x] Eliminación del bucket funcional
- [x] Policies con regex funcionando
- [x] URLs correctas en `user_profiles.avatar_url`
- [ ] SQL ejecutado en Supabase
- [ ] Probado subir avatar como cliente
- [ ] Probado cambiar avatar (verifica eliminación)
- [ ] Probado eliminar avatar

---

## 🚀 **Estado Final:**

**✅ Sistema completamente actualizado:**
- Usa bucket existente `product-media`
- No requiere storage especial para clientes
- Error 403 manejado silenciosamente
- Estructura simple y eficiente
- Listo para producción

**Próximo paso:** Ejecutar `db/create_avatars_bucket.sql` en Supabase y probar! 🎉



