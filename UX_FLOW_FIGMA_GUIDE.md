# 🎨 GUÍA COMPLETA PARA CREAR EL FLUJO UX EN FIGMA

## 🚀 INICIO RÁPIDO

### Opción 1: Usar Plugin Mermaid (MÁS FÁCIL)
1. Abre Figma
2. Plugins → Busca "Mermaid Chart" o "Mermaid to Figma"
3. Copia el código del archivo `UX_FLOW_MERMAID.md`
4. Pégalo en el plugin
5. ¡Listo! Tu diagrama se genera automáticamente

### Opción 2: Usar FigJam (RECOMENDADO)
1. Abre FigJam (en Figma)
2. Crea nuevo archivo
3. Usa las formas de flowchart predefinidas
4. Sigue la guía visual de abajo

### Opción 3: Manual en Figma (MÁS CONTROL)
Sigue esta guía paso a paso →

---

## 📐 ESTRUCTURA DEL CANVAS EN FIGMA

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          OMNIA - UX FLOW MAP                             │
│                                                                          │
│  ┌────────────────────────────┐    ┌────────────────────────────┐      │
│  │      CLIENTE FLOWS         │    │       COACH FLOWS          │      │
│  │      (Azul #3B82F6)        │    │     (Naranja #FF7939)      │      │
│  └────────────────────────────┘    └────────────────────────────┘      │
│                                                                          │
│           ┌────────────────────────────┐                                │
│           │    SHARED SCREENS          │                                │
│           │    (Púrpura #8B5CF6)       │                                │
│           └────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────┘
```

**Dimensiones del canvas**: 4000 x 3000 px

---

## 🎨 PASO 1: CONFIGURAR COLORES Y ESTILOS

### Variables de Color (Color Styles)
Crea estos color styles en Figma:

```
Cliente / Screen Background:    #3B82F6
Cliente / Screen Border:        #1E40AF
Cliente / Text:                 #FFFFFF

Coach / Screen Background:      #FF7939
Coach / Screen Border:          #C2410C
Coach / Text:                   #FFFFFF

Shared / Screen Background:     #8B5CF6
Shared / Screen Border:         #6D28D9
Shared / Text:                  #FFFFFF

Modal / Background:             #10B981
Modal / Border:                 #047857
Modal / Text:                   #FFFFFF

Action / Background:            #F59E0B
Action / Text:                  #78350F

Background / App:               #000000
Background / Card:              #1E1E1E
```

### Text Styles
```
Title Large:     SF Pro Display, 24px, Bold, #FFFFFF
Title Medium:    SF Pro Display, 18px, Bold, #FFFFFF
Body:            SF Pro Text, 14px, Regular, #E5E5E5
Caption:         SF Pro Text, 12px, Regular, #9CA3AF
Label:           SF Pro Text, 11px, Medium, #FF7939
```

---

## 📱 PASO 2: CREAR FRAMES PARA CADA PANTALLA

### Layout de Frames

#### SECCIÓN CLIENTE (Lado Izquierdo)
Posición X: 100, Y: 100

1. **SearchScreen** (390 x 600)
   - X: 100, Y: 100
   - Color: #3B82F6
   - Contenido:
     ```
     🔍 Search
     ──────────────
     Sub-tabs:
     • Coaches
     • Activities
     
     Acciones:
     → Click coach
     → Click actividad
     → Filtrar
     ```

2. **ActivityScreen** (390 x 600)
   - X: 600, Y: 100
   - Color: #3B82F6
   - Contenido:
     ```
     ⚡ Activity
     ──────────────
     Secciones:
     • Activos
     • Completados
     
     Acciones:
     → Click actividad
     → Ver progreso
     ```

3. **CalendarScreen (Cliente)** (390 x 600)
   - X: 1100, Y: 100
   - Color: #3B82F6
   - Contenido:
     ```
     📅 Calendar
     ──────────────
     Vista:
     • Calendario mensual
     • Actividades del día
     
     Acciones:
     → Cambiar fecha
     → Click en actividad
     ```

4. **ProfileScreen (Cliente)** (390 x 600)
   - X: 1600, Y: 100
   - Color: #3B82F6
   - Contenido:
     ```
     👤 Profile
     ──────────────
     Secciones:
     • Info personal
     • Biométricas
     • Lesiones
     • Stats semanales
     
     Acciones:
     → Editar perfil
     → Actualizar datos
     → Gestionar lesiones
     ```

5. **TodayScreen** (390 x 700)
   - X: 350, Y: 800
   - Color: #3B82F6
   - Contenido:
     ```
     💪 Ejercicios del Día
     ──────────────
     Componentes:
     • Lista ejercicios
     • Navegación días
     • Progreso
     
     Acciones:
     → Completar ejercicio
     → Día anterior/siguiente
     → Volver
     ```

#### SECCIÓN COACH (Lado Derecho)
Posición X: 2200, Y: 100

6. **ClientsScreen** (390 x 600)
   - X: 2200, Y: 100
   - Color: #FF7939
   - Contenido:
     ```
     👥 Clients
     ──────────────
     Componentes:
     • Lista clientes
     • Búsqueda
     • Stats
     
     Acciones:
     → Click en cliente
     → Buscar
     ```

7. **ProductsManagementScreen** (390 x 700)
   - X: 2700, Y: 100
   - Color: #FF7939
   - Contenido:
     ```
     🛍️ Products
     ──────────────
     Secciones:
     • Mis productos
     • Consultas:
       - Meet 30min
       - Meet 1hr
       - Café
     • Estadísticas
     
     Acciones:
     → Crear producto
     → Editar producto
     → Toggle consulta
     → Actualizar precio
     ```

8. **CalendarScreen (Coach)** (390 x 600)
   - X: 3200, Y: 100
   - Color: #FF7939
   - Contenido:
     ```
     📅 Calendar
     ──────────────
     Vista:
     • Calendario mensual
     • Todas actividades
     • Clientes por día
     
     Acciones:
     → Navegar meses
     → Ver día
     ```

9. **ProfileScreen (Coach)** (390 x 600)
   - X: 3700, Y: 100
   - Color: #FF7939
   - Contenido:
     ```
     👤 Profile
     ──────────────
     Secciones:
     • Info profesional
     • Certificaciones
     • Redes sociales
     • Stats
     
     Acciones:
     → Editar perfil
     → Subir certificado
     ```

#### SECCIÓN COMPARTIDA (Centro)
Posición X: 1900, Y: 100

10. **CommunityScreen** (390 x 600)
    - X: 1900, Y: 100
    - Color: #8B5CF6
    - Contenido:
      ```
      🔥 Community
      ──────────────
      Sub-tabs:
      • For You
      • Following
      
      Acciones:
      → Like post
      → Comentar
      → Guardar
      ```

#### MODALES (Abajo)
Posición Y: 1600

11. **ClientProductModal** (370 x 700)
    - X: 100, Y: 1600
    - Color: #10B981
    - Contenido:
      ```
      📦 Modal Producto
      ──────────────
      Secciones:
      • Video/Imagen
      • Info producto
      • Coach info
      • Estadísticas
      • Botón comprar
      
      Acciones:
      → Comprar
      → Ver coach
      → Cerrar
      ```

12. **CreateProductModal** (500 x 800)
    - X: 2200, Y: 1600
    - Color: #10B981
    - Contenido:
      ```
      📝 Crear/Editar Producto
      ──────────────
      WIZARD DE 5 PASOS:
      
      [1] Info General
      [2] Horarios (taller)
      [3] Temas (taller)
      [4] Ejercicios CSV
      [5] Planificación
      
      Acciones:
      → Siguiente
      → Anterior
      → Guardar
      → Cancelar
      ```

13. **ClientDetailsModal** (370 x 600)
    - X: 2800, Y: 1600
    - Color: #10B981
    - Contenido:
      ```
      📊 Detalles Cliente
      ──────────────
      Info:
      • Nombre, email
      • Avatar
      • Biométricas
      
      Productos:
      • Lista inscritos
      • Progreso
      
      Acciones:
      → Cerrar
      ```

---

## 🔗 PASO 3: CONECTAR CON PROTOTYPE

### Conexiones de Cliente

#### Desde SearchScreen:
```
SearchScreen → ClientProductModal
  Trigger: Click en actividad
  Animation: Slide up
  Duration: 300ms

SearchScreen → CoachProfileModal
  Trigger: Click en coach
  Animation: Slide up
  Duration: 300ms
```

#### Desde ClientProductModal:
```
ClientProductModal → ActivityScreen
  Trigger: Click "Comprar"
  Animation: Slide left
  Duration: 300ms

ClientProductModal → SearchScreen
  Trigger: Click "Cerrar"
  Animation: Slide down
  Duration: 300ms
```

#### Desde ActivityScreen:
```
ActivityScreen → TodayScreen
  Trigger: Click en actividad
  Animation: Slide left
  Duration: 300ms
```

#### Desde TodayScreen:
```
TodayScreen → ActivityScreen
  Trigger: Click "Volver"
  Animation: Slide right
  Duration: 300ms
```

### Conexiones de Coach

#### Desde ClientsScreen:
```
ClientsScreen → ClientDetailsModal
  Trigger: Click en cliente
  Animation: Slide up
  Duration: 300ms
```

#### Desde ProductsManagementScreen:
```
ProductsManagementScreen → CreateProductModal
  Trigger: Click "Crear" o "Editar"
  Animation: Slide up
  Duration: 300ms
```

#### Desde CreateProductModal:
```
CreateProductModal → ProductsManagementScreen
  Trigger: Click "Guardar" o "Cancelar"
  Animation: Slide down
  Duration: 300ms
```

### Bottom Navigation (Ambos)
```
Todas las tabs principales están conectadas entre sí
Trigger: Click en tab
Animation: Dissolve
Duration: 200ms
```

---

## 📊 PASO 4: AGREGAR ANOTACIONES DE APIs

Para cada pantalla, agrega una anotación (Text box) debajo con las APIs:

### Ejemplo para SearchScreen:
```
┌─────────────────────────┐
│    🔍 SearchScreen      │
│                         │
│  [Contenido aquí]       │
│                         │
└─────────────────────────┘
         │
         ▼
    ┌─────────┐
    │  APIs:  │
    ├─────────┤
    │ GET     │
    │ /api/   │
    │ coaches │
    └─────────┘
```

---

## 🎯 PASO 5: ORGANIZAR EN SECCIONES

### Layout Recomendado:

```
╔═══════════════════════════════════════════════════════════════╗
║                      OMNIA UX FLOW MAP                         ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  ┌──────────────────┐              ┌──────────────────┐       ║
║  │   📱 CLIENTE     │              │   👨‍💼 COACH      │       ║
║  │   5 TABS         │              │   5 TABS         │       ║
║  └──────────────────┘              └──────────────────┘       ║
║          │                                  │                  ║
║          ├─ Search                          ├─ Clients         ║
║          ├─ Activity                        ├─ Products        ║
║          ├─ Community ←─────────────────────┼─ Community       ║
║          ├─ Calendar                        ├─ Calendar        ║
║          └─ Profile                         └─ Profile         ║
║                                                                ║
║  ┌───────────────────────────────────────────────────────┐    ║
║  │              🔄 MODALES Y SUB-PANTALLAS               │    ║
║  ├───────────────────────────────────────────────────────┤    ║
║  │  • ClientProductModal     • CreateProductModal        │    ║
║  │  • CoachProfileModal      • ClientDetailsModal        │    ║
║  │  • TodayScreen                                        │    ║
║  └───────────────────────────────────────────────────────┘    ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🎨 COMPONENTES VISUALES DETALLADOS

### 1️⃣ Frame: SearchScreen (Cliente)

**Dimensiones**: 390 x 844 px
**Background**: #3B82F6
**Padding**: 20px

```
┌────────────────────────────────┐
│  ⚙️    🔍 SEARCH    💬         │ ← Top Bar
├────────────────────────────────┤
│                                │
│  ┌──────────┬──────────┐      │
│  │ Coaches  │Activities│      │ ← Sub-tabs
│  └──────────┴──────────┘      │
│                                │
│  ┌──────────────────────┐     │
│  │   🔍 Buscar...       │     │ ← Search bar
│  └──────────────────────┘     │
│                                │
│  ┌──────────────────────┐     │
│  │ 👨‍💼 Coach 1          │     │
│  │ ⭐ 4.8 · 15 reviews   │     │ ← Coach cards
│  │ 💪 Fitness · 🥗 Nutrition│     │
│  └──────────────────────┘     │
│                                │
│  ┌──────────────────────┐     │
│  │ 💪 Programa Ronaldo   │     │
│  │ 8 semanas · $99       │     │ ← Activity cards
│  │ 👨‍💼 Franco Pomati     │     │
│  └──────────────────────┘     │
│                                │
├────────────────────────────────┤
│ 🔍 ⚡ 🔥 📅 👤             │ ← Bottom Nav
└────────────────────────────────┘
```

**Elementos interactivos** (marca con hotspots):
- Click en coach card → CoachProfileModal
- Click en activity card → ClientProductModal
- Tabs → Cambia contenido
- Search bar → Filtra resultados

---

### 2️⃣ Frame: ActivityScreen (Cliente)

**Dimensiones**: 390 x 844 px
**Background**: #3B82F6

```
┌────────────────────────────────┐
│  ⚙️    ⚡ ACTIVITY    💬        │
├────────────────────────────────┤
│                                │
│  📊 MIS ACTIVIDADES            │
│                                │
│  🟢 ACTIVOS (2)                │
│  ┌──────────────────────┐     │
│  │ 💪 Programa Ronaldo   │     │
│  │ 📊 Progreso: 13%      │     │
│  │ 📅 Semana 1 de 8      │     │
│  └──────────────────────┘     │
│                                │
│  ┌──────────────────────┐     │
│  │ 🧘 Yoga Avanzada      │     │
│  │ 📊 Progreso: 0%       │     │
│  │ 📅 Sin empezar        │     │
│  └──────────────────────┘     │
│                                │
│  ⚪ COMPLETADOS (0)            │
│  (vacío)                       │
│                                │
├────────────────────────────────┤
│ 🔍 ⚡ 🔥 📅 👤             │
└────────────────────────────────┘
```

**Elementos interactivos**:
- Click en card → TodayScreen
- Ver progreso → Muestra detalles

---

### 3️⃣ Frame: TodayScreen (Cliente)

**Dimensiones**: 390 x 844 px
**Background**: #3B82F6

```
┌────────────────────────────────┐
│  ← VOLVER    💪 HOY      📅    │
├────────────────────────────────┤
│                                │
│  Programa Ronaldo              │
│  📅 Miércoles 15 Oct 2025      │
│  📊 Semana 2 · Día 3           │
│                                │
│  ┌─ ◀ ───────────── ▶ ─┐     │ ← Nav días
│                                │
│  EJERCICIOS (4)                │
│                                │
│  ☑️ Saltos de Ronaldo          │
│     3 series × 10 reps         │
│     ✅ Completado               │
│                                │
│  ⬜ Sprint explosivo           │
│     4 series × 30s             │
│     ⏱️ Pendiente               │
│                                │
│  ⬜ Agilidad en zigzag         │
│     3 series × 20s             │
│     ⏱️ Pendiente               │
│                                │
│  ⬜ Descanso activo            │
│     1 × 5min                   │
│     ⏱️ Pendiente               │
│                                │
├────────────────────────────────┤
│ 🔍 ⚡ 🔥 📅 👤             │
└────────────────────────────────┘
```

**Elementos interactivos**:
- Checkbox → Completar ejercicio
- Flechas → Cambiar día
- Volver → ActivityScreen

---

### 4️⃣ Frame: ClientsScreen (Coach)

**Dimensiones**: 390 x 844 px
**Background**: #FF7939

```
┌────────────────────────────────┐
│  ⚙️   👥 CLIENTS    💬         │
├────────────────────────────────┤
│                                │
│  🔍 Buscar cliente...          │
│                                │
│  📊 CLIENTES ACTIVOS (1)       │
│                                │
│  ┌──────────────────────┐     │
│  │ 👤 Franco Pomati      │     │
│  │ 📧 pomati...@gmail    │     │
│  │ 📊 2 productos        │     │
│  │ ✅ Activo             │     │
│  └──────────────────────┘     │
│                                │
│  (más clientes...)             │
│                                │
├────────────────────────────────┤
│ 👥 🛍️ 🔥 📅 👤          │
└────────────────────────────────┘
```

**Elementos interactivos**:
- Click en cliente → ClientDetailsModal
- Search bar → Filtra clientes

---

### 5️⃣ Frame: ProductsManagementScreen (Coach)

**Dimensiones**: 390 x 900 px
**Background**: #FF7939

```
┌────────────────────────────────┐
│  ⚙️   🛍️ PRODUCTS   💬         │
├────────────────────────────────┤
│                                │
│  📊 MIS PRODUCTOS (3)          │
│                                │
│  ┌──────────────────────┐     │
│  │ 💪 Programa Ronaldo   │     │
│  │ 📊 65 cupos · $99     │     │
│  │ ✏️ Editar             │     │
│  └──────────────────────┘     │
│                                │
│  [+ CREAR PRODUCTO NUEVO]      │ ← Botón
│                                │
│  ─────────────────────         │
│                                │
│  💬 CONSULTAS                  │
│                                │
│  ┌──────────────────────┐     │
│  │ ☑️ Meet 30 min       │     │
│  │    $50               │     │
│  └──────────────────────┘     │
│                                │
│  ┌──────────────────────┐     │
│  │ ☑️ Meet 1 hora       │     │
│  │    $80               │     │
│  └──────────────────────┘     │
│                                │
│  ┌──────────────────────┐     │
│  │ ⬜ Café              │     │
│  │    $30               │     │
│  └──────────────────────┘     │
│                                │
│  ─────────────────────         │
│                                │
│  📈 ESTADÍSTICAS               │
│  • Total productos: 3          │
│  • Total clientes: 5           │
│  • Ingresos mes: $450          │
│                                │
├────────────────────────────────┤
│ 👥 🛍️ 🔥 📅 👤          │
└────────────────────────────────┘
```

**Elementos interactivos**:
- Click "Crear" → CreateProductModal
- Click "Editar" → CreateProductModal (modo edit)
- Toggle consulta → Actualiza backend
- Input precio → Actualiza backend

---

### 6️⃣ Modal: CreateProductModal (Coach)

**Dimensiones**: 370 x 800 px
**Background**: #10B981

```
┌────────────────────────────────┐
│  ✕         CREAR PRODUCTO      │
├────────────────────────────────┤
│                                │
│  ● ○ ○ ○ ○  Paso 1/5         │ ← Progress dots
│                                │
│  📝 INFORMACIÓN GENERAL        │
│                                │
│  Título *                      │
│  ┌──────────────────────┐     │
│  │ Mi programa...       │     │
│  └──────────────────────┘     │
│                                │
│  Descripción *                 │
│  ┌──────────────────────┐     │
│  │ Descripción...       │     │
│  │                      │     │
│  └──────────────────────┘     │
│                                │
│  Categoría *                   │
│  ┌──────────────────────┐     │
│  │ ▾ Fitness            │     │
│  └──────────────────────┘     │
│                                │
│  Tipo *                        │
│  ┌──────┬────────┐            │
│  │Program│Workshop│            │
│  └──────┴────────┘            │
│                                │
│  Precio * │ Cupos *            │
│  ┌────┐    ┌────┐             │
│  │$99 │    │ 65 │             │
│  └────┘    └────┘             │
│                                │
│  📷 Imagen / 🎥 Video          │
│  ┌──────────────────────┐     │
│  │   [Subir archivo]    │     │
│  └──────────────────────┘     │
│                                │
│  ┌────────┐  ┌──────────┐    │
│  │CANCELAR│  │SIGUIENTE→│    │
│  └────────┘  └──────────┘    │
└────────────────────────────────┘
```

**Pasos del wizard**:
1. Info General (este mockup)
2. Horarios (solo talleres)
3. Temas (solo talleres)
4. Ejercicios CSV
5. Planificación Semanal

---

### 7️⃣ Frame: ProfileScreen (Ambos roles)

**Dimensiones**: 390 x 900 px
**Background**: Cliente: #3B82F6, Coach: #FF7939

```
┌────────────────────────────────┐
│  ⚙️    👤 PROFILE    💬        │
├────────────────────────────────┤
│                                │
│      ┌──────────┐              │
│      │          │              │
│      │  Avatar  │              │ ← Avatar (tap to change)
│      │          │              │
│      └──────────┘              │
│                                │
│    Franco Pomati               │
│    pomati...@gmail.com         │
│    📍 Buenos Aires, ARG        │
│                                │
│  ─────────────────────         │
│                                │
│  📊 ESTA SEMANA                │
│                                │
│     ┌─┐  ┌─┐  ┌─┐             │
│     │ │  │ │  │ │             │ ← Activity rings
│     └─┘  └─┘  └─┘             │
│    300   30   1                │
│    kcal  min  ej               │
│                                │
│  L  M  M  J  V  S  D           │ ← Weekly breakdown
│  ○  ●  ○  ○  ○  ○  ○          │
│                                │
│  ─────────────────────         │
│                                │
│  💪 BIOMÉTRICAS                │
│  • Peso: 75 kg                 │
│  • Altura: 175 cm              │
│  • Edad: 28 años               │
│                                │
│  ─────────────────────         │
│                                │
│  🤕 LESIONES ACTIVAS (1)       │
│  ┌──────────────────────┐     │
│  │ Rodilla izquierda     │     │
│  │ Desde: 01/10/2025     │     │
│  │ Nivel: Moderado       │     │
│  │         [Eliminar]    │     │
│  └──────────────────────┘     │
│                                │
│  [+ AGREGAR LESIÓN]            │
│                                │
├────────────────────────────────┤
│ 🔍 ⚡ 🔥 📅 👤             │
└────────────────────────────────┘
```

**Elementos interactivos**:
- Avatar → Upload nuevo avatar
- Biométricas → Editar inline
- Eliminar lesión → Confirmar y eliminar
- Agregar lesión → Modal de nueva lesión

---

### 8️⃣ Modal: ClientProductModal (Cliente)

**Dimensiones**: 370 x 700 px
**Background**: #10B981

```
┌────────────────────────────────┐
│  ✕    PLIOMÉTRICOS RONALDO     │
├────────────────────────────────┤
│                                │
│  ┌──────────────────────┐     │
│  │                      │     │
│  │    🎥 VIDEO DEMO     │     │ ← Video player
│  │         ▶️            │     │
│  │                      │     │
│  └──────────────────────┘     │
│                                │
│  👨‍💼 Franco Pomati coach       │
│  ⭐ 4.9 · 23 reviews           │
│                                │
│  ─────────────────────         │
│                                │
│  📊 ESTADÍSTICAS               │
│  • 8 semanas                   │
│  • 3 sesiones/semana           │
│  • 2 ejercicios únicos         │
│  • 3 períodos                  │
│                                │
│  ─────────────────────         │
│                                │
│  💰 PRECIO: $99                │
│  📍 65 cupos disponibles       │
│                                │
│  📝 DESCRIPCIÓN                │
│  Programa intensivo de...      │
│  (texto expandible)            │
│                                │
│  ─────────────────────         │
│                                │
│  ┌──────────────────────┐     │
│  │  💳 COMPRAR AHORA    │     │ ← Primary action
│  └──────────────────────┘     │
│                                │
│  Ver perfil del coach →        │ ← Secondary action
│                                │
└────────────────────────────────┘
```

**Elementos interactivos**:
- Video → Play/Pause
- Comprar → Inscripción + va a ActivityScreen
- Ver perfil coach → CoachProfileModal
- ✕ → Cerrar y volver

---

### 9️⃣ Modal: CreateProductModal - Paso 5 (Coach)

**Dimensiones**: 370 x 800 px
**Background**: #10B981

```
┌────────────────────────────────┐
│  ✕    CREAR PRODUCTO - 5/5     │
├────────────────────────────────┤
│                                │
│  ● ● ● ● ●  Planificación     │ ← All dots filled
│                                │
│  📅 PLANIFICACIÓN SEMANAL      │
│                                │
│  ┌──────────────────────┐     │
│  │ 📊 WeeklyPlanner      │     │
│  │                       │     │
│  │ Período 1             │     │
│  │ ┌─────────────────┐  │     │
│  │ │ Sem 1  Sem 2    │  │     │
│  │ ├─────────────────┤  │     │
│  │ │ L M  J           │  │     │ ← Calendario interactivo
│  │ │ ☑️ ☑️  ☑️          │  │     │
│  │ │ 2ej 2ej 2ej      │  │     │
│  │ └─────────────────┘  │     │
│  │                       │     │
│  │ + Agregar período     │     │
│  └──────────────────────┘     │
│                                │
│  📊 RESUMEN:                   │
│  • 3 períodos                  │
│  • 2 semanas                   │
│  • 3 sesiones                  │
│  • 2 ejercicios únicos         │
│                                │
│  ┌────────┐  ┌──────────┐    │
│  │← ATRÁS │  │ GUARDAR✓ │    │
│  └────────┘  └──────────┘    │
└────────────────────────────────┘
```

**Elementos interactivos**:
- Calendario → Seleccionar días
- + Período → Agregar nuevo período
- Atrás → Paso 4
- Guardar → Crear producto y volver

---

## 🔗 PASO 6: CREAR CONEXIONES EN PROTOTYPE MODE

### Configuración de Prototype en Figma:

1. **Selecciona Frame de origen**
2. **Click en "+" para crear hotspot**
3. **Arrastra al Frame de destino**
4. **Configura la interacción**:

#### Animaciones Recomendadas:

**Para Modales**:
- Trigger: On click
- Action: Open overlay
- Animation: Slide up
- Easing: Ease out
- Duration: 300ms

**Para Navegación entre Tabs**:
- Trigger: On click
- Action: Navigate to
- Animation: Dissolve
- Duration: 200ms

**Para Sub-pantallas**:
- Trigger: On click
- Action: Navigate to
- Animation: Slide left/right
- Duration: 300ms

**Para Volver**:
- Trigger: On click
- Action: Close overlay / Navigate back
- Animation: Slide down/right
- Duration: 300ms

---

## 📊 TABLA COMPLETA DE CONEXIONES PARA PROTOTYPE

| # | Desde | Elemento | Acción | Hacia | Tipo | Animación |
|---|-------|----------|--------|-------|------|-----------|
| 1 | SearchScreen | Activity card | Click | ClientProductModal | Overlay | Slide up |
| 2 | SearchScreen | Coach card | Click | CoachProfileModal | Overlay | Slide up |
| 3 | ClientProductModal | Botón comprar | Click | ActivityScreen | Navigate | Slide left |
| 4 | ClientProductModal | ✕ | Click | SearchScreen | Close | Slide down |
| 5 | ActivityScreen | Activity card | Click | TodayScreen | Navigate | Slide left |
| 6 | TodayScreen | ← Volver | Click | ActivityScreen | Back | Slide right |
| 7 | TodayScreen | ▶ Siguiente | Click | TodayScreen | Change | Fade |
| 8 | TodayScreen | ◀ Anterior | Click | TodayScreen | Change | Fade |
| 9 | CalendarScreen | Día | Click | ActivityScreen | Navigate | Slide left |
| 10 | ClientsScreen | Client card | Click | ClientDetailsModal | Overlay | Slide up |
| 11 | ClientDetailsModal | ✕ | Click | ClientsScreen | Close | Slide down |
| 12 | ProductsScreen | + Crear | Click | CreateProductModal | Overlay | Slide up |
| 13 | ProductsScreen | ✏️ Editar | Click | CreateProductModal | Overlay | Slide up |
| 14 | CreateProductModal | Siguiente | Click | CreateProductModal | Change | Slide left |
| 15 | CreateProductModal | Anterior | Click | CreateProductModal | Change | Slide right |
| 16 | CreateProductModal | Guardar | Click | ProductsScreen | Close | Slide down |
| 17 | CreateProductModal | ✕ | Click | ProductsScreen | Close | Slide down |
| 18 | ProfileScreen | Edit avatar | Click | ProfileScreen | Update | Fade |
| 19 | ProfileScreen | + Lesión | Click | ProfileScreen | Modal | Slide up |

### Bottom Navigation (todas las pantallas):
- Cada tab → Su pantalla correspondiente
- Animación: Dissolve, 200ms

---

## 🎯 COMPONENTES REUTILIZABLES

Crea estos como **Components** en Figma para reutilizar:

### 1. Activity Card
```
┌──────────────────────┐
│ 💪 Título            │
│ 📊 Stats             │
│ 👨‍💼 Coach            │
│ 💰 Precio            │
└──────────────────────┘
```

### 2. Coach Card
```
┌──────────────────────┐
│ 👨‍💼 Nombre           │
│ ⭐ Rating            │
│ 💪 Especialidades    │
│ 📍 Ubicación         │
└──────────────────────┘
```

### 3. Exercise Item
```
┌──────────────────────┐
│ ☑️ Nombre ejercicio  │
│    3 series × 10     │
│    ✅ Completado     │
└──────────────────────┘
```

### 4. Client Card
```
┌──────────────────────┐
│ 👤 Nombre            │
│ 📧 Email             │
│ 📊 N productos       │
│ ✅ Estado            │
└──────────────────────┘
```

### 5. Bottom Navigation Bar
```
┌────────────────────────────────┐
│ 🔍  ⚡  🔥  📅  👤        │
│ Tab1 Tab2 Tab3 Tab4 Tab5       │
└────────────────────────────────┘
```

---

## ✅ CHECKLIST DE FIGMA

- [ ] Crear archivo nuevo en Figma
- [ ] Configurar color styles (cliente, coach, shared)
- [ ] Configurar text styles (SF Pro)
- [ ] Crear frame container principal (4000x3000)
- [ ] Crear sección CLIENTE con 5 tabs + sub-pantallas
- [ ] Crear sección COACH con 5 tabs + sub-pantallas
- [ ] Crear sección SHARED (Community)
- [ ] Crear modales (ClientProductModal, CreateProductModal, etc)
- [ ] Crear componentes reutilizables (cards)
- [ ] Conectar todo en Prototype mode
- [ ] Agregar anotaciones de APIs
- [ ] Agregar leyenda de colores
- [ ] Exportar a PDF o compartir link

---

## 🚀 PLUGINS RECOMENDADOS DE FIGMA

1. **Autoflow** - Genera flechas automáticas entre frames
2. **Mermaid Chart** - Importa diagramas Mermaid
3. **Component Inspector** - Inspecciona estructura
4. **Stark** - Verifica accesibilidad
5. **Lorem Ipsum** - Genera texto placeholder

---

## 📤 EXPORTAR Y COMPARTIR

### Para Presentación:
1. File → Export → PDF
2. Incluye todos los frames
3. Usa para documentación

### Para Desarrollo:
1. Prototype mode → Present
2. Comparte link interactivo
3. Desarrolladores pueden ver flujos

### Para Documentación:
1. Export frames como PNG
2. Incluye en README
3. Usa en onboarding

---

**¿Necesitas ayuda con Figma?** 
- Usa el archivo `UX_FLOW_MAP.json` como referencia
- El código Mermaid se puede visualizar en https://mermaid.live
- Los diagramas están listos para importar

**Fecha**: 2025-01-09
**Version**: Post-optimización v1.0.0
