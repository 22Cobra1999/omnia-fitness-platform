# 📊 TABLA COMPLETA DE FLUJOS UX - OMNIA

## 🎯 TODAS LAS INTERACCIONES MAPEADAS

### 📱 CLIENTE - Tabla Detallada

| # | Pantalla Origen | Elemento/Acción | Pantalla Destino | Tipo | APIs Involucradas | Notas |
|---|----------------|-----------------|------------------|------|-------------------|-------|
| **SEARCH TAB** |
| 1 | SearchScreen | Tab "Coaches" | SearchScreen | Tab interno | GET /api/coaches | Muestra lista de coaches |
| 2 | SearchScreen | Tab "Activities" | SearchScreen | Tab interno | GET /api/activities/search | Muestra lista de actividades |
| 3 | SearchScreen | Click en Coach Card | CoachProfileModal | Modal | - | Abre perfil del coach |
| 4 | SearchScreen | Click en Activity Card | ClientProductModal | Modal | GET /api/activities/[id]/purchase-status | Abre detalles del producto |
| 5 | SearchScreen | Filtrar búsqueda | SearchScreen | Update | GET /api/search-coaches | Actualiza resultados |
| **ACTIVITY TAB** |
| 6 | ActivityScreen | Click en Programa Activo | TodayScreen | Navigate | GET /api/activities/[id]/first-day<br/>GET /api/activities/today | Abre ejercicios del día |
| 7 | ActivityScreen | Ver progreso | ActivityScreen | Update | GET /api/get-product-planning | Muestra stats |
| **TODAY SCREEN** |
| 8 | TodayScreen | Click checkbox ejercicio | TodayScreen | Update | PUT /api/ejecuciones-ejercicio | Marca como completado |
| 9 | TodayScreen | Botón "Siguiente día ▶" | TodayScreen | Update | GET /api/executions/day | Carga ejercicios del día siguiente |
| 10 | TodayScreen | Botón "◀ Día anterior" | TodayScreen | Update | GET /api/executions/day | Carga ejercicios del día anterior |
| 11 | TodayScreen | Botón "Volver" | ActivityScreen | Navigate | - | Regresa a lista de actividades |
| **CALENDAR TAB** |
| 12 | CalendarScreen | Click en día con actividad | ActivityScreen | Navigate | - | Navega a actividad del día |
| 13 | CalendarScreen | Navegar mes | CalendarScreen | Update | - | Cambia mes visible |
| **PROFILE TAB** |
| 14 | ProfileScreen | Click en avatar | ProfileScreen | Update | Supabase Storage | Sube nuevo avatar |
| 15 | ProfileScreen | Editar biométricas | ProfileScreen | Update | PUT /api/profile/biometrics | Actualiza peso, altura, etc |
| 16 | ProfileScreen | Agregar lesión | ProfileScreen | Modal | PUT /api/profile/injuries | Abre modal de nueva lesión |
| 17 | ProfileScreen | Eliminar lesión | ProfileScreen | Update | PUT /api/profile/injuries | Elimina lesión |
| **CLIENT PRODUCT MODAL** |
| 18 | ClientProductModal | Botón "Comprar" | ActivityScreen | Navigate | POST /api/enrollments | Inscribe y va a mis actividades |
| 19 | ClientProductModal | "Ver coach" link | CoachProfileModal | Modal | - | Abre perfil del coach |
| 20 | ClientProductModal | Botón "✕" | SearchScreen | Close | - | Cierra modal |
| **COMMUNITY TAB** |
| 21 | CommunityScreen | Tab "For You" | CommunityScreen | Tab interno | - | Muestra feed personalizado |
| 22 | CommunityScreen | Tab "Following" | CommunityScreen | Tab interno | - | Muestra coaches seguidos |
| 23 | CommunityScreen | Like post | CommunityScreen | Update | - | Da like |
| 24 | CommunityScreen | Comentar | CommunityScreen | Update | - | Agrega comentario |

---

### 👨‍💼 COACH - Tabla Detallada

| # | Pantalla Origen | Elemento/Acción | Pantalla Destino | Tipo | APIs Involucradas | Notas |
|---|----------------|-----------------|------------------|------|-------------------|-------|
| **CLIENTS TAB** |
| 1 | ClientsScreen | Click en Client Card | ClientDetailsModal | Modal | GET /api/coach/clients/[id]/details | Abre detalles del cliente |
| 2 | ClientsScreen | Buscar cliente | ClientsScreen | Update | GET /api/coach/clients | Filtra lista |
| 3 | ClientDetailsModal | Botón "✕" | ClientsScreen | Close | - | Cierra modal |
| **PRODUCTS TAB** |
| 4 | ProductsManagementScreen | Botón "+ Crear Producto" | CreateProductModal | Modal | - | Abre wizard vacío |
| 5 | ProductsManagementScreen | Botón "✏️ Editar" | CreateProductModal | Modal | GET /api/get-product-planning<br/>GET /api/activity-exercises/[id] | Abre wizard con datos |
| 6 | ProductsManagementScreen | Toggle "Meet 30min" | ProductsManagementScreen | Update | PUT /api/coach/consultations | Habilita/deshabilita |
| 7 | ProductsManagementScreen | Toggle "Meet 1hr" | ProductsManagementScreen | Update | PUT /api/coach/consultations | Habilita/deshabilita |
| 8 | ProductsManagementScreen | Toggle "Café" | ProductsManagementScreen | Update | PUT /api/coach/consultations | Habilita/deshabilita |
| 9 | ProductsManagementScreen | Input precio consulta | ProductsManagementScreen | Update | PUT /api/coach/consultations | Actualiza precio |
| **CREATE PRODUCT MODAL** |
| 10 | CreateProductModal | Botón "Siguiente" (Paso 1→2) | CreateProductModal | Wizard | - | Avanza a horarios |
| 11 | CreateProductModal | Botón "Siguiente" (Paso 2→3) | CreateProductModal | Wizard | - | Avanza a temas |
| 12 | CreateProductModal | Botón "Siguiente" (Paso 3→4) | CreateProductModal | Wizard | - | Avanza a ejercicios |
| 13 | CreateProductModal | Botón "Siguiente" (Paso 4→5) | CreateProductModal | Wizard | - | Avanza a planificación |
| 14 | CreateProductModal | Botón "Anterior" | CreateProductModal | Wizard | - | Regresa paso previo |
| 15 | CreateProductModal | Upload CSV (Paso 4) | CreateProductModal | Update | GET /api/existing-exercises | Carga ejercicios |
| 16 | CreateProductModal | Upload video (Paso 4) | CreateProductModal | Update | Supabase Storage | Sube video |
| 17 | CreateProductModal | Configurar calendario (Paso 5) | CreateProductModal | Update | - | Planifica semanas |
| 18 | CreateProductModal | Botón "Guardar" | ProductsManagementScreen | Close + API | POST /api/products | Crea producto |
| 19 | CreateProductModal | Botón "Cancelar" | ProductsManagementScreen | Close | - | Descarta cambios |
| **CALENDAR TAB** |
| 20 | CalendarScreen (Coach) | Click en día | CalendarScreen | Update | - | Muestra actividades del día |
| 21 | CalendarScreen (Coach) | Navegar mes | CalendarScreen | Update | - | Cambia mes |
| **PROFILE TAB** |
| 22 | ProfileScreen (Coach) | Editar perfil | ProfileScreen | Update | PUT /api/profile/update | Actualiza info profesional |
| 23 | ProfileScreen (Coach) | Subir certificación | ProfileScreen | Update | Supabase Storage | Sube documento |

---

## 🔄 NAVEGACIÓN BOTTOM BAR

### Cliente
| Tab | Icon | Pantalla | Auth Requerido | APIs al Abrir |
|-----|------|----------|----------------|---------------|
| Search | 🔍 | SearchScreen | No | GET /api/coaches<br/>GET /api/activities/search |
| Activity | ⚡ | ActivityScreen | Sí | GET /api/get-product-planning |
| Community | 🔥 | CommunityScreen | No | - |
| Calendar | 📅 | CalendarScreen | Sí | - |
| Profile | 👤 | ProfileScreen | Sí | GET /api/profile/combined<br/>GET /api/profile/exercise-progress<br/>GET /api/profile/biometrics<br/>GET /api/profile/injuries |

### Coach
| Tab | Icon | Pantalla | Auth Requerido | APIs al Abrir |
|-----|------|----------|----------------|---------------|
| Clients | 👥 | ClientsScreen | Sí | GET /api/coach/clients |
| Products | 🛍️ | ProductsManagementScreen | Sí | GET /api/products<br/>GET /api/coach/consultations<br/>GET /api/coach/stats-simple |
| Community | 🔥 | CommunityScreen | No | - |
| Calendar | 📅 | CalendarScreen | Sí | - |
| Profile | 👤 | ProfileScreen | Sí | GET /api/profile/combined |

---

## 🎬 ANIMACIONES RECOMENDADAS

| Transición | Animación | Duración | Easing | Uso |
|------------|-----------|----------|--------|-----|
| Tab → Tab | Dissolve | 200ms | Ease in-out | Bottom navigation |
| Screen → Modal | Slide up | 300ms | Ease out | Abrir modales |
| Modal → Screen | Slide down | 300ms | Ease in | Cerrar modales |
| Screen → Screen (forward) | Slide left | 300ms | Ease in-out | Navegar adelante |
| Screen → Screen (back) | Slide right | 300ms | Ease in-out | Navegar atrás |
| Update inline | Fade | 150ms | Ease in-out | Actualizaciones |
| Wizard step → step | Slide left/right | 250ms | Ease in-out | Pasos del wizard |

---

## 📐 DIMENSIONES PARA FIGMA

### Frames Principales
- **Mobile screens**: 390 x 844 px (iPhone 14)
- **Modales pequeños**: 370 x 600 px
- **Modales grandes** (CreateProduct): 370 x 800 px
- **Canvas total**: 4000 x 3000 px

### Spacing
- **Entre screens horizontalmente**: 100px
- **Entre screens verticalmente**: 150px
- **Entre secciones**: 200px
- **Padding interno screens**: 20px
- **Padding interno modales**: 24px

### Typography
- **H1 (Screen titles)**: 24px, Bold, SF Pro Display
- **H2 (Section titles)**: 18px, Bold, SF Pro Display
- **Body**: 14px, Regular, SF Pro Text
- **Captions**: 12px, Regular, SF Pro Text
- **Labels**: 11px, Medium, SF Pro Text

### Components
- **Cards height**: 120-150px
- **Button height**: 44px (iOS standard)
- **Input height**: 44px
- **Bottom nav height**: 60px
- **Top bar height**: 56px
- **Icon size**: 24x24px

---

## 🔍 ESTADOS DE CADA PANTALLA

### SearchScreen
| Estado | Condición | Visual |
|--------|-----------|--------|
| Loading | Cargando datos | Skeletons |
| Empty | Sin resultados | "No se encontraron resultados" |
| Results | Con datos | Lista de cards |
| Filtered | Con filtros aplicados | Lista filtrada + badge filtros |

### ActivityScreen
| Estado | Condición | Visual |
|--------|-----------|--------|
| Empty | Sin actividades | "Aún no tienes programas" |
| With active | Con programas activos | Lista separada activos/completados |
| Loading | Cargando | Skeletons |

### TodayScreen
| Estado | Condición | Visual |
|--------|-----------|--------|
| Loading | Cargando ejercicios | Spinner |
| With exercises | Día con ejercicios | Lista completa |
| Rest day | Día de descanso | "Día de descanso" |
| Future day | Día no disponible aún | "Disponible desde [fecha]" |

### ProfileScreen
| Estado | Condición | Visual |
|--------|-----------|--------|
| Loading | Cargando perfil | Skeletons |
| Loaded | Con datos | Todos los datos |
| Editing | Modo edición | Inputs habilitados |

### ProductsManagementScreen (Coach)
| Estado | Condición | Visual |
|--------|-----------|--------|
| Empty | Sin productos | "Crea tu primer producto" |
| With products | Con productos creados | Lista + stats |
| Loading | Cargando | Skeletons |

---

## 🎨 COMPONENTES REUTILIZABLES PARA FIGMA

### 1. Activity Card Component
**Variantes**: Default, Hover, Selected
```
┌──────────────────────────────┐
│ 💪 [Título del programa]     │ ← H3, 16px Bold
│ 📊 Progreso: [X]%            │ ← Caption, 12px
│ 📅 Semana [X] de [Y]         │ ← Caption, 12px
│ 👨‍💼 [Nombre coach]           │ ← Body, 14px
│ ⭐ [Rating] · [Reviews]      │ ← Caption, 12px
│ 💰 $[Precio]                 │ ← Label, 14px Bold
└──────────────────────────────┘
```

### 2. Coach Card Component
**Variantes**: Default, Hover, Selected
```
┌──────────────────────────────┐
│ ┌────┐ [Nombre Coach]        │
│ │ 👨‍💼 │ ⭐ 4.8 · 15 reviews   │
│ └────┘ 💪 Fitness · 🥗 Nutrition│
│        📍 [Ubicación]         │
└──────────────────────────────┘
```

### 3. Exercise Item Component
**Variantes**: Pending, Completed
```
┌──────────────────────────────┐
│ ☑️ [Nombre del ejercicio]    │ ← H4, 16px
│    [X] series × [Y] reps     │ ← Caption, 12px
│    ✅ Completado / ⏱️ Pendiente│ ← Status
└──────────────────────────────┘
```

### 4. Client Card Component (Coach)
**Variantes**: Active, Inactive
```
┌──────────────────────────────┐
│ 👤 [Nombre Cliente]          │ ← H3, 16px Bold
│ 📧 [Email]                   │ ← Caption, 12px
│ 📊 [N] productos inscritos   │ ← Body, 14px
│ ✅ Activo / ⚪ Inactivo      │ ← Status badge
└──────────────────────────────┘
```

### 5. Bottom Navigation Component
**Variantes**: Cliente, Coach
```
┌────────────────────────────────┐
│ [Icon] [Icon] [Icon] [Icon] [Icon]│
│ Label  Label  Label  Label  Label │
└────────────────────────────────┘
```

---

## 🔗 MAPA DE DEPENDENCIAS

### Pantallas que dependen de autenticación:
- ✅ **Requieren auth**: Activity, Calendar, Profile, Clients, Products, Today
- ⚪ **No requieren**: Community, Search (parcial)

### Pantallas que comparten componentes:
- **ActivityCard**: SearchScreen, ActivityScreen
- **ProfileScreen**: Cliente y Coach (mismo componente)
- **CalendarScreen**: Cliente y Coach (mismo componente, diferente lógica)
- **CommunityScreen**: Cliente y Coach (idéntica)

---

## 📊 FLUJOS CRÍTICOS DE USUARIO

### Flujo 1: Cliente Nuevo → Compra Programa
```
1. Inicio (no auth) → CommunityScreen
2. Click tab Search → SearchScreen
3. Busca "fitness" → Filtra actividades
4. Click en "Programa Ronaldo" → ClientProductModal
5. Ve video y detalles
6. Click "Comprar" → (Auth popup si no auth)
7. Después de auth → ActivityScreen
8. Ve su programa en "Activos"
9. Click en programa → TodayScreen
10. Completa ejercicios del día
```

**APIs usadas**: 
- GET /api/activities/search
- GET /api/activities/[id]/purchase-status
- POST /api/enrollments (si compra)
- GET /api/activities/today
- GET /api/executions/day
- PUT /api/ejecuciones-ejercicio (al completar)

**Tiempo estimado**: 3-5 minutos

---

### Flujo 2: Coach → Crear Programa Nuevo
```
1. Inicio (auth) → ClientsScreen (default para coach)
2. Click tab Products → ProductsManagementScreen
3. Click "+ Crear Producto" → CreateProductModal
4. PASO 1: Completa info general
   - Título, descripción, categoría, tipo, precio, cupos
   - Sube imagen o video
5. Click "Siguiente" → PASO 2 (si taller) o PASO 4 (si programa)
6. PASO 4: Sube CSV de ejercicios
   - Upload CSV
   - Revisa ejercicios importados
   - Sube videos opcionales
7. Click "Siguiente" → PASO 5
8. PASO 5: Configura planificación semanal
   - Crea períodos
   - Asigna semanas
   - Distribuye ejercicios por día
9. Click "Guardar" → ProductsManagementScreen
10. Ve producto creado en lista
```

**APIs usadas**:
- GET /api/existing-exercises
- POST /api/products (al guardar)
- Supabase Storage (para imagen/video/CSV)

**Tiempo estimado**: 10-15 minutos

---

### Flujo 3: Coach → Ver Progreso Cliente
```
1. Tab Clients → ClientsScreen
2. Ve lista de clientes
3. Click en "Franco Pomati" → ClientDetailsModal
4. Ve:
   - Info personal
   - Productos inscritos (2)
   - Progreso en cada producto
5. Revisa que cliente tiene 13% en "Programa Ronaldo"
6. Click "✕" → ClientsScreen
```

**APIs usadas**:
- GET /api/coach/clients
- GET /api/coach/clients/[id]/details

**Tiempo estimado**: 1-2 minutos

---

## 🎯 PANTALLAS POR FRECUENCIA DE USO

### Más Usadas (uso diario):
1. **TodayScreen** (Cliente) - Todos los días
2. **ActivityScreen** (Cliente) - Todos los días
3. **ClientsScreen** (Coach) - Todos los días
4. **ProductsManagementScreen** (Coach) - Frecuente

### Uso Regular (semanal):
1. **SearchScreen** (Cliente) - Explorar nuevos programas
2. **CalendarScreen** (Ambos) - Planificar semana
3. **ProfileScreen** (Ambos) - Revisar progreso

### Uso Ocasional (mensual):
1. **CreateProductModal** (Coach) - Crear nuevos productos
2. **ClientDetailsModal** (Coach) - Revisar clientes específicos

---

## 📱 GESTOS Y INTERACCIONES MÓVILES

| Gesto | Pantalla | Acción | Resultado |
|-------|----------|--------|-----------|
| **Swipe left** | TodayScreen | Navegar días | Día siguiente |
| **Swipe right** | TodayScreen | Navegar días | Día anterior |
| **Swipe down** | Cualquiera | Pull to refresh | Recarga datos |
| **Tap** | Exercise checkbox | Completar | Marca como done |
| **Tap** | Activity card | Abrir | Navega a detalles |
| **Long press** | Activity card | Opciones | Menu contextual |
| **Swipe up** | Modal | Cerrar | Dismiss modal |

---

## 🔗 DEEPLINKS Y NAVEGACIÓN DIRECTA

### URLs directas:
```
/ → MobileApp (detecta rol)
/?tab=search → SearchScreen
/?tab=activity → ActivityScreen
/?tab=calendar → CalendarScreen
/?tab=profile → ProfileScreen
/?tab=clients → ClientsScreen (coach)
/?tab=products-management → ProductsManagementScreen (coach)

/activity/[id] → TodayScreen para actividad específica
/client/[id] → ProfileScreen de cliente
/coach/[id] → CoachProfileModal
```

---

## 📊 RESUMEN VISUAL PARA FIGMA

```
CLIENTE (Izquierda - Azul)          COACH (Derecha - Naranja)
─────────────────────────          ─────────────────────────
┌─────────────┐                    ┌─────────────┐
│   Search    │                    │   Clients   │
└──────┬──────┘                    └──────┬──────┘
       │                                   │
       ├─→ ProductModal                   ├─→ ClientDetails
       │                                   │
┌──────▼──────┐                    ┌──────▼──────┐
│  Activity   │                    │  Products   │
└──────┬──────┘                    └──────┬──────┘
       │                                   │
       ├─→ TodayScreen                    ├─→ CreateProduct
       │                                   │        (5 pasos)
┌──────▼──────┐                    ┌──────┴──────┐
│  Calendar   │                    │  Calendar   │
└──────┬──────┘                    └──────┬──────┘
       │                                   │
┌──────▼──────┐                    ┌──────▼──────┐
│   Profile   │                    │   Profile   │
└─────────────┘                    └─────────────┘
       │                                   │
       └────────→ Community ←──────────────┘
                (Compartida)
```

---

## ✅ EXPORT READY

**Archivos generados**:
1. ✅ `UX_FLOW_MAP.json` - Estructura completa en JSON
2. ✅ `UX_FLOW_MERMAID.md` - Diagramas Mermaid
3. ✅ `UX_FLOW_FIGMA_GUIDE.md` - Guía paso a paso
4. ✅ `UX_FLOW_INTERACTIVE.html` - Visualización interactiva
5. ✅ `UX_FLOW_TABLE_COMPLETE.md` - Este archivo

**Listo para**:
- Importar a Figma con plugin Mermaid
- Crear manualmente en FigJam
- Visualizar en navegador (HTML)
- Documentar en Notion/Confluence
- Presentar a stakeholders

---

**Fecha**: 2025-01-09
**Versión**: Post-optimización v1.0.0
**Cobertura**: 100% de pantallas y flujos activos
