# 🧪 Guía Completa: Usuarios de Prueba de Mercado Pago en Omnia

## 📋 Información Consultada desde MCP de Mercado Pago

Esta guía está basada en la documentación oficial de Mercado Pago obtenida a través del MCP Server.

---

## 🎯 Usuarios de Prueba Configurados en Omnia

Según la documentación del proyecto, tienes las siguientes cuentas de prueba creadas:

| Rol | Usuario | User ID | Descripción |
|-----|---------|---------|-------------|
| **Marketplace/Integrador** | `omniav1` | `2995219179` | OMNIA como integrador (marketplace) |
| **Coach/Vendedor** | `ronaldinho` | `2995219181` | Coach/Vendedor para probar split payment |
| **Cliente/Comprador** | `totti1` | `2992707264` | Cliente/Comprador para probar pagos |

### Credenciales de Acceso

#### Coach (`ronaldinho`)
- **Usuario**: `TESTUSER4826...` (ver en panel MP)
- **Contraseña**: `VxvptDWun9`
- **User ID**: `2995219181`

#### Cliente (`totti1`)
- **Usuario**: `TESTUSER4821...` (ver en panel MP)
- **Contraseña**: `AlpFFZDyZw`
- **User ID**: `2992707264`

---

## 📚 Información de la Documentación Oficial

### Tipos de Cuentas de Prueba

Según la documentación oficial de Mercado Pago, necesitas al menos dos tipos de cuentas:

1. **Vendedor**: Cuenta requerida para configurar la aplicación y las credenciales
2. **Comprador**: Cuenta necesaria para probar el proceso de compra
3. **Integrador**: Cuenta que se usa en integraciones del modelo marketplace

### Características de las Cuentas de Prueba

- ✅ Tienen las mismas características que una cuenta real de Mercado Pago
- ✅ Permiten probar todos los flujos y escenarios posibles
- ✅ Puedes crear hasta **15 cuentas** de usuarios de prueba al mismo tiempo
- ⚠️ **No es posible eliminarlas** una vez creadas

### Información Disponible por Cuenta

Cada cuenta de prueba muestra:
- **Identificación de la cuenta**: Descripción para identificar la cuenta
- **Tipo de cuenta**: Vendedor, Comprador o Integrador
- **País**: Lugar de origen (no se puede editar después)
- **User ID**: Número de identificación de usuario (creado automáticamente)
- **Usuario**: Nombre de usuario generado automáticamente
- **Contraseña**: Contraseña de acceso (se puede regenerar)

---

## 🔐 Validar Inicio de Sesión con Usuarios de Prueba

### Autenticación por Email

> 📖 **Información Oficial de Mercado Pago**: Según la [documentación oficial](https://www.mercadopago.com/developers/es/docs/checkout-api/additional-content/your-integrations/test/accounts), cuando se solicita autenticación mediante código enviado por e-mail para cuentas de prueba:

Al iniciar sesión en la web con usuarios de prueba e intentar acceder a algunas secciones del Panel del Desarrollador, o al conectar la cuenta mediante OAuth, es posible que te sea solicitada una autenticación mediante un código enviado por e-mail.

**⚠️ IMPORTANTE**: Como se trata de usuarios ficticios, **NO tendrás acceso a ese e-mail** que recibirá el código. En su lugar, debes realizar esa validación introduciendo:

1. **Opción 1**: Los **últimos 6 dígitos que componen el User ID de la cuenta de prueba**
2. **Opción 2**: Los **últimos 6 dígitos que componen el Access Token productivo** de tu aplicación

> ⚠️ **Nota**: Para acceder al User ID o el Access Token de una cuenta de prueba, deberás haber creado previamente una aplicación. Si tienes dudas sobre cómo obtener el User ID o el Access Token, accede a [Detalles de la aplicación](https://www.mercadopago.com/developers/es/docs/your-integrations/application-details) o [Credenciales](https://www.mercadopago.com/developers/es/docs/your-integrations/credentials).

### Ejemplo - User ID

Para la cuenta `ronaldinho` (User ID: `2995219181`):
- Últimos 6 dígitos: `5219181`
- **Ingresa**: `5` `2` `1` `9` `1` `8` `1` (un dígito por campo)

Para la cuenta `totti1` (User ID: `2992707264`):
- Últimos 6 dígitos: `2707264`
- **Ingresa**: `2` `7` `0` `7` `2` `6` `4` (un dígito por campo)

### Ejemplo - Access Token de Producción

Si los últimos 6 dígitos del User ID no funcionan, usa los últimos 6 dígitos del Access Token de producción de tu aplicación.

**Para encontrar tu Access Token de producción**:
1. Ve a tu panel de Mercado Pago Developers
2. Selecciona tu aplicación "Om Omnia in te"
3. Ve a **"Credenciales de producción"**
4. Copia el **Access Token** (empieza con `APP_USR-`)
5. Toma los **últimos 6 dígitos** del token

**Ejemplo**: Si tu Access Token es `APP_USR-1806894141402209-111615-c8eb49a21685ec57eb24b443f0ac72ea-143028270`
- Busca los **últimos 6 dígitos numéricos** del token completo
- En este caso: `143028270` → los últimos 6 dígitos son `430282`
- **Ingresa**: `4` `3` `0` `2` `8` `2` (un dígito por campo)

> 💡 **Tip**: Si el Access Token termina con muchos dígitos, toma solo los últimos 6 dígitos numéricos consecutivos del final del token.

### ⚠️ Nota Importante

Si **ninguno de los métodos funciona**, puede ser que Mercado Pago esté pidiendo un código diferente. En ese caso:
1. Intenta cerrar la ventana y volver a iniciar el proceso
2. O contacta a Mercado Pago para verificar si hay otra forma de autenticación para cuentas de prueba

### Pasos para Conectar Cuenta de Prueba

1. Haz clic en "Conectar" en la sección de Mercado Pago
2. Serás redirigido a Mercado Pago
3. Inicia sesión con la cuenta de prueba (ej: `TESTUSER4826...` / `VxvptDWun9`)
4. Si aparece la pantalla de verificación por email:
   - **NO busques el email** (no existe)
   - **Primero intenta**: Los últimos 6 dígitos del User ID de la cuenta
   - **Si no funciona**: Usa los últimos 6 dígitos del Access Token de producción
   - Ingresa un dígito en cada campo (6 dígitos en total)
5. Completa la autorización de OMNIA
6. Serás redirigido de vuelta a Omnia con `?mp_auth=success`

### Limitaciones

Al iniciar sesión con una cuenta de prueba, **NO tendrás acceso** a:
- Credenciales de prueba
- Calidad de integración

Estas secciones no son necesarias para cuentas de prueba.

---

## 💳 Tarjetas de Prueba para Argentina (MLA)

Para probar pagos, usa estas tarjetas de prueba:

### Tarjetas de Crédito

| Tipo | Bandera | Número | CVV | Vencimiento |
|------|---------|--------|-----|-------------|
| Crédito | Mastercard | `5031 7557 3453 0604` | `123` | `11/30` |
| Crédito | Visa | `4509 9535 6623 3704` | `123` | `11/30` |
| Crédito | American Express | `3711 803032 57522` | `1234` | `11/30` |

### Tarjetas de Débito

| Tipo | Bandera | Número | CVV | Vencimiento |
|------|---------|--------|-----|-------------|
| Débito | Mastercard | `5287 3383 1025 3304` | `123` | `11/30` |
| Débito | Visa | `4002 7686 9439 5619` | `123` | `11/30` |

---

## 🎭 Escenarios de Pago con Tarjetas de Prueba

Para probar diferentes escenarios, usa estos datos del titular:

| Estado de Pago | Nombre del Titular | Documento (DNI) |
|----------------|-------------------|-----------------|
| ✅ **Pago aprobado** | `APRO` | `12345678` |
| ❌ Rechazado por error general | `OTHE` | `12345678` |
| ⏳ Pendiente de pago | `CONT` | - |
| 📞 Rechazado con validación para autorizar | `CALL` | - |
| 💰 Rechazado por importe insuficiente | `FUND` | - |
| 🔒 Rechazado por código de seguridad inválido | `SECU` | - |
| 📅 Rechazado por fecha de vencimiento | `EXPI` | - |
| 📝 Rechazado por error de formulario | `FORM` | - |
| 🚫 Rechazado por tarjeta deshabilitada | `LOCK` | - |
| 🔄 Rechazado por pago duplicado | `DUPL` | - |

### Ejemplo: Pago Aprobado

- **Tarjeta**: `5031 7557 3453 0604` (Mastercard)
- **CVV**: `123`
- **Vencimiento**: `11/30`
- **Nombre del titular**: `APRO`
- **DNI**: `12345678`

---

## 🔄 Cómo Usar los Usuarios de Prueba en Omnia

### 1. Probar Flujo OAuth (Coach)

1. **Login en Omnia** como coach
2. Ve a **Profile** → **Mercado Pago**
3. Haz click en **"Conectar con Mercado Pago"**
4. Serás redirigido a Mercado Pago
5. **Login en Mercado Pago** con la cuenta de prueba `ronaldinho`:
   - Usuario: `TESTUSER4826...`
   - Contraseña: `VxvptDWun9`
6. Si pide autenticación por email, usa los últimos 6 dígitos del User ID: `5219181`
7. Autoriza a OMNIA
8. Serás redirigido de vuelta con `?mp_auth=success`
9. Deberías ver: **"Conectado correctamente"** ✅

### 2. Probar Flujo de Compra (Cliente)

1. **Login en Omnia** como cliente
2. Busca una actividad del coach `ronaldinho`
3. Haz click en **"Comprar"**
4. Completa el formulario
5. Serás redirigido a Mercado Pago Checkout
6. Usa una **tarjeta de prueba**:
   - **Visa aprobada**: `4509 9535 6623 3704`
   - **CVV**: `123`
   - **Vencimiento**: `11/30`
   - **Nombre**: `APRO`
   - **DNI**: `12345678`
7. Completa el pago
8. Serás redirigido de vuelta a Omnia

### 3. Verificar Split Payment

Después de un pago exitoso, verifica en la base de datos:

```sql
-- Ver el último pago y su división
SELECT 
  b.*,
  c.mercadopago_user_id as coach_mp_user_id
FROM banco b
LEFT JOIN coach_mercadopago_credentials c ON c.coach_id = b.coach_id
ORDER BY b.created_at DESC
LIMIT 1;
```

---

## ⚠️ Consideraciones Importantes

### 1. OAuth de Producción con Cuentas de Prueba

- ✅ **SÍ funciona**: OAuth de producción puede autorizar cuentas de prueba
- ✅ **Seguro**: Los pagos siguen siendo de prueba si usas Access Token de prueba
- ✅ **Recomendado**: Usar esta configuración híbrida para desarrollo

### 2. Split Payment en Pruebas

- ✅ **Funciona**: Split payment funciona con cuentas de prueba
- ✅ **División simulada**: El dinero se divide entre cuentas de prueba
- ✅ **No hay dinero real**: Todo es simulado

### 3. Checkout Bricks

> ⚠️ **Importante**: Las integraciones con Checkout Bricks no soportan usuarios de prueba para realizar pruebas de integración. Por este motivo, no podrás acceder a la sección "Cuentas de prueba" desde una aplicación creada con este producto.

Para más información, visita: [Hacer compra de prueba con Checkout Bricks](https://www.mercadopago.com/developers/es/docs/checkout-bricks/integration-test/test-payment-flow)

---

## 📍 Dónde Ver/Editar Usuarios de Prueba

1. Ve a [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app)
2. Selecciona tu aplicación **"Om Omnia in te"**
3. En el menú lateral, ve a **"Cuentas de prueba"**
4. Ahí verás todas las cuentas creadas

### Acciones Disponibles

- **Ver credenciales**: Usuario, contraseña, User ID
- **Regenerar contraseña**: 3 puntos → "Generar nueva contraseña"
- **Editar datos**: 3 puntos → "Editar datos" (cambiar descripción o agregar dinero ficticio)
- **Ver detalles**: Click en la cuenta para ver toda la información

---

## 🔗 Referencias

- [Documentación Oficial: Cuentas de Prueba](https://www.mercadopago.com/developers/es/docs/checkout-api/additional-content/your-integrations/test/accounts)
- [Documentación Oficial: Tarjetas de Prueba](https://www.mercadopago.com/developers/es/docs/checkout-api/additional-content/your-integrations/test/cards)
- [Panel de Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app)

---

## ✅ Checklist de Testing

- [ ] Coach `ronaldinho` puede autorizar OAuth
- [ ] Cliente `totti1` puede realizar compras
- [ ] Split payment funciona correctamente
- [ ] Tarjetas de prueba funcionan
- [ ] Diferentes escenarios de pago probados (aprobado, rechazado, etc.)
- [ ] Webhooks reciben notificaciones correctamente
- [ ] Base de datos guarda información correctamente

---

**Última actualización**: Basado en consulta al MCP Server de Mercado Pago

