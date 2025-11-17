# 🚀 FLUJO DE INICIO DE ACTIVIDAD

## 📋 PROBLEMA RESUELTO

Cuando un cliente compra o accede a una actividad, el sistema debe:
1. **Mostrar modal de "Iniciar hoy" o "Esperar"**
2. **Generar todos los registros de `progreso_cliente`** basados en `planificacion_ejercicios`
3. **Ajustar la fecha de inicio al primer día con ejercicios** (no cualquier día)

---

## 🎯 ESCENARIOS DE INICIO

### **Escenario 1: Compra de Producto**
```
Cliente compra producto → Crea enrollment (sin start_date) → 
→ Crea registro en banco → NO se genera progreso_cliente aún
```

**Resultado**: El enrollment existe pero NO tiene `start_date`, por lo que NO hay `progreso_cliente`.

### **Escenario 2: Primera vez que accede a la actividad**
```
Cliente abre actividad → TodayScreen detecta enrollment sin start_date →
→ Muestra modal "Iniciar hoy" o "Esperar" →
→ Usuario selecciona → Actualiza start_date →
→ Llama a /api/activities/initialize-progress →
→ Genera TODOS los progreso_cliente
```

**Resultado**: Se crea el `progreso_cliente` para todos los días con ejercicios en la planificación.

---

## 🔧 COMPONENTES INVOLUCRADOS

### **1. TodayScreen.tsx** (Cliente accede a actividad)

**Lógica de detección:**
```typescript
// En loadProgramInfo() - línea ~1205
if (!enrollmentData.start_date) {
  // NO tiene start_date → Mostrar modal
  setShowStartInfoModal(true);
}
```

**Modal mostrado:**
```typescript
{showStartInfoModal && (
  <StartActivityInfoModal
    isOpen={showStartInfoModal}
    onClose={() => setShowStartInfoModal(false)}
    onStartToday={handleStartToday}
    onStartOnFirstDay={handleStartOnFirstDay}
    activityTitle={programInfo?.title || "Actividad"}
    firstDay={firstDayOfActivity}
    currentDay={getBuenosAiresDayName(new Date())}
  />
)}
```

### **2. StartActivityInfoModal.tsx** (Modal de selección)

**Opciones:**
- **"Iniciar hoy"**: Empieza inmediatamente, ajustando al próximo día con ejercicios
- **"Esperar al primer día"**: Espera hasta el primer día planificado de la semana (ej: lunes)

### **3. handleStartActivity()** (TodayScreen.tsx)

**Flujo:**
```typescript
const handleStartActivity = async (startDate?: Date) => {
  // 1. Actualizar start_date en activity_enrollments
  await supabase
    .from('activity_enrollments')
    .update({ start_date: startDateString })
    .eq('id', enrollment?.id)
    .eq('client_id', user.id);

  // 2. Inicializar progreso_cliente
  await fetch('/api/activities/initialize-progress', {
    method: 'POST',
    body: JSON.stringify({
      activityId: parseInt(activityId),
      clientId: user.id,
      startDate: startDateString
    })
  });

  // 3. Cerrar modal y recargar
  setShowStartInfoModal(false);
  // ...recargar datos
}
```

### **4. /api/activities/initialize-progress** (Generación de progreso)

**Lógica de ajuste de fecha:**
```typescript
// 1. Encontrar el primer día con ejercicios en semana 1
const primeraSemana = planificacion.find(p => p.numero_semana === 1)
let primerDiaConEjercicios = -1  // índice: 0=lunes, 1=martes, etc.

for (let i = 0; i < diasSemana.length; i++) {
  const dia = diasSemana[i]
  const ejerciciosDia = primeraSemana[dia]
  if (ejerciciosDia && ejerciciosDia !== '{}' && ejerciciosDia !== '') {
    primerDiaConEjercicios = i
    break
  }
}

// 2. Ajustar startDate al próximo día con ejercicios
const start = new Date(startDate)
const startDayOfWeek = start.getDay() // 0 = domingo, 1 = lunes, etc.
const targetDayOfWeek = primerDiaConEjercicios === 6 ? 0 : primerDiaConEjercicios + 1

let daysToAdd = targetDayOfWeek - startDayOfWeek
if (daysToAdd < 0) {
  daysToAdd += 7 // Siguiente semana
} else if (daysToAdd === 0 && primerDiaConEjercicios >= 0) {
  daysToAdd = 0 // Hoy es el día
}

start.setDate(start.getDate() + daysToAdd)
```

**Ejemplo:**
- **Planificación**: Semana 1 tiene ejercicios en **lunes**
- **Usuario inicia**: Sábado 18 de octubre de 2025
- **Opción "Iniciar hoy"**: Se ajusta al próximo lunes → **20 de octubre de 2025** ✅
- **Opción "Esperar al primer día"**: Se programa para el próximo lunes → **20 de octubre de 2025** ✅

**Cálculo:**
```typescript
// Hoy: Sábado 18/10 (índice 6)
// Target: Lunes (índice 1)
// Diferencia: 1 - 6 = -5
// Ajuste: -5 + 7 = 2 días
// Resultado: 18 + 2 = 20 de octubre ✅
```

**Generación de registros:**
```typescript
// Para cada período (3 períodos en este caso)
// Para cada semana en el ciclo (2 semanas en este caso)
// Para cada día con ejercicios
//   → Crear registro en progreso_cliente

for (let semanaAbsoluta = 1; semanaAbsoluta <= totalSemanas; semanaAbsoluta++) {
  const semanaEnCiclo = ((semanaAbsoluta - 1) % maxSemanasPlanificacion) + 1
  const planSemana = planificacion.find(p => p.numero_semana === semanaEnCiclo)
  
  const inicioSemana = new Date(start)
  inicioSemana.setDate(start.getDate() + ((semanaAbsoluta - 1) * 7))

  for (let diaSemana = 0; diaSemana < 7; diaSemana++) {
    const nombreDia = diasSemana[diaSemana]  // lunes, martes, etc.
    const ejerciciosDia = planSemana[nombreDia]

    if (ejerciciosDia && ejerciciosDia !== '{}') {
      // Extraer IDs de ejercicios
      const ejercicioIds = /* parsear JSON */

      // Calcular fecha exacta
      const fechaDia = new Date(inicioSemana)
      fechaDia.setDate(inicioSemana.getDate() + diaSemana)

      // Crear registro
      registrosACrear.push({
        actividad_id: activityId,
        cliente_id: clientId,
        fecha: fechaDia.toISOString().split('T')[0],
        ejercicios_completados: [],
        ejercicios_pendientes: ejercicioIds,
        detalles_series: {},
        minutos_json: {},
        calorias_json: {}
      })
    }
  }
}
```

---

## 📊 EJEMPLO COMPLETO

### **Datos de Entrada:**

**Actividad 78**: "Pliométricos de Ronaldinho"

**planificacion_ejercicios:**
| semana | lunes | martes | miercoles | jueves | viernes | sabado | domingo |
|--------|-------|--------|-----------|--------|---------|--------|---------|
| 1 | 4 ejercicios | - | - | - | - | - | - |
| 2 | - | - | 2 ejercicios | 2 ejercicios | - | - | - |

**periodos:**
- `cantidad_periodos`: 3

**Usuario inicia:** Sábado 18 de octubre de 2025

### **Cálculo:**

1. **Primer día con ejercicios**: Lunes (semana 1)
2. **Fecha ajustada**: Lunes 20 de octubre de 2025
3. **Total de semanas**: 2 semanas × 3 períodos = 6 semanas
4. **Días con ejercicios por ciclo**: 3 días (lunes sem1, miércoles sem2, jueves sem2)
5. **Total registros**: 3 días × 3 períodos = 9 registros

### **Registros generados:**

**Start Date**: Lunes 20 de octubre de 2025

| Fecha | Día | Semana Absoluta | Semana Ciclo | Ejercicios |
|-------|-----|-----------------|--------------|------------|
| 2025-10-20 | lunes | 1 | 1 | 4 |
| 2025-10-29 | miércoles | 2 | 2 | 2 |
| 2025-10-30 | jueves | 2 | 2 | 2 |
| 2025-11-03 | lunes | 3 | 1 | 4 |
| 2025-11-12 | miércoles | 4 | 2 | 2 |
| 2025-11-13 | jueves | 4 | 2 | 2 |
| 2025-11-17 | lunes | 5 | 1 | 4 |
| 2025-11-26 | miércoles | 6 | 2 | 2 |
| 2025-11-27 | jueves | 6 | 2 | 2 |

✅ **Total: 9 registros** (3 días/ciclo × 3 períodos)

---

## 🔄 FLUJO VISUAL

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENTE COMPRA PRODUCTO                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ activity_enrollments │
              │  start_date: NULL    │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Cliente abre       │
              │   "Activity" tab     │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   TodayScreen.tsx    │
              │  detecta sin start   │
              └──────────┬───────────┘
                         │
                         ▼
      ┌──────────────────────────────────────────────┐
      │      StartActivityInfoModal.tsx              │
      │                                              │
      │  [Iniciar hoy]    [Esperar al primer día]  │
      └────┬──────────────────────────┬──────────────┘
           │                          │
           ▼                          ▼
    handleStartToday()        handleStartOnFirstDay()
           │                          │
           └──────────┬───────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │ handleStartActivity()│
           └──────────┬───────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────┐    ┌──────────────────────────────┐
│ Actualiza     │    │ /api/activities/             │
│ start_date en │    │  initialize-progress         │
│ enrollments   │    │                              │
└───────────────┘    │ 1. Encuentra primer día      │
                     │ 2. Ajusta fecha a lunes      │
                     │ 3. Genera progreso_cliente   │
                     │    para todos los períodos   │
                     └──────────────────────────────┘
```

---

## ✅ RESULTADO FINAL

### **Antes** (❌ Incorrecto):
```
Compra sábado 18/10 → Genera progreso desde domingo 19/10
```

### **Ahora** (✅ Correcto):
```
Compra sábado 18/10 → 
Modal "Iniciar hoy/Esperar" → 
Usuario elige → 
Genera progreso desde lunes 20/10 (primer día con ejercicios)
```

---

## 🎯 VENTAJAS DEL NUEVO FLUJO

1. ✅ **Flexibilidad**: El usuario decide cuándo empezar
2. ✅ **Precisión**: Siempre empieza en el primer día correcto
3. ✅ **UX mejorado**: Modal claro con opciones
4. ✅ **Consistencia**: Mismo flujo para compra directa y desde search
5. ✅ **Escalabilidad**: Funciona con cualquier planificación

---

## 📝 NOTAS TÉCNICAS

### **Días de la semana:**
- **JavaScript**: 0=domingo, 1=lunes, 2=martes, ..., 6=sábado
- **Nuestro mapeo**: 0=lunes, 1=martes, ..., 6=domingo
- **Conversión**: `targetDayOfWeek = primerDiaConEjercicios === 6 ? 0 : primerDiaConEjercicios + 1`

### **Validación de ejercicios:**
```typescript
if (ejerciciosDia && ejerciciosDia !== '{}' && ejerciciosDia !== '' && ejerciciosDia !== '""')
```

### **Estructura de ejercicios en planificación:**
```json
{
  "1": [{"id": 1042, "orden": 1, "bloque": 1}],
  "2": [{"id": 1043, "orden": 2, "bloque": 2}]
}
```

