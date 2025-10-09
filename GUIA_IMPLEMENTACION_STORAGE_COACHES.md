# 🚀 Guía de Implementación - Storage Organizado por Coach

## 📋 Resumen

Este documento contiene las instrucciones paso a paso para implementar completamente el sistema de storage organizado por coach en la plataforma OMNIA.

---

## ✅ PASO 1: Crear Tabla de Metadata

### **Ejecutar en Supabase SQL Editor:**

1. Ve a tu proyecto de Supabase
2. Click en **SQL Editor** (barra lateral izquierda)
3. Click en **"+ New query"**
4. Copia y pega el contenido de: `sql/create_coach_storage_metadata.sql`
5. Click en **"Run"**

**Verificación:**
```sql
SELECT * FROM coach_storage_metadata;
```
Debería retornar una tabla vacía sin errores.

---

## ✅ PASO 2: Configurar RLS Policies en Storage

### **⚠️ IMPORTANTE: Esto debe hacerse desde el Dashboard de Storage, NO desde SQL Editor**

### **Para bucket `product-media`:**

1. Ve a **Storage** en Supabase Dashboard
2. Click en bucket **`product-media`**
3. Click en la pestaña **"Policies"**
4. Click en **"New Policy"**
5. Crea cada una de estas políticas:

#### **Policy 1: Coaches pueden subir a su carpeta**
- **Name:** `Coaches can upload to own folder`
- **Allowed operation:** `INSERT`
- **Policy definition:**
```sql
(bucket_id = 'product-media') AND 
((storage.foldername(name))[1] = 'coaches') AND 
((storage.foldername(name))[2] = (auth.uid())::text)
```

#### **Policy 2: Coaches pueden leer sus archivos**
- **Name:** `Coaches can read own files`
- **Allowed operation:** `SELECT`
- **Policy definition:**
```sql
(bucket_id = 'product-media') AND 
((storage.foldername(name))[1] = 'coaches') AND 
((storage.foldername(name))[2] = (auth.uid())::text)
```

#### **Policy 3: Público puede ver archivos**
- **Name:** `Public can view product media`
- **Allowed operation:** `SELECT`
- **Policy definition:**
```sql
bucket_id = 'product-media'
```

#### **Policy 4: Coaches pueden actualizar sus archivos**
- **Name:** `Coaches can update own files`
- **Allowed operation:** `UPDATE`
- **Policy definition:**
```sql
(bucket_id = 'product-media') AND 
((storage.foldername(name))[1] = 'coaches') AND 
((storage.foldername(name))[2] = (auth.uid())::text)
```

#### **Policy 5: Coaches pueden eliminar sus archivos**
- **Name:** `Coaches can delete own files`
- **Allowed operation:** `DELETE`
- **Policy definition:**
```sql
(bucket_id = 'product-media') AND 
((storage.foldername(name))[1] = 'coaches') AND 
((storage.foldername(name))[2] = (auth.uid())::text)
```

### **Para bucket `user-media`:**

Repite el proceso anterior pero cambiando `'product-media'` por `'user-media'`:

1. Click en bucket **`user-media`**
2. Click en **"Policies"**
3. Crear las mismas 5 políticas pero para `user-media`

### **ALTERNATIVA SIMPLIFICADA (si las políticas anteriores dan problemas):**

Si tienes problemas con las políticas granulares, usa estas políticas más simples:

#### **Para product-media:**
```sql
-- Policy: Authenticated can manage
(bucket_id = 'product-media') AND (auth.role() = 'authenticated')

-- Policy: Public can read
bucket_id = 'product-media'
```

#### **Para user-media:**
```sql
-- Policy: Authenticated can manage
(bucket_id = 'user-media') AND (auth.role() = 'authenticated')
```

---

## ✅ PASO 3: Migrar Archivos Existentes (OPCIONAL)

**⚠️ RECOMENDADO: Hacer primero un DRY RUN para ver qué se va a mover**

### **Simulación (DRY RUN):**

```bash
cd /Users/francopomati/Downloads/omnia\ \(3\)
DRY_RUN=true npx tsx scripts/migrate-storage-to-coach-folders.ts
```

Esto mostrará un reporte de qué archivos se moverían **SIN MOVERLOS**.

### **Migración Real:**

**⚠️ CUIDADO: Esto moverá archivos permanentemente**

```bash
DRY_RUN=false npx tsx scripts/migrate-storage-to-coach-folders.ts
```

### **¿Qué hace el script?**

1. Lee todos los registros de `activity_media`
2. Para cada archivo, obtiene el `coach_id` desde `activities`
3. Mueve archivos de:
   ```
   FROM: images/products/{filename}
   TO:   coaches/{coach_id}/images/{filename}
   ```
4. Actualiza las URLs en la base de datos
5. Genera un reporte completo

---

## ✅ PASO 4: Verificar Integración (YA HECHO)

El hook de inicialización automática ya está integrado en `app-mobile.tsx`:

```typescript
import { useCoachStorageInitialization } from "@/hooks/use-coach-storage-initialization"

// En MobileApp():
const { initialized: storageInitialized, loading: storageLoading } = useCoachStorageInitialization()
```

**Esto significa:**
- ✅ Cuando un coach inicia sesión por primera vez
- ✅ Se verifica automáticamente si tiene carpetas creadas
- ✅ Si no las tiene, se crean automáticamente
- ✅ Todo sucede de forma transparente en background

---

## 🧪 PASO 5: Probar el Sistema

### **Test 1: Nuevo Coach**

1. Crear una nueva cuenta de coach
2. Iniciar sesión
3. Verificar en consola del navegador:
   ```
   ✅ Storage inicializado exitosamente
   ```
4. Verificar en Supabase Storage que se crearon las carpetas:
   ```
   product-media/coaches/{nuevo_coach_id}/
   ```

### **Test 2: Subida de Imagen**

1. Como coach, ir a "Gestión de Productos"
2. Click en "Crear Producto"
3. Subir una imagen de portada
4. Verificar en logs del servidor:
   ```
   📂 UPLOAD-ORGANIZED: Estructura organizada por coach:
     coachId: {coach_id}
     folderPath: coaches/{coach_id}/images/{timestamp}_{filename}
   ```
5. Verificar en Supabase Storage:
   ```
   product-media/coaches/{coach_id}/images/{archivo}
   ```

### **Test 3: Reutilización de Archivos**

1. Editar un producto existente
2. Click en "Seleccionar Imagen de Portada"
3. Verificar que se muestran TODAS las imágenes del coach
4. Verificar en logs:
   ```
   📁 MediaSelectionModal: Media filtrada: {
     totalArchivos: X,
     archivosFiltrados: Y
   }
   ```

### **Test 4: Seguridad**

1. Intentar acceder a archivos de otro coach (solo si tienes 2 coaches)
2. Debería ser bloqueado por RLS policies
3. Cada coach solo ve sus propios archivos

---

## 📊 VERIFICACIÓN EN SUPABASE

### **Verificar Tabla:**
```sql
-- Ver metadata de todos los coaches
SELECT 
  coach_id,
  storage_initialized,
  initialization_date,
  total_files_count,
  total_storage_bytes
FROM coach_storage_metadata;
```

### **Verificar Estructura en Storage:**

1. Ve a **Storage** en Supabase Dashboard
2. Click en **`product-media`**
3. Deberías ver:
   ```
   coaches/
     {coach_id_1}/
       images/
       videos/
       exercises/
     {coach_id_2}/
       images/
       videos/
       exercises/
   ```

### **Verificar Policies:**

1. Ve a **Storage** > **product-media** > **Policies**
2. Deberías ver las 5 políticas creadas
3. Cada una debe tener estado: ✅ Enabled

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### **Problema 1: Error al crear tabla**

**Error:** `relation "coach_storage_metadata" already exists`

**Solución:** La tabla ya existe, puedes omitir este paso.

---

### **Problema 2: Error al subir archivos**

**Error:** `new row violates row-level security policy`

**Solución:** 
1. Verifica que las políticas de Storage estén creadas
2. Verifica que el usuario esté autenticado
3. Temporalmente, puedes deshabilitar RLS en Storage para testing

---

### **Problema 3: Script de migración falla**

**Error:** `Cannot find module 'tsx'`

**Solución:**
```bash
npm install -g tsx
# O usar directamente:
npx tsx scripts/migrate-storage-to-coach-folders.ts
```

---

### **Problema 4: Hook no se ejecuta**

**Solución:**
1. Verifica que estés autenticado como coach
2. Abre la consola del navegador
3. Busca logs de inicialización
4. El hook solo se ejecuta para usuarios con rol 'coach'

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

- [ ] **PASO 1:** Tabla `coach_storage_metadata` creada en Supabase
- [ ] **PASO 2:** RLS Policies configuradas en Storage (product-media)
- [ ] **PASO 2:** RLS Policies configuradas en Storage (user-media)
- [ ] **PASO 3:** Script de migración ejecutado (DRY RUN primero)
- [ ] **PASO 3:** Script de migración ejecutado (modo real)
- [ ] **PASO 4:** Hook integrado en app-mobile.tsx ✅ (YA HECHO)
- [ ] **PASO 5:** Tests completados (nuevo coach, subida, reutilización)

---

## 🎯 ORDEN RECOMENDADO DE EJECUCIÓN

### **Opción A: Implementación Completa (Recomendado)**

1. ✅ Crear tabla metadata (PASO 1)
2. ✅ Configurar RLS policies (PASO 2)
3. ⚠️ Migrar archivos existentes con DRY_RUN=true (PASO 3)
4. ✅ Revisar resultados de la simulación
5. ⚠️ Migrar archivos reales con DRY_RUN=false (PASO 3)
6. ✅ Probar con un nuevo coach (PASO 5)

### **Opción B: Implementación Mínima (Sin migrar archivos antiguos)**

1. ✅ Crear tabla metadata (PASO 1)
2. ✅ Configurar RLS policies simplificadas (PASO 2 - Alternativa)
3. ⏭️ Saltar migración (los archivos viejos seguirán funcionando)
4. ✅ Probar con un nuevo coach (PASO 5)

---

## 📞 SOPORTE

Si encuentras algún problema:

1. **Revisa los logs del servidor** (terminal donde corre `npm run dev`)
2. **Revisa los logs del navegador** (Console de Chrome DevTools)
3. **Verifica las variables de entorno** (.env.local)
4. **Verifica la autenticación** (usuario debe estar logueado)

---

**Última actualización:** 7 de Octubre, 2025
**Versión:** 1.0
**Estado:** ✅ Listo para implementar





