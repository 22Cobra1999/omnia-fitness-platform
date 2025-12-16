# 🔧 Variables de Entorno Requeridas en Vercel - Supabase

## ⚠️ CRÍTICO: Variables de Supabase Faltantes

Según los errores de build, estas variables **DEBEN** estar configuradas en Vercel:

### ✅ Variables OBLIGATORIAS de Supabase:

1. **`NEXT_PUBLIC_SUPABASE_URL`**
   - **Descripción:** URL de tu proyecto Supabase
   - **Formato:** `https://xxxxx.supabase.co`
   - **Dónde obtenerla:** Supabase Dashboard → Settings → API → Project URL

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**
   - **Descripción:** Clave pública anónima de Supabase (segura para usar en cliente)
   - **Formato:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Dónde obtenerla:** Supabase Dashboard → Settings → API → anon public key

3. **`SUPABASE_SERVICE_ROLE_KEY`**
   - **Descripción:** Clave de servicio (PRIVADA - solo para servidor)
   - **Formato:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Dónde obtenerla:** Supabase Dashboard → Settings → API → service_role key
   - **⚠️ IMPORTANTE:** Esta clave tiene permisos completos, mantenerla privada

---

## 📋 Cómo Configurar en Vercel

### Paso 1: Obtener Variables desde Supabase

1. Ve a: **https://supabase.com/dashboard**
2. Selecciona tu proyecto
3. Ve a: **Settings** → **API**
4. Copia estos valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Mantener privada)

### Paso 2: Agregar en Vercel

1. Ve a: **https://vercel.com/dashboard**
2. Selecciona tu proyecto **omnia-fitness-platform** (o el nombre de tu proyecto)
3. Ve a: **Settings** → **Environment Variables**
4. Haz clic en **"Add New"** o **"Add Variable"**

#### Variable 1: NEXT_PUBLIC_SUPABASE_URL
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://xxxxx.supabase.co` (tu URL de Supabase)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- **Save**

#### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (tu anon key)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- **Save**

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY
- **Key:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (tu service_role key)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- **⚠️ IMPORTANTE:** Esta clave es privada, no la compartas
- **Save**

---

## ✅ Checklist de Verificación

Después de agregar las variables, verifica:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` está configurada en Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` está configurada en Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` está configurada en Vercel
- [ ] Todas las variables están disponibles para Production, Preview y Development
- [ ] El build en Vercel ya no muestra el error "supabaseUrl is required"

---

## 🔍 Verificar Variables Actuales en Vercel

Para ver qué variables tienes actualmente configuradas:

1. Ve a: **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
2. Busca las variables que comienzan con `SUPABASE_` o `NEXT_PUBLIC_SUPABASE_`
3. Si no existen, agrégalas siguiendo los pasos anteriores

---

## 🆘 Si el Build Sigue Fallando

1. **Verifica que las variables estén escritas correctamente** (sin espacios extra)
2. **Asegúrate de que estén disponibles para Production** (no solo Development)
3. **Revisa los logs del build en Vercel** para ver errores específicos
4. **Confirma que los valores coincidan** con los de tu proyecto Supabase

---

## 📝 Variables Adicionales Recomendadas

Estas variables también son útiles pero no críticas para el build:

- `NEXT_PUBLIC_APP_URL` - URL de tu aplicación (ej: `https://tu-app.vercel.app`)
- `GOOGLE_CLIENT_ID` - Para integración con Google Calendar
- `GOOGLE_CLIENT_SECRET` - Para integración con Google Calendar
- Variables de Mercado Pago (si usas pagos)
- Variables de Bunny.net (si usas almacenamiento de videos)

---

## 🔗 Enlaces Útiles

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Documentación Supabase:** https://supabase.com/docs/guides/getting-started
