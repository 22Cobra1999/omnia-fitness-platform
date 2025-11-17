# 📝 Cómo Completar el Formulario de Mercado Pago

## ⚠️ Problema Principal

Mercado Pago **NO acepta** `http://localhost` en las URLs de redireccionamiento. Requiere que todas las URLs empiecen con `https://`.

---

## ✅ Cómo Completar Cada Campo

### 1. **Industria (Industry)**
- **Selecciona**: La categoría que mejor describe tu negocio
- **Opciones comunes**: 
  - "Servicios profesionales" 
  - "Educación y capacitación"
  - "Servicios digitales"
  - O la que mejor se ajuste a OMNIA

### 2. **URL del sitio en producción**
- **Pon**: `https://omnia-app.vercel.app/`
- ✅ Ya lo tienes bien configurado

### 3. **¿Qué tipo de solución de pago vas a integrar?**
- ✅ **"Pagos online"** (ya seleccionado correctamente)

### 4. **¿Estás usando una plataforma de e-commerce?**
- ✅ **"No"** (ya seleccionado correctamente)

### 5. **¿Qué producto estás integrando?**
- ⚠️ **Problema**: Tienes "Checkout Bricks" seleccionado
- **Para OAuth y Split Payment necesitas**: **"Checkout API"** o **"Checkout Transparente"**
- **Solución**: Cambia a **"Checkout API"** o **"Checkout Transparente"**

### 6. **Modelo de integración (Opcional)**
- Puedes dejarlo vacío o seleccionar:
  - "Marketplace" (si aplica)
  - O dejarlo en blanco

### 7. **URLs de redireccionamiento** ⚠️ CRÍTICO

**Problema**: Mercado Pago NO acepta `http://localhost`

**Solución para desarrollo local:**

#### Opción A: Usar ngrok (Recomendado para desarrollo)

1. Instala ngrok:
   ```bash
   npm install -g ngrok
   # O descarga desde https://ngrok.com/
   ```

2. Inicia tu servidor local:
   ```bash
   npm run dev
   ```

3. En otra terminal, crea un túnel:
   ```bash
   ngrok http 3000
   ```

4. Copia la URL HTTPS que ngrok te da (algo como `https://abc123.ngrok.io`)

5. En Mercado Pago, agrega:
   ```
   https://abc123.ngrok.io/api/mercadopago/oauth/callback
   ```

**⚠️ Nota**: Cada vez que reinicies ngrok, la URL cambia. Tendrás que actualizarla en Mercado Pago.

#### Opción B: Usar solo la URL de producción (Más simple)

Para desarrollo, puedes usar directamente la URL de producción:

1. En Mercado Pago, agrega:
   ```
   https://omnia-app.vercel.app/api/mercadopago/oauth/callback
   ```

2. Cuando pruebes localmente, asegúrate de que tu app esté desplegada en Vercel

3. El callback funcionará aunque estés probando desde `localhost:3000`

#### Opción C: Usar Cloudflare Tunnel (Alternativa a ngrok)

Similar a ngrok pero con URL estable.

---

### 8. **¿Utilizar el flujo de código de autorización con PKCE?**
- ✅ **"No"** está bien para empezar
- Puedes dejarlo así por ahora
- PKCE es una capa extra de seguridad, pero no es obligatorio

---

## 📋 Resumen de Configuración Recomendada

```
Industria: [Selecciona la que mejor describa tu negocio]
URL del sitio en producción: https://omnia-app.vercel.app/
Tipo de solución: Pagos online ✅
¿Plataforma e-commerce?: No ✅
Producto: Checkout API (CAMBIAR de Checkout Bricks)
Modelo de integración: [Opcional, puede quedar vacío]
URLs de redireccionamiento: 
  - https://omnia-app.vercel.app/api/mercadopago/oauth/callback
PKCE: No ✅
```

---

## 🔧 Cambiar de Checkout Bricks a Checkout API

Si necesitas cambiar el producto:

1. Ve a "Tus integraciones"
2. Selecciona tu aplicación
3. Busca "Editar" o "Configurar"
4. Cambia "Checkout Bricks" por "Checkout API"
5. Guarda los cambios

**⚠️ Importante**: Si no puedes cambiar el producto, puede que necesites crear una nueva aplicación.

---

## ✅ Después de Completar

1. Haz clic en **"Guardar cambios"** o **"Guardar"**
2. Completa el reCAPTCHA si se solicita
3. Espera 1-2 minutos
4. Prueba la conexión desde OMNIA

---

## 🧪 Probar la Conexión

1. Ve a OMNIA → Profile
2. Busca "Cobros y Cuenta de Mercado Pago"
3. Haz clic en "Conectar con Mercado Pago"
4. Deberías ser redirigido correctamente sin error 400

---

## 💡 Recomendación Final

**Para desarrollo local**, usa la **Opción B** (URL de producción):
- Es más simple
- No necesitas instalar herramientas adicionales
- Funciona siempre que tu app esté desplegada en Vercel
- Puedes probar desde `localhost:3000` y el callback funcionará

Solo agrega esta URL en Mercado Pago:
```
https://omnia-app.vercel.app/api/mercadopago/oauth/callback
```

