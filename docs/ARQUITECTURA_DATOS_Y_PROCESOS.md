# 🏗️ Arquitectura de Datos y Procesos Web - Guía Completa

## 📋 Índice
1. [Procesos Más Comunes en la Web](#procesos-más-comunes-en-la-web)
2. [Jerarquía y Prioridad de Datos](#jerarquía-y-prioridad-de-datos)
3. [Técnicas de Optimización](#técnicas-de-optimización)
4. [Dónde Guardar Cada Tipo de Dato](#dónde-guardar-cada-tipo-de-dato)
5. [Estrategias por Tipo de Datos](#estrategias-por-tipo-de-datos)
6. [Implementación Actual en Omnia](#implementación-actual-en-omnia)

---

## 🔄 Procesos Más Comunes en la Web

### 1. **Caché en Capas (Multi-Layer Caching)**

La estrategia de caché en capas es fundamental para optimizar el rendimiento:

```
┌─────────────────────────────────────────────────────────┐
│                    CAPA 1: CDN                          │
│  - Contenido estático (imágenes, videos, CSS, JS)      │
│  - TTL: 1-7 días                                        │
│  - Ejemplo: Bunny.net CDN, Cloudflare                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    CAPA 2: Redis                        │
│  - Datos frecuentemente consultados                    │
│  - Sesiones de usuario                                  │
│  - Resultados de búsquedas                              │
│  - TTL: 5-30 minutos                                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    CAPA 3: Memoria                      │
│  - Datos del usuario actual                            │
│  - Estado de la aplicación                              │
│  - TTL: Durante la sesión                              │
│  - Ejemplo: React State, Context API                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    CAPA 4: Base de Datos                │
│  - Fuente de verdad                                     │
│  - Datos persistentes                                   │
│  - Ejemplo: Supabase (PostgreSQL)                      │
└─────────────────────────────────────────────────────────┘
```

**Prioridad de Consulta:**
1. CDN (más rápido, contenido estático)
2. Redis (muy rápido, datos dinámicos en memoria)
3. Memoria del navegador (rápido, datos de sesión)
4. Base de datos (más lento, fuente de verdad)

---

### 2. **Lazy Loading y Code Splitting**

**Proceso:**
- Cargar componentes solo cuando son necesarios
- Dividir el código en chunks más pequeños
- Precargar recursos críticos

**Ejemplo en Next.js:**
```typescript
// Lazy loading de componentes
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <LoadingSpinner />,
  ssr: false // Solo cargar en cliente si no necesita SSR
})

// Lazy loading de imágenes
import Image from 'next/image'
<Image
  src="/image.jpg"
  loading="lazy" // Precarga cuando está cerca del viewport
  placeholder="blur"
/>
```

**Cuándo usar:**
- ✅ Componentes pesados (modales, gráficos, editores)
- ✅ Imágenes que no están en viewport inicial
- ✅ Rutas que no se visitan frecuentemente
- ✅ Bibliotecas grandes (charting, video players)

---

### 3. **Throttling y Debouncing**

**Diferencias clave:**

| Técnica | Cuándo Ejecuta | Caso de Uso |
|---------|---------------|-------------|
| **Throttling** | Ejecuta a intervalos fijos | Scroll, resize, mouse move |
| **Debouncing** | Ejecuta después de pausa | Búsqueda, input de texto, validación |

**Ejemplo de Throttling:**
```typescript
// Ejecuta máximo 1 vez por segundo
const throttledScroll = throttle(() => {
  console.log('Scrolling...')
}, 1000)

window.addEventListener('scroll', throttledScroll)
```

**Ejemplo de Debouncing:**
```typescript
// Ejecuta 500ms después de que el usuario deja de escribir
const debouncedSearch = debounce((query: string) => {
  fetch(`/api/search?q=${query}`)
}, 500)

input.addEventListener('input', (e) => {
  debouncedSearch(e.target.value)
})
```

**Cuándo usar cada uno:**

**Throttling:**
- Scroll events
- Resize events
- Mouse move tracking
- Logging de errores (evitar spam)

**Debouncing:**
- Búsquedas en tiempo real
- Validación de formularios
- Auto-guardado
- Input de texto

---

### 4. **Request Batching y Deduplication**

**Proceso:**
- Agrupar múltiples requests en uno solo
- Evitar requests duplicados
- Usar GraphQL o endpoints batch

**Ejemplo:**
```typescript
// En lugar de múltiples requests:
// GET /api/exercise/1
// GET /api/exercise/2
// GET /api/exercise/3

// Usar batch endpoint:
// GET /api/exercises?ids=1,2,3
```

---

### 5. **Background Refresh (Stale-While-Revalidate)**

**Proceso:**
1. Mostrar datos cacheados inmediatamente
2. Refrescar en background
3. Actualizar UI cuando lleguen datos frescos

**Flujo:**
```
Usuario solicita datos
  ↓
¿Hay caché válida?
  ├─ SÍ → Mostrar caché inmediatamente
  │         ↓
  │       Refrescar en background
  │         ↓
  │       Actualizar UI cuando lleguen datos frescos
  │
  └─ NO → Cargar datos frescos
           ↓
         Mostrar datos
           ↓
         Guardar en caché
```

---

## 📊 Jerarquía y Prioridad de Datos

### **Niveles de Prioridad**

```
┌─────────────────────────────────────────────────────────┐
│  NIVEL 1: CRÍTICO (Inmediato)                          │
│  - Autenticación del usuario                           │
│  - Datos del usuario actual                            │
│  - Permisos y roles                                    │
│  - Estado de sesión                                    │
│  Guardado: Memoria + Redis + BD                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  NIVEL 2: ALTA PRIORIDAD (1-5 segundos)                │
│  - Datos visibles en pantalla actual                   │
│  - Navegación activa                                    │
│  - Datos de formularios en edición                     │
│  Guardado: Memoria + Caché + BD                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  NIVEL 3: MEDIA PRIORIDAD (5-30 segundos)              │
│  - Datos de pantallas relacionadas                     │
│  - Búsquedas recientes                                 │
│  - Historial de navegación                             │
│  Guardado: Caché + BD                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  NIVEL 4: BAJA PRIORIDAD (30+ segundos o lazy)         │
│  - Datos de pantallas no visitadas                     │
│  - Contenido relacionado                               │
│  - Estadísticas y métricas                             │
│  Guardado: BD (cargar bajo demanda)                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Técnicas de Optimización

### **1. Redis (Caché en Memoria)**

**Cuándo usar Redis:**
- ✅ Datos consultados frecuentemente
- ✅ Resultados de búsquedas
- ✅ Sesiones de usuario
- ✅ Datos que cambian poco
- ✅ Rate limiting
- ✅ Contadores y estadísticas en tiempo real

**Cuándo NO usar Redis:**
- ❌ Datos que cambian constantemente
- ❌ Datos que se consultan una sola vez
- ❌ Datos muy grandes (mejor usar BD)
- ❌ Datos transaccionales críticos

**Estrategia de TTL en Redis:**
```typescript
// Datos que cambian poco
SETEX user:123 3600 {userData} // 1 hora

// Datos que cambian moderadamente
SETEX activities:search 300 {results} // 5 minutos

// Datos que cambian frecuentemente
SETEX metrics:real-time 60 {metrics} // 1 minuto
```

**Estructura de Keys recomendada:**
```
user:{userId}                    // Datos del usuario
session:{sessionId}              // Sesión de usuario
search:{queryHash}               // Resultados de búsqueda
activities:{coachId}:{filters}   // Actividades filtradas
cache:{resource}:{id}            // Caché genérica
```

---

### **2. LocalStorage vs SessionStorage vs IndexedDB**

| Almacenamiento | Capacidad | Persistencia | Caso de Uso |
|----------------|-----------|--------------|-------------|
| **LocalStorage** | ~5-10 MB | Persiste entre sesiones | Preferencias, tokens, datos offline |
| **SessionStorage** | ~5-10 MB | Solo sesión actual | Datos temporales, estado de formularios |
| **IndexedDB** | ~50+ MB | Persiste entre sesiones | Datos grandes, offline-first, archivos |

**Estrategia en Omnia:**
```typescript
// LocalStorage: Datos que persisten entre sesiones
localStorage.setItem('user_preferences', JSON.stringify(prefs))
localStorage.setItem('auth_token', token)

// SessionStorage: Datos de la sesión actual
sessionStorage.setItem('current_tab', 'products')
sessionStorage.setItem('form_draft', JSON.stringify(formData))

// IndexedDB: Datos grandes o offline-first
// (Para implementación futura)
```

---

### **3. Lazy Loading de Componentes**

**Next.js Dynamic Imports:**
```typescript
// Cargar componente solo cuando se necesita
const CreateProductModal = dynamic(
  () => import('./CreateProductModal'),
  {
    loading: () => <SkeletonLoader />,
    ssr: false // No necesita SSR
  }
)

// Cargar con prefetch
const VideoPlayer = dynamic(
  () => import('./VideoPlayer'),
  {
    loading: () => <VideoPlaceholder />,
    ssr: false
  }
)
```

**Lazy Loading de Rutas:**
```typescript
// Next.js automáticamente hace code splitting por rutas
// Cada página en app/ es un chunk separado
```

**Lazy Loading de Imágenes:**
```typescript
// Next.js Image con lazy loading nativo
<Image
  src="/image.jpg"
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

---

### **4. Throttling y Debouncing**

**Implementación de Throttling:**
```typescript
function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Uso
const throttledScroll = throttle(() => {
  updateScrollPosition()
}, 100) // Máximo cada 100ms
```

**Implementación de Debouncing:**
```typescript
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return function(this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

// Uso
const debouncedSearch = debounce((query: string) => {
  performSearch(query)
}, 300) // Ejecuta 300ms después de que se deja de escribir
```

**Hook React para Debouncing:**
```typescript
// hooks/shared/use-debounce.ts (ya existe)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

---

### **5. Request Deduplication**

**Proceso:**
Evitar múltiples requests simultáneos para el mismo recurso.

**Implementación:**
```typescript
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()

  async request<T>(
    key: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Si ya hay un request pendiente, reutilizarlo
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // Crear nuevo request
    const promise = fetchFn().finally(() => {
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, promise)
    return promise
  }
}

// Uso
const deduplicator = new RequestDeduplicator()

// Múltiples componentes pueden llamar esto simultáneamente
// Solo se ejecutará un request
const userData = await deduplicator.request(
  `user-${userId}`,
  () => fetchUser(userId)
)
```

---

### **6. Prefetching y Preloading**

**Prefetching:**
- Cargar recursos que probablemente se necesitarán
- Usar `<link rel="prefetch">` para recursos
- Usar `router.prefetch()` en Next.js

**Preloading:**
- Cargar recursos críticos inmediatamente
- Usar `<link rel="preload">` para recursos críticos

**Estrategia:**
```typescript
// Prefetch de rutas relacionadas
useEffect(() => {
  // Cuando usuario está en página de productos
  router.prefetch('/products/create')
  router.prefetch('/products/[id]')
}, [])

// Prefetch de datos relacionados
useEffect(() => {
  // Precargar datos relacionados después de 1 segundo
  const timer = setTimeout(() => {
    prefetchRelatedData()
  }, 1000)
  return () => clearTimeout(timer)
}, [])
```

---

## 💾 Dónde Guardar Cada Tipo de Dato

### **Tabla de Decisión**

| Tipo de Dato | Frecuencia de Lectura | Frecuencia de Escritura | Tamaño | Guardado En |
|--------------|----------------------|------------------------|--------|-------------|
| **Perfil de usuario** | Alta | Baja | Pequeño | Redis (1h) + BD |
| **Token de autenticación** | Alta | Baja | Pequeño | LocalStorage + Redis |
| **Lista de actividades** | Alta | Media | Medio | Redis (5min) + BD |
| **Búsquedas recientes** | Media | Alta | Pequeño | SessionStorage |
| **Datos de formulario** | Alta | Alta | Pequeño | SessionStorage + BD |
| **Videos e imágenes** | Media | Baja | Grande | CDN (Bunny.net) |
| **Progreso del cliente** | Alta | Alta | Medio | BD + Caché (1min) |
| **Estadísticas** | Baja | Media | Pequeño | BD + Redis (1h) |
| **Logs de errores** | Baja | Alta | Pequeño | BD (batch) |

---

### **Estrategia por Tipo de Datos**

#### **1. Datos de Usuario (Perfil, Autenticación)**

**Jerarquía:**
```
1. Memoria (React State/Context)
   - Durante la sesión actual
   - TTL: Hasta que se cierra la app

2. LocalStorage
   - Token de autenticación
   - Preferencias del usuario
   - TTL: Hasta que expira o logout

3. Redis (si está disponible)
   - Perfil completo del usuario
   - TTL: 1 hora
   - Key: user:{userId}

4. Base de Datos
   - Fuente de verdad
   - Actualización persistente
```

**Implementación:**
```typescript
// Cargar desde caché primero
const userData = await getFromCache(`user:${userId}`)
  || await fetchFromDB(`users/${userId}`)
  || await getFromLocalStorage('user_data')
```

---

#### **2. Datos de Productos/Actividades**

**Jerarquía:**
```
1. Redis (si está disponible)
   - Lista de productos filtrados
   - TTL: 5 minutos
   - Key: activities:{coachId}:{filtersHash}

2. Caché en memoria (React State)
   - Datos de la pantalla actual
   - TTL: Hasta cambio de pantalla

3. Base de Datos
   - Fuente de verdad
   - Consultas complejas
```

**Implementación:**
```typescript
// Buscar en múltiples capas
const activities = await getFromRedis(`activities:${coachId}:${filters}`)
  || await fetchFromAPI(`/api/activities/search?coachId=${coachId}`)
  // Guardar en Redis para próxima vez
```

---

#### **3. Datos de Progreso (Tiempo Real)**

**Jerarquía:**
```
1. Memoria (React State)
   - Estado actual del progreso
   - TTL: Durante la sesión

2. LocalStorage/SessionStorage
   - Borrador de progreso
   - TTL: Hasta guardar o cerrar sesión

3. Base de Datos
   - Guardado inmediato
   - Sincronización con servidor
```

**Implementación:**
```typescript
// Guardar inmediatamente en BD
// Mostrar optimista desde memoria
const updateProgress = async (progress) => {
  // Actualización optimista
  setLocalProgress(progress)
  
  // Guardar en BD
  await saveToDB(progress)
  
  // Invalidar caché
  invalidateCache(`progress:${clientId}`)
}
```

---

#### **4. Multimedia (Videos, Imágenes)**

**Jerarquía:**
```
1. CDN (Bunny.net, Cloudflare)
   - Distribución global
   - Caché automática
   - TTL: 7 días

2. Base de Datos (Solo metadatos)
   - URLs de los archivos
   - Información de almacenamiento
   - TTL: Indefinido
```

**Implementación:**
```typescript
// URLs vienen de BD pero archivos están en CDN
const videoUrl = activity.media.video_url // URL de CDN
// CDN maneja automáticamente el caché
```

---

## 🎯 Estrategias por Tipo de Datos

### **Datos Estáticos (Raramente Cambian)**

**Ejemplos:**
- Lista de tipos de ejercicios
- Niveles de dificultad
- Categorías de productos

**Estrategia:**
- ✅ Guardar en Redis con TTL largo (24 horas)
- ✅ Cachear en memoria de la app
- ✅ Invalidar solo cuando hay cambios

```typescript
// Cargar una vez y mantener en memoria
const exerciseTypes = await getFromCache('exercise_types', {
  ttl: 24 * 60 * 60 * 1000, // 24 horas
  persistKey: 'exercise_types'
})
```

---

### **Datos Dinámicos (Cambian Frecuentemente)**

**Ejemplos:**
- Progreso del cliente
- Estadísticas en tiempo real
- Estado de ejercicios

**Estrategia:**
- ✅ No cachear o TTL muy corto (1-5 minutos)
- ✅ Actualización optimista en UI
- ✅ Sincronización con servidor

```typescript
// No cachear, siempre consultar BD
const progress = await fetchFromDB(`progress/${clientId}`)
```

---

### **Datos de Búsqueda**

**Ejemplos:**
- Resultados de búsqueda de productos
- Filtros aplicados
- Búsquedas recientes

**Estrategia:**
- ✅ Redis con TTL corto (5 minutos)
- ✅ Debouncing en input
- ✅ Cachear por query hash

```typescript
// Cachear resultados de búsqueda
const queryHash = hashQuery(filters)
const results = await getFromRedis(`search:${queryHash}`, {
  ttl: 5 * 60 * 1000, // 5 minutos
  fetchFn: () => searchProducts(filters)
})
```

---

### **Datos de Sesión**

**Ejemplos:**
- Estado de la aplicación
- Datos del formulario actual
- Navegación activa

**Estrategia:**
- ✅ SessionStorage para datos temporales
- ✅ Memoria para estado reactivo
- ✅ No persistir en BD hasta submit

```typescript
// Guardar en sessionStorage
sessionStorage.setItem('form_draft', JSON.stringify(formData))

// Recuperar al cargar
const draft = sessionStorage.getItem('form_draft')
```

---

## 🔧 Implementación Actual en Omnia

### **1. Sistema de Caché (useOptimizedCache)**

**Ubicación:** `hooks/shared/use-optimized-cache.ts`

**Características:**
- ✅ TTL configurable
- ✅ Refresco en background
- ✅ Persistencia en localStorage
- ✅ Estadísticas de uso

**Uso:**
```typescript
const { data, isLoading, error, fetchData } = useOptimizedCache(
  'activities',
  () => fetch('/api/activities').then(r => r.json()),
  {
    ttl: 5 * 60 * 1000, // 5 minutos
    maxAge: 3 * 60 * 1000, // 3 minutos para refresh
    backgroundRefresh: true,
    persistKey: 'activities_cache'
  }
)
```

**Estrategia de Caché:**
```
1. Verificar localStorage (persistKey)
   ↓ (si expiró o no existe)
2. Verificar caché en memoria
   ↓ (si expiró o no existe)
3. Cargar desde API
   ↓
4. Guardar en memoria y localStorage
   ↓
5. Si está cerca de expirar, refrescar en background
```

---

### **2. Smart Data Loader (useSmartDataLoader)**

**Ubicación:** `hooks/shared/use-smart-data-loader.ts`

**Características:**
- ✅ Precarga datos relacionados
- ✅ Retry automático
- ✅ Detección de tipo de datos
- ✅ Estrategias de caché adaptativas

**Estrategias de Caché por Tipo:**
```typescript
// Datos que cambian poco (coaches, perfiles)
getCacheStrategy('coach') → 'persistent'
  - TTL: 10 minutos
  - Persistencia: localStorage

// Datos que cambian moderadamente (actividades)
getCacheStrategy('activity') → 'shortTerm'
  - TTL: 5 minutos
  - Persistencia: sessionStorage

// Datos que cambian frecuentemente (métricas)
getCacheStrategy('metrics') → 'optimized'
  - TTL: 1 minuto
  - Sin persistencia
```

---

### **3. Throttling de Logs**

**Ubicación:** `lib/logging/log-throttler.ts`

**Características:**
- ✅ Evita spam de logs
- ✅ Ventana de tiempo: 10 segundos
- ✅ Máximo 5 logs por ventana
- ✅ Silencio de 30 segundos después del límite

**Uso:**
```typescript
import { throttledLog } from '@/lib/logging/log-throttler'

// En lugar de console.log directamente
throttledLog.log('error-key', 'Error message', errorData)
```

---

### **4. Debouncing para Búsquedas**

**Ubicación:** `hooks/shared/use-debounce.ts`

**Uso:**
```typescript
const [searchQuery, setSearchQuery] = useState('')
const debouncedQuery = useDebounce(searchQuery, 300)

useEffect(() => {
  if (debouncedQuery) {
    performSearch(debouncedQuery)
  }
}, [debouncedQuery])
```

---

## 📈 Recomendaciones para Omnia

### **1. Implementar Redis**

**Prioridad: ALTA**

**Beneficios:**
- Reducir carga en Supabase
- Mejorar tiempos de respuesta
- Manejar sesiones de usuario
- Rate limiting

**Datos a cachear en Redis:**
```typescript
// Perfiles de usuarios
SETEX user:{userId} 3600 {userData}

// Lista de productos por coach
SETEX activities:{coachId}:{filters} 300 {activities}

// Resultados de búsqueda
SETEX search:{queryHash} 300 {results}

// Estadísticas del coach
SETEX stats:{coachId} 600 {stats}
```

**Implementación sugerida:**
```typescript
// lib/redis/client.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function getFromRedis<T>(key: string): Promise<T | null> {
  const data = await redis.get(key)
  return data ? JSON.parse(data) : null
}

export async function setInRedis<T>(
  key: string,
  value: T,
  ttl: number = 300
): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(value))
}
```

---

### **2. Lazy Loading de Componentes Pesados**

**Componentes candidatos:**
- ✅ `CreateProductModal` (solo se carga al crear producto)
- ✅ `VideoSelectionModal` (solo al seleccionar video)
- ✅ `WeeklyExercisePlanner` (solo en paso 5)
- ✅ Gráficos y visualizaciones

**Implementación:**
```typescript
// En lugar de import directo
import CreateProductModal from './CreateProductModal'

// Usar dynamic import
const CreateProductModal = dynamic(
  () => import('./CreateProductModal'),
  {
    loading: () => <ModalSkeleton />,
    ssr: false
  }
)
```

---

### **3. Prefetching de Datos Relacionados**

**Estrategia:**
```typescript
// Cuando usuario está en ProductsScreen
useEffect(() => {
  // Precargar datos relacionados después de 2 segundos
  const timer = setTimeout(() => {
    // Precargar estadísticas
    prefetch('/api/product-stats')
    
    // Precargar planificación si está editando
    if (editingProductId) {
      prefetch(`/api/get-product-planning?id=${editingProductId}`)
    }
  }, 2000)
  
  return () => clearTimeout(timer)
}, [])
```

---

### **4. Request Deduplication**

**Implementar para:**
- Búsquedas simultáneas
- Carga de productos
- Datos de perfil

**Ejemplo:**
```typescript
// lib/utils/request-deduplicator.ts
class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>()
  
  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key)!
    }
    
    const promise = fn().finally(() => {
      this.pending.delete(key)
    })
    
    this.pending.set(key, promise)
    return promise
  }
}

export const requestDeduplicator = new RequestDeduplicator()
```

---

### **5. Estrategia de Caché por Endpoint**

**Tabla de TTL recomendada:**

| Endpoint | TTL | Persistencia | Invalidación |
|----------|-----|--------------|--------------|
| `/api/coaches` | 10 min | localStorage | Al cambiar perfil |
| `/api/activities/search` | 5 min | sessionStorage | Al crear/editar producto |
| `/api/activities/today` | 1 min | sessionStorage | Al completar ejercicio |
| `/api/coach/clients` | 5 min | sessionStorage | Al agregar cliente |
| `/api/product-stats/[id]` | 10 min | sessionStorage | Al cambiar planificación |
| `/api/activity-exercises/[id]` | 3 min | sessionStorage | Al desactivar ejercicio |

---

## 🎯 Mejores Prácticas

### **1. Principio de Menor Privilegio**

**Regla:**
- Guardar datos en el nivel más bajo posible que cumpla los requisitos
- No usar Redis si sessionStorage es suficiente
- No usar BD si memoria es suficiente

**Ejemplo:**
```typescript
// ❌ MAL: Guardar estado de formulario en BD
await saveToDB(formData) // Cada cambio

// ✅ BIEN: Guardar en sessionStorage
sessionStorage.setItem('form_draft', JSON.stringify(formData))
// Solo guardar en BD al submit
```

---

### **2. Invalidación de Caché**

**Estrategia:**
- Invalidar cuando se modifica el recurso
- Invalidar por tags (todos los recursos relacionados)
- Invalidar por tiempo (TTL)

**Implementación:**
```typescript
// Invalidar caché específica
invalidateCache('activities:123')

// Invalidar por patrón
invalidateCachePattern('activities:*')

// Invalidar por tag
invalidateCacheTag('coach-products')
```

---

### **3. Actualización Optimista**

**Estrategia:**
1. Actualizar UI inmediatamente
2. Enviar request al servidor
3. Revertir si falla

**Ejemplo:**
```typescript
const toggleExercise = async (exerciseId: number) => {
  // 1. Actualización optimista
  setExercises(prev => prev.map(ex => 
    ex.id === exerciseId 
      ? { ...ex, completed: !ex.completed }
      : ex
  ))
  
  try {
    // 2. Guardar en servidor
    await fetch('/api/toggle-exercise', {
      method: 'POST',
      body: JSON.stringify({ exerciseId })
    })
  } catch (error) {
    // 3. Revertir si falla
    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId 
        ? { ...ex, completed: !ex.completed }
        : ex
    ))
    showError('Error al guardar')
  }
}
```

---

### **4. Paginación y Lazy Loading**

**Para listas grandes:**
```typescript
// Usar paginación en lugar de cargar todo
const [page, setPage] = useState(1)
const { data, hasMore } = useInfiniteQuery(
  ['activities', page],
  () => fetchActivities({ page, limit: 20 })
)

// Lazy load más datos al hacer scroll
const loadMore = () => {
  if (hasMore) {
    setPage(prev => prev + 1)
  }
}
```

---

### **5. Batch Requests**

**Agrupar múltiples requests:**
```typescript
// ❌ MAL: Múltiples requests
const exercises = await Promise.all([
  fetch('/api/exercise/1'),
  fetch('/api/exercise/2'),
  fetch('/api/exercise/3')
])

// ✅ BIEN: Un solo request batch
const exercises = await fetch('/api/exercises?ids=1,2,3')
```

---

## 📊 Diagrama de Flujo de Datos

```
┌─────────────────────────────────────────────────────────┐
│                    USUARIO HACE REQUEST                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│          1. Verificar Caché en Memoria                  │
│          (React State/Context)                          │
└─────────────────────────────────────────────────────────┘
         ↓ (cache hit)              ↓ (cache miss)
┌─────────────────────┐   ┌─────────────────────────────────┐
│  Retornar Datos     │   │  2. Verificar LocalStorage      │
│  (inmediato)        │   │  (persistKey)                   │
└─────────────────────┘   └─────────────────────────────────┘
                                  ↓ (cache hit)    ↓ (cache miss)
                          ┌──────────────┐   ┌──────────────────────┐
                          │ Retornar     │   │ 3. Verificar Redis   │
                          │ (rápido)     │   │ (si está disponible) │
                          └──────────────┘   └──────────────────────┘
                                             ↓ (cache hit)  ↓ (cache miss)
                                     ┌──────────────┐   ┌──────────────────┐
                                     │ Retornar     │   │ 4. Consultar BD  │
                                     │ (muy rápido) │   │ (más lento)      │
                                     └──────────────┘   └──────────────────┘
                                                               ↓
                                                      ┌────────────────────┐
                                                      │  Guardar en Caché  │
                                                      │  (Redis + Memoria) │
                                                      └────────────────────┘
                                                               ↓
                                                      ┌────────────────────┐
                                                      │  Retornar Datos    │
                                                      └────────────────────┘
```

---

## 🔍 Checklist de Optimización

### **Para cada tipo de dato, preguntarse:**

1. ✅ ¿Con qué frecuencia se lee?
2. ✅ ¿Con qué frecuencia se escribe?
3. ✅ ¿Qué tan grande es?
4. ✅ ¿Cuánto tiempo puede estar desactualizado?
5. ✅ ¿Es crítico para la funcionalidad?
6. ✅ ¿Necesita persistencia entre sesiones?

### **Decisión de almacenamiento:**

```
Frecuencia de lectura = ALTA
  → Caché en memoria o Redis

Frecuencia de escritura = ALTA
  → No cachear o TTL muy corto

Tamaño = GRANDE
  → CDN o IndexedDB

Tiempo de desactualización = CORTO
  → TTL corto o no cachear

Crítico = SÍ
  → BD + Caché + Validación

Persistencia = SÍ
  → BD + LocalStorage
```

---

## 📚 Referencias y Recursos

### **Documentos Relacionados en Omnia:**
- `DIAGRAMA_NAVEGACION_COACH.md` - Flujo de navegación
- `ARQUITECTURA_COMPARTIDA.md` - Arquitectura de componentes
- `DIAGRAMA-PLANIFICACION-COACH.md` - Sistema de planificación

### **Implementaciones Actuales:**
- `hooks/shared/use-optimized-cache.ts` - Sistema de caché
- `hooks/shared/use-smart-data-loader.ts` - Loader inteligente
- `lib/logging/log-throttler.ts` - Throttling de logs
- `hooks/shared/use-debounce.ts` - Debouncing

### **Tecnologías Utilizadas:**
- **Next.js 15** - Framework con SSR y optimizaciones automáticas
- **Supabase** - Base de datos PostgreSQL
- **Bunny.net** - CDN para videos e imágenes
- **React Query** (opcional) - Gestión de estado de servidor

---

## 🚀 Próximos Pasos Recomendados

1. **Implementar Redis** para caché de servidor
2. **Agregar lazy loading** a componentes pesados
3. **Implementar request deduplication** para evitar requests duplicados
4. **Agregar prefetching** de datos relacionados
5. **Optimizar imágenes** con Next.js Image component
6. **Implementar service workers** para offline-first (futuro)

---

**Última actualización:** Diciembre 2024  
**Versión:** 1.0  
**Autor:** Sistema Omnia































