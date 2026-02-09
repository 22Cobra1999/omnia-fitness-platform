# 🎯 Plan de Evolución: Gestión de Productos (Coach) - V2

Este documento define la hoja de ruta para la refactorización profunda y optimización UX de la pestaña de "Products Management". Seguimos una política de **Seguridad Total**: no se elimina lógica sin validación y se mantiene la trazabilidad con los flujos originales.

---

## 🧭 1. Mapa de Dominios y Ramas de Uso (UX-Driven)

Para separar correctamente los componentes y hooks, entendemos que el Coach opera en 3 ramas mentales distintas:

### A. Rama de Negocio (Tab: "Productos")
*   **Propósito**: Administrar qué servicios se venden y cómo se monetiza el tiempo.
*   **Divisiones Internas Sugeridas**:
    1.  **Mercado de Actividades**: Programas de largo plazo (Fitness, Nutrición, Talleres).
    2.  **Meets Instantáneos (Consultas de Café)**: Servicios de baja fricción y venta inmediata.
*   **Acciones**: Crear, Editar, Activar/Desactivar Venta, Ver estadísticas de conversiones.

### B. Rama de Contenido (Tab: "Ejercicios/Platos")
*   **Propósito**: Gestionar la "materia prima" o librería de conocimiento.
*   **Divisiones Internas Sugeridas**:
    1.  **Librería Fitness**: Ejercicios técnicos, instrucciones de movimiento y videos Bunny.net.
    2.  **Librería de Nutrición**: Recetas, platos y guías de alimentación.
*   **Acciones**: Carga masiva (CSV), Búsqueda de recursos, Previsualización de técnica.

### C. Rama de Infraestructura (Tab: "Almacenamiento")
*   **Propósito**: Auditoría de recursos y control de costos/límites.
*   **Visualizaciones Duales**:
    1.  **Vista de Tipos**: ¿Cuánto ocupan mis Videos vs Imágenes vs PDFs?
    2.  **Vista de Entidades**: ¿Qué Actividad o Programa es el "dueño" de la mayor parte del almacenamiento? (Útil para saber qué borrar si se llena).
*   **Acciones**: Refrescar cuotas, identificar archivos huérfanos.

---

## 🛡️ 2. Normas de Procedimiento (Cautela Antigravity)

1.  **Aislamiento de Hooks**: No tocaremos el hook actual `useProductsManagementLogic.ts` directamente para cambios masivos. Crearemos mini-hooks especializados y el principal será un simple "pasamanos" hasta que los pequeños estén validados.
2.  **No Eliminación**: Cualquier bloque de código "antiguo" será comentado o movido a un archivo `.deprecated` o `_OLD` antes de ser borrado definitivamente.
3.  **Logging de Flujo**: Cada nueva lógica llevará trazas `[LogicName]` para que Robert (el usuario) pueda auditar el comportamiento en tiempo real.
4.  **Sincronización de Biblia**: Al terminar cada "rama", se actualiza la Biblia HTML para que el conocimiento no se pierda.

---

## 🛠️ 3. Fases de Ejecución Proyectadas

### Fase 1: Desestructuración del "Gran Cerebro"
*   Extraer `useConsultationManager` (Lógica de Meets/Café).
*   Extraer `useProductCRUD` (Creación, edición, borrado y encuestas).
*   Extraer `useProductsFiltering` (Filtros, sorting y búsqueda memoizada).

### Fase 2: Especialización de Componentes UI
*   Refactorizar `ProductsSection.tsx` para separar el carrusel de productos de la caja de consultas.
*   Crear `StorageManager` con la vista dual (Uso total vs Por actividad).

### Fase 3: Integración de Librerías (Contenido)
*   Separar la lógica de `Ejercicios/Platos` del componente principal para que sea una entidad de librería independiente de la venta.

---

**Estado Actual**: 🚧 Planeamiento Terminado / Preparado para Fase 1.
