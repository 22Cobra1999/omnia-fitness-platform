# ✅ Corrección del Flujo OAuth de Mercado Pago

## 📅 Fecha: $(date)

---

## 🔧 Cambios Realizados

### 1. **Componente `mercadopago-connection.tsx`**

**Problema**: El botón "Conectar" abría un popup que no redirigía correctamente a Mercado Pago.

**Solución**: 
- Cambiado `window.open()` por `window.location.href` para abrir en la misma ventana
- Esto asegura que la redirección del servidor funcione correctamente

```typescript
const handleConnect = async () => {
  if (!user?.id) return;

  setConnecting(true);
  try {
    // Usar el endpoint intermedio que construye la URL de Mercado Pago
    // y redirige correctamente. Abrir en la misma ventana para que funcione.
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const authUrl = `${baseUrl}/api/mercadopago/oauth/authorize?coach_id=${user.id}`;
    
    // Abrir directamente en la misma ventana para que la redirección funcione correctamente
    // Esto asegura que Mercado Pago se abra y el usuario pueda loguearse
    window.location.href = authUrl;
    
  } catch (error) {
    console.error('Error al conectar:', error);
    setConnecting(false);
    toast.error('Error al iniciar la conexión con Mercado Pago');
  }
};
```

### 2. **Endpoint `/api/mercadopago/oauth/authorize`**

**Mejoras**:
- Cambiado status code de `302` a `307` (Temporary Redirect) para mantener el método GET
- Agregado header `Location` explícito
- Mantenidos parámetros `prompt=login` y `force_login=true` para forzar pantalla de login

```typescript
// Redirigir a Mercado Pago con headers explícitos
// Usar 307 (Temporary Redirect) para mantener el método GET
return NextResponse.redirect(finalAuthUrl, {
  status: 307,
  headers: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Location': finalAuthUrl
  }
});
```

---

## 🔄 Flujo Completo Corregido

1. **Usuario hace clic en "Conectar con Mercado Pago"**
   - Se ejecuta `handleConnect()`
   - Se redirige a `/api/mercadopago/oauth/authorize?coach_id=xxx`

2. **Endpoint de autorización**
   - Verifica autenticación
   - Construye URL de Mercado Pago con:
     - `client_id`
     - `response_type=code`
     - `platform_id=mp`
     - `redirect_uri`
     - `state=coach_id`
     - `prompt=login` (fuerza login)
     - `force_login=true` (fuerza selección de cuenta)
   - Redirige con status 307

3. **Mercado Pago**
   - Usuario ve pantalla de login/selección de cuenta
   - Usuario se loguea
   - Usuario autoriza a OMNIA

4. **Callback**
   - Mercado Pago redirige a `/api/mercadopago/oauth/callback?code=xxx&state=coach_id`
   - Se intercambia código por tokens
   - Se guardan credenciales encriptadas
   - Se redirige a `/?tab=profile&mp_auth=success`

---

## ✅ Resultado

- ✅ El botón "Conectar" ahora abre Mercado Pago correctamente
- ✅ La redirección funciona en la misma ventana
- ✅ Se fuerza la pantalla de login/selección de cuenta
- ✅ El flujo OAuth completo funciona correctamente

---

## 📝 Notas

- El componente `MercadoPagoConnection` solo se muestra para coaches (`isCoach === true`)
- La redirección debe hacerse en la misma ventana, no en popup
- Los parámetros `prompt=login` y `force_login=true` aseguran que el usuario vea la pantalla de login

---

## 🚀 Deployment

- ✅ Cambios pusheados a `main`
- ✅ Deploy completado en Vercel
- ✅ URL de producción: `https://omnia-app.vercel.app`

