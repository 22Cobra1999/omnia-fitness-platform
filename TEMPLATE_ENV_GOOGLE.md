# 🔧 Template para .env.local - Variables de Google

## 📝 Instrucciones Rápidas

1. **Obtén el GOOGLE_CLIENT_ID desde Vercel:**
   - Ve a: Vercel Dashboard → Tu proyecto → Settings → Environment Variables
   - Busca `GOOGLE_CLIENT_ID` y copia el valor

2. **Agrega estas líneas a tu `.env.local`:**

```env
# ============================================
# GOOGLE OAUTH (Para Google Calendar y Meet)
# ============================================
GOOGLE_CLIENT_ID=TU_CLIENT_ID_DESDE_VERCEL_AQUI
GOOGLE_CLIENT_SECRET=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
```

3. **Reemplaza `TU_CLIENT_ID_DESDE_VERCEL_AQUI`** con el valor real que copiaste de Vercel

4. **Guarda el archivo y reinicia el servidor**

---

## ✅ Ejemplo Completo

```env
# ============================================
# GOOGLE OAUTH
# ============================================
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# ============================================
# APP URL
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🔍 ¿Dónde está tu Client ID en Vercel?

1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Ve a: **Settings** → **Environment Variables**
4. Busca `GOOGLE_CLIENT_ID`
5. Haz clic para revelar y copiar el valor

---

## ⚠️ IMPORTANTE

- El Client ID es un número largo que termina en `.apps.googleusercontent.com`
- No compartas estas credenciales públicamente
- Después de configurar, considera rotar el Client Secret en Google Cloud Console



















