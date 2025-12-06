# 🔗 Guía: Vincular Usuarios de Omnia con Usuarios de Prueba de MercadoPago

## 📋 Resumen

Esta guía explica cómo vincular usuarios de Omnia (coaches y clientes) con usuarios de prueba de MercadoPago mediante el flujo OAuth.

---

## 🎯 Paso a Paso

### **Para COACHES:**

#### 1. **Crear/Verificar Cuenta de Prueba en MercadoPago**

1. Ve a [MercadoPago Developers](https://www.mercadopago.com.ar/developers/panel/app)
2. Ve a **"PRUEBAS"** → **"Usuarios de prueba"**
3. Crea un nuevo usuario de prueba o usa uno existente:
   - **Ejemplo**: `ronaldinho` (User ID: `2995219181`)
   - Guarda el **User ID** (lo necesitarás para verificar)

#### 2. **Login en Omnia como Coach**

1. Abre `http://localhost:3000`
2. Inicia sesión con tu cuenta de coach en Omnia
3. Ve a **"Profile"** o **"Configuración"**

#### 3. **Conectar con MercadoPago**

1. Busca la sección **"Mercado Pago"**
2. Haz click en **"Conectar con Mercado Pago"**
3. Serás redirigido a MercadoPago

#### 4. **Autorizar en MercadoPago**

1. **IMPORTANTE**: En la página de MercadoPago, **haz login con la cuenta de prueba** que creaste (ej: `ronaldinho`)
2. Autoriza a OMNIA para acceder a tu cuenta
3. Serás redirigido de vuelta a Omnia con `?mp_auth=success`

#### 5. **Verificar Conexión**

1. Deberías ver: **"Conectado correctamente"** ✅
2. El **User ID de MercadoPago** debería aparecer (ej: `2995219181`)
3. Verifica en la base de datos:
   ```sql
   SELECT coach_id, mercadopago_user_id, oauth_authorized 
   FROM coach_mercadopago_credentials 
   WHERE coach_id = 'tu-coach-id';
   ```

---

### **Para CLIENTES:**

> ⚠️ **Nota**: El OAuth para clientes aún no está implementado. Por ahora, los clientes pueden pagar sin conectar su cuenta.

Cuando esté implementado, el flujo será similar:

1. Login en Omnia como cliente
2. Ve a **"Profile"** → **"Conectar MercadoPago"**
3. Haz click en **"Conectar"**
4. En MercadoPago, haz login con cuenta de prueba (ej: `totti1`)
5. Autoriza a OMNIA
6. Listo ✅

---

## 🔍 Verificar Vinculación

### **Opción 1: Desde la UI**

- Ve a **Profile** → **Mercado Pago**
- Deberías ver: **"Conectado correctamente"** con el User ID

### **Opción 2: Desde la Base de Datos**

```sql
-- Ver todos los coaches conectados
SELECT 
  c.coach_id,
  u.email as coach_email,
  c.mercadopago_user_id,
  c.oauth_authorized,
  c.oauth_authorized_at
FROM coach_mercadopago_credentials c
LEFT JOIN auth.users u ON u.id = c.coach_id
WHERE c.oauth_authorized = true;

-- Ver un coach específico
SELECT * 
FROM coach_mercadopago_credentials 
WHERE coach_id = 'tu-coach-id';
```

### **Opción 3: Desde el Endpoint de Verificación**

```bash
curl http://localhost:3000/api/mercadopago/verify-tables
```

---

## 🧪 Cuentas de Prueba Disponibles

Según la documentación existente, estas son las cuentas de prueba:

| Rol | Usuario | User ID | Descripción |
|-----|---------|---------|-------------|
| **Marketplace** | `omniav1` | `2995219179` | OMNIA como integrador |
| **Coach** | `ronaldinho` | `2995219181` | Coach/Vendedor |
| **Cliente** | `totti1` | `2992707264` | Cliente/Comprador |

---

## ⚠️ Puntos Importantes

### **1. Usar Cuentas de Prueba Correctas**

- ✅ **Coach en Omnia** → Usa cuenta de prueba de **coach** en MercadoPago
- ✅ **Cliente en Omnia** → Usa cuenta de prueba de **cliente** en MercadoPago
- ❌ **NO mezcles**: Un coach no debe usar la cuenta de un cliente

### **2. OAuth Funciona con Credenciales de Producción**

- El OAuth usa `MERCADOPAGO_CLIENT_ID` y `MERCADOPAGO_CLIENT_SECRET` (de producción)
- Pero puede autorizar **cuentas de prueba** sin problema
- Esto es seguro porque los pagos siguen siendo de prueba si usas `TEST-` tokens

### **3. Verificar User ID**

Después de conectar, verifica que el `mercadopago_user_id` guardado coincida con el User ID de la cuenta de prueba que usaste.

---

## 🔧 Troubleshooting

### **Error: "No autorizado"**

- Verifica que estés logueado en Omnia
- Verifica que el `coach_id` en la URL coincida con tu usuario

### **Error: "token_exchange_failed"**

- Verifica que `MERCADOPAGO_CLIENT_ID` y `MERCADOPAGO_CLIENT_SECRET` estén configurados
- Verifica que el `redirect_uri` esté configurado en MercadoPago

### **Error: "db_error"**

- Verifica que la tabla `coach_mercadopago_credentials` exista
- Verifica que tengas permisos para escribir en la tabla

### **No se guarda el User ID**

- Verifica los logs del servidor
- Verifica que el callback esté recibiendo el `user_id` de MercadoPago
- Revisa `app/api/mercadopago/oauth/callback/route.ts`

---

## 📝 Script de Verificación

Puedes usar este script para verificar todas las vinculaciones:

```bash
# Verificar coaches conectados
curl -s http://localhost:3000/api/mercadopago/verify-tables | grep -A 10 "campos_coach_credentials"
```

---

## 🚀 Próximos Pasos

1. ✅ Conectar coaches con cuentas de prueba
2. ⏳ Implementar OAuth para clientes
3. ⏳ Probar split payment con cuentas vinculadas
4. ⏳ Verificar que los pagos se dividan correctamente

---

## 📚 Referencias

- [Documentación OAuth de MercadoPago](https://www.mercadopago.com.ar/developers/es/docs/security/oauth)
- [Usuarios de Prueba](https://www.mercadopago.com.ar/developers/es/docs/checkout-api/testing)
- `PLAN_MERCADOPAGO_CLIENTES.md` - Plan completo de implementación














