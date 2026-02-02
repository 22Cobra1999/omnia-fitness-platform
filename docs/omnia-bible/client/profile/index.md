# 👤 Perfil del Cliente (Profile Screen)

Esta sección permite al cliente gestionar su información personal, biometría, objetivos y ver su historial de actividad.

## 📐 Esquema de la Pantalla

### [HEADER] - Información de Usuario
- **Avatar**: Imagen de perfil circular con botón de edición rápida (Capa superior en modo edición).
- **Acciones Rápidas**:
  - `Botón Cuestionario (BookOpen)`: Acceso al Onboarding Modal.
  - `Botón Edición (Edit3/X)`: Alterna entre visualización y edición inline del perfil.
- **Información Principal**:
  - `Nombre`: Campo de texto editable.
  - `Ubicación (MapPin)`: Campo de texto editable.
  - `Edad`: Calculada dinámicamente desde la fecha de nacimiento.
  - `Fecha de Nacimiento`: Campo de fecha (solo visible en modo edición).

### [ACTIVITY_STATS] - Dashboard de Actividad
- **Filtro de Disciplina**: Selector Fitness / Nutrición.
- **Anillos de Actividad (DailyActivityRings)**:
  - Anillo Kcal (Naranja).
  - Anillo Minutos/Sesiones (Naranja claro).
  - Anillo Ejercicios/Platos (Blanco).
- **Selector Semanal**: Navegación por fechas.

### [BIOMETRICS_SECTION] - Biometría
- **Título**: "Biometría" con botón (+) para añadir nueva medición.
- **Carrusel Horizontal**: Cards compactos que muestran:
  - Nombre de la métrica (Peso, Altura, % Grasa, etc.).
  - Valor actual y unidad.
  - Tendencia (Flecha arriba/abajo y diferencia numérica).
  - Fecha de última actualización.

### [PERFORMANCE_GOALS] - Metas de Rendimiento
- **Título**: "Metas de Rendimiento" con botón (+) para añadir ejercicio rápido.
- **Acción**: Botón "Editar" (lápiz) que activa el modo edición de la lista.
- **Lista de Seguimiento (ExerciseProgressList)**:
  - Título del ejercicio.
  - Valor actual (editable).
  - Objetivo (editable).
  - Unidad (Peso, Repeticiones, Tiempo).

### [INJURIES_SECTION] - Lesiones
- **Título**: "Lesiones" con botón (+) para registrar nueva lesión.
- **Lista**: Cards indicando nombre de la lesión y nivel de severidad (Baja/Media/Alta).

### [PURCHASES_SECTION] - Compras Recientes
- **Lista (RecentPurchasesList)**: Historial de productos adquiridos con fecha, importe e icono según tipo de actividad.

---

## 📊 Datos y Tablas

### Sección: Perfil y Cabecera
- **Tabla**: `user_profiles`
  - Variables: `full_name`, `location`, `avatar_url`, `level` (role).
- **Tabla**: `clients`
  - Variables: `birth_date`.

### Sección: Biometría
- **Tabla**: `user_biometrics`
  - Variables: `name`, `value`, `unit`, `notes`, `created_at`.
- **Lógica**: Se agrupan por `name` y se muestra el registro más reciente como valor actual.

### Sección: Metas de Rendimiento
- **Tabla**: `user_exercise_objectives` (Principal)
  - Variables: `exercise_title`, `unit`, `current_value`, `objective`.
- **Tabla**: `user_exercise_progress` (Fallback/Historial)
  - Variables: `exercise_title`, `value_1` (current), `date_1`.

### Sección: Lesiones
- **Tabla**: `user_injuries`
  - Variables: `name`, `severity` (low, medium, high), `notes`.

### Sección: Compras
- **Tabla**: `activity_enrollments` JOIN `activities`
  - Variables: `activities.title`, `activity_enrollments.created_at`, `activity_enrollments.amount_paid`.
- **Tabla**: `banco` (Opcional para auditoría)
  - Variables: `monto`, `created_at`.

---

## 🧩 Componentes Reutilizables

- **`ExerciseProgressList`**: Se utiliza tanto en el perfil del cliente como en la vista que el coach tiene de su cliente para mantener coherencia en la edición de objetivos.
- **`DailyActivityRings`**: Componente visual para métricas diarias, compartido con otros módulos de seguimiento.
- **`RecentPurchasesList`**: Muestra el historial de transacciones, alineado con el sistema de pagos globales.
