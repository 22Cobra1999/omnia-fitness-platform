# Plan de Refactorización: ActivityScreen (Mobile)

## 1. Problema (Problem)
El archivo `components/mobile/activity-screen.tsx` se ha convertido en un "monolito" de **2,146 líneas**.
- **Complejidad:** Mezcla lógica de negocio (cálculo de estados, filtros), llamadas a datos (Supabase, API), y presentación UI compleja (listas, modales, tarjetas).
- **Mantenibilidad:** Es difícil rastrear bugs o agregar nuevas funcionalidades sin romper algo existente.
- **Rendimiento:** Re-renders innecesarios debido a un estado global gigante dentro del componente.

## 2. Situación Actual (Situation)
El componente actualmente maneja responsabilidades que no le corresponden directamente:
- **Gestión de Datos:** `fetchUserEnrollments`, `loadCoaches`, `fetchMeetCredits`.
- **Lógica de Estado Derivado:** `calculateEnrollmentStatus`, `filterEnrollmentsByStatus`, `filterActivitiesBySearch`.
- **Control de UI:** Manejo de 5+ modales diferentes (Purchase, Survey, Note, Schedule, etc.) y pestañas internas (Programs, Coaches, Community).
- **Routing:** Lógica de navegación condicional basada en `viewState` y `selectedActivity`.

## 3. Uso (Usage)
Este es el componente **CORE** de la experiencia móvil del cliente.
- Es la "Home" del cliente.
- Muestra sus programas comprados.
- Muestra sus coaches asignados.
- Es el punto de entrada para iniciar el `TodayScreen` (la pantalla de entrenamiento diario).

## 4. Solución (Solution)
Aplicar la misma arquitectura exitosa del `TodayScreen`: **Separación de Intereses (Separation of Concerns).**

### Estrategia de División
1.  **Cerebro (Logic Layer):** Extraer toda la lógica de estado y fetching a un Custom Hook: `useActivityScreenLogic`.
2.  **Componentes Visuales (UI Layer):** Dividir la interfaz en piezas pequeñas y reutilizables.
    - `EnrollmentList`: Lista de programas/actividades.
    - `CoachList`: Carrusel horizontal de coaches.
    - `ActivityFilters`: Chips de filtrado (Todo, Pendiente, Finalizado).
    - `HeaderSection`: Saludo y barra de búsqueda.

## 5. Método (Method)

### Paso 1: Extracción de Lógica (The Brain)
Crear `hooks/useActivityScreenLogic.ts` que se encargue de:
- Estados (`activities`, `coaches`, `loading`, `filters`).
- Efectos (`useEffect` para cargar datos iniciales).
- Funciones de Acción (`handleRefresh`, `handleActivityClick`).
- Funciones de Ayuda (`calculateStatus`, `filterBySearch`).

### Paso 2: Modularización de UI (The Body)
Crear carpeta `components/mobile/ActivityScreenRefactored/components/`:
- `Header/ActivityHeader.tsx` (Saludo + Search).
- `Filters/StatusFilterBar.tsx` (Pestañas de estado).
- `Lists/ProgramList.tsx` (Renderizado de tarjetas de actividad).
- `Lists/CoachCarousel.tsx` (Lista de coaches).
- `Modals/ActivityModals.tsx` (Agrupador de modales para limpiar el JSX principal).

### Paso 3: Ensamblaje (The Assembly)
Crear `components/mobile/ActivityScreenRefactored/index.tsx`:
- Importará el hook y los sub-componentes.
- Debería tener menos de **300 líneas**.
- Será puramente declarativo (leíble como un índice).

### Paso 4: Verificación y Reemplazo
- Testear en paralelo importando el componente refactorizado.
- Verificar flujos críticos: Carga de programas, Carga de coaches, Navegación a TodayScreen.
- Reemplazo final en `app-mobile.tsx`.

---
**Resultado Esperado:** Un código limpio, ordenado y listo para recibir mejoras de "UX Premium" (como skeletons y transiciones suaves) sin riesgo de romper la lógica base.
