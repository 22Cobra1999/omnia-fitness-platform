# Plan de Refactorización: TodayScreen (Espejo 100%)

Este documento mapea las 6029 líneas del archivo original `TodayScreen.tsx` a una estructura modular que preserve el 100% del diseño y funcionalidad.

## Estrategia de División
No simplificar. Copiar lógica y estilos exactos, solo separando en archivos para mantenibilidad.

---

## 🗺️ Mapa de Componentes vs. Líneas Originales

### 1. 🧠 Lógica y Estado (“El Controlador”)
**Líneas Originales:** `1 - 2318`
**Archivos Propuestos:**
- `hooks/useTodayScreenLogic.ts`: Gestión de usuarios, fechas, estados de carga y efectos principales.
- `hooks/useDataLoaders.ts`: `loadTodayActivities` (2056-2264), `loadProgramInfo` (1900-2040).
- `utils/parsers.ts`: Lógica de parseo compleja (ej. `objetivos` en líneas 173-209, `parseSeries`).

### 2. 🎨 Universal Layout & Hero (“La Capa Común”)
**Líneas Originales:** `2319 - 3400`
**Archivos Propuestos:**
- `components/Layout/UniversalActivityLayout.tsx`: Contenedor principal que recibe `children` (el contenido específico).
  - Gestiona `ScreenWrapper.tsx` (Fondo blureado).
  - Gestiona `TopNavigation.tsx` (Iconos Settings).
  - Gestiona `UniversalHero.tsx` (Título, Meets, Tags).
  *Nota: El Hero se adaptará internamente si es Taller/Programa, pero es un solo componente.*

### 3. 🚦 El Punto de Divergencia (“El Contenido”)
A partir de aquí, `activity-screen.tsx` inyecta el componente hijo según el tipo:

#### A. Programa (Calendario + Sheet)
- `components/Program/ProgramContent.tsx`: Wrapper para el contenido de programa.
  - `components/Calendar/WeeklyCalendar.tsx`: Tira de días (3400-3647).
  - `components/Sheet/DraggableSheet.tsx`: Sheet de Actividades.

### 4. 📄 Actividades / Sheet (“El Contenido”)
**Líneas Originales:** `3648 - 6029` (El bloque más grande)
**Estructura:** Draggable Sheet usando `framer-motion`.

#### 4a. Sheet Container
- `components/Sheet/DraggableSheet.tsx`: Lógica de drag, snap points (3648-3754).

#### 4b. Detalle de Actividad (Overlay/Expanded)
**Líneas Originales:** `3754 - 5000` (Aprox)
**Variaciones Críticas:**
- `components/Details/FitnessDetail.tsx`: Tabs de técnica, inputs de series/repeticiones.
- `components/Details/NutritionDetail.tsx`: Tabs de Ingredientes/Instrucciones.
- `components/Details/VideoPlayer.tsx`: `UniversalVideoPlayer` y lógica de expansión.

#### 4c. Lista de Actividades (Collapsed)
**Líneas Originales:** `5000 - 5800`
- `components/List/SummaryHeader.tsx`: "Actividades de hoy" + Pill de conteo (5013).
- `components/List/DayNavigation.tsx`: Flechas prev/next dentro del sheet.
- `components/List/EmptyState.tsx`: "Día de descanso" (5171+).
- `components/List/ActivityBlocks.tsx`: Loop principal (5320+).
- `components/List/ActivityItem.tsx`: Item individual con lógica de "Fuego" (5460+).

### 5. 🧩 Modales y Footers
**Líneas Originales:** `5800 - 6029`
- `components/Modals/SurveyModal.tsx`
- `components/Modals/StartInfoModal.tsx`

---

## 🚦 Orden de Ejecución para Refactor

1. **Setup**: Crear estructura de carpetas `TodayScreenRefactored/components/{Layout,Header,Hero,Calendar,Sheet,Details}`.
2. **Migración de Lógica**: Mover hooks masivos primero para limpiar el componente principal.
3. **Migración de UI (Sección por Sección)**:
   - Copiar estilos *inline* EXACTOS.
   - Copiar lógica de renderizado condicional (Ej. Nutrición vs Fitness).
4. **Validación Visual**: Comparar pixel-perfect con el original.

¿Confirmas este esquema para proceder?
