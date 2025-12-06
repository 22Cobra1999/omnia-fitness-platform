# 📋 Plan: OAuth MercadoPago para Clientes

## 🎯 Objetivo
Permitir que los clientes conecten su cuenta de MercadoPago para realizar pagos. Si no tienen cuenta conectada, iniciar el flujo OAuth desde el modal de pago.

---

## ✅ Lo que TENEMOS hoy

### 1. **OAuth para Coaches** (✅ Implementado)
- ✅ Endpoint `/api/mercadopago/oauth/authorize` - Inicia OAuth
- ✅ Endpoint `/api/mercadopago/oauth/callback` - Callback OAuth
- ✅ Tabla `coach_mercadopago_credentials` - Almacena credenciales de coaches
- ✅ Componente `MercadoPagoConnection` - UI en perfil del coach
- ✅ Encriptación de tokens funcionando

### 2. **Infraestructura Base**
- ✅ Función de encriptación (`lib/utils/encryption.ts`)
- ✅ Variables de entorno configuradas
- ✅ SDK de MercadoPago instalado

### 3. **Ambiente de Pruebas**
- ✅ Cuentas de prueba creadas:
  - `omniav1` (Integrador/Marketplace) - User ID: `2995219179`
  - `ronaldinho` (Coach/Vendedor) - User ID: `2995219181`
  - `totti1` (Cliente/Comprador) - User ID: `2992707264`

---

## ❌ Lo que FALTA

### 1. **OAuth para Clientes** (No implementado)
- ❌ Tabla para almacenar credenciales de clientes
- ❌ Endpoints OAuth adaptados para clientes
- ❌ UI en perfil del cliente
- ❌ Verificación de conexión antes de pagar
- ❌ Flujo de conexión desde modal de pago

### 2. **Integración en Modal de Pago**
- ❌ Verificar si cliente tiene MercadoPago conectado
- ❌ Si no tiene, iniciar OAuth automáticamente
- ❌ Guardar estado de "pago pendiente" durante OAuth

---

## 🌍 Ambiente de Pruebas vs Producción

### **Ambiente de PRUEBAS (Sandbox)**
- ✅ **Puedes usar cuentas de prueba** creadas en Mercado Pago
- ✅ **No hay dinero real** involucrado
- ✅ **Tarjetas de prueba** funcionan (ej: `5031 7557 3453 0604`)
- ✅ **OAuth funciona** con credenciales de producción pero autoriza cuentas de prueba
- ✅ **Ideal para desarrollo y testing**

### **Ambiente de PRODUCCIÓN**
- ⚠️ **Requiere cuentas reales** de Mercado Pago
- ⚠️ **Dinero real** en las transacciones
- ⚠️ **Solo usar cuando estés listo** para lanzar

### **Recomendación para OMNIA**
**Usar AMBIENTE DE PRUEBAS** para desarrollo:
- OAuth con credenciales de **producción** (funciona con cuentas de prueba)
- Pagos con Access Token de **prueba** (seguro, no cobra dinero real)
- Cuentas de prueba de Mercado Pago asociadas a usuarios de OMNIA

---

## 📊 Arquitectura Necesaria

### **Tabla: `client_mercadopago_credentials`**
Similar a `coach_mercadopago_credentials`, pero para clientes:

```sql
CREATE TABLE client_mercadopago_credentials (
  id BIGSERIAL PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id),
  mercadopago_user_id TEXT NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  oauth_authorized BOOLEAN DEFAULT FALSE,
  oauth_authorized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id)
);
```

### **Endpoints Necesarios**

1. **`/api/mercadopago/oauth/authorize-client`**
   - Similar a `/api/mercadopago/oauth/authorize`
   - Recibe `client_id` en lugar de `coach_id`
   - Redirige a Mercado Pago con `state=client_id`

2. **`/api/mercadopago/oauth/callback-client`**
   - Similar a `/api/mercadopago/oauth/callback`
   - Guarda en `client_mercadopago_credentials`
   - Redirige a perfil del cliente o continúa con el pago pendiente

3. **`/api/mercadopago/client/check-connection`**
   - Verifica si el cliente tiene MercadoPago conectado
   - Retorna `{ connected: boolean, mercadopago_user_id?: string }`

---

## 🔄 Flujo Propuesto

### **Escenario 1: Cliente SIN MercadoPago conectado**

```
1. Cliente selecciona "MercadoPago" en modal de pago
   ↓
2. Sistema verifica conexión → NO tiene
   ↓
3. Mostrar modal: "Conecta tu cuenta de MercadoPago"
   - Mensaje: "Para pagar con MercadoPago, necesitas conectar tu cuenta"
   - Botón: "Conectar MercadoPago"
   ↓
4. Redirigir a OAuth: `/api/mercadopago/oauth/authorize-client?client_id=xxx&return_to=payment`
   ↓
5. Cliente autoriza en Mercado Pago
   ↓
6. Callback guarda credenciales
   ↓
7. Redirigir de vuelta al modal de pago (con estado guardado)
   ↓
8. Continuar con el pago usando MercadoPago
```

### **Escenario 2: Cliente CON MercadoPago conectado**

```
1. Cliente selecciona "MercadoPago" en modal de pago
   ↓
2. Sistema verifica conexión → SÍ tiene
   ↓
3. Continuar directamente con el pago
   - Crear preferencia de pago
   - Redirigir a checkout de Mercado Pago
```

### **Escenario 3: Conexión desde Perfil**

```
1. Cliente va a Perfil → Sección "Mercado Pago"
   ↓
2. Click en "Conectar MercadoPago"
   ↓
3. Redirigir a OAuth
   ↓
4. Callback guarda credenciales
   ↓
5. Redirigir a perfil con mensaje de éxito
```

---

## 📝 Pasos de Implementación

### **FASE 1: Base de Datos** (15 min)
1. ✅ Crear migración SQL para `client_mercadopago_credentials`
2. ✅ Agregar políticas RLS
3. ✅ Ejecutar migración en Supabase

### **FASE 2: Backend - OAuth** (30 min)
1. ✅ Crear `/api/mercadopago/oauth/authorize-client`
2. ✅ Crear `/api/mercadopago/oauth/callback-client`
3. ✅ Crear `/api/mercadopago/client/check-connection`

### **FASE 3: Frontend - UI** (45 min)
1. ✅ Crear componente `ClientMercadoPagoConnection` (para perfil)
2. ✅ Integrar en `profile-screen.tsx`
3. ✅ Modificar `payment-methods-modal.tsx`:
   - Verificar conexión al seleccionar MercadoPago
   - Mostrar modal de conexión si no está conectado
   - Guardar estado de pago pendiente durante OAuth

### **FASE 4: Integración** (30 min)
1. ✅ Modificar flujo de compra para usar credenciales del cliente
2. ✅ Actualizar `create-with-mercadopago` para verificar cliente conectado
3. ✅ Testing completo

---

## 🔐 Asociación de Cuentas de Prueba

### **Cómo asociar cuentas de prueba con usuarios de OMNIA**

**Opción 1: Manual (Recomendado para testing)**
1. Cliente inicia sesión en OMNIA
2. Va a Perfil → "Conectar MercadoPago"
3. En Mercado Pago, usa cuenta de prueba `totti1`
4. Sistema guarda `mercadopago_user_id: 2992707264` en la BD

**Opción 2: Automática (Para producción)**
- Cada cliente usa su propia cuenta real de Mercado Pago
- OAuth captura automáticamente su `user_id`

### **Cuentas de Prueba Disponibles**
- **Cliente**: `totti1` (User ID: `2992707264`)
- **Coach**: `ronaldinho` (User ID: `2995219181`)
- **Marketplace**: `omniav1` (User ID: `2995219179`)

---

## ⚠️ Consideraciones Importantes

### **1. OAuth de Producción con Cuentas de Prueba**
- ✅ **SÍ funciona**: OAuth de producción puede autorizar cuentas de prueba
- ✅ **Seguro**: Los pagos siguen siendo de prueba si usas Access Token de prueba
- ✅ **Recomendado**: Usar esta configuración híbrida para desarrollo

### **2. Split Payment en Pruebas**
- ✅ **Funciona**: Split payment funciona con cuentas de prueba
- ✅ **División simulada**: El dinero se divide entre cuentas de prueba
- ✅ **No hay dinero real**: Todo es simulado

### **3. Verificación de Conexión**
- ✅ **Antes de pagar**: Verificar si cliente tiene MercadoPago conectado
- ✅ **Si no tiene**: Mostrar opción de conectar
- ✅ **Si tiene**: Continuar con el pago normalmente

---

## 🎯 Próximos Pasos Inmediatos

### **1. Crear Migración SQL** (5 min)
- Tabla `client_mercadopago_credentials`
- Políticas RLS
- Índices necesarios

### **2. Crear Endpoints OAuth** (20 min)
- Adaptar endpoints existentes para clientes
- Cambiar `coach_id` por `client_id`
- Cambiar tabla de destino

### **3. Crear UI de Conexión** (30 min)
- Componente para perfil del cliente
- Modal de conexión en flujo de pago
- Verificación de estado

### **4. Integrar en Flujo de Pago** (20 min)
- Verificar conexión al seleccionar MercadoPago
- Iniciar OAuth si no está conectado
- Continuar pago después de OAuth

---

## 📊 Resumen de Estado

| Componente | Coach | Cliente | Estado |
|------------|-------|---------|--------|
| Tabla de credenciales | ✅ | ❌ | Falta crear |
| OAuth authorize | ✅ | ❌ | Falta adaptar |
| OAuth callback | ✅ | ❌ | Falta adaptar |
| UI en perfil | ✅ | ❌ | Falta crear |
| Verificación de conexión | ✅ | ❌ | Falta crear |
| Integración en pago | ✅ | ❌ | Falta crear |

---

## ✅ Conclusión

**Puedes usar el ambiente de PRUEBAS** para todo el desarrollo:
- OAuth con credenciales de producción (funciona con cuentas de prueba)
- Pagos con Access Token de prueba (seguro)
- Cuentas de prueba asociadas a usuarios de OMNIA

**Tiempo estimado total**: ~2 horas de desarrollo

**Prioridad**: Alta - Necesario para que clientes puedan pagar con MercadoPago














