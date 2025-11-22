# 🔍 Validaciones Completas: Botón de Pagar Bloqueado

## 📋 Endpoint de Validación

He creado un endpoint completo que valida **TODOS** los aspectos que podrían causar que Mercado Pago bloquee el botón de pagar:

**Endpoint**: `POST /api/mercadopago/validate-checkout`

---

## ✅ Validaciones Implementadas

### 1. **SDK de Mercado Pago**
- ✅ Verifica que el SDK esté instalado
- ✅ Verifica que se pueda inicializar correctamente
- ✅ Detecta errores de importación o configuración

### 2. **Variables de Entorno**
- ✅ Verifica que todas las variables requeridas estén configuradas
- ✅ Verifica que no estén vacías
- ✅ Valida el formato de las credenciales (TEST- o APP_USR-)
- ✅ Verifica la longitud de los tokens

**Variables validadas**:
- `MERCADOPAGO_ACCESS_TOKEN`
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
- `NEXT_PUBLIC_APP_URL`
- `ENCRYPTION_KEY`

### 3. **Autenticación y Usuario**
- ✅ Verifica que el usuario esté autenticado
- ✅ Verifica que el usuario tenga email
- ✅ Valida que la sesión sea válida

### 4. **Actividad**
- ✅ Verifica que la actividad exista
- ✅ Valida que el precio sea un número válido
- ✅ Verifica que el monto sea mayor a 0
- ✅ Verifica que el monto sea >= $1 (montos muy bajos pueden causar problemas)
- ✅ Verifica que el monto no tenga decimales (puede causar problemas)
- ✅ Verifica que el monto no exceda el máximo

### 5. **Credenciales del Coach**
- ✅ Verifica que el coach tenga Mercado Pago configurado
- ✅ Verifica que el coach haya autorizado OAuth
- ✅ Verifica que se pueda desencriptar el token
- ✅ Valida el tipo de token (TEST o PRODUCTION)
- ✅ Verifica el User ID del coach

### 6. **Información del Payer**
- ✅ Verifica que el usuario tenga email
- ✅ Verifica que tenga nombre
- ✅ Verifica que tenga apellido
- ✅ Verifica que tenga teléfono (opcional pero recomendado)
- ✅ Verifica que tenga DNI/identificación (opcional pero recomendado)
- ✅ Verifica que tenga tipo de documento

### 7. **Configuración de Métodos de Pago**
- ✅ Verifica que los métodos de pago estén configurados
- ✅ Verifica que no haya métodos excluidos incorrectamente
- ✅ Verifica la configuración de cuotas

### 8. **Token del Marketplace**
- ✅ Verifica que el token del marketplace esté configurado
- ✅ Verifica si es token de prueba o producción
- ✅ Verifica si se usará el token del marketplace o del coach

### 9. **Configuración de Preferencia**
- ✅ Verifica que los items sean válidos
- ✅ Verifica que las back URLs estén configuradas
- ✅ Verifica que el auto_return esté configurado
- ✅ Verifica que la notification_url esté configurada
- ✅ Verifica si se incluirá marketplace_fee (solo en producción)

---

## 🧪 Cómo Usar el Endpoint

### Opción 1: Usar el Componente (Recomendado)

He creado un componente que puedes usar en cualquier parte de la aplicación:

```tsx
import { ValidateCheckoutButton } from '@/components/mercadopago/validate-checkout-button';

<ValidateCheckoutButton activityId={activityId} />
```

Este componente:
- ✅ Muestra un botón para validar
- ✅ Muestra los resultados de forma visual
- ✅ Indica qué validaciones pasaron y cuáles fallaron
- ✅ Muestra recomendaciones

### Opción 2: Llamar el Endpoint Directamente

```typescript
const response = await fetch('/api/mercadopago/validate-checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ activityId: '123' }),
});

const result = await response.json();
console.log(result);
```

---

## 📊 Respuesta del Endpoint

### Estructura de la Respuesta

```json
{
  "status": "success" | "warning" | "error",
  "summary": {
    "totalValidations": 10,
    "passed": 8,
    "warnings": 1,
    "errors": 1
  },
  "validations": {
    "sdk": {
      "status": "success",
      "details": {
        "message": "SDK de Mercado Pago está instalado y funcionando"
      }
    },
    "environmentVariables": {
      "status": "success",
      "details": {
        "message": "Todas las variables de entorno están configuradas",
        "accessTokenType": "TEST",
        "publicKeyType": "VALID"
      }
    },
    // ... más validaciones
  },
  "errors": [
    "Error 1",
    "Error 2"
  ],
  "warnings": [
    "Advertencia 1"
  ],
  "recommendations": [
    "Recomendación 1"
  ]
}
```

---

## 🔍 Validaciones Específicas por Problema

### Problema: Botón Deshabilitado

**Validaciones relevantes**:
1. ✅ **Monto válido**: Debe ser >= $1
2. ✅ **Información del payer completa**: Email, nombre, apellido
3. ✅ **Credenciales correctas**: Token válido
4. ✅ **SDK funcionando**: SDK inicializado correctamente
5. ✅ **Métodos de pago**: Configurados correctamente

### Problema: No Aparecen Tarjetas

**Validaciones relevantes**:
1. ✅ **Credenciales de prueba**: Token debe ser de prueba
2. ✅ **Cuenta de comprador**: Debe usar cuenta de prueba del comprador
3. ✅ **Monto válido**: Debe ser un monto válido

### Problema: Error al Crear Preferencia

**Validaciones relevantes**:
1. ✅ **Variables de entorno**: Todas configuradas
2. ✅ **Credenciales del coach**: Coach debe estar configurado
3. ✅ **Token desencriptable**: Token debe poder desencriptarse
4. ✅ **Actividad válida**: Actividad debe existir y tener precio válido

---

## 🎯 Casos de Uso

### 1. Antes de Hacer una Compra

Usa el componente de validación para verificar que todo esté correcto antes de intentar hacer una compra:

```tsx
<ValidateCheckoutButton activityId={activityId} />
```

### 2. Debugging de Problemas

Si el botón está bloqueado, usa el endpoint para ver qué está fallando:

```typescript
const result = await validateCheckout(activityId);
console.log('Errores:', result.errors);
console.log('Advertencias:', result.warnings);
```

### 3. Verificación Automática

Puedes integrar la validación en tu flujo de compra para mostrar errores antes de intentar pagar.

---

## 📋 Checklist de Validaciones

Cuando uses el endpoint, verifica:

- [ ] **SDK**: ✅ Instalado y funcionando
- [ ] **Variables de entorno**: ✅ Todas configuradas
- [ ] **Autenticación**: ✅ Usuario autenticado
- [ ] **Actividad**: ✅ Válida y con precio correcto
- [ ] **Credenciales del coach**: ✅ Configuradas y válidas
- [ ] **Información del payer**: ✅ Completa
- [ ] **Métodos de pago**: ✅ Configurados
- [ ] **Token del marketplace**: ✅ Configurado
- [ ] **Configuración de preferencia**: ✅ Válida

---

## 🚀 Próximos Pasos

1. **Integrar el componente** en la página de compra
2. **Usar el endpoint** para debugging cuando haya problemas
3. **Revisar las recomendaciones** que devuelve el endpoint
4. **Corregir los errores** encontrados

---

## 📚 Referencias

- Endpoint: `app/api/mercadopago/validate-checkout/route.ts`
- Componente: `components/mercadopago/validate-checkout-button.tsx`
- Documentación de Mercado Pago: [Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)

---

**Última actualización**: Endpoint de validación completo creado

