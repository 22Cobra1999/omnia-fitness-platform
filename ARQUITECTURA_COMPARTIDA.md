# 🏗️ ARQUITECTURA COMPARTIDA - COMPONENTES, SCRIPTS Y TABLAS

## 📋 Índice
1. [Componentes](#componentes)
2. [Scripts y Utilidades](#scripts-y-utilidades)
3. [Tablas de Base de Datos](#tablas-de-base-de-datos)
4. [APIs y Endpoints](#apis-y-endpoints)
5. [Hooks Personalizados](#hooks-personalizados)

---

# 1. COMPONENTES

## 🟢 COMPONENTES COMPARTIDOS (Coach + Cliente)

### Video y Multimedia
| Componente | Ubicación | Uso | Descripción |
|------------|-----------|-----|-------------|
| `UniversalVideoPlayer` | `components/shared/video/` | 🔵 Coach 🔵 Cliente | Reproductor universal para Bunny.net, Vimeo, MP4 con HLS.js |
| `VimeoPlayer` | `components/shared/video/` | 🔵 Coach 🔵 Cliente | Reproductor específico para Vimeo |
| `VimeoEmbed` | `components/shared/video/` | 🔵 Coach 🔵 Cliente | Embed de videos Vimeo |
| `VideoPlayer` | `components/shared/video/` | 🔵 Coach 🔵 Cliente | Reproductor genérico con controles personalizados |

### Productos y Actividades
| Componente | Ubicación | Uso | Descripción |
|------------|-----------|-----|-------------|
| `ClientProductModal` | `components/client/activities/` | 🔵 Coach 🔵 Cliente | Modal de preview de producto - **COMPONENTE COMPARTIDO CLAVE** |
| `ActivityCard` | `components/shared/activities/` | 🔵 Coach 🔵 Cliente | Card de actividad/producto en listados |
| `ActivityDetailView` | `components/shared/activities/` | 🔵 Coach 🔵 Cliente | Vista detallada de actividad |
| `ProductPreviewCard` | `components/shared/products/` | 🔵 Coach 🔵 Cliente | Card de preview de producto |
| `ExpandedProductCard` | `components/shared/products/` | 🔵 Coach 🔵 Cliente | Card expandida de producto |

### Búsqueda y Navegación
| Componente | Ubicación | Uso | Descripción |
|------------|-----------|-----|-------------|
| `SearchScreen` | `components/mobile/` | 🔵 Coach 🔵 Cliente | Pantalla de búsqueda de coaches y actividades |
| `CoachProfileModal` | `components/coach/` | 🔵 Coach 🔵 Cliente | Modal de perfil de coach (para ver otros coaches) |

### UI Base
| Componente | Ubicación | Uso | Descripción |
|------------|-----------|-----|-------------|
| `BaseScreen` | `components/base/` | 🔵 Coach 🔵 Cliente | Pantalla base para toda la app |
| Componentes de `ui/` | `components/ui/` | 🔵 Coach 🔵 Cliente | Button, Dialog, Card, Badge, etc. (shadcn/ui) |

---

## 🔵 COMPONENTES SOLO CLIENTE

### Actividades y Ejercicios
| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `TodayScreen` | `components/shared/misc/` | Pantalla de ejercicios del día |
| `ActivityScreen` | `components/client/activities/` | Pantalla principal de actividad |
| `CalendarView` | `components/client/calendar/` | Vista de calendario de cliente |
| `ClientActivityCard` | `components/activities/` | Card de actividad para cliente |
| `PurchasedActivityCard` | `components/activities/` | Card de actividad comprada |

### Progreso y Seguimiento
| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `ProgressTracker` | `components/client/` | Seguimiento de progreso del cliente |
| `ExerciseExecutionCard` | `components/client/` | Card de ejecución de ejercicio |

---

## 🟠 COMPONENTES SOLO COACH

### Gestión de Productos
| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `CreateProductModal` | `components/shared/products/` | Modal para crear/editar productos |
| `ProductsManagementScreen` | `components/mobile/` | Pantalla de gestión de productos del coach |
| `ProductPreviewModal` | `components/shared/products/` | Modal de preview para editar/eliminar |
| `VideoSelectionModal` | `components/shared/ui/` | Modal para seleccionar videos de Bunny.net |
| `MediaSelectionModal` | `components/shared/ui/` | Modal para seleccionar imágenes |

### Planificación
| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `WeeklyExercisePlanner` | `components/shared/activities/` | Planificador de ejercicios semanales |
| `CSVManagerEnhanced` | `components/shared/csv/` | Gestor de CSV para programas |
| `CalendarScheduleManager` | `components/shared/calendar/` | Gestor de horarios |
| `WorkshopScheduleManager` | `components/shared/calendar/` | Gestor de talleres |
| `WorkshopSimpleScheduler` | `components/shared/calendar/` | Planificador simple de talleres |

### Clientes
| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `ClientsScreen` | `components/coach/` | Pantalla de gestión de clientes |
| `ClientCalendar` | `components/coach/` | Calendario de un cliente específico |
| `ClientDetailsModal` | `components/coach/clients/` | Modal de detalles de cliente |

### Calendario y Eventos
| Componente | Ubicación | Descripción |
|------------|-----------|-------------|
| `CoachCalendarScreen` | `components/coach/` | Calendario del coach |
| `EventDetailModal` | `components/coach/` | Modal de detalles de evento/reunión |

---

# 2. SCRIPTS Y UTILIDADES

## 🟢 UTILIDADES COMPARTIDAS

### Servicios
| Archivo | Ubicación | Uso | Descripción |
|---------|-----------|-----|-------------|
| `activity-service.ts` | `utils/` | 🔵 Coach 🔵 Cliente | Servicios de actividades |
| `program-data-service.ts` | `utils/` | 🔵 Coach 🔵 Cliente | Servicios de datos de programas |
| `date-utils.ts` | `utils/` | 🔵 Coach 🔵 Cliente | Utilidades de fechas |
| `format-file-size.ts` | `utils/` | 🔵 Coach 🔵 Cliente | Formateo de tamaño de archivos |

### Configuración
| Archivo | Ubicación | Uso | Descripción |
|---------|-----------|-----|-------------|
| `api-config.ts` | `lib/config/` | 🔵 Coach 🔵 Cliente | Configuración de endpoints API |
| `bunny-config.ts` | `lib/bunny/` | 🔵 Coach 🔵 Cliente | Configuración de Bunny.net |

### Video
| Archivo | Ubicación | Uso | Descripción |
|---------|-----------|-----|-------------|
| `vimeo-utils.ts` | `utils/` | 🔵 Coach 🔵 Cliente | Utilidades para Vimeo |
| `bunny-stream.ts` | `lib/bunny/` | 🔵 Coach 🔵 Cliente | Cliente de Bunny.net Stream |
| `bunny-upload.ts` | `lib/bunny/` | 🟠 Solo Coach | Subida de videos a Bunny.net |

---

## 🔵 SCRIPTS SOLO CLIENTE

*No hay scripts específicos de cliente - toda la lógica está en componentes*

---

## 🟠 SCRIPTS SOLO COACH

### Gestión de Productos
| Script | Ubicación | Descripción |
|--------|-----------|-------------|
| `export-for-figma.js` | `scripts/` | Exportar datos para Figma |
| `calculate-product-stats.js` | `utils/` | Calcular estadísticas de productos |
| `parse-detalle-series.js` | `utils/` | Parser de series de ejercicios |

---

# 3. TABLAS DE BASE DE DATOS

## 🟢 TABLAS COMPARTIDAS (Lectura por ambos)

### Actividades y Productos
| Tabla | Lectura | Escritura | Descripción |
|-------|---------|-----------|-------------|
| `activities` | 🔵 Coach 🔵 Cliente | 🟠 Solo Coach | Actividades/productos principales |
| `activity_media` | 🔵 Coach 🔵 Cliente | 🟠 Solo Coach | Videos, imágenes, multimedia |
| `ejercicios_detalles` | 🔵 Coach 🔵 Cliente | 🟠 Solo Coach | Detalles de ejercicios |
| `planificacion_ejercicios` | 🔵 Coach 🔵 Cliente | 🟠 Solo Coach | Planificación semanal |
| `periodos` | 🔵 Coach 🔵 Cliente | 🟠 Solo Coach | Períodos del programa |

### Coaches
| Tabla | Lectura | Escritura | Descripción |
|-------|---------|-----------|-------------|
| `coaches` | 🔵 Coach 🔵 Cliente | 🟠 Solo Coach | Información de coaches |
| `coach_media` | 🔵 Coach 🔵 Cliente | 🟠 Solo Coach | Media de coaches (videos reutilizables) |

---

## 🔵 TABLAS SOLO CLIENTE

### Progreso y Actividades
| Tabla | Operación | Descripción |
|-------|-----------|-------------|
| `activity_enrollments` | Lectura/Escritura | Inscripciones del cliente a actividades |
| `progreso_cliente` | Lectura/Escritura | Progreso diario del cliente (ejercicios completados/pendientes) |
| `client_profiles` | Lectura | Perfil del cliente |

---

## 🟠 TABLAS SOLO COACH

### Gestión de Clientes
| Tabla | Operación | Descripción |
|-------|-----------|-------------|
| `coach_clients` | Lectura/Escritura | Relación coach-cliente |
| `client_notes` | Lectura/Escritura | Notas del coach sobre clientes |

### Calendario y Reuniones
| Tabla | Operación | Descripción |
|-------|-----------|-------------|
| `meetings` | Lectura/Escritura | Reuniones agendadas |
| `google_oauth_tokens` | Lectura/Escritura | Tokens de Google Calendar/Meet |

### Talleres
| Tabla | Operación | Descripción |
|-------|-----------|-------------|
| `workshop_schedules` | Lectura/Escritura | Horarios de talleres |
| `workshop_attendance` | Lectura/Escritura | Asistencia a talleres |

---

# 4. APIS Y ENDPOINTS

## 🟢 ENDPOINTS COMPARTIDOS

### Actividades
| Endpoint | Método | Uso | Descripción |
|----------|--------|-----|-------------|
| `/api/activities/search` | GET | 🔵 Coach 🔵 Cliente | Buscar actividades (con filtro por coachId) |
| `/api/activities/[id]` | GET | 🔵 Coach 🔵 Cliente | Obtener detalles de actividad |
| `/api/activities/[id]/purchase-status` | GET | 🔵 Coach 🔵 Cliente | Verificar estado de compra |
| `/api/activity-exercises/[id]` | GET | 🔵 Coach 🔵 Cliente | Obtener ejercicios de actividad |

### Coaches
| Endpoint | Método | Uso | Descripción |
|----------|--------|-----|-------------|
| `/api/search-coaches` | GET | 🔵 Coach 🔵 Cliente | Buscar coaches |
| `/api/coaches` | GET | 🔵 Coach 🔵 Cliente | Listar coaches |

### Planificación
| Endpoint | Método | Uso | Descripción |
|----------|--------|-----|-------------|
| `/api/get-product-planning` | GET | 🔵 Coach 🔵 Cliente | Obtener planificación de producto |

---

## 🔵 ENDPOINTS SOLO CLIENTE

### Actividades y Progreso
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/activities/today` | GET | Obtener ejercicios del día |
| `/api/activities/[id]/first-day` | GET | Obtener primer día de actividad |
| `/api/enrollments/direct` | POST | Inscribirse a una actividad |
| `/api/activities/initialize-progress` | POST | Inicializar progreso del cliente |
| `/api/executions/day` | GET | Obtener ejecuciones del día |
| `/api/toggle-exercise` | POST | Marcar ejercicio como completado/pendiente |
| `/api/ejecuciones-ejercicio` | GET/PUT | Gestionar ejecuciones de ejercicios |

---

## 🟠 ENDPOINTS SOLO COACH

### Gestión de Productos
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/activities` | POST/PUT/DELETE | Crear/editar/eliminar actividades |
| `/api/save-exercise-videos` | POST | Guardar videos de ejercicios |
| `/api/save-weekly-planning` | POST | Guardar planificación semanal |
| `/api/upload-organized` | POST | Subir media organizada |

### Video Management
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/bunny/upload-video` | POST | Subir video a Bunny.net |
| `/api/bunny/list-videos` | GET | Listar videos de Bunny.net |
| `/api/bunny/delete-video` | DELETE | Eliminar video de Bunny.net |
| `/api/coach-media` | GET/POST/DELETE | Gestionar media del coach |

### Clientes
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/coach/clients` | GET | Listar clientes del coach |
| `/api/coach/client-progress` | GET | Ver progreso de un cliente |

### Calendario y Reuniones
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/meetings` | GET/POST/PUT/DELETE | Gestionar reuniones |
| `/api/google/auth` | GET | Autenticar con Google |
| `/api/google/calendar` | GET/POST | Integrar con Google Calendar |

---

# 5. HOOKS PERSONALIZADOS

## 🟢 HOOKS COMPARTIDOS

### Video
| Hook | Ubicación | Uso | Descripción |
|------|-----------|-----|-------------|
| `useVideoProvider` | `hooks/shared/` | 🔵 Coach 🔵 Cliente | Determinar proveedor de video y generar URLs |

### Datos
| Hook | Ubicación | Uso | Descripción |
|------|-----------|-----|-------------|
| `useActivityData` | `hooks/shared/` | 🔵 Coach 🔵 Cliente | Obtener datos de actividad |
| `useAuth` | `contexts/` | 🔵 Coach 🔵 Cliente | Autenticación y usuario actual |

---

## 🔵 HOOKS SOLO CLIENTE

| Hook | Ubicación | Descripción |
|------|-----------|-------------|
| `useClientActivities` | `hooks/client/` | Obtener actividades del cliente |
| `useExerciseProgress` | `hooks/client/` | Gestionar progreso de ejercicios |
| `useDayProgress` | `hooks/client/` | Progreso del día |
| `useActivityEnrollment` | `hooks/client/` | Gestionar inscripciones |

---

## 🟠 HOOKS SOLO COACH

| Hook | Ubicación | Descripción |
|------|-----------|-------------|
| `useCoachClients` | `hooks/coach/` | Gestionar clientes del coach |
| `useCoachProducts` | `hooks/coach/` | Gestionar productos del coach |
| `useCoachCalendar` | `hooks/coach/` | Calendario del coach |
| `useCSVManagement` | `hooks/shared/` | Gestión de CSV (usado en creación de productos) |
| `useProductForm` | `hooks/coach/` | Formulario de productos |
| `useCoachAvailability` | `hooks/coach/` | Disponibilidad del coach |

---

# 6. TABLAS DE BASE DE DATOS - DETALLE COMPLETO

## 📊 Estructura de `activity_media`

**Uso:** 🔵 Coach 🔵 Cliente (Lectura) | 🟠 Solo Coach (Escritura)

### Columnas relevantes para video:

```sql
CREATE TABLE activity_media (
  id UUID PRIMARY KEY,
  activity_id INTEGER REFERENCES activities(id),
  
  -- Video de Bunny.net
  bunny_video_id TEXT,              -- ID del video en Bunny.net Stream
  bunny_library_id TEXT,            -- ID de la librería (510910)
  video_url TEXT,                   -- URL del stream HLS (.m3u8)
  video_thumbnail_url TEXT,         -- URL del thumbnail del video
  
  -- Imagen
  image_url TEXT,                   -- Imagen de portada del producto
  
  -- Metadatos
  storage_provider TEXT,            -- 'bunny' | 'vimeo' | 'supabase'
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Ejemplo de registro:
```json
{
  "activity_id": 78,
  "bunny_video_id": "b8f1c3da-864c-4d9a-8d00-e9d5fa9ac7fa",
  "bunny_library_id": "510910",
  "video_url": "https://vz-37d7814d-402.b-cdn.net/b8f1c3da-864c-4d9a-8d00-e9d5fa9ac7fa/playlist.m3u8",
  "video_thumbnail_url": "https://vz-37d7814d-402.b-cdn.net/b8f1c3da-864c-4d9a-8d00-e9d5fa9ac7fa/thumbnail.jpg",
  "image_url": "https://...",
  "storage_provider": "bunny"
}
```

---

## 📊 Estructura de `progreso_cliente`

**Uso:** 🔵 Solo Cliente

### Columnas:

```sql
CREATE TABLE progreso_cliente (
  id SERIAL PRIMARY KEY,
  cliente_id UUID REFERENCES auth.users(id),
  actividad_id INTEGER REFERENCES activities(id),
  enrollment_id INTEGER REFERENCES activity_enrollments(id),
  fecha DATE NOT NULL,
  
  -- Arrays de IDs de ejercicios
  ejercicios_completados INTEGER[],  -- [1042, 1043]
  ejercicios_pendientes INTEGER[],   -- [1044, 1045]
  
  -- Metadatos
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(cliente_id, actividad_id, fecha)
);
```

### Lógica de generación:
- **Momento:** Al comprar una actividad (`POST /api/enrollments/direct`)
- **Cantidad:** Se generan **TODAS** las filas para toda la duración de la actividad
- **Fuente:** `planificacion_ejercicios` + `periodos`
- **Cálculo de semanas:** Considera ciclos de períodos y repetición

### Ejemplo de registro:
```json
{
  "cliente_id": "00dedc23-0b17-4e50-b84e-b2e8100dc93c",
  "actividad_id": 78,
  "enrollment_id": 143,
  "fecha": "2025-10-18",
  "ejercicios_completados": [],
  "ejercicios_pendientes": [1042, 1043]
}
```

---

## 📊 Estructura de `planificacion_ejercicios`

**Uso:** 🔵 Coach 🔵 Cliente (Lectura) | 🟠 Solo Coach (Escritura)

### Columnas:

```sql
CREATE TABLE planificacion_ejercicios (
  id SERIAL PRIMARY KEY,
  actividad_id INTEGER REFERENCES activities(id),
  numero_semana INTEGER,              -- Semana del ciclo (1, 2, 3...)
  
  -- Arrays JSON de IDs de ejercicios por día
  lunes JSONB,                        -- [{"ejercicioId": 1042, "orden": 1}, ...]
  martes JSONB,
  miercoles JSONB,
  jueves JSONB,
  viernes JSONB,
  sabado JSONB,
  domingo JSONB,
  
  -- Metadatos
  max_semanas_planificacion INTEGER, -- Cuántas semanas de planificación hay
  fecha_creacion TIMESTAMPTZ,
  
  UNIQUE(actividad_id, numero_semana)
);
```

### Ejemplo de registro:
```json
{
  "actividad_id": 78,
  "numero_semana": 1,
  "lunes": null,
  "martes": null,
  "miercoles": "[{\"ejercicioId\": 1042, \"orden\": 1}, {\"ejercicioId\": 1043, \"orden\": 2}]",
  "jueves": "[{\"ejercicioId\": 1042, \"orden\": 1}, {\"ejercicioId\": 1043, \"orden\": 2}]",
  "viernes": null,
  "sabado": "[{\"ejercicioId\": 1042, \"orden\": 1}, {\"ejercicioId\": 1043, \"orden\": 2}]",
  "domingo": null,
  "max_semanas_planificacion": 2
}
```

---

## 📊 Estructura de `periodos`

**Uso:** 🔵 Coach 🔵 Cliente (Lectura) | 🟠 Solo Coach (Escritura)

### Columnas:

```sql
CREATE TABLE periodos (
  id SERIAL PRIMARY KEY,
  actividad_id INTEGER REFERENCES activities(id),
  numero_periodo INTEGER,            -- 1, 2, 3...
  duracion_semanas INTEGER,          -- Duración en semanas (4, 8, etc.)
  objetivo TEXT,                     -- "Fuerza", "Resistencia", etc.
  
  UNIQUE(actividad_id, numero_periodo)
);
```

### Ejemplo de uso:
```
Actividad con 3 períodos de 4 semanas cada uno:
- Período 1: 4 semanas (Semanas 1-4)
- Período 2: 4 semanas (Semanas 5-8)
- Período 3: 4 semanas (Semanas 9-12)

Con planificación de 2 semanas que se repite:
- Semana 1 del cliente → Usa planificación semana 1
- Semana 2 del cliente → Usa planificación semana 2
- Semana 3 del cliente → Usa planificación semana 1 (repite)
- Semana 4 del cliente → Usa planificación semana 2 (repite)
- Semana 5 del cliente → Usa planificación semana 1 (nuevo período)
- etc.
```

---

# 7. FLUJO DE VIDEO - ARQUITECTURA COMPLETA

## 🎬 Componentes de Video (Compartidos)

```
UniversalVideoPlayer (components/shared/video/universal-video-player.tsx)
  └─ Detecta tipo de video:
     ├─ bunnyVideoId existe → Video HTML5 + HLS.js
     │  └─ URL: https://vz-37d7814d-402.b-cdn.net/{bunnyVideoId}/playlist.m3u8
     │
     ├─ videoUrl contiene 'vimeo.com' → Iframe de Vimeo
     │  └─ URL: https://player.vimeo.com/video/{vimeoId}
     │
     └─ videoUrl es .mp4 → Video HTML5 directo
        └─ URL: {videoUrl}
```

## 🔧 Configuración de Video

### Variables de Entorno:
```env
# Bunny.net Stream
BUNNY_STREAM_API_KEY=d082be64-3f24-47b2-aa1157da7fa7-326e-4b9b
BUNNY_STREAM_LIBRARY_ID=510910
BUNNY_STREAM_CDN_URL=https://vz-37d7814d-402.b-cdn.net
NEXT_PUBLIC_BUNNY_LIBRARY_ID=510910
NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID=510910
```

### Controles del Video (UniversalVideoPlayer):
- ✅ **Play/Pause:** Click en la pantalla del video
- ✅ **Mute/Unmute:** Botón flotante en esquina inferior derecha
- ✅ **Sin toolbar:** No se muestra barra de controles
- ✅ **Autoplay:** Habilitado con mute por defecto
- ✅ **HLS.js:** Para streaming adaptativo en Chrome/Firefox
- ✅ **Soporte nativo:** Safari usa HLS nativo

---

## 📦 Flujo de Carga de Producto (Coach y Cliente)

### 1. Cliente busca producto:
```
SearchScreen
  → API: GET /api/activities/search
  → Muestra grid de ActivityCard
  → Click en card
  → Abre ClientProductModal con:
     - product.activity_media[0].bunny_video_id
     - product.activity_media[0].video_url
```

### 2. Coach ve sus productos:
```
ProductsManagementScreen (Tab Products)
  → API: GET /api/activities/search?coachId={coachId}
  → Muestra grid de ActivityCard
  → Click en card
  → Abre ClientProductModal (MISMO COMPONENTE)
```

### 3. Renderizado del video:
```typescript
// ClientProductModal (líneas 493-507)
<UniversalVideoPlayer
  videoUrl={product.activity_media[0].video_url}
  bunnyVideoId={product.activity_media[0].bunny_video_id}
  thumbnailUrl={getValidImageUrl()}
  autoPlay={true}
  muted={true}
  controls={false}
  loop={false}
/>
```

### 4. UniversalVideoPlayer inicializa HLS.js:
```typescript
// Si bunnyVideoId existe:
const source = `https://vz-37d7814d-402.b-cdn.net/${bunnyVideoId}/playlist.m3u8`

if (Hls.isSupported()) {
  const hls = new Hls({
    enableWorker: true,
    lowLatencyMode: true,
    backBufferLength: 90
  })
  hls.loadSource(source)
  hls.attachMedia(videoElement)
}
```

---

# 8. RESUMEN DE CÓDIGO COMPARTIDO

## ✅ Componentes sin duplicación:

1. **ClientProductModal**: Usado por coach y cliente
2. **UniversalVideoPlayer**: Reproductor universal
3. **ActivityCard**: Card de actividad
4. **SearchScreen**: Búsqueda de productos
5. **CoachProfileModal**: Ver perfil de coach
6. Todos los componentes de `components/ui/`

## ⚠️ Beneficios de la arquitectura compartida:

- **Mantenimiento simplificado:** Un cambio se aplica a ambos roles
- **Consistencia:** Experiencia idéntica para coach y cliente
- **Reutilización:** Menos código duplicado
- **Testing:** Probar un componente beneficia a ambos roles

---

# 9. DEPENDENCIAS Y LIBRERÍAS

## 📦 Librerías de Video

| Librería | Versión | Uso | Descripción |
|----------|---------|-----|-------------|
| `hls.js` | Latest | 🔵 Coach 🔵 Cliente | Streaming HLS adaptativo |
| `@vimeo/player` | Latest | 🔵 Coach 🔵 Cliente | Player de Vimeo (si se usa) |

## 📦 UI y Animaciones

| Librería | Versión | Uso | Descripción |
|----------|---------|-----|-------------|
| `framer-motion` | Latest | 🔵 Coach 🔵 Cliente | Animaciones |
| `lucide-react` | Latest | 🔵 Coach 🔵 Cliente | Iconos |
| `@radix-ui/*` | Latest | 🔵 Coach 🔵 Cliente | Componentes UI base |

## 📦 Datos y Estado

| Librería | Versión | Uso | Descripción |
|----------|---------|-----|-------------|
| `@supabase/supabase-js` | Latest | 🔵 Coach 🔵 Cliente | Cliente de Supabase |
| `react` | 18+ | 🔵 Coach 🔵 Cliente | Framework base |
| `next` | 15+ | 🔵 Coach 🔵 Cliente | Framework Next.js |

---

# 10. FLUJOS CLAVE COMPARTIDOS

## 🔄 Flujo de Compra de Actividad

```mermaid
Cliente busca producto
    ↓
SearchScreen → GET /api/activities/search
    ↓
Click en ActivityCard
    ↓
ClientProductModal se abre
    ↓
UniversalVideoPlayer carga video (Bunny.net + HLS.js)
    ↓
Cliente hace click en "Comprar"
    ↓
POST /api/enrollments/direct
    ├─ Crea activity_enrollments
    └─ Llama POST /api/activities/initialize-progress
       └─ Genera TODAS las filas de progreso_cliente
          (basado en planificacion_ejercicios + periodos)
    ↓
Redirecciona a ActivityScreen
```

## 🔄 Flujo de Ver Producto (Coach)

```mermaid
Coach abre tab Products
    ↓
ProductsManagementScreen → GET /api/activities/search?coachId={id}
    ↓
Click en ActivityCard
    ↓
ClientProductModal se abre (MISMO COMPONENTE)
    ↓
UniversalVideoPlayer carga video (MISMO CÓDIGO)
    ↓
Coach puede:
    ├─ Ver preview del producto
    ├─ Editar (abre CreateProductModal)
    └─ Eliminar
```

---

# 11. ARCHIVOS DE CONFIGURACIÓN CLAVE

## 📁 Variables de Entorno

**Archivo:** `.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://mgrfswrsvrzwtgilssad.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Bunny.net Stream
BUNNY_STREAM_API_KEY=d082be64-3f24-47b2-aa1157da7fa7-326e-4b9b
BUNNY_STREAM_LIBRARY_ID=510910
BUNNY_STREAM_CDN_URL=https://vz-37d7814d-402.b-cdn.net
NEXT_PUBLIC_BUNNY_LIBRARY_ID=510910
NEXT_PUBLIC_BUNNY_STREAM_LIBRARY_ID=510910

# Google OAuth (solo coach)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

# 12. CASOS DE USO ESPECÍFICOS

## 🎯 Caso 1: Cliente compra y ve actividad

**Componentes usados:**
- SearchScreen (compartido)
- ClientProductModal (compartido)
- UniversalVideoPlayer (compartido)
- ActivityScreen (solo cliente)
- TodayScreen (solo cliente)

**APIs llamadas:**
- GET /api/activities/search
- GET /api/activities/[id]/purchase-status
- POST /api/enrollments/direct
- POST /api/activities/initialize-progress
- GET /api/activities/today
- GET /api/executions/day

**Tablas accedidas:**
- activities (R)
- activity_media (R)
- activity_enrollments (W)
- progreso_cliente (W/R)
- ejercicios_detalles (R)
- planificacion_ejercicios (R)
- periodos (R)

---

## 🎯 Caso 2: Coach crea y ve producto

**Componentes usados:**
- ProductsManagementScreen (solo coach)
- CreateProductModal (solo coach)
- ClientProductModal (compartido)
- UniversalVideoPlayer (compartido)
- VideoSelectionModal (solo coach)
- WeeklyExercisePlanner (solo coach)

**APIs llamadas:**
- POST /api/activities
- POST /api/bunny/upload-video
- POST /api/save-exercise-videos
- POST /api/save-weekly-planning
- GET /api/activities/search?coachId={id}

**Tablas accedidas:**
- activities (W)
- activity_media (W)
- ejercicios_detalles (W)
- planificacion_ejercicios (W)
- periodos (W)
- coach_media (R/W)

---

## 📝 NOTAS IMPORTANTES

### 🔑 Componentes Clave Compartidos:

1. **ClientProductModal**: 
   - Nombre engañoso - NO es solo para clientes
   - Usado por coach para ver preview de productos
   - Usado por cliente para ver productos a comprar
   - **Resultado:** Experiencia consistente

2. **UniversalVideoPlayer**:
   - Maneja 3 fuentes: Bunny.net, Vimeo, MP4
   - Usa HLS.js para streaming adaptativo
   - Controles personalizados sin toolbar
   - Funciona igual para coach y cliente

3. **ActivityCard**:
   - Card genérica de producto/actividad
   - Mismo diseño en Search, Products, CoachProfile

### 🎨 Arquitectura de Componentes:

```
components/
├── shared/           ← COMPONENTES COMPARTIDOS
│   ├── video/        ← UniversalVideoPlayer, VimeoPlayer, etc.
│   ├── products/     ← ProductPreviewCard, ExpandedProductCard
│   ├── activities/   ← ActivityCard, ActivityDetailView
│   └── ui/           ← Componentes base (Button, Dialog, etc.)
│
├── client/           ← COMPONENTES SOLO CLIENTE
│   ├── activities/   ← ClientProductModal, ActivityScreen
│   ├── calendar/     ← CalendarView
│   └── progress/     ← ProgressTracker
│
├── coach/            ← COMPONENTES SOLO COACH
│   ├── clients/      ← ClientsScreen, ClientDetailsModal
│   ├── products/     ← CreateProductModal
│   └── calendar/     ← CoachCalendarScreen
│
└── mobile/           ← SCREENS PRINCIPALES
    ├── search-screen.tsx                 (compartido)
    ├── products-management-screen.tsx    (solo coach)
    └── activity-screen.tsx               (solo cliente)
```

---

## 🔍 DEBUGGING Y LOGGING

### Console logs útiles:

**ClientProductModal:**
```javascript
console.log('🎬 Video data:', {
  bunnyVideoId: product.activity_media[0].bunny_video_id,
  videoUrl: product.activity_media[0].video_url,
  thumbnail: product.activity_media[0].video_thumbnail_url
})
```

**UniversalVideoPlayer:**
```javascript
console.log('🎥 Initializing video:', {
  source: bunnyVideoId ? 'bunny' : 'direct',
  hlsSupported: Hls.isSupported(),
  autoPlay,
  muted: isMuted
})
```

**SearchScreen:**
```javascript
console.log('🔍 SearchScreen: Navegando a actividad', {
  activityId,
  activityTitle,
  fromCoachProfile
})
```

---

# 📚 DOCUMENTOS RELACIONADOS

- **DIAGRAMA_NAVEGACION_COACH.md**: Navegación completa coach y cliente
- **DIAGRAMA-PLANIFICACION-COACH.md**: Sistema de planificación y generación de fechas
- **SETUP_BUNNY.md**: Configuración de Bunny.net

---

# 6. CÁLCULO DE ESTADÍSTICAS DE PRODUCTOS

## 📊 Lógica de Cálculo de Estadísticas

### 🎯 **API Endpoint:** `/api/activities/search`

La API calcula automáticamente las estadísticas de cada producto basándose en su tipo:

### 🏃‍♂️ **Para Actividades de FITNESS:**

#### **Ejercicios:**
- **Fuente:** Tabla `ejercicios_detalles`
- **Cálculo:** `COUNT(*)` de registros únicos
- **Lógica:** Cada ejercicio es único por actividad

#### **Sesiones:**
- **Fuente:** Tabla `planificacion_ejercicios` + `periodos`
- **Cálculo:** `Días con ejercicios × Cantidad de períodos`
- **Lógica:** 
  1. Contar días únicos que tienen ejercicios en `planificacion_ejercicios`
  2. Multiplicar por `cantidad_periodos` de la tabla `periodos`

#### **Ejemplo Fitness:**
```
Actividad 78 "Pliométricos de Ronaldinho":
- Ejercicios: 2 (Flexiones, HIIT Fútbol)
- Días con ejercicios: 3 (Lunes Semana 1, Miércoles Semana 2, Jueves Semana 2)
- Períodos: 3
- Sesiones: 3 × 3 = 9 sesiones
```

### 🥗 **Para Actividades de NUTRICIÓN:**

#### **Ejercicios/Platos:**
- **Fuente:** Tabla `nutrition_program_details`
- **Cálculo:** `COUNT(*)` de registros únicos
- **Lógica:** Cada plato es único por actividad

#### **Sesiones:**
- **Cálculo:** `Mismo número que ejercicios/platos`
- **Lógica:** Cada plato = 1 sesión de comida

#### **Ejemplo Nutrición:**
```
Actividad 90 "Programa Nutricional Test":
- Ejercicios/Platos: 1 (Ensalada Keto)
- Sesiones: 1 (cada plato = 1 sesión)
```

### 🔧 **Implementación Técnica:**

```typescript
// Detección automática del tipo
const isNutrition = actividad?.categoria === 'nutricion' || actividad?.type === 'nutrition'

if (isNutrition) {
  // Usar nutrition_program_details
  ejerciciosCount = platos?.length || 0
  totalSessions = ejerciciosCount // 1:1
} else {
  // Usar ejercicios_detalles + planificacion_ejercicios + periodos
  ejerciciosCount = ejercicios?.length || 0
  totalSessions = diasConEjercicios × cantidad_periodos
}
```

### 📋 **Tablas Involucradas:**

| Tipo | Ejercicios | Sesiones | Tablas |
|------|------------|----------|--------|
| **Fitness** | `ejercicios_detalles` | `planificacion_ejercicios` + `periodos` | `ejercicios_detalles`, `planificacion_ejercicios`, `periodos` |
| **Nutrición** | `nutrition_program_details` | `nutrition_program_details` | `nutrition_program_details` |

### 🎯 **Resultado en UI:**
- **ActivityCard:** Muestra `totalSessions` y `exercisesCount`
- **ClientProductModal:** Muestra estadísticas en la card del producto
- **Coach/Cliente:** Misma experiencia visual para ambos roles

---

## ✅ CONCLUSIONES

### Código Compartido (Sin Duplicación):
- `ClientProductModal` → Coach y Cliente
- `UniversalVideoPlayer` → Coach y Cliente  
- `ActivityCard` → Coach y Cliente
- `SearchScreen` → Coach y Cliente
- Todos los `components/ui/*` → Coach y Cliente

### Ventajas:
- ✅ Mantenimiento centralizado
- ✅ Experiencia consistente
- ✅ Menos bugs
- ✅ Código más limpio

### Recomendaciones:
- Continuar usando componentes compartidos
- Documentar cuando se agregue funcionalidad específica de rol
- Usar props condicionales en lugar de duplicar componentes

