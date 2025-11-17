# 🎨 ESPECIFICACIONES DETALLADAS PARA FIGMA

## 📐 GUÍA PASO A PASO PARA RECREAR OMNIA EN FIGMA

Esta guía te permite copiar y pegar las especificaciones exactas en Figma.

---

## 🎯 **SETUP INICIAL**

### **1. Configurar Estilos Globales**

**Color Styles:**
```
Crear → Color Styles:

Black/Primary: #000000
Black/Secondary: #1E1E1E
Orange/Primary: #FF7939
Orange/Light: #FF8F5C
White: #FFFFFF
Gray/50: #F9FAFB
Gray/100: #F3F4F6
Gray/400: #9CA3AF
Gray/500: #6B7280
Gray/600: #4B5563
Gray/700: #374151
Gray/900: #111827
```

**Text Styles:**
```
Crear → Text Styles:

H1/Bold: Inter Bold, 28px, line-height 36px
H2/SemiBold: Inter SemiBold, 24px, line-height 32px
H3/SemiBold: Inter SemiBold, 20px, line-height 28px
Body/Regular: Inter Regular, 16px, line-height 24px
Body/Medium: Inter Medium, 16px, line-height 24px
Body Small/Regular: Inter Regular, 14px, line-height 20px
Caption/Medium: Inter Medium, 12px, line-height 16px
Label/SemiBold: Inter SemiBold, 14px, line-height 20px
```

**Effect Styles:**
```
Crear → Effect Styles:

Shadow/Card: 
  - Type: Drop Shadow
  - X: 0, Y: 2, Blur: 8, Spread: 0
  - Color: #000000 10%

Shadow/Modal:
  - Type: Drop Shadow
  - X: 0, Y: 8, Blur: 32, Spread: 0
  - Color: #000000 30%

Shadow/Nav:
  - Type: Drop Shadow
  - X: 0, Y: -2, Blur: 8, Spread: 0
  - Color: #000000 10%
```

---

## 🏗️ **COMPONENTE 1: HEADER UNIVERSAL**

```
Nombre: Header/Universal
Tamaño: 390 x 80

Elementos:
┌─────────────────────────────────────┐
│                                     │
│  [⚙️]         OMNIA          [💬]   │
│  (20,28)    (center,28)    (346,28) │
│                                     │
└─────────────────────────────────────┘

Propiedades:
1. Background Rectangle:
   - Width: 390px
   - Height: 80px
   - Fill: #000000
   - Border Radius: 0 0 32px 32px
   - Position: X:0, Y:0

2. Settings Icon:
   - Icon: Lucide "Settings"
   - Size: 24x24
   - Color: #9CA3AF
   - Position: X:20, Y:28
   - Link: → Settings Screen (prototype)

3. OMNIA Logo:
   - Text: "OMNIA"
   - Font: Inter Bold
   - Size: 28px
   - Color: #FFFFFF
   - Position: Center horizontal, Y:32
   - Letter spacing: 2px

4. Messages Icon:
   - Icon: Lucide "MessageCircle"
   - Size: 24x24
   - Color: #9CA3AF
   - Position: X:346, Y:28
   - Badge (si hay mensajes):
     - Circle: 16x16, #FF7939
     - Position: top-right del icono
     - Número: 10px, blanco, centro
   - Link: → Messages Screen (prototype)

Auto Layout: Horizontal
Padding: 20px horizontal, 24px vertical
Spacing: Auto (space-between)
Alignment: Center
```

---

## 🏗️ **COMPONENTE 2: BOTTOM NAVIGATION - CLIENTE**

```
Nombre: BottomNav/Client
Tamaño: 390 x 70

┌──────────────────────────────────────────────────┐
│  [🔍]   [📊]    [🔥]    [📅]    [👤]           │
│ Search Activity Community Calendar Profile      │
└──────────────────────────────────────────────────┘

Propiedades:
1. Background Rectangle:
   - Width: 390px
   - Height: 70px
   - Fill: #000000
   - Shadow: Shadow/Nav
   - Position: Fixed bottom

2. Tab Container:
   - Auto Layout: Horizontal
   - Width: Fill (390px)
   - Height: 70px
   - Spacing: 0 (distribute evenly)
   - Items: 5 tabs (78px cada uno)

3. Tab Item (Search) - Estado Inactivo:
   - Frame: 78 x 70
   - Auto Layout: Vertical
   - Alignment: Center
   - Spacing: 4px
   - Padding: 12px 0
   - Icon: Lucide "Search", 20x20, #9CA3AF
   - Label: "Search", 12px, #9CA3AF
   
4. Tab Item - Estado Activo:
   - Igual que inactivo
   - Icon color: #FF7939
   - Label color: #FF7939
   
5. Tab Central (Community) - ESPECIAL:
   - Frame: 78 x 90 (más alto)
   - Position Y: -20 (elevado)
   - Background Circle:
     - Size: 56x56
     - Fill: #FF7939
     - Shadow: 0 4px 12px rgba(255,121,57,0.4)
   - Icon: Lucide "Flame", 28x28, #FFFFFF
   - Position: center del círculo
   - NO tiene label

Estados (crear variantes):
- Variant 1: tab="search" (Search activo)
- Variant 2: tab="activity" (Activity activo)
- Variant 3: tab="community" (Community siempre activo visualmente)
- Variant 4: tab="calendar" (Calendar activo)
- Variant 5: tab="profile" (Profile activo)

Interacciones (Prototype):
- Click Search → Change to variant tab="search"
- Click Activity → Change to variant tab="activity"
- Click Community → Change to variant tab="community"
- Click Calendar → Change to variant tab="calendar"
- Click Profile → Change to variant tab="profile"
```

---

## 🏗️ **COMPONENTE 3: BOTTOM NAVIGATION - COACH**

```
Nombre: BottomNav/Coach
Tamaño: 390 x 70

┌──────────────────────────────────────────────────┐
│  [👥]   [🛍️]    [🔥]    [📅]    [👤]           │
│ Clients Products Community Calendar Profile     │
└──────────────────────────────────────────────────┘

Igual que BottomNav/Client pero:
- Tab 1: Icon "Users", Label "Clients"
- Tab 2: Icon "ShoppingBag", Label "Products"
- Tabs 3-5: Iguales (Community, Calendar, Profile)

Estados (crear variantes):
- Variant 1: tab="clients"
- Variant 2: tab="products"
- Variant 3: tab="community"
- Variant 4: tab="calendar"
- Variant 5: tab="profile"
```

---

## 🏗️ **COMPONENTE 4: CARD PRODUCTO/ACTIVIDAD**

```
Nombre: Card/Product
Tamaño: 350 x 200

Layout:
┌─────────────────────────────────────┐
│ ┌──────────┐  Título                │
│ │          │  👤 Coach Name          │
│ │  Image   │  ⭐⭐⭐⭐⭐ 4.8         │
│ │  200x200 │  📊 Estadísticas        │
│ │          │  💰 $50                 │
│ └──────────┘  [Ver más →]           │
└─────────────────────────────────────┘

Propiedades:
1. Container Frame:
   - Width: 350px
   - Height: 200px
   - Fill: #1E1E1E
   - Border radius: 12px
   - Padding: 16px
   - Shadow: Shadow/Card
   - Auto Layout: Horizontal
   - Spacing: 16px

2. Image Container:
   - Width: 168px (200-32 padding)
   - Height: 168px
   - Border radius: 8px
   - Fill: Image (placeholder)
   - Object fit: Cover

3. Info Container:
   - Auto Layout: Vertical
   - Width: Fill
   - Height: Fill
   - Spacing: 8px
   - Alignment: Top left

4. Título:
   - Text: "Pliométricos de Ronaldinho"
   - Style: H3/SemiBold
   - Color: #FFFFFF
   - Max lines: 2
   - Truncate: Yes

5. Coach Name:
   - Text: "👤 Franco Pomati"
   - Style: Body Small/Regular
   - Color: #9CA3AF

6. Rating:
   - Text: "⭐⭐⭐⭐⭐ 4.8"
   - Style: Body Small/Medium
   - Color: #FF7939

7. Stats:
   - Auto Layout: Vertical
   - Spacing: 4px
   - Items:
     • "📊 3 sesiones" (14px, #9CA3AF)
     • "💪 2 ejercicios" (14px, #9CA3AF)
     • "⏱️ 2 semanas" (14px, #9CA3AF)

8. Price:
   - Text: "$50"
   - Style: H3/Bold
   - Color: #FF7939
   - Position: Bottom left

9. Button "Ver más":
   - Text: "Ver más →"
   - Style: Body Small/Medium
   - Color: #FF7939
   - Background: Transparent
   - Position: Bottom right
   - Hover: underline

Estados (variantes):
- Default
- Hover (scale 1.02)
- Loading (skeleton)
- Purchased (badge "✓ Comprado")

Interacción:
- Click anywhere → Open Modal Detalle Producto
```

---

## 🏗️ **COMPONENTE 5: MODAL DETALLE PRODUCTO**

```
Nombre: Modal/ProductDetail
Tamaño: 390 x 700 (scroll interno)

Layout:
┌─────────────────────────────────────┐
│  [X]                                │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │      Video Preview          │   │
│  │      16:9 ratio             │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Pliométricos de Ronaldinho         │
│  👤 Franco Pomati                   │
│  ⭐⭐⭐⭐⭐ 4.8 (234 reviews)        │
│                                     │
│  ─────────────────────────────      │
│  📊 Detalles del Programa           │
│  ─────────────────────────────      │
│  • 3 sesiones semanales             │
│  • 2 ejercicios únicos              │
│  • Duración: 2 semanas              │
│  • Nivel: Intermedio                │
│                                     │
│  ─────────────────────────────      │
│  📝 Descripción                     │
│  ─────────────────────────────      │
│  Programa intensivo de...           │
│  (texto completo descripción)       │
│                                     │
│  ─────────────────────────────      │
│  💰 Precio: $50                     │
│  ─────────────────────────────      │
│                                     │
│  [Comprar Ahora] (Primary)          │
│  [Contactar Coach] (Secondary)      │
│                                     │
└─────────────────────────────────────┘

Propiedades:
1. Overlay Background:
   - Fill: #000000 60% opacity
   - Click → Close modal

2. Modal Container:
   - Width: 390px
   - Max height: 700px
   - Fill: #1E1E1E
   - Border radius: 24px 24px 0 0
   - Position: Bottom
   - Shadow: Shadow/Modal
   - Padding: 24px
   - Scroll: Vertical

3. Close Button:
   - Icon: "X"
   - Size: 24x24
   - Color: #9CA3AF
   - Position: Top right (346, 24)
   - Click → Close modal

4. Video Container:
   - Width: 342px (390-48 padding)
   - Height: 192px (16:9 ratio)
   - Border radius: 12px
   - Background: #000000
   - Margin bottom: 20px
   - Play button overlay: 48x48, #FF7939

5. Title:
   - Text style: H2/SemiBold
   - Color: #FFFFFF
   - Margin bottom: 8px

6. Coach Name:
   - Auto Layout: Horizontal
   - Icon: User 16x16, #9CA3AF
   - Text: Inter Regular 14px, #9CA3AF
   - Spacing: 6px
   - Margin bottom: 4px

7. Rating:
   - Auto Layout: Horizontal
   - Stars: ⭐ (5x) 16x16
   - Score: 4.8, Inter Bold 16px, #FF7939
   - Reviews: (234 reviews), 14px, #9CA3AF
   - Spacing: 8px

8. Divider:
   - Height: 1px
   - Fill: #374151
   - Margin: 20px 0

9. Section Header "📊 Detalles":
   - Text: Body/Medium 16px
   - Color: #FFFFFF
   - Margin: 16px 0 12px

10. Stats List:
    - Auto Layout: Vertical
    - Spacing: 8px
    - Each item:
      • Bullet: "•" #FF7939
      • Text: 14px, #9CA3AF
      • Spacing: 8px horizontal

11. Price Section:
    - Text: "💰 Precio: $50"
    - Style: H2/Bold
    - Color: #FF7939
    - Margin: 24px 0 20px

12. Button Container:
    - Auto Layout: Vertical
    - Spacing: 12px
    - Width: Fill

13. Primary Button [Comprar]:
    - Width: Fill (342px)
    - Height: 48px
    - Fill: #FF7939
    - Border radius: 8px
    - Text: "Comprar Ahora", Inter SemiBold 16px, #FFFFFF
    - Click → Payment flow

14. Secondary Button [Contactar]:
    - Width: Fill
    - Height: 48px
    - Fill: Transparent
    - Border: 1px solid #FF7939
    - Border radius: 8px
    - Text: "Contactar Coach", Inter SemiBold 16px, #FF7939
    - Click → Chat screen

Animación entrada:
- From: translateY(700px), opacity 0
- To: translateY(0), opacity 1
- Duration: 300ms
- Easing: ease-out

Animación salida:
- From: translateY(0), opacity 1
- To: translateY(700px), opacity 0
- Duration: 200ms
- Easing: ease-in
```

---

## 📱 **PANTALLA 1: SEARCH SCREEN (Cliente)**

```
Nombre: Client/Search
Tamaño: 390 x 844

Estructura completa:
┌─────────────────────────────────────┐ Y:0
│  Header Universal (80px)            │
├─────────────────────────────────────┤ Y:80
│  🔍 [Buscar coaches o actividades]  │ 
│  Padding: 20px, Height: 48px        │
├─────────────────────────────────────┤ Y:148
│  ┌──────────┐  ┌──────────┐        │
│  │ Coaches  │  │Activities│        │
│  └──────────┘  └──────────┘        │
│  Toggle buttons, Height: 40px       │
├─────────────────────────────────────┤ Y:208
│                                     │
│  SCROLL CONTAINER                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Card Producto/Actividad     │   │
│  │  (350 x 200)                 │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Card Producto/Actividad     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Card Producto/Actividad     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ... (más cards)                    │
│                                     │
├─────────────────────────────────────┤ Y:774
│  Bottom Navigation (70px)           │
└─────────────────────────────────────┘ Y:844

Elementos:

1. Header: 
   - Component: Header/Universal

2. Search Bar Container:
   - Width: 350px
   - Height: 48px
   - Fill: #1E1E1E
   - Border radius: 24px
   - Border: 1px solid #374151
   - Position: Center horizontal, Y:90
   - Padding: 12px 16px
   - Icon: Search 20x20, #9CA3AF, left
   - Placeholder: "Buscar coaches o actividades"
   - Text color: #9CA3AF
   - Focus border: #FF7939

3. Filter Toggle:
   - Container: 350px width, Y:148
   - Auto Layout: Horizontal
   - Spacing: 12px
   - Center horizontal
   
   Button "Coaches":
   - Width: 169px (half minus spacing)
   - Height: 40px
   - Border radius: 8px
   - State inactive: 
     • Fill: Transparent
     • Border: 1px #374151
     • Text: #9CA3AF
   - State active:
     • Fill: #FF7939
     • Border: none
     • Text: #FFFFFF
   
   Button "Activities":
   - Same as Coaches
   - Toggle state opposite

4. Scroll Container:
   - Position: Y:208
   - Width: 390px
   - Height: 566px (774-208)
   - Overflow: Scroll vertical
   - Padding: 20px
   - Spacing: 16px between cards
   
   Content (Auto Layout Vertical):
   - Component: Card/Product (x multiple)
   - Spacing: 16px
   - Alignment: Center

5. Bottom Nav:
   - Component: BottomNav/Client
   - Position: Fixed bottom
   - State: tab="search" (activo)

Prototype Connections:
- Search bar click → Keyboard aparece (simular)
- Filter toggle → Switch state
- Any card → Open Modal/ProductDetail (overlay)
- Bottom tabs → Navigate to other screens
```

---

## 📱 **PANTALLA 2: PRODUCTS SCREEN (Coach)**

```
Nombre: Coach/Products
Tamaño: 390 x 844

Layout completo:
┌─────────────────────────────────────┐ Y:0
│  Header Universal (80px)            │
├─────────────────────────────────────┤ Y:80
│  Mis Productos                      │
│  [+ Crear Producto]                 │
│  Padding: 20px                      │
├─────────────────────────────────────┤ Y:168
│  SCROLL: Lista Productos            │
│  ┌─────────────────────────────┐   │
│  │ Producto 1                   │   │
│  │ [Editar] [Ver]               │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Producto 2                   │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  💼 Consultas                       │
│  ┌───────────────────────────────┐ │
│  │ ☕ Café     [OFF] $10 [Edit] │ │
│  │ ⏰ 30 min   [ON]  $50 [Edit] │ │
│  │ ⏰ 1 hora   [ON]  $80 [Edit] │ │
│  └───────────────────────────────┘ │
├─────────────────────────────────────┤ Y:774
│  Bottom Navigation (70px)           │
└─────────────────────────────────────┘

Elementos:

1. Title + Button Container:
   - Position: Y:90
   - Padding: 20px
   - Auto Layout: Vertical
   - Spacing: 16px
   
   Title:
   - Text: "Mis Productos"
   - Style: H2/SemiBold
   - Color: #FFFFFF
   
   Create Button:
   - Width: 350px
   - Height: 48px
   - Fill: #FF7939
   - Border radius: 8px
   - Icon: "Plus" 20x20, left
   - Text: "Crear Producto", 16px SemiBold
   - Color: #FFFFFF
   - Click → Open Modal Crear (Paso 1)

2. Products List Container:
   - Auto Layout: Vertical
   - Spacing: 16px
   - Padding: 0 20px
   
   Product Card (cada uno):
   - Width: 350px
   - Height: 180px
   - Fill: #1E1E1E
   - Border radius: 12px
   - Padding: 16px
   - Shadow: Shadow/Card
   
   Layout interno:
   ┌──────────────────────────┐
   │ Título (18px Bold)       │
   │ 📊 3 sesiones, 2 ejerc.  │
   │ 💰 $50                   │
   │ [Editar] [Ver]           │
   └──────────────────────────┘
   
   Buttons:
   - [Editar]: 100px x 36px, #FF7939
   - [Ver]: 100px x 36px, border #FF7939
   - Spacing: 12px

3. Consultations Section:
   - Background: #1E1E1E
   - Border radius: 16px
   - Padding: 20px
   - Margin: 20px
   - Shadow: Shadow/Card
   
   Header:
   - Text: "💼 Consultas"
   - Style: H3/SemiBold
   - Color: #FFFFFF
   - Margin bottom: 16px
   
   Each consultation row:
   - Height: 56px
   - Auto Layout: Horizontal
   - Spacing: Auto (space-between)
   - Alignment: Center
   - Border bottom: 1px #374151 (excepto último)
   
   Row layout:
   ┌────────────────────────────────┐
   │ ☕ Café    [Toggle] $10 [Edit] │
   └────────────────────────────────┘
   
   Components:
   - Icon + Label: Auto layout, 8px spacing
   - Toggle: Component Toggle/Switch
   - Price: 16px Medium, #FF7939
   - Edit button: 24x24, icon "Edit3", #9CA3AF

4. Bottom Nav:
   - Component: BottomNav/Coach
   - State: tab="products"

Connections:
- [+ Crear] → Modal/CreateProduct (Paso 1)
- [Editar] → Modal/CreateProduct (Paso 1, pre-filled)
- [Ver] → Modal/ProductDetail
- Toggle → Update state + API call
- [Edit] precio → Modal/EditPrice
```

---

## 📱 **PANTALLA 3: TODAYSCREEN (Ejercicios del Día)**

```
Nombre: Client/TodayScreen
Tamaño: 390 x 844

Layout completo:
┌─────────────────────────────────────┐ Y:0
│  [← Volver]   HOY    [Próximo →]   │
│  Custom Header (60px)               │
├─────────────────────────────────────┤ Y:60
│  📅 Miércoles 9 de Octubre          │
│  🏋️ Programa de Fuerza              │
│  Sesión 1 - Día 3                   │
│  (80px)                             │
├─────────────────────────────────────┤ Y:140
│  SCROLL: Lista Ejercicios           │
│  ┌─────────────────────────────┐   │
│  │ 1. Sentadillas               │   │
│  │ 3 series x 10 reps           │   │
│  │ 💪 60kg                      │   │
│  │ ┌───┐ ┌───┐ ┌───┐          │   │
│  │ │ ✓ │ │ ✓ │ │   │ Series   │   │
│  │ └───┘ └───┘ └───┘          │   │
│  │ ──────────────────────────   │   │
│  │ Peso: [60kg ▼] Reps: [10▼] │   │
│  └─────────────────────────────┘   │
│  (240px por ejercicio)              │
│  ┌─────────────────────────────┐   │
│  │ 2. Press de banca            │   │
│  │ ...                          │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤ Y:704
│  Footer Fijo (140px)                │
│  Progreso: ━━━━━━━ 0%               │
│  0/2 ejercicios completados          │
│  [Marcar día completo] ✅           │
└─────────────────────────────────────┘ Y:844

Elementos:

1. Custom Header:
   - Width: 390px
   - Height: 60px
   - Fill: #000000
   - Padding: 16px 20px
   
   Layout horizontal:
   - [← Volver]: Icon "ArrowLeft" 24x24, #FF7939
   - "HOY": H3/Bold 20px, #FFFFFF, center
   - [Próximo →]: Icon "ArrowRight" 24x24, #FF7939
   - Spacing: Auto (space-between)

2. Activity Info Section:
   - Padding: 20px
   - Auto Layout: Vertical
   - Spacing: 4px
   - Background: #000000
   
   Date:
   - Text: "📅 Miércoles 9 de Octubre"
   - Style: Body/Medium 14px
   - Color: #9CA3AF
   
   Activity:
   - Text: "🏋️ Programa de Fuerza"
   - Style: H3/SemiBold 18px
   - Color: #FFFFFF
   
   Session:
   - Text: "Sesión 1 - Día 3"
   - Style: Body Small 14px
   - Color: #9CA3AF

3. Exercise Card (Component):
   - Width: 350px
   - Auto height (min 240px)
   - Fill: #1E1E1E
   - Border radius: 12px
   - Padding: 16px
   - Shadow: Shadow/Card
   
   Layout interno:
   
   Exercise Number + Name:
   - Text: "1. Sentadillas"
   - Style: Body/Medium 16px
   - Color: #FFFFFF
   
   Sets x Reps:
   - Text: "3 series x 10 reps"
   - Style: Body Small 14px
   - Color: #9CA3AF
   - Margin: 4px 0 8px
   
   Weight:
   - Text: "💪 60kg"
   - Style: Body Small 14px
   - Color: #FF7939
   - Margin bottom: 12px
   
   Series Checkboxes:
   - Auto Layout: Horizontal
   - Spacing: 8px
   - Each checkbox:
     • Size: 32x32
     • Border radius: 6px
     • Border: 2px #374151
     • Checked: Fill #FF7939, checkmark white
     • Unchecked: Fill transparent
   
   Divider:
   - Height: 1px
   - Fill: #374151
   - Margin: 16px 0
   
   Input Row:
   - Auto Layout: Horizontal
   - Spacing: 12px
   
   Peso Input:
   - Label: "Peso:" 12px #9CA3AF
   - Select: [60kg ▼]
     • Width: 100px
     • Height: 40px
     • Fill: #000000
     • Border: 1px #374151
     • Border radius: 6px
     • Dropdown icon: right
   
   Reps Input:
   - Same structure
   - Label: "Reps:"
   - Select: [10 ▼]

4. Scroll Container:
   - Position: Y:140
   - Height: 564px (704-140)
   - Overflow: Scroll vertical
   - Padding: 20px
   - Auto Layout: Vertical
   - Spacing: 16px between exercises

5. Footer Fixed:
   - Width: 390px
   - Height: 140px
   - Fill: #000000
   - Position: Fixed bottom Y:704
   - Padding: 20px
   - Border top: 1px #374151
   
   Progress Bar:
   - Width: 350px
   - Height: 8px
   - Background: #4B5563
   - Fill: #FF7939 (porcentaje completado)
   - Border radius: 4px
   - Margin bottom: 8px
   
   Progress Text:
   - Text: "0/2 ejercicios completados"
   - Style: Body Small 14px
   - Color: #9CA3AF
   - Center aligned
   - Margin bottom: 16px
   
   Complete Button:
   - Width: 350px
   - Height: 48px
   - Fill: #FF7939
   - Border radius: 8px
   - Icon: "CheckCircle" 20x20, left
   - Text: "Marcar día completo", 16px SemiBold
   - Color: #FFFFFF
   - Shadow: 0 4px 12px rgba(255,121,57,0.3)

Interacciones:
- [← Volver] → Calendar Screen
- [Próximo →] → TodayScreen (siguiente fecha)
- Checkbox → Toggle checked state + update BD
- Peso/Reps select → Open dropdown
- [Marcar completo] → Mark all + animation + navigate back

Estados del botón:
- Default: #FF7939
- Disabled (0 completados): #4B5563
- Pressed: Scale 0.98
- Success: ✓ animation + green flash
```

---

## 📱 **PANTALLA 4: CALENDAR SCREEN (Universal)**

```
Nombre: Universal/Calendar
Tamaño: 390 x 844

Layout:
┌─────────────────────────────────────┐ Y:0
│  Header Universal (80px)            │
├─────────────────────────────────────┤ Y:80
│  📅 [<] Octubre 2025 [>]            │
│  (40px)                             │
├─────────────────────────────────────┤ Y:120
│  L   M   M   J   V   S   D          │
│  (días de la semana, 32px)          │
├─────────────────────────────────────┤ Y:152
│  Grid Calendario (300px)            │
│  ┌────┬────┬────┬────┬────┬────┬────┐│
│  │ 1  │ 2  │ 3  │ 4  │ 5  │ 6  │    ││
│  ├────┼────┼────┼────┼────┼────┼────┤│
│  │ 7  │ 8  │🔥9 │ 10 │ 11 │ 12 │ 13 ││
│  ├────┼────┼────┼────┼────┼────┼────┤│
│  │ •  │ •  │ •  │ •  │    │    │    ││
│  │ 14 │ 15 │ 16 │ 17 │ 18 │ 19 │ 20 ││
│  └────┴────┴────┴────┴────┴────┴────┘│
│  (42px altura cada fila)            │
├─────────────────────────────────────┤ Y:452
│  SCROLL: Actividades del día        │
│  📋 Actividades del 9/10:           │
│  ┌─────────────────────────────┐   │
│  │ 🏋️ Programa de Fuerza        │   │
│  │ Sesión 1 - Día 3             │   │
│  │ [Ir a entrenar] →            │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 🧘 Yoga Avanzada             │   │
│  │ Tema 1                       │   │
│  │ [Ver detalles] →             │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤ Y:774
│  Bottom Navigation (70px)           │
└─────────────────────────────────────┘

Elementos:

1. Month Selector:
   - Width: 350px
   - Height: 40px
   - Position: Center, Y:90
   - Auto Layout: Horizontal
   - Spacing: Auto (space-between)
   
   [< Button]:
   - Icon: "ChevronLeft" 24x24, #FF7939
   - Click → Previous month
   
   Month Text:
   - Text: "📅 Octubre 2025"
   - Style: Body/Medium 16px
   - Color: #FFFFFF
   
   [> Button]:
   - Icon: "ChevronRight" 24x24, #FF7939
   - Click → Next month

2. Weekday Headers:
   - Width: 350px
   - Height: 32px
   - Position: Center, Y:130
   - Auto Layout: Horizontal
   - Spacing: Distribute evenly
   - Each label: 14px Medium, #9CA3AF
   - Labels: L M M J V S D

3. Calendar Grid:
   - Width: 350px
   - Position: Center, Y:162
   - Grid: 7 columns x 5 rows
   - Cell size: 50x42px
   - Gap: 0
   
   Cell (día):
   - Size: 50x42px
   - Text: Número día, 16px Regular
   - Color: #FFFFFF
   - Alignment: Center
   
   Cell States:
   - Default: Color #FFFFFF
   - Today: Border 2px #FF7939, Bold
   - Has activity: Dot 6px #FF7939, below number
   - Selected: Background #FF7939, text #000
   - Other month: Color #4B5563
   - Disabled: Color #374151
   
   Activity Indicator (dot):
   - Size: 6x6px
   - Fill: #FF7939
   - Position: Center horizontal, Y+26

4. Day Activities Section:
   - Position: Y:452
   - Height: 322px (774-452)
   - Padding: 20px
   - Background: #000000
   - Overflow: Scroll vertical
   
   Section Title:
   - Text: "📋 Actividades del 9/10:"
   - Style: Body/Medium 16px
   - Color: #FFFFFF
   - Margin bottom: 12px
   
   Activity Card (mini):
   - Width: 350px
   - Height: 100px
   - Fill: #1E1E1E
   - Border radius: 12px
   - Padding: 16px
   - Margin bottom: 12px
   
   Layout:
   - Icon: 24x24 (🏋️ o 🧘)
   - Title: 16px SemiBold, #FFFFFF
   - Subtitle: 14px Regular, #9CA3AF
   - Button "Ir a entrenar →": #FF7939
   
   Click → Navigate to TodayScreen

5. Bottom Nav:
   - Component: BottomNav/Client (o Coach)
   - State: tab="calendar"

Interacciones:
- [<] [>] → Change month
- Click día → Select + show activities below
- Dot día → Visual indicator only
- [Ir a entrenar] → Navigate TodayScreen
- Activity card → Navigate TodayScreen
```

---

## 🎨 **ESPECIFICACIONES EXACTAS PARA COPIAR/PEGAR**

### **Frame Base para cada pantalla:**
```
1. Crear Frame
2. Nombre: Client/[NombrePantalla] o Coach/[NombrePantalla]
3. Width: 390px
4. Height: 844px
5. Fill: #000000
6. Constraints: Center
```

### **Auto Layout recomendado:**
```
Container principal:
- Direction: Vertical
- Horizontal padding: 0
- Vertical padding: 0
- Spacing: 0
- Fill: #000000

Content area:
- Direction: Vertical
- Horizontal padding: 20px
- Vertical padding: 20px
- Spacing: 16px
- Fill: #000000
```

### **Componentes a crear primero:**
```
1. Header/Universal (390x80)
2. BottomNav/Client (390x70)
3. BottomNav/Coach (390x70)
4. Card/Product (350x200)
5. Button/Primary (350x48)
6. Button/Secondary (350x48)
7. Input/Text (350x48)
8. Toggle/Switch (48x24)
9. ProgressBar (350x8)
10. Modal/Base (390x700)
```

---

## 🔗 **PROTOTYPE CONNECTIONS - RESUMEN**

### **Cliente → Cliente:**
```
Search → Modal Producto → Comprar/Contactar
Search → Modal Coach Profile
Activity → Modal Producto
Community → Modal Publicación
Community → Modal Coach
Calendar → TodayScreen → Complete → Calendar
Profile → Modal Biométricas
Profile → Modal Lesiones
Profile → Settings Screen
```

### **Coach → Coach:**
```
Clients → Modal Cliente → Calendario/Mensaje
Products → Modal Crear (5 pasos) → Publicar
Products → Modal Editar → Actualizar
Products → Toggle Consultas → Update
Calendar → Stats del día
```

### **Shared:**
```
Bottom Nav → Any tab (bidireccional)
Messages icon → Chat Screen (ambos)
Settings icon → Settings Screen (ambos)
```

---

## ✅ **CHECKLIST FINAL FIGMA**

### **Setup (15 min):**
- [ ] Crear proyecto "OMNIA App"
- [ ] Configurar color styles (12 colores)
- [ ] Configurar text styles (8 estilos)
- [ ] Configurar effect styles (3 sombras)
- [ ] Descargar iconos Lucide

### **Componentes (2 horas):**
- [ ] Header/Universal
- [ ] BottomNav/Client
- [ ] BottomNav/Coach
- [ ] Card/Product (con variantes)
- [ ] Button/Primary
- [ ] Button/Secondary
- [ ] Input/Text
- [ ] Toggle/Switch
- [ ] ProgressBar
- [ ] Modal/Base

### **Pantallas Cliente (3 horas):**
- [ ] Client/Search
- [ ] Client/Activity
- [ ] Client/Community
- [ ] Client/Calendar
- [ ] Client/Profile
- [ ] Client/TodayScreen

### **Pantallas Coach (2 horas):**
- [ ] Coach/Clients
- [ ] Coach/Products
- [ ] Coach/Calendar

### **Modales (2 horas):**
- [ ] Modal/ProductDetail
- [ ] Modal/CoachProfile
- [ ] Modal/ClientDetail
- [ ] Modal/CreateProduct (5 pasos)
- [ ] Modal/Biometrics
- [ ] Modal/Injuries

### **Prototype (1 hora):**
- [ ] Conectar navegación bottom nav
- [ ] Conectar cards a modales
- [ ] Conectar flujo crear producto
- [ ] Conectar calendario → TodayScreen
- [ ] Agregar animaciones Smart Animate
- [ ] Testing del flujo completo

### **Export (30 min):**
- [ ] Crear presentación interactiva
- [ ] Export para desarrollo
- [ ] Documentar componentes

---

**Tiempo total estimado: 10-11 horas**

**Resultado:** Diseño completo funcional de OMNIA con todos los flujos de navegación y componentes reutilizables. 🎨✨
