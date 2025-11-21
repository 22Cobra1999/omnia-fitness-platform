# 🔑 Credenciales de Mercado Pago - Actualizadas

## ✅ Credenciales de Prueba (Argentina)

**Fecha de actualización**: Enero 2025

### Public Key
```
APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb
```

### Access Token
```
APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181
```

### País de Operación
```
Argentina
```

---

## 📋 Configuración en Variables de Entorno

### Para `.env.local` (Desarrollo Local):

```env
# Mercado Pago - Credenciales de Prueba (Argentina)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb
MERCADOPAGO_ACCESS_TOKEN=APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181

# URLs de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=http://localhost:3000/api/mercadopago/oauth/callback

# Clave de encriptación (para tokens OAuth)
ENCRYPTION_KEY=1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4
```

### Para Vercel (Producción/Testing):

```env
# Mercado Pago - Credenciales de Prueba (Argentina)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-f5589935-8dea-4963-af32-b0f57a9ad7fb
MERCADOPAGO_ACCESS_TOKEN=APP_USR-8497664518687621-112020-b8d6314ad9be3f5f9b55182b157921c1-2995219181

# URLs de la aplicación
NEXT_PUBLIC_APP_URL=https://omnia-app.vercel.app
NEXT_PUBLIC_MERCADOPAGO_REDIRECT_URI=https://omnia-app.vercel.app/api/mercadopago/oauth/callback

# Clave de encriptación (para tokens OAuth)
ENCRYPTION_KEY=1513307e2b8fefae34becc196fd23904f9e2cc0768ad684f522424934f5187b4
```

---

## ⚠️ Notas Importantes

1. **Estas son credenciales de PRODUCCIÓN para cuenta de PRUEBA**:
   - Empiezan con `APP_USR-` (no `TEST-`)
   - Son seguras para usar en pruebas
   - No procesan pagos reales

2. **User ID del Access Token**:
   - El Access Token contiene el User ID: `2995219181`
   - Este es el ID de la cuenta de prueba del vendedor/coach

3. **Para OAuth (si es necesario)**:
   - Necesitarás `MERCADOPAGO_CLIENT_ID` y `MERCADOPAGO_CLIENT_SECRET`
   - Estas se encuentran en "Información general" de la aplicación en Mercado Pago

---

## 🔍 Verificación

Para verificar que las credenciales están correctamente configuradas:

1. **En el código**:
   - `MERCADOPAGO_ACCESS_TOKEN` se usa en los endpoints del backend
   - `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` se usa en el frontend (si es necesario)

2. **Endpoints que usan estas credenciales**:
   - `/api/mercadopago/checkout-pro/create-preference` - Crea preferencias
   - `/api/mercadopago/webhook` - Recibe notificaciones
   - `/api/mercadopago/oauth/*` - Flujo OAuth (si está configurado)

---

## 📚 Referencias

- [Documentación de Credenciales de Mercado Pago](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/credentials)
- [Configuración de Pruebas](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/integration-test)

