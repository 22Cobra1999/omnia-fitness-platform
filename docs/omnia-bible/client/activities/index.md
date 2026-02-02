# 🏃 Mis Actividades (Activity Screen)

Pestaña central donde el cliente gestiona y consume los productos que ha adquirido (Programas, Talleres, Consultas, etc.).

## 📐 Esquema de la Pantalla

### [FILTER_TABS] - Filtros de Estado
- **Tabs superiores**: 
  - `En curso`: Actividades con progreso pendiente o activas.
  - `Por empezar`: Inscripciones nuevas sin registros de progreso.
  - `Finalizadas`: Actividades marcadas como 100% completas o expiradas.

### [ACTIVITY_LIST] - Listado de Productos
- **Contenedor**: scroll vertical de cards.
- **Activity Card (PurchasedActivityCard)**:
  - Imagen de la actividad (miniatura).
  - Título y Categoría/Modalidad.
  - **Barra de Progreso**: Visualización del % completado (e.g., "75%").
  - **Status Badge**: Indica "En curso", "Pendiente" o "Completado".
  - **Action Arrow**: Flecha naranja para entrar al detalle.

### [QUICK_ACCESS] - Acceso Directo (Opcional)
- Acceso a archivos/PDFs si la actividad es de tipo "Documento".

---

## 📊 Datos y Tablas

### Sección: Listado de Actividades
- **Tabla**: `activity_enrollments`
  - Variables: `status` (active, completed), `progress_percentage`.
- **Tabla**: `activities` (Vía JOIN)
  - Variables: `title`, `type` (fitness, nutricion), `modality` (taller, programa, consulta), `image_url`.

### Sección: Seguimiento de Progreso
- **Tabla**: `user_activity_progress` (o similar)
  - Variables: `completed_steps`, `total_steps`, `last_accessed_at`.

---

## 🧩 Componentes Reutilizables

- **`PurchasedActivityCard`**: Es el componente estándar para representar una actividad ya comprada. Se usa en:
  - `ActivityScreen` (esta ventana).
  - `ClientsScreen` (vista del coach sobre las actividades de su cliente).
  - `ExploreScreen` (versión simplificada para "Continuar viendo").
- **`StatusBadge`**: Componente de feedback visual que indica el estado actual de la inscripción.
