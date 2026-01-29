# 👥 Gestión de Clientes (Coach)

Esta sección explica cómo se consultan y visualizan los clientes desde el panel del coach.

## 📡 Flujo de Consulta
Cuando un coach entra en la pestaña **Clients**, el sistema realiza los siguientes pasos:

1.  **Listado General**: Se consultan todos los clientes asociados al `coach_id` del coach autenticado.
2.  **Detalle de Cliente**: Al hacer clic en un cliente, se abre una vista detallada que contiene varias sub-pestañas:
    *   **Progreso**: Resumen visual de la evolución del cliente.
    *   **Actividades**: Listado de inscripciones actuales y pasadas.
    *   **To Do**: Tareas diarias pendientes y completadas.
    *   **Ingresos**: Registro de pagos y suscripciones.

## 📊 Consulta de Progreso de Actividades
Para mostrar el nivel de cumplimiento del cliente en sus actividades (Programas, Talleres o Documentos), se utiliza una query compleja que calcula:

*   **Días completados, en curso y ausentes**: Basado en `progreso_diario_actividad`.
*   **Items pasados y próximos**: Diferenciando entre ítems logrados, deuda (atrasados) y pendientes.
*   **Porcentaje de progreso total**: Calculado dinámicamente según el tipo de actividad.

> [!NOTE]
> La query completa y optimizada se encuentra en [queries.sql](queries.sql).
