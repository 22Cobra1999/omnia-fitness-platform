# 🔧 Configurar Redirect URI en Mercado Pago para OAuth

## ⚠️ Error Actual

Si ves el error:
- **"La aplicación no está preparada para conectarse a Mercado Pago"**
- **Error 400 (Bad Request)** en la URL de autorización

Significa que el **Redirect URI** no está configurado en tu aplicación de Mercado Pago.

---

## 📋 Pasos para Configurar el Redirect URI

### Paso 1: Acceder al Panel de Mercado Pago Developers

1. Ve a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app)
2. Inicia sesión con tu cuenta
3. Haz clic en **"Tus integraciones"** (esquina superior derecha)

### Paso 2: Seleccionar tu Aplicación

1. Busca y selecciona tu aplicación **"Om Omnia in te"**
2. O la aplicación que estés usando para OMNIA

### Paso 3: Configurar Redirect URI

1. En el menú lateral izquierdo, busca la sección **"Información general"** o **"Detalles de la aplicación"**
2. Busca la opción **"Configuraciones avanzadas"** o **"OAuth"**
3. Busca el campo **"URL de redireccionamiento"** o **"Redirect URI"**
4. Haz clic en **"Editar"** o **"Configurar"**

### Paso 4: Agregar la URL

Agrega la siguiente URL (exactamente como está):

```
http://localhost:3000/api/mercadopago/oauth/callback
```

**⚠️ IMPORTANTE:**
- La URL debe ser **exactamente** como se muestra arriba
- No debe tener espacios al inicio o final
- Debe usar `http://` (no `https://`) para localhost
- Debe terminar con `/api/mercadopago/oauth/callback`

### Paso 5: Guardar Cambios

1. Haz clic en **"Guardar cambios"** o **"Guardar"**
2. Completa el reCAPTCHA si se solicita
3. Confirma los cambios

---

## 🌐 Para Producción

Cuando estés listo para producción, también agrega la URL de producción:

```
https://tu-dominio.com/api/mercadopago/oauth/callback
```

O si usas Vercel:

```
https://tu-app.vercel.app/api/mercadopago/oauth/callback
```

---

## ✅ Verificar Configuración

Después de configurar el Redirect URI:

1. Vuelve a intentar conectar tu cuenta de Mercado Pago desde OMNIA
2. Deberías ser redirigido correctamente a Mercado Pago
3. Después de autorizar, deberías ser redirigido de vuelta a OMNIA

---

## 🔍 Ubicación Exacta en el Panel

La ubicación puede variar según la versión del panel, pero generalmente está en:

**Opción 1:**
- Tus integraciones → Tu aplicación → **Información general** → **Configuraciones avanzadas** → **URL de redireccionamiento**

**Opción 2:**
- Tus integraciones → Tu aplicación → **OAuth** → **Redirect URI**

**Opción 3:**
- Tus integraciones → Tu aplicación → **Detalles de la aplicación** → **Editar** → **Configuraciones avanzadas**

---

## ⚠️ Problemas Comunes

### Error: "La URL no es válida"
- Verifica que la URL sea exactamente: `http://localhost:3000/api/mercadopago/oauth/callback`
- No uses `https://` para localhost
- No agregues espacios o caracteres extra

### Error: "La aplicación no está preparada"
- Asegúrate de haber guardado los cambios
- Espera unos minutos después de guardar (puede tardar en propagarse)
- Verifica que estés usando el Client ID correcto

### Error: "Redirect URI no coincide"
- Verifica que la URL en el código sea exactamente igual a la configurada en Mercado Pago
- Revisa las variables de entorno: `NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI`

---

## 📝 Variables de Entorno

Asegúrate de tener estas variables en tu `.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/oauth/callback
MERCADOPAGO_CLIENT_ID=1806894141402209
MERCADOPAGO_CLIENT_SECRET=7dtInztF6aQwAGQCfWk2XGdMbWBd54QS
```

---

## 🧪 Probar la Configuración

Después de configurar:

1. Reinicia el servidor de desarrollo (`npm run dev`)
2. Ve a Profile → "Cobros y Cuenta de Mercado Pago"
3. Haz clic en "Conectar con Mercado Pago"
4. Deberías ser redirigido a Mercado Pago sin errores

---

## 📚 Referencias

- [Documentación OAuth de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs/security/oauth)
- [Configurar aplicación para OAuth](https://www.mercadopago.com.ar/developers/es/docs/mp-point/create-application)

