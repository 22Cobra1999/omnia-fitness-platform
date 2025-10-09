# ✅ VERIFICACIÓN MANUAL - Setup de Supabase

Ya ejecutaste los 2 SQLs en Supabase. Ahora vamos a verificar que todo se creó correctamente.

---

## 🔍 **VERIFICACIÓN 1: Tabla `coach_storage_metadata`**

### **En Supabase Dashboard:**

1. Ve a: **Database** → **Tables** (barra lateral)
2. Busca la tabla: **`coach_storage_metadata`**

**✅ Debería aparecer en la lista**

### **Columnas esperadas:**

- `coach_id` (UUID, PRIMARY KEY)
- `storage_initialized` (BOOLEAN)
- `initialization_date` (TIMESTAMPTZ)
- `folder_structure` (JSONB)
- `total_files_count` (INTEGER)
- `total_storage_bytes` (BIGINT)
- `last_upload_date` (TIMESTAMPTZ)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### **Verificar RLS:**

1. Click en la tabla `coach_storage_metadata`
2. Ve a la pestaña **"RLS"**
3. **Debería decir:** "Row Level Security is enabled"

### **Verificar Policies:**

Deberías ver estas políticas:

- ✅ `Coaches can view own storage metadata`
- ✅ `Coaches can insert own storage metadata`
- ✅ `Coaches can update own storage metadata`

---

## 🔍 **VERIFICACIÓN 2: Storage Policies**

### **Para `product-media`:**

1. Ve a: **Storage** → **product-media**
2. Click en pestaña: **Policies**

**¿Cuántas policies ves?**

#### **Si ves 5 policies:**
✅ Excelente, configuración completa

#### **Si ves 0 policies:**
⚠️ Necesitas configurar las policies de Storage

**OPCIONES:**

**A) Configuración Completa (Segura):**
- Seguir: `EJECUTAR_EN_SUPABASE.md` (sección 2)
- Crear las 5 policies manualmente

**B) Configuración Rápida (Para testing):**

Ejecuta esto en Supabase Dashboard → Storage → product-media → Policies:

```sql
-- Policy 1: Authenticated can manage
Name: Allow authenticated users full access
Policy Command: ALL
Target roles: authenticated
USING expression:
bucket_id = 'product-media'

-- Policy 2: Public can read
Name: Allow public read access
Policy Command: SELECT
Target roles: anon, authenticated
USING expression:
bucket_id = 'product-media'
```

### **Para `user-media`:**

Repetir lo mismo pero para bucket `user-media`.

---

## 🔍 **VERIFICACIÓN 3: Consulta SQL**

### **En Supabase SQL Editor:**

Ejecuta esto para ver el estado actual:

```sql
-- Ver estructura de la tabla
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'coach_storage_metadata'
ORDER BY ordinal_position;

-- Ver si hay registros
SELECT 
  COUNT(*) as total_registros
FROM coach_storage_metadata;

-- Ver policies activas
SELECT 
  tablename, 
  policyname
FROM pg_policies
WHERE tablename = 'coach_storage_metadata';

-- Ver actividades con coach_id (para migración)
SELECT 
  COUNT(*) as actividades_con_coach,
  COUNT(DISTINCT coach_id) as coaches_unicos
FROM activities
WHERE coach_id IS NOT NULL;

-- Ver media existente (para migración)
SELECT 
  COUNT(*) as total_media,
  COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as con_imagen,
  COUNT(CASE WHEN video_url IS NOT NULL THEN 1 END) as con_video
FROM activity_media;
```

**Resultados esperados:**

```
coach_storage_metadata:
- total_registros: 0 (normal si es nuevo)

policies:
- Deberías ver 3 policies listadas

activities:
- actividades_con_coach: (tu número)
- coaches_unicos: (tu número)

activity_media:
- total_media: (tu número)
- con_imagen: (cuántas tienen imagen)
- con_video: (cuántas tienen video)
```

---

## ✅ **CHECKLIST DE VERIFICACIÓN:**

Marca lo que ya tienes:

### **Base de Datos:**
- [ ] Tabla `coach_storage_metadata` existe
- [ ] Tiene las 9 columnas correctas
- [ ] RLS está habilitado
- [ ] Hay 3 policies activas
- [ ] Trigger `update_updated_at` existe

### **Storage:**
- [ ] Bucket `product-media` existe
- [ ] Bucket `user-media` existe
- [ ] Policies configuradas en `product-media`
- [ ] Policies configuradas en `user-media`

### **Opcional (para verificar que funciona):**
- [ ] Ejecutar consultas SQL de verificación
- [ ] Ver cantidad de actividades existentes
- [ ] Ver cantidad de media existente

---

## 🎯 **SIGUIENTE PASO:**

### **Si TODO está ✅:**

```bash
# 1. Iniciar servidor
npm run dev

# 2. Abrir navegador
http://localhost:3006

# 3. Iniciar sesión como coach

# 4. Verificar en Console del navegador:
# Debería aparecer:
✅ Storage inicializado exitosamente
```

### **Si hay algo pendiente:**

**Falta configurar Storage Policies:**
- Ve a: `EJECUTAR_EN_SUPABASE.md` → Sección 2
- O usa la configuración rápida de arriba

**Falta algo en la tabla:**
- Re-ejecuta: `sql/create_coach_storage_metadata.sql`

---

## 🧪 **PRUEBA FINAL:**

### **Test 1: Auto-Inicialización**

1. Inicia sesión como coach (cualquier coach)
2. Abre **Console** del navegador (F12)
3. Busca este log:
   ```
   🔄 Inicializando storage para el coach: {tu_id}
   🎉 Storage del coach inicializado exitosamente.
   ```

4. Ve a Supabase → Storage → product-media
5. Deberías ver:
   ```
   coaches/
     {tu_coach_id}/
       images/
       videos/
       exercises/
   ```

### **Test 2: Upload**

1. Como coach, ve a "Gestión de Productos"
2. Click "Crear Producto"
3. Sube una imagen de portada
4. Verifica en Supabase Storage:
   ```
   product-media/coaches/{tu_id}/images/{timestamp}_{archivo}.jpg
   ```

### **Test 3: Verificar en Tabla**

```sql
SELECT * FROM coach_storage_metadata WHERE coach_id = 'tu_coach_id';
```

Debería retornar:
```
storage_initialized: true
initialization_date: (fecha de hoy)
total_files_count: 1 (o más)
```

---

## 📊 **RESUMEN:**

### **✅ YA HICISTE:**
1. ✅ Ejecutar `sql/create_coach_storage_metadata.sql`
2. ✅ Ejecutar `sql/configure_storage_rls_policies.sql` (instrucciones)

### **⏳ FALTA (Si aplica):**
3. ⏳ Configurar Storage Policies (si no las configuraste aún)
4. ⏳ Probar con un coach

### **📝 OPCIONAL:**
5. 📝 Migrar archivos antiguos con `npm run migrate:storage:dry`

---

## 🆘 **SI ALGO NO FUNCIONA:**

### **Error: "relation coach_storage_metadata does not exist"**
→ La tabla no se creó. Re-ejecuta el SQL.

### **Error: "new row violates row-level security policy"**
→ Las policies de Storage no están configuradas.

### **No aparecen carpetas en Storage**
→ Normal. Se crean cuando el coach inicia sesión por primera vez.

### **No ve archivos anteriores en el modal**
→ Normal si no has subido archivos aún.

---

## 🎉 **¿TODO VERIFICADO?**

Entonces ya puedes:

1. ✅ Iniciar el servidor: `npm run dev`
2. ✅ Iniciar sesión como coach
3. ✅ Crear/editar un producto
4. ✅ Ver que los archivos se organizan por coach

**¡El sistema está funcionando!** 🚀

---

**Archivo de referencia:**
- Guía completa: `STORAGE_COACHES_COMPLETO.md`
- Troubleshooting: `SISTEMA_STORAGE_COACHES_README.md`





