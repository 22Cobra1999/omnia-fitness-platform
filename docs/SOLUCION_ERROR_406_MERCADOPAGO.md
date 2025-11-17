# 🔧 Solución: Error 406 en coach_mercadopago_credentials

## ⚠️ Error Actual

Si ves el error:
```
GET .../coach_mercadopago_credentials?select=... 406 (Not Acceptable)
```

Significa que hay un problema con las **políticas RLS (Row Level Security)** o la tabla no existe.

---

## ✅ Solución: Ejecutar Migración SQL

### Paso 1: Abrir Supabase SQL Editor

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (en el menú lateral izquierdo)
4. Haz clic en **"New query"**

### Paso 2: Ejecutar la Migración

Copia y pega el siguiente SQL en el editor:

```sql
-- ================================================================
-- 1. Crear tabla si no existe
-- ================================================================

CREATE TABLE IF NOT EXISTS coach_mercadopago_credentials (
  id BIGSERIAL PRIMARY KEY,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mercadopago_user_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  oauth_authorized BOOLEAN DEFAULT FALSE,
  oauth_authorized_at TIMESTAMPTZ,
  oauth_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(coach_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_coach_mp_credentials_coach_id ON coach_mercadopago_credentials(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_mp_credentials_mp_user_id ON coach_mercadopago_credentials(mercadopago_user_id);
CREATE INDEX IF NOT EXISTS idx_coach_mp_credentials_authorized ON coach_mercadopago_credentials(oauth_authorized);

-- ================================================================
-- 2. Habilitar RLS
-- ================================================================

ALTER TABLE coach_mercadopago_credentials ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 3. Eliminar políticas existentes (si existen)
-- ================================================================

DROP POLICY IF EXISTS "Coaches can view their own credentials" ON coach_mercadopago_credentials;
DROP POLICY IF EXISTS "Coaches can insert their own credentials" ON coach_mercadopago_credentials;
DROP POLICY IF EXISTS "Coaches can update their own credentials" ON coach_mercadopago_credentials;
DROP POLICY IF EXISTS "Service role can manage all credentials" ON coach_mercadopago_credentials;

-- ================================================================
-- 4. Crear políticas RLS correctas
-- ================================================================

-- SELECT: Los coaches pueden ver sus propias credenciales
CREATE POLICY "Coaches can view their own credentials"
  ON coach_mercadopago_credentials
  FOR SELECT
  USING (auth.uid() = coach_id);

-- INSERT: Los coaches pueden insertar sus propias credenciales
CREATE POLICY "Coaches can insert their own credentials"
  ON coach_mercadopago_credentials
  FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

-- UPDATE: Los coaches pueden actualizar sus propias credenciales
CREATE POLICY "Coaches can update their own credentials"
  ON coach_mercadopago_credentials
  FOR UPDATE
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- Política para service role (para el callback de OAuth)
CREATE POLICY "Service role can manage all credentials"
  ON coach_mercadopago_credentials
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

### Paso 3: Ejecutar la Query

1. Haz clic en **"Run"** o presiona `Ctrl+Enter` (o `Cmd+Enter` en Mac)
2. Deberías ver un mensaje de éxito: **"Success. No rows returned"**

### Paso 4: Verificar

1. Recarga la página de OMNIA
2. Ve a Profile → "Cobros y Cuenta de Mercado Pago"
3. El error 406 debería desaparecer

---

## 🔍 Verificar que Funcionó

Puedes verificar ejecutando esta query en Supabase SQL Editor:

```sql
-- Verificar que la tabla existe y tiene las políticas correctas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'coach_mercadopago_credentials';
```

Deberías ver 4 políticas:
1. `Coaches can view their own credentials` (SELECT)
2. `Coaches can insert their own credentials` (INSERT)
3. `Coaches can update their own credentials` (UPDATE)
4. `Service role can manage all credentials` (ALL)

---

## 📝 Archivo de Migración

También puedes ejecutar el archivo de migración completo:

**Ubicación**: `db/migrations/fix-coach-mercadopago-credentials-rls.sql`

Este archivo contiene toda la migración necesaria.

---

## ⚠️ Si el Error Persiste

1. **Verifica que estés autenticado**: Asegúrate de estar logueado en OMNIA
2. **Verifica las variables de entorno**: Asegúrate de que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén configuradas
3. **Revisa la consola del navegador**: Busca más detalles del error
4. **Verifica en Supabase**: Ve a Authentication → Users y confirma que tu usuario existe

---

## 🧪 Probar Después de la Corrección

1. Recarga la página de OMNIA
2. Ve a Profile
3. Busca la sección "Cobros y Cuenta de Mercado Pago"
4. Deberías ver el estado correcto (conectado o no conectado)
5. Si no está conectado, haz clic en "Conectar con Mercado Pago"

---

## 📚 Referencias

- [Documentación RLS de Supabase](https://supabase.com/docs/guides/auth/row-level-security)
- Archivo de migración: `db/migrations/fix-coach-mercadopago-credentials-rls.sql`

