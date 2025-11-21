# 🔧 Actualizar Credenciales de Mercado Pago en Vercel

## ⚠️ Sobre Compartir Credenciales en Mercado Pago

**NO necesitas compartir las credenciales desde el panel de Mercado Pago**. 

El mensaje que ves sobre "Compartir credenciales" es para dar acceso a otra persona a tu cuenta de Mercado Pago. **NO lo hagas**. Las credenciales que me compartiste (Public Key y Access Token) son suficientes para configurar las variables de entorno.

---

## 🚀 Opción 1: Usar el Script Automatizado (Recomendado)

Ejecuta el script que creé para actualizar las credenciales:

```bash
bash scripts/update-mercadopago-credentials.sh
```

Este script:
1. ✅ Elimina las variables viejas de Mercado Pago
2. ✅ Crea las nuevas con las credenciales actualizadas
3. ✅ Verifica que todo esté correcto

---

## 🖥️ Opción 2: Actualizar Manualmente en Vercel Dashboard

Si prefieres hacerlo manualmente:

1. **Ve a Vercel Dashboard**:
   - https://vercel.com/dashboard
   - Selecciona tu proyecto `omnia-app`

2. **Ve a Settings → Environment Variables**

3. **Elimina las variables viejas** (si existen):
   - `TEST_MERCADOPAGO_ACCESS_TOKEN`
   - `TEST_NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`

4. **Actualiza/Crea estas variables**:

   | Variable | Valor |
   |----------|-------|
   | `MERCADOPAGO_ACCESS_TOKEN` | `APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181` |
   | `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | `APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb` |
   | `NEXT_PUBLIC_APP_URL` | `https://omnia-app.vercel.app` |
   | `NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI` | `https://omnia-app.vercel.app/api/mercadopago/oauth/callback` |
   | `ENCRYPTION_KEY` | `1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4` |

5. **Asegúrate de seleccionar "Production"** para cada variable

6. **Guarda los cambios**

---

## ✅ Verificación

Después de actualizar, verifica que las variables estén correctas:

```bash
vercel env ls production | grep -E "MERCADOPAGO|NEXT_PUBLIC_APP_URL|ENCRYPTION_KEY"
```

Deberías ver:
- ✅ `MERCADOPAGO_ACCESS_TOKEN` con el nuevo valor
- ✅ `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` con el nuevo valor
- ✅ `NEXT_PUBLIC_APP_URL` configurado
- ✅ `NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI` configurado
- ✅ `ENCRYPTION_KEY` configurado

---

## 🔄 Después de Actualizar

1. **Haz un nuevo deploy** en Vercel para que los cambios surtan efecto:
   ```bash
   git add .
   git commit -m "Actualizar credenciales de Mercado Pago"
   git push origin main
   ```

2. **O haz un redeploy manual** desde Vercel Dashboard:
   - Ve a Deployments
   - Haz clic en los tres puntos del último deployment
   - Selecciona "Redeploy"

---

## 📝 Notas

- Las credenciales actualizadas son de **producción para cuenta de prueba** (empiezan con `APP_USR-`)
- Son seguras para usar en pruebas
- No procesan pagos reales
- El Access Token contiene el User ID: `2995219181`

