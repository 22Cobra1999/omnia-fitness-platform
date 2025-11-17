# 🎨 GUÍA COMPLETA PARA DISEÑAR OMNIA EN FIGMA

## 🚀 INICIO RÁPIDO

¡Bienvenido! Esta guía te permitirá recrear **toda la aplicación OMNIA en Figma** con el diseño exacto, todos los flujos de navegación y componentes interactivos.

---

## 📚 **DOCUMENTOS DISPONIBLES**

### **1. FLUJO_UX_COMPLETO_FIGMA.md** 
📖 **Guía general y wireframes**
- Descripción de todas las pantallas
- Wireframes ASCII art de cada vista
- Instrucciones paso a paso
- Organización del proyecto en Figma

### **2. DIAGRAMA_FLUJO_COMPLETO.md**
🔄 **Diagramas de flujo Mermaid**
- Mapa completo de navegación
- Flujo cliente y coach separados
- Diagrama unificado
- Visualización de conexiones

### **3. TABLA_NAVEGACION_COMPLETA.md**
📊 **Tabla detallada de clicks**
- Cada elemento clickeable documentado
- Origen → Acción → Destino
- Tipo de transición
- ~100 interacciones mapeadas

### **4. SPECS_FIGMA_DETALLADAS.md**
🎯 **Especificaciones pixel-perfect**
- Medidas exactas de cada componente
- Código copy/paste para Figma
- Propiedades detalladas (padding, margin, colors)
- Auto-layout configurations

---

## 🎨 **PALETA DE COLORES**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEGRO (Fondos principales)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#000000 - Background principal
#1E1E1E - Cards y componentes
#111827 - Textos muy oscuros

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NARANJA (Color de acento - OMNIA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#FF7939 - Primary (botones, activo, links)
#FF8F5C - Light (hover states)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GRISES (Textos y elementos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#FFFFFF - Texto principal
#F9FAFB - Texto muy claro
#9CA3AF - Texto secundario
#6B7280 - Texto disabled
#4B5563 - Borders y separadores
#374151 - Borders sutiles

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📐 **DIMENSIONES CLAVE**

```
📱 PANTALLA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Width: 390px (iPhone 14)
Height: 844px
Safe Area Top: 0px
Safe Area Bottom: 0px

🧱 ESTRUCTURA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Header: 390 x 80px
Content: 390 x 694px
Bottom Nav: 390 x 70px

📏 ESPACIADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sistema: 4px base
- 4px (extra small)
- 8px (small)
- 12px (medium-small)
- 16px (medium)
- 20px (medium-large)
- 24px (large)
- 32px (extra large)

🎨 BORDER RADIUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Buttons: 8px
Cards: 12px
Inputs: 8px
Modals: 24px (top) / 0px (bottom)
Header: 32px (bottom corners)
```

---

## 🏗️ **COMPONENTES PRINCIPALES (Crear primero)**

### **1. Header/Universal** (390x80)
- Background negro con border-radius inferior
- Logo OMNIA centrado
- Icons Settings y Messages en laterales

### **2. BottomNav/Client** (390x70)
- 5 tabs: Search, Activity, Community (elevado), Calendar, Profile
- Tab central con círculo naranja elevado -20px

### **3. BottomNav/Coach** (390x70)
- 5 tabs: Clients, Products, Community (elevado), Calendar, Profile

### **4. Card/Product** (350x200)
- Imagen izquierda (168x168)
- Info derecha (título, coach, stats, precio)
- Botones Editar/Ver (coach only)

### **5. Modal/Base** (390x700)
- Fondo overlay negro 60%
- Container blanco/gris desde bottom
- Border radius superior 24px
- Scroll interno

---

## 📱 **PANTALLAS POR ORDEN DE PRIORIDAD**

### **🥇 PRIORIDAD ALTA (Hacer primero):**

1. **Client/Search** ⭐⭐⭐⭐⭐
   - Barra de búsqueda
   - Toggle Coaches/Activities
   - Grid de cards
   - **Más usada por clientes**

2. **Coach/Products** ⭐⭐⭐⭐⭐
   - Lista de productos
   - Botón crear
   - Sección consultas
   - **Más usada por coaches**

3. **Universal/Calendar** ⭐⭐⭐⭐
   - Grid calendario
   - Actividades del día
   - **Compartida, muy importante**

4. **Client/TodayScreen** ⭐⭐⭐⭐
   - Ejercicios del día
   - Checkboxes series
   - Progreso
   - **Core de la funcionalidad**

### **🥈 PRIORIDAD MEDIA:**

5. **Client/Activity** ⭐⭐⭐
6. **Client/Profile** ⭐⭐⭐
7. **Coach/Clients** ⭐⭐⭐
8. **Modal/ProductDetail** ⭐⭐⭐
9. **Modal/CreateProduct** ⭐⭐⭐

### **🥉 PRIORIDAD BAJA:**

10. **Community** ⭐⭐
11. **Otros modales** ⭐⭐
12. **Settings screens** ⭐

---

## 🎬 **ANIMACIONES EN FIGMA**

### **Configurar Smart Animate:**

**Transición entre tabs:**
```
Trigger: On click
Action: Change to → [Target screen]
Animation: Smart Animate
Duration: 300ms
Easing: Ease out
```

**Abrir modal:**
```
Trigger: On click
Action: Open overlay → [Modal]
Position: Center
Close on click outside: Yes
Background: Black 60%
Animation: Move in (bottom to center)
Duration: 300ms
Easing: Ease out
```

**Button press:**
```
While pressing:
Action: Scale 0.95
Duration: 100ms
Easing: Ease in-out
```

**Card hover (desktop):**
```
While hovering:
Action: Scale 1.02
Duration: 200ms
Easing: Ease out
```

---

## 📋 **PLAN DE TRABAJO SUGERIDO**

### **DÍA 1 (4 horas):**
- ✅ Setup inicial (colores, fuentes, efectos)
- ✅ Crear componentes base (10 componentes)
- ✅ Diseñar Client/Search completa
- ✅ Diseñar Coach/Products completa

### **DÍA 2 (4 horas):**
- ✅ Diseñar Universal/Calendar
- ✅ Diseñar Client/TodayScreen
- ✅ Diseñar Modal/ProductDetail
- ✅ Diseñar Modal/CreateProduct (5 pasos)

### **DÍA 3 (3 horas):**
- ✅ Diseñar pantallas restantes
- ✅ Conectar todo con Prototype
- ✅ Agregar animaciones
- ✅ Testing y ajustes finales

**Total: 11 horas → Diseño completo funcional** 🎉

---

## 🎯 **RESULTADO FINAL**

Al completar esta guía tendrás:

✅ **20 pantallas** diseñadas pixel-perfect
✅ **10 componentes** reutilizables
✅ **8 modales** completos
✅ **~50 conexiones** interactivas
✅ **Prototipo funcional** completo
✅ **Presentación** lista para mostrar
✅ **Export** listo para desarrollo

---

## 📖 **CÓMO USAR ESTOS DOCUMENTOS**

### **Para diseñar en Figma:**
1. Lee **FLUJO_UX_COMPLETO_FIGMA.md** para entender la estructura general
2. Usa **SPECS_FIGMA_DETALLADAS.md** para copiar/pegar especificaciones exactas
3. Consulta **TABLA_NAVEGACION_COMPLETA.md** para entender cada click
4. Revisa **DIAGRAMA_FLUJO_COMPLETO.md** para visualizar conexiones

### **Para presentar el diseño:**
1. Exporta el prototipo interactivo de Figma
2. Comparte el link con modo "Present"
3. Usa los diagramas Mermaid para explicar el flujo
4. Usa la tabla de navegación como documentación

### **Para desarrollo:**
1. Exporta assets desde Figma
2. Usa las especificaciones de componentes
3. Implementa según los flows documentados
4. Testing con los flujos como checklist

---

## 🎨 **TIPS PARA FIGMA**

### **Optimización:**
- ✅ Usa componentes para todo lo reutilizable
- ✅ Crea variantes para estados (activo/inactivo)
- ✅ Usa Auto Layout para todo
- ✅ Nombra layers descriptivamente
- ✅ Organiza en páginas (Cliente, Coach, Modales, Componentes)

### **Colaboración:**
- ✅ Comenta decisiones de diseño
- ✅ Linkea specs en comentarios
- ✅ Usa plugins para iconos (Lucide Icons)
- ✅ Exporta specs para desarrolladores

### **Testing:**
- ✅ Prueba el prototipo en modo Present
- ✅ Verifica todos los clicks
- ✅ Revisa animaciones
- ✅ Testing en mobile (Figma Mirror app)

---

## 📞 **SOPORTE**

Si tienes dudas sobre alguna especificación:
1. Revisa primero **SPECS_FIGMA_DETALLADAS.md** (más detallado)
2. Consulta **TABLA_NAVEGACION_COMPLETA.md** para flows
3. Busca en el código fuente: `components/mobile/[nombre-screen].tsx`

---

## ✅ **CHECKLIST RÁPIDO**

Antes de empezar, asegúrate de tener:
- [ ] Figma instalado (desktop o web)
- [ ] Cuenta Figma (gratis o pro)
- [ ] Plugin Lucide Icons instalado
- [ ] Fuente Inter instalada (Google Fonts)
- [ ] Los 4 documentos de guía abiertos

---

**¡Listo para diseñar!** 🎨

Sigue los documentos en orden y tendrás el diseño completo de OMNIA en Figma con todos los flujos interactivos funcionando perfectamente.

**Tiempo estimado total: 10-11 horas**
**Resultado: Diseño profesional completo + Prototipo interactivo** ✨
