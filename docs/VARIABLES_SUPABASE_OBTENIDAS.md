# 🔑 Variables de Supabase - Información Obtenida

## ✅ Información Obtenida desde Supabase MCP

### 📍 URL del Proyecto
```
NEXT_PUBLIC_SUPABASE_URL=https://mgrfswrsvrzwtgilssad.supabase.co
```

### 🔐 Claves Públicas Disponibles

#### 1. Clave Anónima (Legacy)
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxOTAzMDMsImV4cCI6MjA2MTc2NjMwM30.vuEgFbZGHO0OjJ8O9SjKaYKJcIdIh3mxV2wK7iNKaJs
```

#### 2. Clave Publishable (Moderna - Recomendada)
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_dLWqOe9CzXjuAgCXphc5Vg_HoLYdkax
```

**⚠️ NOTA:** Puedes usar cualquiera de las dos, pero la clave publishable es más moderna y recomendada.

---

## ⚠️ Clave de Servicio (Service Role Key)

La clave `SUPABASE_SERVICE_ROLE_KEY` **NO** está disponible a través de las herramientas MCP por razones de seguridad (es una clave privada con permisos completos).

### 🔍 Cómo Obtenerla Manualmente:

1. Ve a: **https://supabase.com/dashboard**
2. Selecciona tu proyecto: **mgrfswrsvrzwtgilssad**
3. Ve a: **Settings** → **API**
4. Busca la sección **"Project API keys"**
5. Encuentra **"service_role"** key (está oculta por defecto)
6. Haz clic en **"Reveal"** o **"Show"** para verla
7. **⚠️ IMPORTANTE:** Esta clave tiene permisos completos, mantenerla privada

---

## 📋 Variables para Configurar en Vercel

### Paso 1: Agregar Variables en Vercel

1. Ve a: **https://vercel.com/dashboard**
2. Selecciona tu proyecto
3. Ve a: **Settings** → **Environment Variables**
4. Haz clic en **"Add New"**

#### Variable 1: NEXT_PUBLIC_SUPABASE_URL
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://mgrfswrsvrzwtgilssad.supabase.co`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- **Save**

#### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `sb_publishable_dLWqOe9CzXjuAgCXphc5Vg_HoLYdkax` (o la legacy si prefieres)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- **Save**

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY
- **Key:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** `[Obtener desde Supabase Dashboard - Settings → API → service_role key]`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development
- **⚠️ IMPORTANTE:** Esta clave es privada, mantenerla segura
- **Save**

---

## ✅ Checklist de Configuración

Después de agregar las variables en Vercel:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada en Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurada en Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` obtenida desde Supabase Dashboard
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada en Vercel
- [ ] Todas las variables disponibles para Production, Preview y Development
- [ ] Build en Vercel ejecutado exitosamente

---

## 🔍 Información Adicional del Proyecto

### Extensions Instaladas:
- ✅ `pgcrypto` (cryptographic functions)
- ✅ `pg_stat_statements` (query statistics)
- ✅ `pg_graphql` (GraphQL support)
- ✅ `uuid-ossp` (UUID generation)
- ✅ `supabase_vault` (vault extension)
- ✅ `pgjwt` (JWT support)
- ✅ `vector` (vector data type)

### Migraciones:
- No hay migraciones registradas en el sistema de migraciones de Supabase

---

## 🆘 Si el Build Sigue Fallando

1. **Verifica que todas las variables estén escritas correctamente** (sin espacios extra)
2. **Confirma que `SUPABASE_SERVICE_ROLE_KEY` esté correctamente copiada** desde Supabase Dashboard
3. **Asegúrate de que las variables estén disponibles para Production** (no solo Development)
4. **Revisa los logs del build en Vercel** para ver errores específicos
5. **Espera unos minutos** después de agregar las variables para que Vercel las propague

---

## 🔗 Enlaces Útiles

- **Supabase Dashboard:** https://supabase.com/dashboard/project/mgrfswrsvrzwtgilssad
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Documentación Supabase:** https://supabase.com/docs/guides/getting-started

---

## 📝 Notas Importantes

1. **Clave Publishable vs Legacy:** La clave publishable (`sb_publishable_...`) es más moderna y recomendada, pero ambas funcionan.

2. **Service Role Key:** Esta clave tiene permisos completos y debe mantenerse privada. Solo úsala en el servidor, nunca en el cliente.

3. **Variables Públicas:** Las variables que comienzan con `NEXT_PUBLIC_` están disponibles en el cliente (navegador), así que no incluyas información sensible en ellas.

4. **Propagación:** Después de agregar variables en Vercel, puede tomar unos minutos para que estén disponibles en los builds.
