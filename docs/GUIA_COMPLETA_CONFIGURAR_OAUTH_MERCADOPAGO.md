# 🔧 Guía Completa: Configurar OAuth en Mercado Pago

## ⚠️ Error Actual

Si ves el error:
- **"La aplicación no está preparada para conectarse a Mercado Pago"**
- **Error 400 (Bad Request)** en `auth.mercadopago.com.ar/authorization`

Significa que necesitas configurar el **Redirect URI** en tu aplicación de Mercado Pago.

---

## 📋 Pasos Detallados

### Paso 1: Acceder al Panel de Mercado Pago Developers

1. Ve a: **https://www.mercadopago.com.ar/developers/panel/app**
2. Inicia sesión con tu cuenta de Mercado Pago
3. En la esquina superior derecha, haz clic en **"Tus integraciones"**

### Paso 2: Seleccionar tu Aplicación

1. Busca tu aplicación (probablemente se llama **"Om Omnia in te"** o similar)
2. Haz clic en la aplicación para abrir sus detalles

### Paso 3: Encontrar Configuraciones Avanzadas

**IMPORTANTE**: La ubicación exacta puede variar. Prueba estas opciones:

#### Opción A: Desde el Menú Lateral
1. En el menú lateral izquierdo, busca **"Información general"** o **"Detalles de la aplicación"**
2. Haz clic en **"Editar"** o **"Configurar"**
3. Busca la sección **"Configuraciones avanzadas"** o **"OAuth"**

#### Opción B: Directamente en OAuth
1. En el menú lateral izquierdo, busca directamente **"OAuth"** o **"Seguridad"**
2. Si existe, haz clic ahí

#### Opción C: Si no encuentras la opción
Si no encuentras ninguna de estas opciones, puede ser que tu aplicación fue creada con **Checkout Bricks** y no tiene habilitado OAuth. En ese caso:

1. Ve a **"Tus integraciones"**
2. Haz clic en **"Crear aplicación"** (o crea una nueva aplicación)
3. Al crear la aplicación, selecciona:
   - **Tipo de pago**: "Pagos online"
   - **Plataforma**: "Desarrollo propio"
   - **Solución**: **"Checkout API"** (NO Checkout Bricks)
   - **Tipo de API**: "API de Orders"

### Paso 4: Configurar Redirect URI

Una vez que encuentres la sección de configuración:

1. Busca el campo **"URL de redireccionamiento"** o **"Redirect URI"**
2. Haz clic en **"Agregar"** o **"Editar"**
3. Ingresa exactamente esta URL:

```
http://localhost:3000/api/mercadopago/oauth/callback
```

**⚠️ CRÍTICO:**
- Debe ser **exactamente** como se muestra arriba
- Sin espacios al inicio o final
- Usa `http://` (NO `https://`) para localhost
- No agregues `/` al final

### Paso 5: Guardar y Verificar

1. Haz clic en **"Guardar cambios"** o **"Guardar"**
2. Completa el reCAPTCHA si se solicita
3. Espera 1-2 minutos para que los cambios se propaguen

---

## 🔍 Verificar que Funcionó

### Verificación 1: En el Panel
1. Vuelve a la sección de configuración
2. Verifica que la URL `http://localhost:3000/api/mercadopago/oauth/callback` aparezca en la lista

### Verificación 2: En OMNIA
1. Recarga la página de OMNIA
2. Ve a Profile → "Cobros y Cuenta de Mercado Pago"
3. Haz clic en "Conectar con Mercado Pago"
4. Deberías ser redirigido a Mercado Pago **sin** el error 400

---

## 🆘 Si No Encuentras la Opción de Redirect URI

### Problema: Aplicación creada con Checkout Bricks

Si tu aplicación fue creada con **Checkout Bricks**, puede que no tenga habilitado OAuth. Soluciones:

#### Solución 1: Crear Nueva Aplicación para OAuth

1. Ve a **"Tus integraciones"** → **"Crear aplicación"**
2. Configura así:
   - **Nombre**: "OMNIA OAuth" (o el que prefieras)
   - **Tipo de pago**: "Pagos online"
   - **Plataforma**: "Desarrollo propio"
   - **Solución**: **"Checkout API"** (importante: NO Checkout Bricks)
   - **Tipo de API**: "API de Orders"
3. Después de crear, ve a **"Detalles de la aplicación"**
4. Busca **"Configuraciones avanzadas"** o **"OAuth"**
5. Configura el Redirect URI como se explicó arriba
6. **Actualiza las variables de entorno** con el nuevo Client ID y Client Secret

#### Solución 2: Contactar Soporte de Mercado Pago

Si necesitas usar la misma aplicación:
1. Ve a: **https://www.mercadopago.com.ar/developers/support**
2. Explica que necesitas habilitar OAuth para Split Payment
3. Proporciona tu Application ID: `1806894141402209`

---

## 📝 Actualizar Variables de Entorno

Si creaste una nueva aplicación, actualiza tu `.env.local`:

```env
# Si creaste nueva aplicación, actualiza estos valores:
MERCADOPAGO_CLIENT_ID=TU_NUEVO_CLIENT_ID
MERCADOPAGO_CLIENT_SECRET=TU_NUEVO_CLIENT_SECRET

# Estos valores NO cambian:
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/oauth/callback
```

---

## 🌐 Para Producción

Cuando estés listo para producción:

1. Agrega también la URL de producción en el mismo campo:
   ```
   https://tu-dominio.com/api/mercadopago/oauth/callback
   ```
   O si usas Vercel:
   ```
   https://tu-app.vercel.app/api/mercadopago/oauth/callback
   ```

2. Puedes tener múltiples Redirect URIs:
   - `http://localhost:3000/api/mercadopago/oauth/callback` (desarrollo)
   - `https://tu-dominio.com/api/mercadopago/oauth/callback` (producción)

---

## ✅ Checklist Final

Antes de probar, verifica:

- [ ] Redirect URI configurado en Mercado Pago: `http://localhost:3000/api/mercadopago/oauth/callback`
- [ ] Variables de entorno configuradas correctamente
- [ ] Servidor de desarrollo corriendo (`npm run dev`)
- [ ] Esperaste 1-2 minutos después de guardar el Redirect URI

---

## 🧪 Probar la Conexión

1. Ve a OMNIA → Profile
2. Busca "Cobros y Cuenta de Mercado Pago"
3. Haz clic en "Conectar con Mercado Pago"
4. Deberías ser redirigido a Mercado Pago
5. Inicia sesión con tu cuenta de Mercado Pago
6. Autoriza a OMNIA
7. Deberías ser redirigido de vuelta a OMNIA con éxito

---

## 📚 Referencias

- [Documentación OAuth de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs/security/oauth)
- [Crear aplicación para OAuth](https://www.mercadopago.com.ar/developers/es/docs/mp-point/create-application)
- [Soporte de Mercado Pago](https://www.mercadopago.com.ar/developers/support)

---

## 💡 Nota Importante

**Checkout Bricks vs Checkout API para OAuth:**

- **Checkout Bricks**: Ideal para frontend, pero puede tener limitaciones para OAuth
- **Checkout API**: Necesario para Split Payment y OAuth completo

Si necesitas Split Payment (dividir pagos entre OMNIA y coaches), necesitas una aplicación con **Checkout API** habilitado, no solo Checkout Bricks.

