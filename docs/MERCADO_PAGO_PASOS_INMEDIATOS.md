# ✅ Pasos Inmediatos: Configuración de Mercado Pago

## 🎯 Estado Actual

### ✅ Lo que ya tienes:
1. **Aplicación creada**: "Om Omnia in te" con Checkout Bricks
2. **Cuentas de prueba creadas**:
   - `omniav1` - Integrador (OMNIA como marketplace) - User ID: `2995219179`
   - `ronaldinho` - Vendedor (coach) - User ID: `2995219181`
   - `totti1` - Comprador (cliente) - User ID: `2992707264`

---

## 📋 Próximos Pasos (En Orden)

### 1️⃣ Obtener Credenciales de Prueba

**En el panel de Mercado Pago Developers**:
1. Ve a **"Credenciales de prueba"** (en el menú lateral izquierdo)
2. Copia las siguientes credenciales:
   - **Public Key** (para el frontend) ✅
   - **Access Token** (para el backend) ✅

**Para Client ID y Client Secret (OAuth)**:
- Ve a **"Información general"** de tu aplicación
- O busca en la sección de **OAuth** o **Configuración de la aplicación**
- Si no aparecen, es posible que necesites configurar OAuth primero (ver paso 3)

**⚠️ IMPORTANTE**: 
- Con **Public Key** y **Access Token** puedes empezar a probar pagos básicos
- **Client ID** y **Client Secret** son necesarios para el flujo OAuth
- **Nota**: Si tienes Client ID y Client Secret en **producción** (no en prueba), puedes usarlos también en desarrollo, pero ten cuidado de no mezclar entornos

---

### 2️⃣ Configurar Variables de Entorno

Crea o actualiza tu archivo `.env.local`:

```env
# Mercado Pago - Configuración Híbrida (Recomendada)
# ✅ Credenciales de PRUEBA para pagos (sandbox - seguro)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxx (de prueba)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx (de prueba)

# ✅ Credenciales de PRODUCCIÓN para OAuth (funciona con cuentas de prueba)
MERCADOPAGO_CLIENT_ID=xxx (de producción - que ya tienes)
MERCADOPAGO_CLIENT_SECRET=xxx (de producción - que ya tienes)

# URL de la aplicación (para OAuth redirect)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/oauth/callback

# Clave de encriptación (genera una de 32 bytes)
ENCRYPTION_KEY=tu_clave_de_32_bytes_aqui
```

**Para generar `ENCRYPTION_KEY`**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**✅ CONFIGURACIÓN HÍBRIDA (Recomendada)**:
- **Public Key y Access Token de PRUEBA**: Para pagos en sandbox (seguro, no cobra real)
- **Client ID y Client Secret de PRODUCCIÓN**: Para OAuth (funciona con cuentas de prueba)
- **Ventaja**: Puedes probar split payment completo sin riesgo de cobros reales

**⚠️ IMPORTANTE**: 
- Esta configuración híbrida es segura y común
- Los pagos seguirán siendo de prueba (sandbox)
- OAuth de producción puede autorizar cuentas de prueba
- No hay riesgo de cobros reales mientras uses Access Token de prueba

---

### 3️⃣ Configurar Redirect URI para OAuth

**En el panel de Mercado Pago Developers**:
1. Ve a **"Información general"** de tu aplicación
2. Busca **"Redirect URI"** o **"URL de redirección"**
3. Configura: `http://localhost:3000/api/mercadopago/oauth/callback`
4. Guarda los cambios

**⚠️ Para producción**, también necesitarás agregar:
- `https://tu-dominio.com/api/mercadopago/oauth/callback`

---

### 4️⃣ Ejecutar Migraciones SQL

**En Supabase SQL Editor**, ejecuta en este orden:

1. **Primero**: `db/migrations/add-mercadopago-fields-to-banco.sql`
   - Agrega campos de Mercado Pago a la tabla `banco`

2. **Segundo**: `db/migrations/add-split-payment-tables.sql`
   - Crea tabla `coach_mercadopago_credentials`
   - Crea tabla `marketplace_commission_config`
   - Crea función `calculate_marketplace_commission`

---

### 5️⃣ Instalar SDK de Mercado Pago

```bash
npm install mercadopago @mercadopago/sdk-react
```

---

### 6️⃣ Verificar Configuración

**Checklist**:
- [ ] Credenciales de prueba obtenidas
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Redirect URI configurado en Mercado Pago
- [ ] Migraciones SQL ejecutadas
- [ ] SDK instalado

---

## 🔍 Dónde Encontrar las Credenciales

### En el Panel de Mercado Pago:

1. **Credenciales de Prueba**:
   - Menú lateral → **"PRUEBAS"** → **"Credenciales de prueba"**
   - Ahí verás:
     - Public Key
     - Access Token

2. **Client ID y Client Secret** (para OAuth):
   - Menú lateral → **"Información general"**
   - O en la sección de OAuth

---

## 🧪 Probar con Cuentas de Prueba

### Para probar el flujo completo:

1. **Login como coach** (`ronaldinho`):
   - Usuario: `TESTUSER4826...`
   - Contraseña: `VxvptDWun9`
   - User ID: `2995219181`

2. **Login como cliente** (`totti1`):
   - Usuario: `TESTUSER4821...`
   - Contraseña: `AlpFFZDyZw`
   - User ID: `2992707264`

3. **OMNIA (Integrador)** (`omniav1`):
   - User ID: `2995219179`
   - Usa las credenciales de la aplicación

---

## 📝 Notas Importantes

1. **Credenciales de Prueba vs Producción**:
   - Las credenciales de prueba solo funcionan en sandbox
   - Para producción, necesitarás credenciales de producción (después de aprobar la aplicación)

2. **OAuth en Prueba**:
   - En sandbox, el flujo OAuth funciona igual
   - Los coaches de prueba pueden autorizar a OMNIA

3. **Tarjetas de Prueba**:
   - Ve a **"Tarjetas de prueba"** para obtener números de tarjeta para testing
   - Ejemplo: `5031 7557 3453 0604` (Visa aprobada)

---

## 🚀 Siguiente Paso Después de Esto

Una vez completados estos pasos, podremos:
1. Implementar el flujo OAuth
2. Crear los endpoints de pago
3. Integrar Bricks en el frontend
4. Probar el split payment completo

---

## ❓ ¿Dudas?

Si algo no está claro, revisa:
- `docs/MERCADO_PAGO_SPLIT_PAYMENT.md` - Guía completa
- `docs/MERCADO_PAGO_CHECKOUT_API_BRICKS.md` - Implementación de Bricks

