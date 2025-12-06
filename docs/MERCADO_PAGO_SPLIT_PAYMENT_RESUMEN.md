# Resumen: Split Payment de Mercado Pago para OMNIA

## 🎯 ¿Qué es Split Payment?

Split Payment permite dividir automáticamente los pagos entre:
- **OMNIA (Marketplace)**: Recibe una comisión (ej: 15%)
- **Coach (Vendedor)**: Recibe el resto del monto

**Ventajas**:
- ✅ División automática sin intervención manual
- ✅ Cada coach recibe directamente en su cuenta de Mercado Pago
- ✅ OMNIA recibe su comisión automáticamente
- ✅ Transparencia total en las transacciones

---

## 📋 Requisitos

### 1. Cuenta de Mercado Pago
- ✅ Cuenta de vendedor con nivel **KYC 6**
- ✅ Aplicación creada en [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/panel/app/create-app)
- ✅ Modelo: **"Marketplace"**

### 2. OAuth para Coaches
- ⚠️ Cada coach debe autorizar a OMNIA mediante OAuth
- ⚠️ Obtener `access_token` de cada coach
- ⚠️ Almacenar tokens encriptados en base de datos

---

## 🗄️ Estructura de Base de Datos

### Tablas a crear/modificar:

1. **`banco`** (modificar):
   - Agregar campos de Mercado Pago
   - Agregar `marketplace_fee` y `seller_amount`
   - Ver: `db/migrations/add-mercadopago-fields-to-banco.sql`

2. **`coach_mercadopago_credentials`** (nueva):
   - Almacena credenciales OAuth de cada coach
   - Ver: `db/migrations/add-split-payment-tables.sql`

3. **`marketplace_commission_config`** (nueva):
   - Configuración de comisiones (por defecto: 15%)
   - Ver: `db/migrations/add-split-payment-tables.sql`

---

## 🔄 Flujo Completo

```
1. Coach autoriza OMNIA (OAuth)
   ↓
2. Cliente compra actividad
   ↓
3. OMNIA crea preferencia de pago
   - Usa access_token del coach
   - Calcula comisión (15%)
   - Crea preferencia con marketplace_fee
   ↓
4. Cliente paga en Mercado Pago
   ↓
5. Mercado Pago divide automáticamente:
   - $1,500 ARS → Cuenta de OMNIA (comisión)
   - $8,500 ARS → Cuenta del Coach
   ↓
6. Webhook notifica a OMNIA
   ↓
7. OMNIA actualiza banco y activa enrollment
```

---

## 📝 Archivos Creados

1. **Documentación**:
   - `docs/MERCADO_PAGO_SPLIT_PAYMENT.md` - Guía completa
   - `docs/MERCADO_PAGO_SPLIT_PAYMENT_RESUMEN.md` - Este archivo

2. **Migraciones SQL**:
   - `db/migrations/add-mercadopago-fields-to-banco.sql` - Campos de MP en banco
   - `db/migrations/add-split-payment-tables.sql` - Tablas nuevas + función SQL

3. **Consultas**:
   - `db/queries/list-all-tables-and-columns.sql` - Ver todas las tablas

---

## 🚀 Próximos Pasos

### 1. Ejecutar Migraciones
```sql
-- En Supabase SQL Editor, ejecutar:
1. db/migrations/add-mercadopago-fields-to-banco.sql
2. db/migrations/add-split-payment-tables.sql
```

### 2. Instalar SDK
```bash
npm install mercadopago
```

### 3. Configurar Variables de Entorno
```env
MERCADOPAGO_CLIENT_ID=tu_client_id
MERCADOPAGO_CLIENT_SECRET=tu_client_secret
MERCADOPAGO_ACCESS_TOKEN=tu_access_token_omnia
ENCRYPTION_KEY=tu_clave_de_32_bytes_para_encriptar_tokens
```

### 4. Implementar Endpoints
- `POST /api/mercadopago/oauth/authorize` - Iniciar OAuth
- `GET /api/mercadopago/oauth/callback` - Callback OAuth
- `POST /api/payments/create-preference` - Crear preferencia con split
- `POST /api/payments/webhook` - Recibir webhooks

### 5. UI para Coaches
- Página para autorizar Mercado Pago
- Dashboard de pagos recibidos
- Estado de autorización OAuth

---

## 🔗 Referencias

- [Documentación Split Payments](https://www.mercadopago.com.ar/developers/es/docs/split-payments/landing)
- [Requisitos Previos](https://www.mercadopago.com.ar/developers/es/docs/split-payments/prerequisites)
- [Integración Marketplace](https://www.mercadopago.com.br/developers/es/docs/split-payments/integration-configuration/integrate-marketplace)

---

## ⚠️ Consideraciones Importantes

1. **OAuth es obligatorio**: Cada coach debe autorizar a OMNIA
2. **Tokens expiran**: Implementar refresh token automático
3. **Seguridad**: Encriptar todos los tokens en base de datos
4. **Reembolsos**: Se dividen proporcionalmente
5. **Comisiones MP**: Se deducen antes del split

---

## 💡 Ejemplo Práctico

**Actividad**: "Pliométricos de Ronaldinho" - $10,000 ARS

**Flujo**:
1. Coach autoriza OMNIA (una vez)
2. Cliente compra → OMNIA crea preferencia con `marketplace_fee: 1500`
3. Cliente paga $10,000 en Mercado Pago
4. Mercado Pago divide:
   - OMNIA recibe: $1,500 (automático)
   - Coach recibe: $8,500 (automático)
5. Enrollment se activa automáticamente

**Sin Split Payment** (actual):
- Cliente paga → Todo va a OMNIA → OMNIA debe transferir manualmente al coach

**Con Split Payment**:
- Cliente paga → División automática → Cada uno recibe su parte directamente















