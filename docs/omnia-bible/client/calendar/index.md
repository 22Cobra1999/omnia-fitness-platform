# 📅 Calendario (Calendar Screen)

Gestión de sesiones individuales (Meets), clases colectivas y recordatorios de actividades programadas.

## 📐 Esquema de la Pantalla

### [CALENDAR_VIEW] - Vista de Fechas
- **Calendario (CalendarView)**: Vista interactiva mes/semana.
- **Indicadores (Dots)**: Pequeños puntos debajo de los días que tienen sesiones programadas.
- **Acción**: Click en un día para filtrar el listado inferior.

### [SESSIONS_LIST] - Agenda del Día
- **Contenedor**: Lista vertical de las sesiones del día seleccionado.
- **Session Card**:
  - Hora de inicio y fin.
  - Título de la sesión (e.g., "Consulta Nutrición").
  - Avatar del Coach.
  - Botón `Unirse (Join)`: Solo activo 5 mins antes de la sesión.
  - Link a plataforma externa (Google Meet / Zoom).

---

## 📊 Datos y Tablas

### Sección: Calendario y Sesiones
- **Tabla**: `activity_sessions`
  - Variables: `start_time`, `end_time`, `session_title`, `coach_id`, `meeting_link`.
- **Tabla**: `activity_enrollments`
  - Lógica: Para filtrar sesiones que correspondan a actividades donde el cliente está inscrito.

### Sección: Créditos y Disponibilidad
- **Tabla**: `user_meet_credits` (o similar)
  - Variables: `remaining_credits`, `activity_id`.

---

## 🧩 Componentes Reutilizables

- **`CalendarView`**: Basado en `react-day-picker` o librería similar, con estilos personalizados para el ecosistema Omnia.
- **`SessionCard`**: Tarjeta informativa del turno, similar a la que ve el coach en su panel pero con acciones específicas para el cliente (Unirse).
