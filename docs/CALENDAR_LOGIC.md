# Documentación de Lógica y Flujos del Calendario (Omnia Fitness)

Este documento detalla el funcionamiento, lógicas de negocio y flujos de usuario para el módulo de Calendario, tanto para el perfil **Coach** como para el perfil **Cliente**.

---

## 1. Visión General

El módulo de calendario permite la gestión de encuentros (Meets) y el seguimiento de actividades diarias. Actúa como el centro de coordinación entre el Coach y sus Clientes.

**Componentes Clave UI:**
- `CalendarMonthGrid`: Vista mensual principal.
- `CalendarDayDetail`: Lista de actividades del día seleccionado (bajo el calendario).
- `MeetNotificationsModal`: Centro de notificaciones para invitaciones y cambios de estado.

---

## 2. Perfil Coach

### A. Gestión de Disponibilidad
- **Flujo**: El Coach define sus bloques horarios disponibles para que los clientes puedan agendar.
- **Lógica**:
  - Los bloques se guardan en `coach_availability`.
  - Se visualizan como franjas horarias en la vista de configuración.

### B. Visualización de Meets
- **Vista**: Calendario Mensual.
- **Indicadores**:
  - Puntos/Iconos en los días con meets programadas.
  - Al hacer click en un día, se despliega `CalendarDayDetail` con la lista de meets.
- **Estados de Meet**:
  - `pending`: Solicitud recibida (amarillo).
  - `confirmed`: Meet confirmada (naranja/botón "Unirse").
  - `cancelled/declined`: Cancelada o rechazada (rojo).

### C. Notificaciones (Coach)
- **Activación**: Icono de campana en el header.
- **Lógica de Filtrado**:
  - Solo se muestran eventos **Futuros** o que están ocurriendo en el momento (`end_time >= now`).
  - Se excluyen eventos pasados, incluso si están pendientes.
- **Tipos de Notificación**:
  - **Solicitud de Meet**: "Cliente X solicitó una meet". Botones: [Aceptar] [Rechazar].
  - **Confirmación**: "Cliente X aceptó la invitación".
  - **Cancelación**: "Cliente X canceló la meet".
  - **Reprogramación**: Solicitudes de cambio de horario.

---

## 3. Perfil Cliente

### A. Agendamiento (Booking)
- **Flujo**:
  1. Cliente navega al perfil del Coach o sección de "Agendar".
  2. Selecciona un día disponible.
  3. Selecciona un bloque horario.
  4. Confirma la solicitud.
- **Resultado**: Se crea un evento con `rsvp_status: pending`.

### B. Visualización de Agenda
- **Vista**: Calendario Mensual (pestaña principal).
- **Detalle del Día (`CalendarDayDetail`)**:
  - Muestra lista de Meets y Tareas (Ejercicios/Nutrición).
  - **Badges de Estado** (ubicados a la derecha):
    - `PENDIENTE` (Pill amarillo).
    - `CONFIRMADA` (Pill naranja con icono de video).
    - `CANCELADA` / `RECHAZADA` (Pill rojo).
  - **Botón "Unirse"**:
    - Solo visible si: Es HOY + Estado CONFIRMADA + Hora actual es cercana al inicio.

### C. Notificaciones (Cliente)
- **Lógica de Texto ("Solicitaste" vs "Te invitaron")**:
  - El sistema verifica quién inició la invitación (`invited_by_user_id`).
  - Si `invited_by_user_id == mi_id` -> Texto: "Solicitaste una meet a Coach". (Sin botones de acción, estado informativo).
  - Si `invited_by_user_id != mi_id` (o es null/coach) -> Texto: "Coach te invitó a una meet". (Con botones [Aceptar] [Rechazar]).
- **Reglas de Negocio**:
  - Un cliente NO puede aceptar/rechazar su propia solicitud.
  - Solo se muestran notificaciones de eventos futuros.

---

## 4. Detalles Técnicos

### Estados de RSVP (`rsvp_status`)
| Estado | Descripción | Visualización |
| :--- | :--- | :--- |
| `pending` | Invitación enviada, esperando respuesta. | Badge Amarillo `PENDIENTE` |
| `confirmed` | Aceptada por ambas partes. | Badge Naranja `CONFIRMADA` |
| `declined` | Rechazada por el invitado. | Badge Rojo `RECHAZADA` |
| `cancelled` | Evento cancelado (global). | Badge Rojo `CANCELADA` |

### Lógica de Filtrado de Notificaciones
```typescript
// Ubicación: components/shared/meet-notifications-modal.tsx

// Se filtran estrictamente eventos pasados
const now = new Date()
const eventEnd = ev.end_time ? new Date(ev.end_time) : new Date(ev.start_time)

if (eventEnd < now) {
  return // No mostrar, es pasado
}
// Solo pasan eventos futuros u ongoing
```

### Componente `CalendarDayDetail`
- Renderiza la lista debajo del calendario.
- Responsable de mostrar los "Pills" de estado.
- Lógica de estilos:
  - `CONFIRMADA`: `rounded-full border-[#FF7939]/30 bg-[#FF7939]/10 text-[#FFB366]`.
  - `PENDIENTE/CANCELADA`: Estilos homologados a `CONFIRMADA` (Rounded full, padding consistente).
  - Layout: Flexbox con `ml-auto` para empujar el estado a la derecha.

## 5. Mejoras de UX y Edición

### A. Visualización de Meets en Detalle (`CalendarDayDetail`)
- **Objetivo**: Clarificar de un vistazo si la meet es grupal o individual y con quién es.
- **Lógica de Iconos**:
  - **Grupal**: Si el evento es tipo `workshop` o tiene > 2 participantes -> Icono de `Users` (Grupo).
  - **1:1**: Si tiene <= 2 participantes y no es workshop -> Etiqueta "1:1".
- **Visualización de Participantes**:
  - En meets 1:1, se intenta mostrar el nombre de la "otra parte":
    - Si soy Coach -> Muestra el nombre del Cliente.
    - Si soy Cliente -> Muestra el nombre del Coach.
    - Formato: `HH:mm - HH:mm - [Nombre]`

### B. Edición y Reprogramación de Meets
- **Modal de Edición (`MeetCreateEditModal`)**:
  - **Protección de Datos**:
    - **Título**: Bloqueado en modo edición (`readOnly`) para evitar cambios accidentales en la temática acordada.
    - **Notas**: Se visualizan las notas originales como "Solo Lectura".
    - **Nuevas Notas**: Se provee un campo separado para "Agregar Nueva Nota".
  - **Lógica de Guardado**:
    - Al guardar, el sistema **concatena** la nota nueva a las notas originales, separadas por un salto de línea.
    - Esto asegura que el historial de notas se mantenga y no se sobrescriba información vital anterior.

