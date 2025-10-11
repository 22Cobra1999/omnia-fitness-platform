# 📊 TABLA DE NAVEGACIÓN COMPLETA - OMNIA

## 🗺️ MAPA COMPLETO DE CLICKS Y NAVEGACIÓN

---

## 👤 **CLIENTE - FLUJO DE NAVEGACIÓN**

| Pantalla Origen | Elemento Clickeable | Acción | Destino | Tipo Transición |
|----------------|---------------------|---------|---------|-----------------|
| **Search** | Barra búsqueda | Activar teclado | Filtrar resultados | In-place |
| **Search** | Toggle Coaches/Activities | Switch filtro | Cambiar vista | In-place |
| **Search** | Card Coach | Abrir perfil | Modal Perfil Coach | Overlay |
| **Search** | Card Actividad | Ver detalles | Modal Detalle Producto | Overlay |
| **Search** | → Bottom Nav | Cambiar tab | Cualquier otra tab | Navigate |
| | | | | |
| **Activity** | Card Mi Actividad | Ver programa | Modal Detalle Actividad | Overlay |
| **Activity** | Barra progreso | Visual feedback | - | Visual only |
| **Activity** | → Bottom Nav | Cambiar tab | Cualquier otra tab | Navigate |
| | | | | |
| **Community** | Card Publicación | Expandir | Detalle Publicación | Overlay |
| **Community** | Nombre Coach en post | Ver perfil | Modal Perfil Coach | Overlay |
| **Community** | Botón ❤️ Like | Dar like | Animación + guardar | Animation |
| **Community** | Botón 💬 Comentarios | Ver comentarios | Modal Comentarios | Overlay |
| **Community** | Botón 🔖 Guardar | Guardar post | Modal Seleccionar Folder | Overlay |
| **Community** | → Bottom Nav | Cambiar tab | Cualquier otra tab | Navigate |
| | | | | |
| **Calendar** | Día del mes | Seleccionar día | Mostrar actividades abajo | In-place |
| **Calendar** | Botón < > meses | Navegar mes | Mes anterior/siguiente | In-place |
| **Calendar** | Card actividad del día | Ver ejercicios | TodayScreen completa | Navigate |
| **Calendar** | Botón [Ir a entrenar] | Iniciar sesión | TodayScreen completa | Navigate |
| **Calendar** | → Bottom Nav | Cambiar tab | Cualquier otra tab | Navigate |
| | | | | |
| **Profile** | Avatar | Cambiar foto | Modal Upload Imagen | Overlay |
| **Profile** | Botón Biométricas | Editar datos | Modal Biométricas | Overlay |
| **Profile** | Botón Lesiones | Gestionar lesiones | Modal Lesiones | Overlay |
| **Profile** | Botón Configuración | Settings | Settings Screen | Navigate |
| **Profile** | Botón Mis Programas | Ver programas | My Programs Screen | Navigate |
| **Profile** | Estadísticas semana | Visual info | - | Visual only |
| **Profile** | Anillos diarios | Visual progress | - | Visual only |
| **Profile** | → Bottom Nav | Cambiar tab | Cualquier otra tab | Navigate |
| | | | | |
| **TodayScreen** | Checkbox serie | Marcar completada | Estado actualizado | In-place |
| **TodayScreen** | Botón ← Volver | Regresar | Calendar Screen | Navigate back |
| **TodayScreen** | Botón Próximo → | Siguiente día | TodayScreen (nueva fecha) | Navigate |
| **TodayScreen** | [Marcar día completo] | Completar todas | Actualizar BD + animación | Action |
| **TodayScreen** | Input peso/reps | Editar valores | Guardar en BD | In-place |

---

## 👨‍💼 **COACH - FLUJO DE NAVEGACIÓN**

| Pantalla Origen | Elemento Clickeable | Acción | Destino | Tipo Transición |
|----------------|---------------------|---------|---------|-----------------|
| **Clients** | Card Cliente | Ver detalles | Modal Detalle Cliente | Overlay |
| **Clients** | → Bottom Nav | Cambiar tab | Cualquier otra tab | Navigate |
| | | | | |
| **Products** | Botón [+ Crear Producto] | Crear nuevo | Modal 5 Pasos (Paso 1) | Overlay |
| **Products** | Card Producto → [Editar] | Editar existente | Modal 5 Pasos (Paso 1) | Overlay |
| **Products** | Card Producto → [Ver] | Vista previa | Modal Detalle Producto | Overlay |
| **Products** | Toggle ☕ Café | ON/OFF | Actualizar BD | In-place |
| **Products** | Toggle ⏰ 30 min | ON/OFF | Actualizar BD | In-place |
| **Products** | Toggle ⏰ 1 hora | ON/OFF | Actualizar BD | In-place |
| **Products** | Precio consultas | Editar precio | Modal Editar Precio | Overlay |
| **Products** | → Bottom Nav | Cambiar tab | Cualquier otra tab | Navigate |
| | | | | |
| **Calendar Coach** | Día del mes | Seleccionar día | Mostrar resumen abajo | In-place |
| **Calendar Coach** | Resumen día | Ver stats | Estadísticas visuales | In-place |
| **Calendar Coach** | → Bottom Nav | Cambiar tab | Cualquier otra tab | Navigate |
| | | | | |
| **Community** | (igual que cliente) | - | - | - |
| **Profile** | (igual que cliente) | - | - | - |

---

## 📦 **MODAL CREAR/EDITAR PRODUCTO - FLUJO 5 PASOS**

| Paso | Pantalla | Campos/Elementos | Botones | Validación |
|------|----------|------------------|---------|------------|
| **1** | Info General | • Título (input)<br>• Descripción (textarea)<br>• Precio (input número)<br>• Tipo (radio: Programa/Workshop) | [← Cancelar] [Siguiente →] | Título requerido<br>Precio > 0 |
| **2** | Multimedia | • [Subir archivo] (imagen/video)<br>• [Seleccionar existente]<br>• Preview visual | [← Atrás] [Siguiente →] | Archivo requerido |
| **3** | Ejercicios CSV | • [📄 Subir CSV]<br>• [✅ Seleccionar existentes]<br>• Lista ejercicios cargados<br>• [Ver plantilla] | [← Atrás] [Siguiente →] | Min 1 ejercicio |
| **4** | Calendario | • Períodos (tabs)<br>• [+ Agregar período]<br>• Grid semana (L-D)<br>• Asignación ejercicios/día<br>• Resumen: sesiones/semana | [← Atrás] [Siguiente →] | Min 1 sesión |
| **5** | Revisión | • Preview completo<br>• ✓ Validaciones todas OK<br>• Resumen final | [← Atrás] [🚀 Publicar] | Todo OK |

**NAVEGACIÓN ENTRE PASOS:**
- [← Atrás]: Regresa al paso anterior (datos se mantienen)
- [Siguiente →]: Avanza al siguiente paso (valida antes)
- [X Cerrar]: Modal confirmación "¿Descartar cambios?"
- [🚀 Publicar]: Guarda todo en BD y cierra modal

---

## 🎭 **MODALES Y OVERLAYS**

| Modal | Trigger (desde) | Contenido | Acciones | Cierre |
|-------|----------------|-----------|----------|--------|
| **Detalle Producto** | Search, Activity, Products | • Video/Imagen<br>• Título, coach, rating<br>• Stats (sesiones, ejercicios)<br>• Descripción<br>• Precio | [Comprar]<br>[Contactar] | [X] o click fuera |
| **Perfil Coach** | Search, Community | • Avatar + nombre<br>• Rating + reviews<br>• Productos del coach<br>• Bio | [Ver producto]<br>[Mensaje] | [X] o click fuera |
| **Detalle Cliente** | Clients (coach) | • Info personal<br>• Programas activos<br>• Progreso<br>• Calendario | [Mensaje]<br>[Ver calendario] | [X] o click fuera |
| **Biométricas** | Profile | • Peso (kg)<br>• Altura (cm)<br>• Edad (años) | [Guardar]<br>[Cancelar] | [X] o Cancelar |
| **Lesiones** | Profile | • Lista lesiones<br>• [+ Agregar nueva]<br>• Editar/Eliminar | [Guardar]<br>[Cancelar] | [X] o Cancelar |
| **Crear Producto** | Products (coach) | 5 pasos completos | [Publicar]<br>[Cancelar] | [X] + confirmación |
| **Confirmación** | Al cerrar modales | "¿Descartar cambios?" | [Sí, descartar]<br>[No, continuar] | Sí/No |

---

## 🎨 **ESTADOS DE COMPONENTES**

### **Card Producto/Actividad**

| Estado | Visual | Descripción |
|--------|--------|-------------|
| **Default** | Fondo #1E1E1E, texto blanco | Estado normal |
| **Hover** | Escala 1.02, sombra aumenta | Desktop only |
| **Loading** | Skeleton gris animado | Cargando datos |
| **Error** | Borde rojo, mensaje error | Fallo carga |
| **Purchased** | Badge "✓ Comprado" verde | Cliente ya compró |

### **Bottom Navigation Tab**

| Estado | Visual | Descripción |
|--------|--------|-------------|
| **Inactivo** | Color #9CA3AF, opacidad 0.7 | Tab no seleccionado |
| **Activo** | Color #FF7939, opacidad 1.0 | Tab actual |
| **Presionado** | Escala 0.95, duration 100ms | Feedback táctil |
| **Community (central)** | Siempre #FF7939, elevado -20px | Tab principal |

### **Botones**

| Tipo | Color Fondo | Color Texto | Border Radius | Altura |
|------|-------------|-------------|---------------|--------|
| **Primary** | #FF7939 | #FFFFFF | 8px | 48px |
| **Secondary** | Transparent | #FF7939 | 8px | 48px |
| **Ghost** | Transparent | #9CA3AF | 8px | 40px |
| **Disabled** | #4B5563 | #6B7280 | 8px | 48px |

---

## 📐 **LAYOUTS ESPECÍFICOS**

### **Search Screen Layout:**
```
┌─────────────────────────────────────┐ 390px
│ Header (80px)                       │
├─────────────────────────────────────┤
│ Barra búsqueda (48px)               │
│ Margin: 20px                        │
├─────────────────────────────────────┤
│ Filtros Toggle (40px)               │
│ Margin: 16px                        │
├─────────────────────────────────────┤
│ Scroll Container:                   │
│  • Card (160px height)              │
│  • Spacing: 16px entre cards        │
│  • Padding: 20px horizontal         │
│  • Infinite scroll                  │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ Bottom Navigation (70px)            │
└─────────────────────────────────────┘
```

### **Products Screen Layout (Coach):**
```
┌─────────────────────────────────────┐ 390px
│ Header (80px)                       │
├─────────────────────────────────────┤
│ Título "Mis Productos" (40px)       │
│ [+ Crear Producto] Button (48px)   │
│ Margin: 20px                        │
├─────────────────────────────────────┤
│ Lista Productos:                    │
│  • Card producto (180px)            │
│  • Spacing: 16px                    │
│  • [Editar] [Ver] buttons           │
│                                     │
├─────────────────────────────────────┤
│ Sección Consultas:                  │
│  • Header "💼 Consultas" (32px)     │
│  • Toggle ☕ Café (56px)            │
│  • Toggle ⏰ 30 min (56px)          │
│  • Toggle ⏰ 1 hora (56px)          │
│                                     │
├─────────────────────────────────────┤
│ Bottom Navigation (70px)            │
└─────────────────────────────────────┘
```

### **TodayScreen Layout:**
```
┌─────────────────────────────────────┐ 390px
│ Header Custom (80px)                │
│ [← Volver]   HOY   [Próximo →]     │
├─────────────────────────────────────┤
│ Fecha + Actividad (60px)            │
│ "Miércoles 9 de Octubre"            │
│ "Programa de Fuerza - Sesión 1"     │
├─────────────────────────────────────┤
│ Scroll Container Ejercicios:        │
│  ┌───────────────────────────────┐ │
│  │ 1. Sentadillas                 │ │
│  │ 3 series x 10 reps             │ │
│  │ 💪 60kg                        │ │
│  │ [✓] [✓] [ ] Series             │ │
│  │ ────────────────────────────   │ │
│  │ Peso: [60kg▼]  Reps: [10▼]   │ │
│  └───────────────────────────────┘ │
│  (200px por ejercicio)              │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 2. Press de banca              │ │
│  │ ...                            │ │
│  └───────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ Footer Fijo (100px)                 │
│ Progreso: ━━━━━━━━━━ 0%             │
│ 0/2 ejercicios completados          │
│ [Marcar día completo] ✅            │
└─────────────────────────────────────┘
```

---

## 👨‍💼 **COACH - FLUJO DE NAVEGACIÓN**

| Pantalla Origen | Elemento Clickeable | Acción | Destino | Tipo Transición |
|----------------|---------------------|---------|---------|-----------------|
| **Clients** | Card Cliente | Ver detalles | Modal Detalle Cliente | Overlay |
| **Clients** | → Bottom Nav | Cambiar tab | Cualquier otra tab | Navigate |
| | | | | |
| **Products** | [+ Crear Producto] | Iniciar creación | Modal Paso 1/5 | Overlay |
| **Products** | Card → [Editar] | Editar producto | Modal Paso 1/5 (pre-filled) | Overlay |
| **Products** | Card → [Ver] | Vista previa | Modal Detalle Producto | Overlay |
| **Products** | Toggle ☕ Café | ON/OFF servicio | Actualiza BD + visual | In-place |
| **Products** | Toggle ⏰ 30 min | ON/OFF servicio | Actualiza BD + visual | In-place |
| **Products** | Toggle ⏰ 1 hora | ON/OFF servicio | Actualiza BD + visual | In-place |
| **Products** | Click precio consulta | Editar precio | Modal Input Precio | Overlay |
| **Products** | → Bottom Nav | Cambiar tab | Cualquier otra tab | Navigate |
| | | | | |
| **Calendar Coach** | Día del mes | Ver resumen | Stats del día abajo | In-place |
| **Calendar Coach** | Botón < > meses | Navegar mes | Mes anterior/siguiente | In-place |
| **Calendar Coach** | → Bottom Nav | Cambiar tab | Cualquier otra tab | Navigate |

---

## 📦 **FLUJO MODAL CREAR/EDITAR PRODUCTO**

| Desde Paso | Acción | Destino | Notas |
|-----------|---------|---------|-------|
| **Paso 1** | [Siguiente →] | Paso 2 | Valida: título, precio |
| **Paso 2** | [← Atrás] | Paso 1 | Mantiene datos |
| **Paso 2** | [Siguiente →] | Paso 3 | Valida: imagen/video |
| **Paso 2** | [Subir archivo] | File picker | Sube a Supabase Storage |
| **Paso 2** | [Seleccionar existente] | Grid archivos | Muestra archivos del coach |
| **Paso 3** | [← Atrás] | Paso 2 | Mantiene datos |
| **Paso 3** | [Siguiente →] | Paso 4 | Valida: min 1 ejercicio |
| **Paso 3** | [Subir CSV] | File picker CSV | Procesa y valida CSV |
| **Paso 3** | [Seleccionar existentes] | Lista ejercicios | Multi-select |
| **Paso 4** | [← Atrás] | Paso 3 | Mantiene datos |
| **Paso 4** | [Siguiente →] | Paso 5 | Valida: min 1 sesión |
| **Paso 4** | [+ Agregar período] | Nuevo período | Añade período a lista |
| **Paso 4** | Click día semana | Toggle día | Activa/desactiva día |
| **Paso 4** | [Editar sesiones] | Modal sesiones | Asignar ejercicios a día |
| **Paso 5** | [← Atrás] | Paso 4 | Mantiene datos |
| **Paso 5** | [🚀 Publicar] | Guardado BD | Cierra modal + refresh |
| **Cualquier paso** | [X Cerrar] | Modal confirmación | "¿Descartar cambios?" |

---

## 🎨 **COMPONENTES UI COMPARTIDOS**

### **1. Header (Todas las pantallas)**
```
┌─────────────────────────────────────┐
│  [⚙️ Settings]   OMNIA   [💬 Messages] │
│     24x24         28px      24x24   │
│   Posición:    Centro    Posición:  │
│   (20, 28)              (346, 28)   │
└─────────────────────────────────────┘
Altura total: 80px
Fondo: #000000
Border radius bottom: 32px
```

### **2. Card Producto/Actividad**
```
┌─────────────────────────────────┐
│ ┌──────┐  Título (18px bold)    │
│ │      │  👤 Coach (14px)       │
│ │ IMG  │  ⭐⭐⭐⭐⭐ 4.8         │
│ │200x  │  📊 3 sesiones         │
│ │200px │  💪 2 ejercicios       │
│ └──────┘  ⏱️ 2 semanas          │
│           💰 $50 (20px bold)    │
│           [Ver más →]           │
└─────────────────────────────────┘
Altura total: 200px
Fondo: #1E1E1E
Border radius: 12px
Padding: 16px
```

### **3. Barra de Progreso**
```
━━━━━━━━━━━━━━━━━━━━ 13%
│←── Naranja ──→│←─ Gris ─→│
Altura: 8px
Border radius: 4px
Color completado: #FF7939
Color pendiente: #4B5563
Label: 14px, gris, right aligned
```

### **4. Toggle Switch (Consultas)**
```
☕ Café        [ON] $10
               ┌──┐
     OFF    ●  │  │  ON
               └──┘
Width: 48px
Height: 24px
Color OFF: #4B5563
Color ON: #FF7939
Círculo: 20px, blanco
Transición: 200ms ease
```

### **5. Input Field**
```
┌─────────────────────────────────┐
│ Label (12px, #9CA3AF)           │
│ ┌─────────────────────────────┐ │
│ │ Placeholder texto...         │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
Height: 48px
Border: 1px solid #4B5563
Border radius: 8px
Focus: border #FF7939
Padding: 12px 16px
```

---

## 🔄 **ANIMACIONES Y TRANSICIONES**

| Elemento | Evento | Animación | Duración | Easing |
|----------|--------|-----------|----------|--------|
| Tab Navigation | Click | Fade in/out + slide | 300ms | ease-out |
| Modal open | Trigger | Scale 0.95→1 + fade in | 200ms | ease-out |
| Modal close | Close | Scale 1→0.95 + fade out | 150ms | ease-in |
| Button press | Click | Scale 0.95 | 100ms | ease-in-out |
| Card hover | Hover | Scale 1.02 + shadow | 200ms | ease-out |
| Like button | Click | Heart pulse + color | 300ms | bounce |
| Checkbox | Check | Checkmark draw + scale | 200ms | ease-out |
| Progress bar | Update | Width transition | 400ms | ease-out |
| Page transition | Navigate | Slide left/right | 300ms | ease-out |
| Overlay | Open | Backdrop fade in | 200ms | ease-out |

---

## 📱 **GESTOS MÓVILES**

| Gesto | Pantalla | Acción | Resultado |
|-------|----------|--------|-----------|
| **Swipe left** | Cualquier tab | Ir a tab siguiente | Navegación tabs |
| **Swipe right** | Cualquier tab | Ir a tab anterior | Navegación tabs |
| **Swipe down** | Top de pantalla | Pull to refresh | Recargar datos |
| **Tap** | Card/Button | Seleccionar | Acción principal |
| **Long press** | Card | Opciones contextuales | Menu contextual |
| **Swipe up** | Modal | Arrastrar para cerrar | Cerrar modal |
| **Pinch** | Imagen/Video | Zoom in/out | Ampliar visual |

---

## 🎯 **PRIORIDAD DE DISEÑO EN FIGMA**

### **FASE 1 - Pantallas Core (Hacer primero):**
1. ✅ Header universal
2. ✅ Bottom Navigation (Cliente)
3. ✅ Bottom Navigation (Coach)
4. ✅ Search Screen (Cliente)
5. ✅ Products Screen (Coach)
6. ✅ Calendar Screen (ambos)

### **FASE 2 - Modales Críticos:**
7. ✅ Modal Detalle Producto
8. ✅ Modal Crear Producto (5 pasos)
9. ✅ Modal Detalle Cliente

### **FASE 3 - Pantallas Secundarias:**
10. ✅ Activity Screen
11. ✅ Community Screen
12. ✅ Profile Screen
13. ✅ TodayScreen

### **FASE 4 - Flujos y Conexiones:**
14. ✅ Conectar todas las pantallas con Prototype
15. ✅ Agregar animaciones
16. ✅ Testing del flujo completo

---

## 📋 **RESUMEN PARA FIGMA**

**Total de elementos a diseñar:**
- 🖼️ **10 pantallas únicas** (algunas compartidas entre roles)
- 🎭 **8 modales/overlays**
- 🧩 **6 componentes reutilizables**
- 🔗 **~50 conexiones** entre pantallas
- ✨ **~20 animaciones/transiciones**

**Dimensiones:**
- 📱 Frame: 390 x 844 px
- 🎨 Colores: Negro #000, Naranja #FF7939
- 🔤 Fuente: Inter (Google Fonts)
- 📐 Espaciado: Sistema de 4px (4, 8, 12, 16, 20, 24...)

**Tiempo estimado diseño completo:** 6-8 horas

---

Esta tabla te permite ver de un vistazo **EXACTAMENTE** qué pasa cuando haces click en cada elemento de la aplicación. 🎯
