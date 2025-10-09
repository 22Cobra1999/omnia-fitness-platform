# 🎯 INSTRUCCIONES PARA EJECUTAR EN SUPABASE

## 📋 ORDEN DE EJECUCIÓN

### **1️⃣ CREAR TABLA DE METADATA (SQL Editor)**

**Dónde:** Supabase Dashboard → SQL Editor → New Query

**Copiar y ejecutar:**

```sql
-- Crear tabla
CREATE TABLE IF NOT EXISTS coach_storage_metadata (
  coach_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  storage_initialized BOOLEAN DEFAULT false,
  initialization_date TIMESTAMPTZ,
  folder_structure JSONB,
  total_files_count INTEGER DEFAULT 0,
  total_storage_bytes BIGINT DEFAULT 0,
  last_upload_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_coach_storage_initialized ON coach_storage_metadata(storage_initialized);
CREATE INDEX IF NOT EXISTS idx_coach_storage_updated ON coach_storage_metadata(updated_at);

-- Habilitar RLS
ALTER TABLE coach_storage_metadata ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Coaches can view own storage metadata"
  ON coach_storage_metadata FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert own storage metadata"
  ON coach_storage_metadata FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own storage metadata"
  ON coach_storage_metadata FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_coach_storage_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_coach_storage_metadata_updated_at
  BEFORE UPDATE ON coach_storage_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_coach_storage_metadata_updated_at();

-- Verificar
SELECT 'Tabla creada exitosamente' as resultado;
```

**Resultado esperado:** `Tabla creada exitosamente`

---

### **2️⃣ CONFIGURAR STORAGE POLICIES (Dashboard de Storage)**

#### **⚠️ IMPORTANTE:** Esto NO se hace en SQL Editor, sino en Storage Policies

#### **Para bucket `product-media`:**

1. Ve a: **Storage** → **product-media** → **Policies**
2. Click en **"New Policy"**
3. Selecciona **"Custom Policy"**
4. Crea cada policy:

##### **Policy A: Upload**
- **Name:** `Coaches can upload to own folder`
- **Policy Command:** `INSERT`
- **Target roles:** `authenticated`
- **WITH CHECK expression:**
```sql
(bucket_id = 'product-media'::text) AND 
((storage.foldername(name))[1] = 'coaches'::text) AND 
((storage.foldername(name))[2] = (auth.uid())::text)
```

##### **Policy B: Select (Coaches)**
- **Name:** `Coaches can read own files`
- **Policy Command:** `SELECT`
- **Target roles:** `authenticated`
- **USING expression:**
```sql
(bucket_id = 'product-media'::text) AND 
((storage.foldername(name))[1] = 'coaches'::text) AND 
((storage.foldername(name))[2] = (auth.uid())::text)
```

##### **Policy C: Select (Public)**
- **Name:** `Public can view product media`
- **Policy Command:** `SELECT`
- **Target roles:** `anon`, `authenticated`
- **USING expression:**
```sql
bucket_id = 'product-media'::text
```

##### **Policy D: Update**
- **Name:** `Coaches can update own files`
- **Policy Command:** `UPDATE`
- **Target roles:** `authenticated`
- **USING expression:**
```sql
(bucket_id = 'product-media'::text) AND 
((storage.foldername(name))[1] = 'coaches'::text) AND 
((storage.foldername(name))[2] = (auth.uid())::text)
```

##### **Policy E: Delete**
- **Name:** `Coaches can delete own files`
- **Policy Command:** `DELETE`
- **Target roles:** `authenticated`
- **USING expression:**
```sql
(bucket_id = 'product-media'::text) AND 
((storage.foldername(name))[1] = 'coaches'::text) AND 
((storage.foldername(name))[2] = (auth.uid())::text)
```

#### **Para bucket `user-media`:**

Repite las mismas policies pero cambiando `'product-media'` por `'user-media'`.

---

### **ALTERNATIVA SIMPLE (Si las policies de arriba no funcionan):**

Si tienes problemas con las policies granulares, usa estas **policies simplificadas**:

#### **Para product-media:**

1. **Policy:** `Allow authenticated users full access`
   - **Command:** `ALL`
   - **Target roles:** `authenticated`
   - **USING:** `bucket_id = 'product-media'::text`

2. **Policy:** `Allow public read access`
   - **Command:** `SELECT`
   - **Target roles:** `anon`, `authenticated`
   - **USING:** `bucket_id = 'product-media'::text`

#### **Para user-media:**

1. **Policy:** `Allow authenticated users full access`
   - **Command:** `ALL`
   - **Target roles:** `authenticated`
   - **USING:** `bucket_id = 'user-media'::text`

---

### **3️⃣ EJECUTAR MIGRACIÓN (Terminal)**

#### **Paso 1: Simulación (recomendado primero)**

```bash
cd "/Users/francopomati/Downloads/omnia (3)"
chmod +x scripts/run-migration.sh
./scripts/run-migration.sh
# Selecciona opción 1 (Simulación)
```

#### **Paso 2: Migración Real (después de verificar simulación)**

```bash
./scripts/run-migration.sh
# Selecciona opción 2 (Migración Real)
# Escribe 'SI' para confirmar
```

---

## ✅ VERIFICACIÓN FINAL

### **En Supabase Dashboard:**

1. **Tabla:** 
   ```sql
   SELECT * FROM coach_storage_metadata;
   ```
   Debería mostrar registros de coaches inicializados

2. **Storage:**
   - Ve a Storage → product-media
   - Deberías ver carpetas: `coaches/{coach_id}/`

3. **Policies:**
   - Storage → product-media → Policies
   - Deberías ver al menos 5 policies activas

### **En la Aplicación:**

1. Inicia sesión como coach
2. Abre Console del navegador
3. Busca: `✅ Storage inicializado exitosamente`
4. Sube una imagen de prueba
5. Verifica en Storage que esté en: `coaches/{tu_id}/images/`

---

## 🎉 ¡LISTO!

Una vez completados estos pasos, tu sistema estará:

✅ Organizado por coach
✅ Seguro con RLS
✅ Inicialización automática
✅ Archivos migrados
✅ Listo para escalar

---

**Fecha:** 7 de Octubre, 2025
**Última actualización:** Implementación completa





