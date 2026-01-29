# 📅 Calendario (Coach)

El calendario es el centro de gestión de tiempo y citas del coach.

## 📡 Flujo de Datos y Generación Automática (eMeet)
El calendario no solo muestra disponibilidad, sino que **genera sesiones automáticamente** mediante triggers en la base de datos:

1.  **Gatillo 1 (Talleres)**: Cuando un cliente confirma asistencia o se inscribe (`ejecuciones_taller`), el trigger `trigger_sync_calendar_on_ejecucion` crea el evento en `calendar_events`.
2.  **Gatillo 2 (Consultas)**: Al agendar una consulta en `activity_schedules`, el trigger `trigger_sync_calendar_on_schedule` sincroniza el calendario.
3.  **Integración Google Meet**: La tabla `google_meet_links` se vincula al evento para trackear el link oficial y la asistencia (coach vs cliente).

## 📊 Tablas y Triggers Clave
*   **`calendar_events`**: Tabla central de visualización.
*   **`google_meet_links`**: Almacena los links de videollamada y logs de asistencia.
*   **`trigger_sync_calendar_*`**: Funciones PL/pgSQL que automatizan la consistencia.

> [!TIP]
> Puedes consultar los triggers activos y su lógica detallada en [queries.sql](queries.sql).
