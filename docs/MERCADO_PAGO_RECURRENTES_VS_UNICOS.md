# Pagos Recurrentes vs Pagos Únicos en Mercado Pago

## 🔄 ¿Qué es un Pago Recurrente?

### Pago Único (No Recurrente)
- Cliente paga **una sola vez**
- Ejemplo: Compra de "Pliométricos de Ronaldinho" por $10,000 ARS
- El cliente paga una vez y tiene acceso permanente (o por el tiempo definido)

### Pago Recurrente (Suscripción)
- Cliente paga **automáticamente cada cierto tiempo**
- Ejemplo: Suscripción mensual de $5,000 ARS/mes
- El cliente paga automáticamente cada mes sin intervención
- Se renueva automáticamente hasta que el cliente cancele

---

## 📊 Ejemplos para OMNIA

### Escenario 1: Pago Único (Actual)
```
Cliente compra: "Pliométricos de Ronaldinho"
Precio: $10,000 ARS (pago único)
Acceso: Permanente o por X días
```

**Flujo**:
1. Cliente paga $10,000 una vez
2. Recibe acceso a la actividad
3. No hay más pagos

### Escenario 2: Pago Recurrente (Futuro)
```
Cliente se suscribe: "Coaching Mensual con Coach X"
Precio: $5,000 ARS/mes (pago recurrente)
Acceso: Renovación mensual automática
```

**Flujo**:
1. Cliente paga $5,000 el primer mes
2. Recibe acceso por 30 días
3. Al día 30, Mercado Pago cobra automáticamente otros $5,000
4. Cliente recibe acceso por otros 30 días
5. Se repite cada mes hasta que el cliente cancele

---

## 💰 ¿Cambia el Precio/Comisión?

### ✅ **NO, el precio NO cambia**

- **Comisiones de Mercado Pago**: Son las mismas para pagos únicos y recurrentes
- **Split Payment**: Funciona igual en ambos casos
- **Comisión de OMNIA**: La misma (ej: 15%)

**Ejemplo**:
- Pago único de $10,000 → OMNIA recibe $1,500 (15%)
- Pago recurrente de $10,000/mes → OMNIA recibe $1,500 cada mes (15%)

---

## 🎯 ¿Cuándo Usar Cada Uno?

### Usa **Pago Único** (Checkout Pro o Bricks) si:
- ✅ Vendes actividades/programas con acceso permanente
- ✅ El cliente paga una vez y tiene acceso por tiempo limitado (ej: 30 días)
- ✅ No necesitas cobros automáticos

**Ejemplo OMNIA actual**:
- "Pliométricos de Ronaldinho" - $10,000 (pago único)
- "Programa de Fuerza" - $8,000 (pago único)

### Usa **Pago Recurrente** (Suscripciones) si:
- ✅ Ofreces membresías mensuales/anuales
- ✅ Coaching continuo con renovación automática
- ✅ El cliente necesita pagar periódicamente

**Ejemplo futuro OMNIA**:
- "Coaching Mensual Premium" - $5,000/mes (recurrente)
- "Acceso Ilimitado Anual" - $50,000/año (recurrente)

---

## 🔧 Implementación en OMNIA

### Estado Actual
- ✅ OMNIA vende actividades con **pago único**
- ✅ Campo `is_subscription` existe en `activity_enrollments` pero no se usa activamente
- ✅ No hay funcionalidad de suscripciones implementada

### Recomendación
**Para empezar**: Usa **Bricks con pagos únicos**

**Razones**:
1. ✅ Cubre el 100% de tus casos actuales
2. ✅ Bricks soporta pagos recurrentes si los necesitas después
3. ✅ No necesitas cambiar nada más adelante
4. ✅ Misma comisión, mismo split payment

**Si en el futuro quieres suscripciones**:
- Bricks ya lo soporta
- Solo necesitas activar la funcionalidad
- No necesitas cambiar de checkout

---

## 📋 Resumen

| Aspecto | Pago Único | Pago Recurrente |
|---------|-----------|-----------------|
| **Frecuencia** | Una vez | Automático cada X tiempo |
| **Precio** | ❌ No cambia | ❌ No cambia |
| **Comisión MP** | ❌ No cambia | ❌ No cambia |
| **Comisión OMNIA** | ❌ No cambia | ❌ No cambia |
| **Split Payment** | ✅ Funciona | ✅ Funciona |
| **Bricks** | ✅ Soporta | ✅ Soporta |
| **OMNIA actual** | ✅ Usa esto | ❌ No usa aún |

---

## 🎯 Conclusión

**Para OMNIA**:
1. ✅ Selecciona **Bricks** (Checkout API)
2. ✅ Empieza con **pagos únicos** (lo que ya tienes)
3. ✅ Si en el futuro necesitas suscripciones, Bricks ya lo soporta
4. ✅ **El precio NO cambia** entre opciones

**Bricks es la mejor opción porque**:
- ✅ Funciona para pagos únicos (tu caso actual)
- ✅ Funciona para pagos recurrentes (futuro)
- ✅ No necesitas cambiar nada más adelante
- ✅ Misma comisión en ambos casos









