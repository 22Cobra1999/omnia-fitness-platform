# 🚀 Agregar Variables de Supabase en Vercel - Guía Rápida

## 📋 Variables a Agregar

Todas estas variables deben agregarse en **Vercel → Settings → Environment Variables**

### ✅ Variable 1: NEXT_PUBLIC_SUPABASE_URL

**Key:**
```
NEXT_PUBLIC_SUPABASE_URL
```

**Value:**
```
https://mgrfswrsvrzwtgilssad.supabase.co
```

**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### ✅ Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY

**Key:**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

**Value (Publishable Key - Recomendada):**
```
sb_publishable_dLWqOe9CzXjuAgCXphc5Vg_HoLYdkax
```

**Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### ✅ Variable 3: SUPABASE_SERVICE_ROLE_KEY

**Key:**
```
SUPABASE_SERVICE_ROLE_KEY
```

**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmZzd3JzdnJ6d3RnaWxzc2FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjE5MDMwMywiZXhwIjoyMDYxNzY2MzAzfQ.qRKBCY7dbxvNs-KCQqAm9L6xBY4X293oaFAW5yxc9Hc
```

**Environments:** ✅ Production, ✅ Preview, ✅ Development

**⚠️ IMPORTANTE:** Esta clave es privada y tiene permisos completos. Mantenerla segura.

---

## 📝 Pasos para Agregar en Vercel

1. **Ve a Vercel Dashboard:**
   - https://vercel.com/dashboard

2. **Selecciona tu proyecto:**
   - Busca y selecciona tu proyecto (probablemente `omnia-fitness-platform` o similar)

3. **Ve a Settings:**
   - Haz clic en **Settings** en el menú superior

4. **Ve a Environment Variables:**
   - En el menú lateral izquierdo, haz clic en **Environment Variables**

5. **Agrega cada variable:**
   - Haz clic en **"Add New"** o **"Add Variable"**
   - Pega el **Key** y **Value** de cada variable
   - Selecciona los **Environments** (Production, Preview, Development)
   - Haz clic en **"Save"**
   - Repite para las 3 variables

6. **Verifica:**
   - Deberías ver las 3 variables listadas:
     - ✅ `NEXT_PUBLIC_SUPABASE_URL`
     - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - ✅ `SUPABASE_SERVICE_ROLE_KEY`

7. **Redeploy:**
   - Después de agregar las variables, Vercel debería detectar los cambios automáticamente
   - Si no, ve a **Deployments** y haz clic en **"Redeploy"** en el último deployment

---

## ✅ Checklist Final

- [ ] `NEXT_PUBLIC_SUPABASE_URL` agregada en Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` agregada en Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` agregada en Vercel
- [ ] Todas las variables están disponibles para Production, Preview y Development
- [ ] Build en Vercel ejecutado exitosamente
- [ ] No hay errores de "supabaseUrl is required" en los logs

---

## 🆘 Si el Build Sigue Fallando

1. **Espera unos minutos** después de agregar las variables (Vercel necesita tiempo para propagarlas)

2. **Verifica que los valores estén correctos:**
   - Sin espacios extra al inicio o final
   - Sin saltos de línea
   - Copiados completamente

3. **Redeploy manualmente:**
   - Ve a **Deployments**
   - Haz clic en los 3 puntos del último deployment
   - Selecciona **"Redeploy"**

4. **Revisa los logs del build:**
   - Ve a **Deployments** → Selecciona el deployment → **Build Logs**
   - Busca errores específicos

---

## 🔗 Enlaces Útiles

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Documentación Vercel:** https://vercel.com/docs/concepts/projects/environment-variables
