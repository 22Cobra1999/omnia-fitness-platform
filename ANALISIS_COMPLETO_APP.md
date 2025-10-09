# ANÁLISIS COMPLETO OMNIA APP

## ESTRUCTURA PRINCIPAL

La app tiene 2 perfiles principales:
- **CLIENTE** (client)
- **COACH** (coach)

Cada uno tiene sus propios TABs en el bottom navigation.

---

## 📱 CLIENTE (Client)

### TABS DEL CLIENTE

#### 1. TAB: SEARCH (Búsqueda)
**Qué hace**: Permite al cliente buscar coaches y productos disponibles

**Componentes**:
- `/components/mobile/search-screen.tsx`
- `/components/CoachCard.tsx`
- `/components/ActivityCard.tsx`
- `/components/client-product-modal.tsx`
- `/components/CoachProfileModal.tsx`
- `/components/purchase-activity-modal.tsx`

**Hooks usados**:
- `use-toast` - Para notificaciones
- `useRouter` - Para navegación

**APIs que consume**:
- `/api/search-coaches` - GET - Búsqueda de coaches
- `/api/activities/search` - GET - Búsqueda de actividades/productos
- `/api/coaches` - GET - Lista coaches (fallback)

**Tablas Supabase**:
- `user_profiles` (coaches con level='coach')
- `activities` (productos del coach)
- `activity_media` (imágenes/videos)

**Flujo**:
1. Cliente entra al tab Search
2. Carga coaches desde `/api/search-coaches`
3. Carga actividades desde `/api/activities/search`
4. Muestra coaches en cards horizontales deslizables
5. Muestra actividades debajo
6. Click en coach → abre `CoachProfileModal`
7. Click en actividad → abre `ClientProductModal`
8. Desde modal puede comprar producto

**Caché**:
- Usa `sessionStorage` para cachear coaches por 10 minutos
- Usa `sessionStorage` para cachear actividades

---

#### 2. TAB: ACTIVITY (Actividad del Cliente)
**Qué hace**: Muestra los productos/programas que el cliente ha comprado y su progreso

**Componentes**:
- `/components/mobile/activity-screen.tsx`
- `/components/activities/purchased-activity-card.tsx`
- `/components/TodayScreen.tsx` - Pantalla de ejecución de programa
- `/components/client/workshop-client-view.tsx` - Vista de talleres
- `/components/purchase-activity-modal.tsx`
- `/components/CoachProfileModal.tsx`
- `/components/activity-skeleton-loader.tsx`

**Hooks usados**:
- `use-toast` - Para notificaciones
- `useRouter` - Para navegación
- Estados con caché en `sessionStorage`

**APIs que consume**:
- Supabase directamente (no APIs custom):
  - Query a `activity_enrollments` con joins a:
    - `activities`
    - `activity_media`
    - `coaches`
  - Query a `ejecuciones_ejercicio` para calcular progreso
  - Query a `user_profiles` para datos de coaches
  - Query a `ejercicios_detalles` para detalles de ejercicios
  - Query a `nutrition_program_details` para programas de nutrición
- `/api/coaches` - GET - Lista de coaches
- `/api/calendar-events` - POST - Crear eventos programados

**Tablas Supabase**:
- `activity_enrollments` - Inscripciones del cliente (NUEVA TABLA)
  - Columnas clave:
    - `id` (integer)
    - `client_id` (uuid) - ID del cliente
    - `activity_id` (integer) - ID del producto
    - `status` (text)
    - `created_at` (timestamp)
    - `start_date` (date) - Fecha de inicio del programa
- `activities` - Productos/programas
- `ejecuciones_ejercicio` - Ejecuciones de ejercicios completados
- `ejercicios_detalles` - Detalles de ejercicios (NUEVA TABLA MODULAR)
- `nutrition_program_details` - Detalles de programas de nutrición
- `coaches` - Tabla de coaches
- `user_profiles` - Perfiles de usuarios/coaches
- `calendar_events` - Eventos del calendario

**Flujo**:
1. Cliente entra al tab Activity
2. Carga enrollments desde Supabase con JOIN complejo
3. Calcula progreso real de cada enrollment:
   - Cuenta ejecuciones completadas vs total
   - Usa función `calculateRealProgress()`
4. Muestra cards de productos comprados con:
   - Imagen
   - Título, tipo, precio
   - Progreso calculado
   - Botón "Start" si no ha iniciado
5. Click en card → abre `TodayScreen` (programas) o `WorkshopClientView` (talleres)
6. En TodayScreen:
   - Ve ejercicios del día
   - Puede marcar como completado
   - Navega entre días
7. Puede programar actividades en calendario
8. Muestra "Mis coaches" - coaches de productos comprados

**Caché**:
- Usa `sessionStorage` para cachear enrollments por 10 minutos
- Usa `sessionStorage` para cachear coaches por 10 minutos
- Recarga en background después de 2 segundos si hay caché válido

**Columnas importantes**:
- `activity_enrollments`:
  - `id` (integer)
  - `client_id` (uuid) - ID del cliente
  - `activity_id` (integer) - ID del producto
  - `status` (text)
  - `created_at` (timestamp)
  - `start_date` (date) - Fecha inicio del programa
  - `updated_at` (timestamp)

---

#### 3. TAB: COMMUNITY (Comunidad)
**Qué hace**: Feed social, contenido de coaches, posts

**Componentes**:
- `/components/mobile/community-screen.tsx`

**Nota**: Este tab es accesible incluso sin login

**APIs que consume**:
- TBD (probablemente posts, feed)

**Tablas Supabase**:
- TBD (probablemente `posts`, `feed`)

---

#### 4. TAB: CALENDAR (Calendario Cliente)
**Qué hace**: Muestra calendario con ejercicios planificados del cliente

**Componentes**:
- `/components/calendar/CalendarScreen.tsx`

**APIs que consume**:
- `/api/calendar-events` - Eventos del calendario
- `/api/executions` - Ejecuciones planificadas

**Tablas Supabase**:
- `ejecuciones_ejercicio` - Ejercicios planificados por fecha
- `planificacion_ejercicios` - Planificación
- `ejercicios` - Detalles de ejercicios

**Flujo**:
1. Cliente ve calendario mensual
2. Cada día muestra ejercicios planificados
3. Click en día → ve detalle de ejercicios
4. Puede marcar como completado

---

#### 5. TAB: PROFILE (Perfil Cliente)
**Qué hace**: Perfil del cliente, configuración, avatar, datos personales

**Componentes**:
- `/components/mobile/profile-screen.tsx`

**APIs que consume**:
- `/api/profile` - Datos del perfil
- `/api/upload-avatar` - Subir avatar
- `/api/user-achievements` - Logros del usuario

**Tablas Supabase**:
- `user_profiles` - Perfil del usuario
  - Columnas:
    - `id` (uuid)
    - `email` (text)
    - `name` (text)
    - `avatar_url` (text) - URL del avatar (NO storage propio, usa avatar_url directo)
    - `level` (text) - 'client' o 'coach'
    - `created_at` (timestamp)

**Flujo**:
1. Cliente ve su perfil
2. Puede editar nombre, avatar
3. Ve estadísticas (productos comprados, progreso)
4. Puede cerrar sesión

---

## 🔥 COACH (Coach)

### TABS DEL COACH

#### 1. TAB: CLIENTS (Clientes del Coach)
**Qué hace**: Lista de clientes que han comprado productos del coach

**Componentes**:
- `/components/mobile/clients-screen.tsx`
- `/components/coach/client-calendar.tsx` - Calendario de actividades del cliente

**Hooks usados**:
- `useState`, `useEffect` para gestión de estado
- Sin hooks personalizados

**APIs que consume**:
- `/api/coach/clients` - GET - Lista de clientes del coach con métricas
- `/api/coach/clients/{clientId}/details` - GET - Detalles completos de un cliente
- `/api/coach/clients/{clientId}/todo` - GET/POST/DELETE - Gestión de tareas To Do
- `/api/coach/consultations` - GET/PUT - Consultas disponibles del coach
- `/api/coach/stats` - GET - Estadísticas del coach

**Tablas Supabase**:
- `activity_enrollments` - Filtrado por coach_id de las actividades
- `user_profiles` - Datos de los clientes
- `activities` - Productos del coach
- Otras tablas consultadas vía API:
  - `client_injuries` - Lesiones del cliente
  - `client_biometrics` - Biométricas del cliente
  - `client_objectives` - Objetivos del cliente
  - `client_todo_tasks` - Tareas To Do

**Flujo**:
1. Coach entra al tab Clients
2. Carga lista de clientes desde `/api/coach/clients`:
   - Nombre, email, avatar
   - Número de actividades compradas
   - Progreso total
   - To Do count
   - Ingresos totales del cliente
   - Última actividad
3. Puede buscar/filtrar clientes por:
   - Todos / Activos / Pendientes / Inactivos
   - Búsqueda por nombre o email
4. Click en cliente → abre modal fullscreen con:
   - Información básica (nombre, email, estado)
   - Métricas (progreso, actividades, to do, ingresos)
   - **Sección To Do** (expandible):
     - Máximo 4 tareas por cliente
     - Coach puede agregar/eliminar tareas
     - Click en flame icon para completar tarea
   - **Lesiones** (expandible):
     - Nombre de lesión
     - Severidad (alta/media/baja)
     - Músculo afectado
     - Nivel de dolor
     - Descripción
   - **Biométricas** (expandible):
     - Peso, altura, IMC, etc.
     - Valores con unidades
   - **Objetivos** (expandible):
     - Ejercicio objetivo
     - Valor actual vs objetivo
   - **Actividades activas**:
     - Lista de productos comprados
     - Precio pagado por cada uno
   - **Calendario** (expandible):
     - Vista del calendario de actividades del cliente
5. Botón de mensajes (MessageSquare) para comunicarse con cliente

**Datos almacenados por cliente**:
- `client_todo_tasks`: Array de hasta 4 tareas
- `client_injuries`: Array de lesiones
- `client_biometrics`: Array de métricas
- `client_objectives`: Array de objetivos

**Columnas importantes**:
- `activity_enrollments`:
  - Se usa para obtener clientes del coach
  - Join con `activities` para filtrar por `coach_id`
  - `client_id` - ID del cliente
  - `activity_id` - Producto comprado

---

#### 2. TAB: PRODUCTS (Productos del Coach)
**Qué hace**: Gestión de productos/programas del coach (crear, editar, eliminar)

**Componentes**:
- `/components/mobile/products-management-screen.tsx`
- `/components/create-product-modal-refactored.tsx` - Modal de creación/edición
- `/components/ActivityCard.tsx` - Cards de productos
- `/components/client-product-modal.tsx` - Vista previa del producto

**Hooks usados**:
- `useState`, `useEffect`, `useCallback`, `useMemo` - Hooks optimizados con memoización
- Sin hooks personalizados

**APIs que consume**:
- `/api/products` - GET - Lista productos del coach
- `/api/coach/consultations` - GET/PUT - Gestión de consultas (Café, Meet 30min, Meet 1h)
- `/api/coach/stats` - GET - Estadísticas del coach (ingresos, reviews, etc.)
- `/api/delete-activity-final` - DELETE - Eliminar producto por ID

**Tablas Supabase**:
- `activities` - Tabla principal de productos
  - Columnas clave:
    - `id` (integer)
    - `coach_id` (uuid) - ID del coach creador
    - `title` (text) - Nombre del producto
    - `description` (text)
    - `price` (decimal)
    - `type` (text) - Tipo: 'fitness', 'nutrition', 'consultation', 'workshop', 'document', 'program'
    - `categoria` (text) - 'fitness' o 'nutrition'
    - `difficulty` (text)
    - `is_public` (boolean)
    - `created_at` (timestamp)
    - `updated_at` (timestamp)
- `activity_media` - Imágenes y videos
- Consultadas vía API:
  - `coach_consultations` - Consultas disponibles del coach (Café, Meet 30min, Meet 1h)
  - `activity_enrollments` - Para estadísticas de ventas
  - `reviews` - Para ratings

**Flujo completo de la pantalla**:

### Al cargar:
1. Carga productos del coach desde `/api/products`
2. Carga consultas disponibles desde `/api/coach/consultations`
3. Carga estadísticas desde `/api/coach/stats`:
   - Total productos
   - Ingresos totales
   - Rating promedio
   - Total reviews
   - Total enrollments

### Sección de Estadísticas (minimalista):
- Muestra: Ingresos, Productos, Rating
- Todo en una línea compacta

### Sección de Consultas Disponibles:
- 3 tipos de consultas que el coach puede activar/desactivar:
  1. **Café** (consulta informal)
  2. **Meet 30 min** (consulta de 30 minutos)
  3. **Meet 1 hora** (consulta completa de 1 hora)
- Cada consulta tiene:
  - Toggle para activar/desactivar
  - Precio editable (cuando está desactivada y en modo edición)
  - Icono distintivo (Coffee, Clock, Users)
  - Estado visual (activa = naranja, inactiva = gris)
- Botón de edición (lápiz) para entrar en modo edición de precios

### Sección de Productos:
- Filtro por tipo (dropdown):
  - Todos
  - Fitness
  - Nutrición
  - Programa
  - Consultas
  - Talleres
  - Documentos
- Lista horizontal de products cards (scroll horizontal)
- Cada card muestra:
  - Imagen del producto
  - Título
  - Tipo (badge con color)
  - Precio
  - Botones de edición y eliminación (hover)
- Click en card → abre vista previa en `ClientProductModal`
- Click en editar → abre `CreateProductModal` con datos pre-cargados
- Click en eliminar → flujo de eliminación optimizado

### Flujo de Eliminación (OPTIMIZADO):
1. Click en botón eliminar
2. Abre modal de confirmación con:
   - Icono de advertencia (rojo)
   - Nombre del producto a eliminar
   - Mensaje de advertencia
   - Botones: Cancelar / Eliminar
3. Al confirmar:
   - **Cierra modal inmediatamente** (UX mejorada)
   - **Elimina producto del estado local** → desaparece de la UI
   - Ejecuta eliminación en backend en background
   - Si falla → revierte el cambio
   - Si tiene éxito → muestra modal de éxito
4. Modal de éxito:
   - Icono check (naranja)
   - Mensaje de éxito
   - Botón "Entendido"
   - Al cerrar → refresca página y vuelve al tab products

### Flujo de Creación/Edición:
- Click en botón "Crear" → abre `CreateProductModal`
- Modal permite crear diferentes tipos de productos
- Al guardar → dispara evento `productCreated` o `productUpdated`
- La pantalla escucha el evento y recarga productos

**Optimizaciones implementadas**:
- Memoización de funciones con `useCallback`
- Memoización de listas filtradas/ordenadas con `useMemo`
- Componente ProductCard memoizado con `memo()`
- Timeouts en fetch para evitar cuelgues (30s productos, 15s consultas, 8s stats)
- Fallbacks a valores por defecto si falla alguna API
- Carga secuencial de datos (productos → consultas → stats) para evitar sobrecarga

---

## 📋 RESUMEN DE APIs EN USO

### ✅ APIs CONFIRMADAS EN USO (CONSERVAR)

#### Auth & User
- `/api/auth/logout` - POST - Cerrar sesión
- `/api/auth/clear-cookies` - POST - Limpiar cookies
- `/api/profile` - GET/PUT - Perfil del usuario
- `/api/upload-avatar` - POST - Subir avatar

#### Coaches & Search
- `/api/coaches` - GET - Lista coaches
- `/api/search-coaches` - GET - Búsqueda optimizada de coaches

#### Activities & Products
- `/api/products` - GET - Lista productos del coach
- `/api/activities/search` - GET - Búsqueda de actividades
- `/api/delete-activity-final` - DELETE - Eliminar producto

#### Coach Management
- `/api/coach/clients` - GET - Lista clientes del coach
- `/api/coach/clients/{id}/details` - GET - Detalles del cliente
- `/api/coach/clients/{id}/todo` - GET/POST/DELETE - Gestión To Do
- `/api/coach/consultations` - GET/PUT - Consultas del coach
- `/api/coach/stats` - GET - Estadísticas del coach
- `/api/coach/initialize-storage` - GET/POST - Inicializar carpetas storage

#### Calendar & Events  
- `/api/calendar-events` - GET/POST - Eventos del calendario

#### Messages
- `/api/messages/conversations` - GET - Conversaciones

---

### 🗑️ APIs PARA ELIMINAR (NO SE USAN)

#### Delete endpoints duplicados (eliminar TODAS excepto `/api/delete-activity-final`)
- `/api/delete-60-*` (30+ variaciones)
- `/api/delete-product-*` (10+ variaciones: basic, bypass, direct, fixed, mock, safe, simple, sql)
- `/api/delete-activity-raw`
- `/api/force-delete-*`

#### Check/Debug APIs (eliminar TODAS)
- `/api/check-*` (30+ endpoints)
- `/api/analyze-*` (10+ endpoints)
- `/api/verify-*` (10+ endpoints)
- `/api/validate-*`
- `/api/diagnose-*`
- `/api/investigate-*`
- `/api/debug/*`

#### Setup/Fix APIs (eliminar TODAS - solo desarrollo)
- `/api/setup-*` (15+ endpoints)
- `/api/fix-*` (15+ endpoints)
- `/api/install-*`
- `/api/execute-*`
- `/api/urgent-fix-*`
- `/api/admin/*` (todos los endpoints admin)
- `/api/init-db`
- `/api/adjust-tables-direct`

#### Upload duplicados (eliminar excepto `/api/upload-media` y `/api/upload-avatar`)
- `/api/upload-direct`
- `/api/upload-final`
- `/api/upload-media-robust`
- `/api/upload-media-temp`
- `/api/upload-organized`
- `/api/upload-program`
- `/api/upload-simple`
- `/api/upload-file`

#### Process/Import duplicados
- `/api/process-csv-*` (múltiples versiones)
- `/api/process-fitness-csv-*`
- `/api/import-program`
- `/api/reprocess-*`

#### Exercise endpoints probablemente sin uso
- `/api/exercise-completion`
- `/api/exercise-intensities`
- `/api/exercise-progress`
- `/api/exercise-replications`
- `/api/exercise-times`
- `/api/exercise-times-simple`
- `/api/existing-exercises`
- `/api/mark-exercise-completed`
- `/api/toggle-exercise`

#### Otros endpoints sin uso
- `/api/simulate-*`
- `/api/populate-*` (múltiples)
- `/api/repopulate-*`
- `/api/simple-populate`
- `/api/regenerate-*`
- `/api/recreate-*`
- `/api/migrate-*`
- `/api/auto-regenerate-*`
- `/api/generate-*` (múltiples)
- `/api/insert-*` (múltiples)
- `/api/direct-*`
- `/api/remove-*`
- `/api/disable-*`
- `/api/enable-*`
- `/api/sql-query`
- `/api/execute-sql-*`

#### Storage/Media sin uso
- `/api/storage` (si no se usa)
- `/api/coach-media` (revisar si se usa)
- `/api/coach-videos` (revisar si se usa)
- `/api/list-buckets`
- `/api/optimize-images`

#### Activity endpoints sin uso aparente
- `/api/activities` (revisar - podría usarse)
- `/api/coach-activities` (revisar - podría usarse)
- `/api/direct-activities`
- `/api/recent-activities`
- `/api/all-activities`
- `/api/my-products` (probablemente reemplazado por `/api/products`)
- `/api/revalidate-my-products`

---

## 📁 ARCHIVOS .MD A CONSOLIDAR/ELIMINAR

### Consolidar en un README principal:
Todos los archivos `RESUMEN_*.md`, `GUIA_*.md`, `IMPLEMENTACION_*.md`, `SISTEMA_*.md`, `MEJORAS_*.md`, `CORRECCION_*.md`

Estos son resúmenes de sesiones de desarrollo que ya no son necesarios una vez que el código está funcionando.

### Lista completa a eliminar:
- ARCHIVOS_MANTENER.md
- ARQUITECTURA_TALLERES_COMPLETA.md
- CALENDARIO_HORAS_TOTALES.md
- COMPONENTES_TALLER_MEJORADOS.md
- CORRECCION_ERROR_COMPONENTE_TALLER.md
- CORRECCION_FLUJO_UPLOAD_IMAGENES.md
- CORRECCION_SELECCION_VIDEO_EXISTENTE.md
- DISENO_FINAL_TALLERES_UN_CALENDARIO.md
- EJECUTAR_EN_SUPABASE.md
- EJECUTAR_LIMPIEZA_EJECUCIONES.md
- ESTADO_PROYECTO_ANTES_LIMPIEZA.md
- ESTRUCTURA_ALMACENAMIENTO_TALLER.md
- ESTRUCTURA_STORAGE_COACHES.md
- GUIA_IMPLEMENTACION_STORAGE_COACHES.md
- GUIA_TEMAS_TALLERES.md
- IMPLEMENTACION_*.md (todos)
- INSTAGRAM_OAUTH_SETUP.md (si no se usa OAuth de Instagram)
- INSTRUCCIONES_CORRECCION_VIDEOS.md
- LIMPIEZA_COMPLETADA.md
- MEJORAS_*.md (todos)
- NUEVO_FLUJO_TALLERES_SIMPLE.md
- RESUMEN_*.md (todos)
- SCRIPT_*.sql (mover a carpeta sql/)
- SISTEMA_*.md (todos)
- SOLUCION_*.md (todos)
- STORAGE_COACHES_COMPLETO.md
- VERIFICACION_MANUAL_SUPABASE.md
- VERIFICAR_*.md (todos)

---

## 🎯 PRÓXIMOS PASOS RECOMENDADOS

1. **Crear backup** de la carpeta completa antes de eliminar
2. **Revisar** cada API marcada para eliminar (hacer búsqueda en código)
3. **Eliminar** APIs no usadas de `/app/api/`
4. **Consolidar** archivos .md en un solo README principal
5. **Limpiar** scripts en `/scripts/` (mantener solo los esenciales)
6. **Documentar** las tablas SQL necesarias en un archivo único
7. **Crear** archivo `ARCHITECTURE.md` con la información de este análisis

---

## 📊 ESTADÍSTICAS DEL PROYECTO

### Estado Actual:
- **APIs totales**: ~255 archivos
- **APIs en uso**: ~20
- **APIs para eliminar**: ~235 (92%)
- **Archivos .md**: ~40+
- **Archivos .md necesarios**: 1-2
- **Scripts**: 72
- **Scripts necesarios**: ~5-10

### Ahorro estimado:
- **Espacio en disco**: 70-80% reducción
- **Tiempo de build**: Mejora significativa
- **Claridad del código**: Mucho mayor
- **Mantenibilidad**: Drásticamente mejorada
