# 🚀 INSTRUCCIONES PARA DEPLOY EN VERCEL

## ⚡ PASOS RÁPIDOS

### **PASO 1: Ejecuta el comando de deploy**

```bash
vercel
```

### **PASO 2: Responde las preguntas**

El CLI te preguntará:

```
? Set up and deploy "~/Downloads/omnia (3)"? [Y/n] 
→ Presiona: Y

? Which scope do you want to deploy to?
→ Selecciona tu cuenta (francopomati o similar)

? Link to existing project? [y/N]
→ Presiona: N (nuevo proyecto)

? What's your project's name? 
→ Escribe: omnia-app

? In which directory is your code located?
→ Presiona Enter (usa ./ por defecto)

? Want to override the settings? [y/N]
→ Presiona: N
```

### **PASO 3: Espera el deploy (2-3 minutos)**

Verás:

```
🔗 Linked to francopomati/omnia-app
🔍 Inspect: https://vercel.com/.../...
✅ Production: https://omnia-app-xxxxx.vercel.app
```

### **PASO 4: Configura las variables de entorno**

⚠️ **IMPORTANTE:** Tu app usa Supabase, necesitas configurar las env vars:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Pega tu URL de Supabase

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Pega tu Anon Key

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Pega tu Service Role Key
```

O más fácil: Ve a Vercel Dashboard → Settings → Environment Variables

### **PASO 5: Redeploy con las env vars**

```bash
vercel --prod
```

---

## 🎯 RESULTADO

Tendrás:
- ✅ URL pública: https://omnia-app-xxxxx.vercel.app
- ✅ Auto-deploy en cada git push
- ✅ HTTPS gratis
- ✅ CDN global
- ✅ Listo para compartir

---

## 📝 NOTAS

- La primera vez tarda ~3 minutos
- Siguientes deploys: ~1 minuto
- Gratis hasta 100GB bandwidth/mes
- Dominio personalizado disponible

---

## 🔧 SI HAY ERRORES

**Error de env vars:**
```
Ve a: https://vercel.com/tu-usuario/omnia-app/settings/environment-variables
Agrega las 3 variables de Supabase
```

**Error de build:**
```bash
# Verifica que el build funciona local
npm run build

# Si hay error, arréglalo y vuelve a:
vercel --prod
```

