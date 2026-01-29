# 📱 Aplicación del Cliente

Documentación sobre la experiencia del usuario final (Cliente).

## 🏃 Mis Actividades
Pestaña central donde el cliente consume sus productos adquiridos.

*   **Programas/Talleres**: Visualización de rutinas diarias y registro de progreso.
*   **Documentos**: Acceso a PDFs y material de lectura.

## 🔍 Explorar / Marketplace
Flujo para descubrir y comprar nuevos servicios.

1.  **Búsqueda**: Filtros por categoría, precio y valoración de coach.
2.  **Checkout**: Integración con pasarelas de pago (Mercado Pago).
3.  **Inscripción**: Generación automática de `activity_enrollments` tras el pago exitoso.

> [!NOTE]
> El progreso del cliente se persiste en `progreso_diario_actividad`, lo cual alimenta los dashboards del coach.
