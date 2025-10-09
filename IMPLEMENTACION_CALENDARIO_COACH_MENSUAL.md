# 📅 Implementación de Calendario Mensual para Coach

## 🎯 **Objetivo**

Implementar un calendario mensual para el coach que funcione igual que el del cliente, mostrando las actividades agendadas con sus horarios y permitiendo ver detalles al hacer clic en un día.

## 🔧 **Componentes Creados**

### 1. **CoachCalendarMonthly** (`components/coach/coach-calendar-monthly.tsx`)

**Funcionalidades:**
- **Calendario mensual** con navegación por meses
- **Indicadores visuales** en días con actividades agendadas
- **Vista detallada** al hacer clic en un día
- **Estadísticas del mes** (actividades, horarios, inscritos)
- **Integración con Supabase** para datos reales

### 2. **Modificación de CoachCalendarView**

**Cambios realizados:**
- **Vista por defecto** cambiada de "agenda" a "month"
- **Integración** del nuevo componente `CoachCalendarMonthly`
- **Función de navegación** para actividades

## 📊 **Estructura de Datos**

### **DayActivities Interface:**
```typescript
interface DayActivities {
  fecha: string;
  actividades: Array<{
    activity_id: string;
    actividad_nombre: string;
    tipo: string;
    horarios: Array<{
      hora_inicio: string;
      hora_fin: string;
      cupo: number;
      inscritos?: number;
    }>;
    total_horarios: number;
    total_inscritos: number;
  }>;
}
```

## 🔄 **Flujo de Datos**

### **1. Carga de Actividades:**
```typescript
// 1. Obtener actividades del coach
const { data: activities } = await supabase
  .from('activities')
  .select('id, title, type')
  .eq('coach_id', user.id)
  .eq('status', 'active')

// 2. Obtener detalles de talleres
const { data: tallerDetalles } = await supabase
  .from('taller_detalles')
  .select('*')
  .in('actividad_id', activityIds)

// 3. Obtener enrollments para calcular inscripciones
const { data: enrollments } = await supabase
  .from('activity_enrollments')
  .select('activity_id, status')
  .in('activity_id', activityIds)
  .eq('status', 'activa')
```

### **2. Procesamiento de Horarios:**
- **Horarios originales**: `taller.originales.fechas_horarios`
- **Horarios secundarios**: `taller.secundarios.fechas_horarios`
- **Agrupación por fecha** y actividad
- **Cálculo de inscripciones** por horario

### **3. Visualización:**
- **Días con actividades** marcados en naranja
- **Contador de actividades** por día
- **Lista detallada** al hacer clic en un día
- **Horarios específicos** con cupos e inscripciones

## 🎨 **Interfaz de Usuario**

### **Calendario Principal:**
```jsx
// Días del mes con indicadores
{days.map((day) => {
  const activityCount = getDayActivityCount(day.date)
  const hasActivities = activityCount > 0
  
  return (
    <div
      onClick={() => hasActivities && handleDayClick(day.date)}
      style={{
        background: hasActivities ? '#FF7939' : 'transparent',
        cursor: hasActivities ? 'pointer' : 'default'
      }}
    >
      <span>{day.dayNumber}</span>
      {hasActivities && (
        <span>{activityCount}</span>
      )}
    </div>
  )
})}
```

### **Vista Detallada del Día:**
```jsx
// Lista de actividades del día seleccionado
{dayData.actividades.map((actividad) => (
  <div onClick={() => handleActivityClick(actividad.activity_id)}>
    <h3>{actividad.actividad_nombre}</h3>
    <div>{actividad.tipo}</div>
    
    // Lista de horarios
    {actividad.horarios.map((horario) => (
      <div>
        {horario.hora_inicio} - {horario.hora_fin}
        {horario.inscritos}/{horario.cupo} inscritos
      </div>
    ))}
  </div>
))}
```

## 📈 **Estadísticas del Mes**

### **Contadores:**
- **Total de actividades**: Actividades activas del coach
- **Total de horarios**: Suma de todos los horarios programados
- **Total de inscritos**: Suma de todos los inscritos

### **Indicadores Visuales:**
```jsx
<div style={{ background: '#FF7939' }}>
  Actividades ({dayCounts.total_actividades})
</div>
<div style={{ background: '#FFC933' }}>
  Horarios ({dayCounts.total_horarios})
</div>
<div style={{ background: '#00C851' }}>
  Inscritos ({dayCounts.total_inscritos})
</div>
```

## 🔄 **Navegación y Interacción**

### **1. Navegación del Calendario:**
- **Botones anterior/siguiente** para cambiar mes
- **Header con mes y año** actual
- **Navegación automática** al hacer clic en días

### **2. Interacción con Actividades:**
```typescript
const handleActivityClick = (activityId: string) => {
  // Guardar en localStorage para navegación
  localStorage.setItem('selectedActivityFromCalendar', activityId)
  
  // Navegar a vista de detalles (implementar según necesidad)
  // router.push(`/activity/${activityId}`)
}
```

### **3. Selección de Días:**
- **Clic en día con actividades** → Mostrar vista detallada
- **Clic en día sin actividades** → No hacer nada
- **Botón cerrar** en vista detallada → Volver al calendario

## 🎯 **Características Principales**

### **✅ Implementado:**
1. **Calendario mensual** con navegación
2. **Indicadores visuales** para días con actividades
3. **Vista detallada** de actividades por día
4. **Lista de horarios** con cupos e inscripciones
5. **Estadísticas del mes** en tiempo real
6. **Integración con Supabase** para datos reales
7. **Diseño responsivo** para iPhone 12 Pro
8. **Navegación entre componentes**

### **🎨 Diseño:**
- **Tema oscuro** consistente con la app
- **Colores OMNIA** (naranja #FF7939)
- **Gradientes** y efectos visuales
- **Tipografía** clara y legible
- **Animaciones** suaves en hover

## 📱 **Optimización Mobile**

### **Características para iPhone 12 Pro:**
- **Scroll optimizado** para pantalla táctil
- **Botones de tamaño adecuado** para dedos
- **Espaciado apropiado** entre elementos
- **Vista compacta** de información
- **Navegación intuitiva**

## 🔧 **Integración con Sistema Existente**

### **1. CoachCalendarView:**
- **Vista por defecto** cambiada a "month"
- **Componente integrado** `CoachCalendarMonthly`
- **Mantiene compatibilidad** con otras vistas

### **2. Datos en Tiempo Real:**
- **Consulta a Supabase** en cada cambio de mes
- **Datos actualizados** automáticamente
- **Manejo de estados** de carga

### **3. Navegación:**
- **localStorage** para comunicación entre componentes
- **Preparado para routing** futuro
- **Manejo de eventos** de clic

## 🚀 **Resultado Final**

El coach ahora tiene un **calendario mensual completo** que:

1. **Muestra todas sus actividades** agendadas por mes
2. **Permite ver detalles** al hacer clic en cualquier día
3. **Lista horarios específicos** con cupos e inscripciones
4. **Proporciona estadísticas** del mes actual
5. **Funciona igual que el calendario del cliente** pero adaptado para coaches
6. **Está optimizado para iPhone 12 Pro**

---

**¡El calendario del coach ahora es completamente funcional y visualmente atractivo!** 🎉


