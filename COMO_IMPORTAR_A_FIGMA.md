# 🎨 CÓMO IMPORTAR EL FLUJO UX A FIGMA - GUÍA RÁPIDA

## ⚡ MÉTODO RÁPIDO (5 minutos)

### Opción 1: Usar Plugin Mermaid (MÁS FÁCIL)

1. **Abre Figma** → Nuevo archivo
   
2. **Instala plugin**:
   - Menu → Plugins → Browse plugins
   - Busca "Mermaid Chart" o "Mermaid to Figma"
   - Instala el plugin

3. **Importa el diagrama**:
   - Abre el archivo `UX_FLOW_MERMAID.md`
   - Copia el código Mermaid del "Flujo Completo Integrado"
   - En Figma: Plugins → Mermaid Chart
   - Pega el código
   - Click "Generate"

4. **Personaliza**:
   - Ajusta colores según la leyenda
   - Agrupa por roles (Cliente/Coach)
   - Agrega detalles visuales

✅ **¡Listo en 5 minutos!**

---

### Opción 2: Usar FigJam (RECOMENDADO PARA COLABORACIÓN)

1. **Abre FigJam** (dentro de Figma)
   
2. **Crea nuevo tablero**

3. **Usa formas predefinidas**:
   - Arrastra "Sticky notes" para las pantallas
   - Usa "Flowchart shapes" para modales
   - Conecta con flechas

4. **Sigue la estructura**:
   - Lado izquierdo: Flujo Cliente (azul)
   - Lado derecho: Flujo Coach (naranja)
   - Centro: Community (púrpura)

5. **Agrega la info**:
   - Usa el archivo `UX_FLOW_TABLE_COMPLETE.md` como referencia
   - Copia las descripciones de cada pantalla

✅ **Más colaborativo y visual!**

---

## 🎨 MÉTODO MANUAL PROFESIONAL (30-60 minutos)

### PASO 1: Setup del Archivo

1. **Crea nuevo archivo en Figma**
   - Nombre: "OMNIA - UX Flow Map"

2. **Configura el canvas**:
   - Canvas size: 4000 x 3000 px
   - Background: #1a1a1a

3. **Crea Color Styles** (importante):
   ```
   Cliente/Background:     #3B82F6
   Cliente/Border:         #1E40AF
   Coach/Background:       #FF7939
   Coach/Border:           #C2410C
   Shared/Background:      #8B5CF6
   Modal/Background:       #10B981
   Text/Primary:           #FFFFFF
   Text/Secondary:         #E5E5E5
   ```

4. **Crea Text Styles**:
   ```
   Screen Title:    SF Pro Display, 20px, Bold
   Section Title:   SF Pro Display, 16px, Semibold
   Body:            SF Pro Text, 14px, Regular
   Caption:         SF Pro Text, 12px, Regular
   ```

---

### PASO 2: Crear Estructura de Frames

#### Frame Container Principal:
- Nombre: "OMNIA UX Flow"
- Tamaño: 4000 x 3000 px
- Layout: None

#### Dentro, crea 3 secciones:

**A) Sección Cliente** (Frame: 2000 x 2500)
- Position: X: 100, Y: 100
- Background: Transparente
- Border: 3px solid #3B82F6

**B) Sección Coach** (Frame: 2000 x 2500)
- Position: X: 2200, Y: 100
- Background: Transparente
- Border: 3px solid #FF7939

**C) Sección Shared** (Frame: 500 x 800)
- Position: X: 1750, Y: 100
- Background: Transparente
- Border: 3px solid #8B5CF6

---

### PASO 3: Crear Frames para Cada Pantalla

#### Cliente - 5 Tabs Principales:

**1. SearchScreen**
```
Frame: 390 x 600
Position: 150, 200
Background: #3B82F6
Corner radius: 20px
Border: 3px #1E40AF

Contenido (Auto Layout vertical, gap 16px):
├─ Text: "🔍 SEARCH" (Screen Title style)
├─ Frame: Sub-tabs (Auto Layout horizontal)
│  ├─ Text: "Coaches"
│  └─ Text: "Activities"
├─ Frame: Search bar
├─ Frame: Results list
│  ├─ Component: Coach Card (instance)
│  ├─ Component: Coach Card (instance)
│  └─ Component: Activity Card (instance)
└─ Text: "APIs: GET /api/coaches..." (Caption style, gray)
```

**2. ActivityScreen**
```
Frame: 390 x 600
Position: 650, 200
Background: #3B82F6
Corner radius: 20px

Contenido:
├─ Text: "⚡ ACTIVITY"
├─ Text: "Activos (2)"
├─ Component: Activity Card instance
├─ Component: Activity Card instance
├─ Text: "Completados (0)"
└─ Text: "APIs: GET /api/get-product-planning"
```

**3. CalendarScreen**
```
Frame: 390 x 600
Position: 1150, 200
Background: #3B82F6

Contenido:
├─ Text: "📅 CALENDAR"
├─ Frame: Month view (grid 7x5)
└─ Frame: Activity list for selected day
```

**4. ProfileScreen**
```
Frame: 390 x 700
Position: 1650, 200
Background: #3B82F6

Contenido:
├─ Frame: Avatar (100x100, circle)
├─ Text: Name
├─ Text: Email
├─ Frame: Activity Rings (3 circles)
├─ Frame: Weekly breakdown
├─ Frame: Biometrics
└─ Frame: Injuries list
```

**5. TodayScreen**
```
Frame: 390 x 800
Position: 400, 1000
Background: #3B82F6

Contenido:
├─ Text: "💪 EJERCICIOS DEL DÍA"
├─ Frame: Date navigator
├─ Component: Exercise Item (x4 instances)
└─ Button: "Volver"
```

#### Coach - 5 Tabs Principales:

**6. ClientsScreen**
```
Frame: 390 x 600
Position: 2250, 200
Background: #FF7939
Corner radius: 20px

Contenido:
├─ Text: "👥 CLIENTS"
├─ Frame: Search bar
├─ Component: Client Card (x3 instances)
└─ Text: "APIs: GET /api/coach/clients"
```

**7. ProductsManagementScreen**
```
Frame: 390 x 800
Position: 2750, 200
Background: #FF7939

Contenido:
├─ Text: "🛍️ PRODUCTS"
├─ Frame: Products list
│  └─ Component: Activity Card instances
├─ Button: "+ Crear Producto"
├─ Frame: Consultations
│  ├─ Toggle: Meet 30min
│  ├─ Toggle: Meet 1hr
│  └─ Toggle: Café
└─ Frame: Stats summary
```

**8. CalendarScreen (Coach)**
```
Frame: 390 x 600
Position: 3250, 200
Background: #FF7939

Contenido:
├─ Text: "📅 CALENDAR"
├─ Frame: Month view full
└─ Frame: Stats (actividades, clientes)
```

#### Modales:

**9. ClientProductModal**
```
Frame: 370 x 700
Position: 150, 1600
Background: #10B981
Corner radius: 20px
Drop shadow: 0 10px 40px rgba(0,0,0,0.5)

Contenido:
├─ Button: ✕ (top right)
├─ Frame: Video player (16:9)
├─ Text: Product title (H2)
├─ Frame: Coach info (avatar + name)
├─ Frame: Stats (4 items)
├─ Text: Description
├─ Text: Price (large)
└─ Button: "COMPRAR" (primary, full width)
```

**10. CreateProductModal**
```
Frame: 500 x 800
Position: 2250, 1600
Background: #10B981
Drop shadow: 0 10px 40px rgba(0,0,0,0.5)

Contenido:
├─ Progress dots: ● ○ ○ ○ ○
├─ Text: "Paso 1/5"
├─ Frame: Form fields (depende del paso)
├─ Button: "Cancelar" (secondary)
└─ Button: "Siguiente" (primary)

(Crear 5 variantes, una por paso)
```

**11. ClientDetailsModal**
```
Frame: 370 x 600
Position: 2800, 1600
Background: #10B981

Contenido:
├─ Button: ✕
├─ Frame: Client info
├─ Frame: Enrolled products
└─ Frame: Progress bars
```

---

### PASO 4: Crear Componentes Reutilizables

En la página de componentes de Figma:

#### Component: Activity Card
```
Frame: 350 x 120
Auto Layout: Vertical, gap 8px
Padding: 16px
Background: #1E1E1E
Corner radius: 12px

Layers:
├─ Text: {Title} (16px, Bold)
├─ Text: {Stats} (12px, Regular)
├─ Frame: (Auto Layout horizontal)
│  ├─ Text: {Coach name}
│  └─ Text: {Rating}
└─ Text: ${Price} (14px, Bold, #FF7939)

Properties (para variantes):
- title: Text
- stats: Text
- coachName: Text
- rating: Text
- price: Text
- state: Default | Hover | Selected
```

#### Component: Coach Card
```
Frame: 350 x 100
Auto Layout: Horizontal, gap 12px
Padding: 12px
Background: #1E1E1E
Corner radius: 12px

Layers:
├─ Frame: Avatar (60x60, circle)
└─ Frame: Info (Auto Layout vertical)
   ├─ Text: {Name} (16px, Bold)
   ├─ Text: {Rating} (12px)
   ├─ Text: {Specialties} (12px)
   └─ Text: {Location} (11px)
```

#### Component: Exercise Item
```
Frame: 350 x 80
Auto Layout: Horizontal, gap 12px
Padding: 12px
Background: #1E1E1E
Corner radius: 10px

Layers:
├─ Checkbox: {Done} (24x24)
└─ Frame: (Auto Layout vertical)
   ├─ Text: {Exercise name} (16px)
   ├─ Text: {Sets & Reps} (12px)
   └─ Badge: {Status} (Completado/Pendiente)

Variants:
- State: Pending | Completed
```

#### Component: Bottom Navigation
```
Frame: 390 x 60
Auto Layout: Horizontal, gap 0px
Background: #000000

Layers (5 items, each 78px width):
├─ Frame: Tab button (Auto Layout vertical, center)
│  ├─ Icon: {icon} (24x24)
│  └─ Text: {label} (11px)

Properties:
- activeTab: Search | Activity | Community | Calendar | Profile

Variants por rol:
- Role: Client | Coach
```

---

### PASO 5: Conectar en Prototype Mode

1. **Activa Prototype mode** (esquina superior derecha)

2. **Para cada frame**:
   - Selecciona el elemento clickeable
   - Arrastra el "+" al frame destino
   - Configura la interacción

3. **Configuraciones recomendadas**:

**Tab Navigation** (Bottom Nav):
```
From: Tab button
To: Respective screen
Trigger: On click
Action: Navigate to
Animation: Dissolve
Duration: 200ms
Easing: Ease in-out
```

**Abrir Modal**:
```
From: Card or button
To: Modal frame
Trigger: On click
Action: Open overlay
Position: Center
Animation: Slide up
Duration: 300ms
Easing: Ease out
Background: Dim (50% black)
Close on click outside: Yes
```

**Navegar Forward**:
```
From: Button or card
To: Next screen
Trigger: On click
Action: Navigate to
Animation: Slide left
Duration: 300ms
Easing: Ease in-out
```

**Navegar Back**:
```
From: Back button
To: Previous screen
Trigger: On click
Action: Back
Animation: Slide right
Duration: 300ms
Easing: Ease in-out
```

**Wizard Steps** (CreateProductModal):
```
From: "Siguiente" button
To: Next step variant
Trigger: On click
Action: Change to
Animation: Slide left
Duration: 250ms
```

---

### PASO 6: Agregar Anotaciones

Para cada screen, agrega un **Text box** debajo con:

```
APIs:
• GET /api/[endpoint]
• POST /api/[endpoint]

Componentes:
• ComponentName
• AnotherComponent

Acciones:
→ Click aquí va a...
→ Este botón hace...
```

Usa color **#6B7280** (gris) y tamaño **11px**.

---

## 🚀 SHORTCUTS ÚTILES EN FIGMA

| Acción | Shortcut | Uso |
|--------|----------|-----|
| Crear frame | `F` | Frame para pantallas |
| Auto layout | `Shift + A` | Organizar contenido |
| Componente | `Cmd/Ctrl + Alt + K` | Crear componente |
| Instancia | `Cmd/Ctrl + D` | Duplicar |
| Prototype | `Shift + E` | Modo prototype |
| Grupo | `Cmd/Ctrl + G` | Agrupar elementos |
| Desagrupar | `Cmd/Ctrl + Shift + G` | Desagrupar |
| Copiar estilo | `Cmd/Ctrl + Alt + C` | Copiar propiedades |
| Pegar estilo | `Cmd/Ctrl + Alt + V` | Pegar propiedades |

---

## 📦 RECURSOS INCLUIDOS

### Archivos Generados:
1. ✅ **UX_FLOW_MAP.json** - Datos estructurados
2. ✅ **UX_FLOW_MERMAID.md** - Diagramas código
3. ✅ **UX_FLOW_FIGMA_GUIDE.md** - Guía detallada
4. ✅ **UX_FLOW_INTERACTIVE.html** - Vista previa
5. ✅ **UX_FLOW_TABLE_COMPLETE.md** - Tabla de interacciones
6. ✅ **COMO_IMPORTAR_A_FIGMA.md** - Esta guía

### Información Disponible:
- ✅ 15 pantallas mapeadas
- ✅ 40+ interacciones documentadas
- ✅ 24 APIs vinculadas a pantallas
- ✅ Código de colores oficial
- ✅ Dimensiones exactas (390x844 iOS)
- ✅ Animaciones recomendadas
- ✅ Componentes reutilizables

---

## 🎯 TEMPLATE FIGMA (Copy-Paste)

Si quieres empezar super rápido, copia esto:

### Frame: SearchScreen Template
```
1. Crea Frame: 390 x 600, #3B82F6, radius 20px
2. Agrega Auto Layout: Vertical, gap 16px, padding 20px
3. Agrega dentro:
   - Text: "🔍 SEARCH" (20px, Bold, White)
   - Frame: Tabs (horizontal)
     - Pill: "Coaches" (active)
     - Pill: "Activities"
   - Frame: Search bar (height 44px)
     - Icon: Search (20x20)
     - Text placeholder: "Buscar..."
   - Auto Layout: Cards list (vertical, gap 12px)
     - Instance: Coach Card
     - Instance: Coach Card
     - Instance: Activity Card
   - Text: "APIs used..." (11px, gray)
```

Repite este patrón para cada pantalla usando la info de `UX_FLOW_TABLE_COMPLETE.md`.

---

## ✅ CHECKLIST FINAL

### Antes de empezar:
- [ ] Abrir `UX_FLOW_INTERACTIVE.html` en navegador (preview)
- [ ] Tener `UX_FLOW_TABLE_COMPLETE.md` abierto (referencia)
- [ ] Tener `UX_FLOW_MERMAID.md` abierto (estructura)

### En Figma:
- [ ] Archivo nuevo creado
- [ ] Color styles configurados
- [ ] Text styles configurados
- [ ] Frame principal creado (4000x3000)
- [ ] Sección Cliente creada
- [ ] Sección Coach creada
- [ ] Sección Shared creada

### Pantallas Cliente:
- [ ] SearchScreen (con sub-tabs)
- [ ] ActivityScreen
- [ ] CommunityScreen (shared)
- [ ] CalendarScreen
- [ ] ProfileScreen
- [ ] TodayScreen
- [ ] ClientProductModal
- [ ] CoachProfileModal (opcional)

### Pantallas Coach:
- [ ] ClientsScreen
- [ ] ProductsManagementScreen
- [ ] CalendarScreen (variant)
- [ ] ProfileScreen (variant)
- [ ] CreateProductModal (5 pasos)
- [ ] ClientDetailsModal

### Componentes:
- [ ] Activity Card
- [ ] Coach Card
- [ ] Exercise Item
- [ ] Client Card
- [ ] Bottom Navigation

### Prototype:
- [ ] Todas las tabs conectadas
- [ ] Modales con overlay
- [ ] Navegación forward/back
- [ ] Animaciones configuradas

### Finalización:
- [ ] Anotaciones de APIs agregadas
- [ ] Leyenda de colores incluida
- [ ] Nombres de frames claros
- [ ] Organización limpia
- [ ] Exportar o compartir link

---

## 🎨 TIPS PROFESIONALES

### 1. Usa Auto Layout en todo
- Hace los diseños responsivos
- Facilita los cambios
- Profesional

### 2. Crea variantes de componentes
- Activity Card: Default, Hover, Selected
- Button: Primary, Secondary, Disabled
- Exercise Item: Pending, Completed

### 3. Usa constraints
- Para que elementos se adapten al resize
- Top + Left para headers
- Bottom + Left para buttons

### 4. Nombra todo bien
```
✅ Bueno:
- Screen/Cliente/Search
- Component/ActivityCard/Default
- Modal/ProductDetails

❌ Malo:
- Frame 1
- Rectangle 45
- Group 23
```

### 5. Agrupa lógicamente
```
Estructura recomendada:
├─ 📱 Cliente
│  ├─ Screens
│  │  ├─ Search
│  │  ├─ Activity
│  │  └─ ...
│  └─ Modales
│     └─ ProductModal
├─ 👨‍💼 Coach
│  ├─ Screens
│  └─ Modales
├─ 🔄 Shared
│  └─ Community
└─ 🧩 Components
   ├─ Cards
   ├─ Buttons
   └─ Navigation
```

---

## 🔗 RECURSOS EXTERNOS

### Plugins Recomendados:
1. **Autoflow** - Conectores automáticos
2. **Mermaid Chart** - Import diagramas
3. **Stark** - Accesibilidad
4. **Content Reel** - Datos realistas
5. **Unsplash** - Imágenes

### Templates Útiles:
- Busca "iOS App Flowchart" en Figma Community
- Busca "User Flow Template" 
- Busca "Mobile App Wireframe"

### Exportar:
- **PDF**: File → Export → PDF (para documentación)
- **PNG**: Export frames individuales
- **Link**: Share → Get link (para colaboración)
- **Dev Mode**: Para que developers vean specs

---

## 🎉 RESULTADO FINAL

Al terminar tendrás:

✅ Un mapa visual completo del flujo UX de OMNIA
✅ Todas las pantallas conectadas con prototype
✅ Código de colores profesional
✅ Listo para presentar a stakeholders
✅ Listo para developers
✅ Listo para testing de UX
✅ Base para futuros diseños

---

## 🆘 AYUDA

**¿No tienes Figma?**
- Usa la versión web gratis: figma.com
- Abre `UX_FLOW_INTERACTIVE.html` en navegador
- Importa a Miro, Draw.io o Lucidchart

**¿Necesitas ayuda?**
- Todos los datos están en `UX_FLOW_MAP.json`
- Estructura visual en `UX_FLOW_MERMAID.md`
- Referencia detallada en `UX_FLOW_TABLE_COMPLETE.md`

**¿Quieres modificar?**
- Los archivos están listos para editar
- El código Mermaid se puede modificar fácilmente
- Los colores son variables CSS

---

**Tiempo estimado**: 30-60 minutos para resultado profesional
**Nivel**: Intermedio en Figma
**Resultado**: Documentación UX de nivel enterprise

¡Éxito con tu mapa de flujos! 🚀
