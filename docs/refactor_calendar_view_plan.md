
# Plan de Refactorización: CalendarView.tsx (El Leviatán del Cliente)

## Objetivo
Reducir la complejidad de `CalendarView.tsx` (~4000 líneas) transformándolo en un orquestador limpio de Hooks y Componentes, **sin alterar la UI ni la lógica de negocio existente**.

## Estrategia: "Divide y Vencerás" (Safe Refactoring)

### Fase 1: Extracción de Lógica (Hooks)
Moveremos la lógica de estado y fetching a hooks personalizados.

1.  **`useCalendarData`**
    *   **Responsabilidad**: Cargar minutos de actividad, breakdown del día y datos generales del calendario.
    *   **Funciones a mover**: `loadDayMinutes`, `loadSelectedDayBreakdown`, `loadAllActivityInfo`.
    *   **Estado**: `currentDate`, `selectedDate`, `dayMinutes`, `dayBreakdown`.

2.  **`useMeetLogic`**
    *   **Responsabilidad**: Gestionar la lógica de eMeets, créditos y reprogramaciones.
    *   **Funciones a mover**: `loadMeetCredits`, `loadPendingReschedule`, `fetchParticipants`, `openMeetById`.
    *   **Estado**: `meetCredits`, `pendingReschedules`, `selectedMeet`.

3.  **`useCoachAvailability`**
    *   **Responsabilidad**: Calcular slots disponibles y gestionar la selección de coach.
    *   **Funciones a mover**: `loadCoachAvailability`, `getSlotsForDate`, `loadBookedSlots`.
    *   **Estado**: `coachAvailability`, `bookedSlots`.

### Fase 2: Modularización de UI (Componentes)
Fragmentaremos el renderizado gigante en componentes manejables.

1.  **`CalendarHeader`**
    *   Navegación de mes, estadísticas de resumen y botón "Hoy".
2.  **`CalendarGrid`**
    *   La grilla de días del mes, celdas de días y lógica de selección visual.
3.  **`DayDetailModal`**
    *   El modal inferior que muestra el detalle de Actividad, Nutrición y Descanso del día seleccionado.
4.  **`MeetBookingFlow`**
    *   El wizard para seleccionar coach y horario de una nueva meet.

### Fase 3: Integración
`CalendarView.tsx` pasará de 4000 líneas a ~400 líneas, actuando solo como el "pegamento" entre estos módulos.

## Estructura de Archivos Propuesta

```
components/calendar/
├── CalendarView.tsx (Orquestador principal)
├── hooks/
│   ├── useCalendarData.ts
│   ├── useMeetLogic.ts
│   └── useCoachAvailability.ts
└── components/
    ├── CalendarHeader.tsx
    ├── CalendarGrid.tsx
    ├── DayDetailModal.tsx
    └── MeetBookingFlow.tsx
```

## Beneficios
1.  **Mantenibilidad**: Archivos más pequeños y fáciles de entender.
2.  **Performance**: Menos re-renders innecesarios al separar contextos.
3.  **Escalabilidad**: Más fácil agregar nuevas features (como el nuevo flujo de invitación) sin romper todo.
4.  **Seguridad**: Menos riesgo de "efecto mariposa" (tocar algo aquí y romper algo allá).

---
**¿Procedemos con la Fase 1 (Creación de Hooks)?**
