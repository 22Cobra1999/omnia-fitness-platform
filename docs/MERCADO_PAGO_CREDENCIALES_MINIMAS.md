# Credenciales Mínimas para Empezar con Mercado Pago

## ✅ Lo que ya tienes

- **Public Key** ✅
- **Access Token** ✅

## ⚠️ Lo que falta (pero no es crítico ahora)

- **Client ID** (para OAuth)
- **Client Secret** (para OAuth)

---

## 🎯 ¿Qué puedes hacer ahora?

### ✅ Con solo Public Key y Access Token puedes:

1. **Probar pagos básicos** (sin split payment)
2. **Crear preferencias de pago**
3. **Recibir webhooks**
4. **Probar el checkout básico**

### ❌ Lo que NO puedes hacer todavía:

1. **Split Payment completo** (necesitas OAuth)
2. **Que los coaches autoricen a OMNIA** (necesitas OAuth)

---

## 🚀 Plan de Acción

### Fase 1: Empezar con lo básico (AHORA)

```env
# .env.local - Configuración mínima
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu_public_key
MERCADOPAGO_ACCESS_TOKEN=tu_access_token
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=tu_clave_32_bytes
```

**Con esto puedes**:
- Instalar el SDK
- Ejecutar las migraciones SQL
- Crear endpoints básicos de pago
- Probar el checkout

### Fase 2: Agregar OAuth (DESPUÉS)

Cuando encuentres o configures Client ID y Client Secret:

```env
# Agregar a .env.local
MERCADOPAGO_CLIENT_ID=tu_client_id
MERCADOPAGO_CLIENT_SECRET=tu_client_secret
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/oauth/callback
```

**Con esto puedes**:
- Implementar el flujo OAuth completo
- Hacer split payment real
- Que los coaches autoricen a OMNIA

---

## 🔍 Dónde buscar Client ID y Client Secret

### Opción 1: Información General
1. Ve a **"Información general"** de tu aplicación
2. Busca secciones como:
   - "OAuth"
   - "Credenciales OAuth"
   - "Client ID" / "Client Secret"

### Opción 2: Configuración de OAuth
1. Busca una sección de **"OAuth"** o **"Autorización"**
2. Puede que necesites habilitar OAuth primero

### Opción 3: Crear nueva aplicación
Si no encuentras las credenciales, puede que necesites:
1. Verificar que la aplicación esté configurada como **"Marketplace"**
2. Habilitar OAuth en la configuración
3. Mercado Pago generará Client ID y Client Secret automáticamente

### Opción 4: Contactar soporte
Si no aparecen en ninguna parte, contacta a Mercado Pago para habilitar OAuth en tu aplicación.

---

## 💡 Recomendación

**Empieza ahora con lo que tienes**:
1. ✅ Configura `.env.local` con Public Key y Access Token
2. ✅ Ejecuta las migraciones SQL
3. ✅ Instala el SDK
4. ✅ Crea endpoints básicos de pago

**Mientras tanto**:
- Busca Client ID y Client Secret en el panel
- O configura OAuth si es necesario
- O contacta a Mercado Pago si no aparecen

**Cuando tengas Client ID y Client Secret**:
- Agrégalos a `.env.local`
- Implementa el flujo OAuth
- Activa el split payment completo

---

## 📝 Checklist

### Para empezar ahora:
- [x] Public Key ✅
- [x] Access Token ✅
- [ ] Configurar `.env.local` con lo mínimo
- [ ] Ejecutar migraciones SQL
- [ ] Instalar SDK

### Para split payment completo (después):
- [ ] Client ID
- [ ] Client Secret
- [ ] Configurar Redirect URI
- [ ] Implementar flujo OAuth

---

## ❓ ¿Qué hacer si no encuentro Client ID y Client Secret?

1. **Revisa la documentación de Mercado Pago** sobre OAuth
2. **Verifica que tu aplicación esté configurada como Marketplace**
3. **Busca en todas las secciones del panel**:
   - Información general
   - Configuración
   - OAuth
   - Credenciales
4. **Contacta a soporte de Mercado Pago** si no aparecen

**No te preocupes**: Puedes avanzar con la integración básica mientras resuelves esto.








