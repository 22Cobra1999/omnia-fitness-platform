# 🚀 FLUJO COMPLETO DE CREACIÓN DE PRODUCTOS - UX Y DISEÑO

## 📋 ÍNDICE DEL PROCESO

1. **[PASO 1: TIPO DE PRODUCTO](#paso-1-tipo-de-producto)** 🏷️
2. **[PASO 2: CATEGORÍA](#paso-2-categoría)** 🎯
3. **[PASO 3: INFORMACIÓN BÁSICA](#paso-3-información-básica)** 📝
4. **[PASO 4: CONTENIDO ESPECÍFICO](#paso-4-contenido-específico)** 📋
5. **[PASO 5: PLANIFICACIÓN](#paso-5-planificación)** 📅
6. **[PASO 6: RESUMEN Y PUBLICACIÓN](#paso-6-resumen-y-publicación)** ✅

---

## 🔄 FLUJO CONDICIONAL POR TIPO

```
PASO 1: TIPO DE PRODUCTO
├── Programa → PASO 2: CATEGORÍA
├── Documento → PASO 2: CATEGORÍA  
└── Taller → PASO 2: CATEGORÍA

PASO 2: CATEGORÍA (todos los tipos)
├── Fitness → PASO 3: INFORMACIÓN BÁSICA
└── Nutrición → PASO 3: INFORMACIÓN BÁSICA

PASO 3: INFORMACIÓN BÁSICA (todos los tipos)
├── Si Programa → Campos completos (modalidad Online/Presencial)
├── Si Taller → Campos completos (modalidad Online/Presencial)
└── Si Documento → Campos básicos (modalidad fija: Online)

PASO 4: CONTENIDO ESPECÍFICO (condicional)
├── Si Programa + Fitness → PASO 4A: EJERCICIOS DEL PROGRAMA
├── Si Programa + Nutrición → PASO 4B: PLATOS DEL PROGRAMA
├── Si Taller → PASO 4C: ADJUNTAR PDF (opcional)
└── Si Documento → PASO 4D: RECURSOS ADICIONALES

PASO 5: PLANIFICACIÓN (condicional)
├── Si Programa → PASO 5A: PLANIFICACIÓN DE DÍAS (weeklyPlan)
├── Si Taller → PASO 5B: TEMAS Y HORARIOS (workshopSchedule)
└── Si Documento → PASO 6: RESUMEN Y PUBLICACIÓN

PASO 6: RESUMEN Y PUBLICACIÓN (todos los tipos)
```

---

## 📐 DISEÑO DEL MODAL

### **Estructura General:**
```
┌─────────────────────────────────────────────────────────┐
│  [X]  Crear Producto                    [Paso 1●○○○○○]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [CONTENIDO DEL PASO ACTUAL]                            │
│                                                          │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [← Atrás]                    [Siguiente →]            │
└─────────────────────────────────────────────────────────┘
```

### **Características del Modal:**
- **Fondo:** Overlay oscuro con blur (`bg-black/50 backdrop-blur-sm`)
- **Modal:** Fondo `#1E1E1E`, bordes redondeados, sombra
- **Ancho:** Máximo `max-w-4xl` (responsive)
- **Altura:** Auto, con scroll interno si es necesario
- **Indicador de pasos:** Barra superior con puntos (●○○○○○)
- **Botones:** Naranja `#FF7939` para acciones principales

---

## 🏷️ PASO 1: TIPO DE PRODUCTO

### **Diseño Visual:**
```
┌─────────────────────────────────────────────────────────┐
│  [X]  Crear Producto                    [Paso 1●○○○○○]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ¿Qué tipo de producto querés crear?                    │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   📦         │  │   📄         │  │   🎓         │ │
│  │  PROGRAMA    │  │  DOCUMENTO   │  │   TALLER     │ │
│  │              │  │              │  │              │ │
│  │  Programa    │  │  PDF, guía,  │  │  Sesión      │ │
│  │  estructurado│  │  manual      │  │  única o     │ │
│  │  con semanas │  │  descargable │  │  workshop    │ │
│  │              │  │              │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [Cancelar]                    [Siguiente →]            │
└─────────────────────────────────────────────────────────┘
```

### **Elementos:**
- **3 Cards grandes** con iconos y descripción
- **Selección:** Click en card (se marca con borde naranja)
- **Iconos:** 📦 Programa, 📄 Documento, 🎓 Taller
- **Validación:** No se puede avanzar sin seleccionar

### **Estados:**
- **Sin seleccionar:** Cards grises, botón "Siguiente" deshabilitado
- **Seleccionado:** Card con borde naranja `border-[#FF7939]`, botón habilitado

---

## 🎯 PASO 2: CATEGORÍA

### **Diseño Visual:**
```
┌─────────────────────────────────────────────────────────┐
│  [X]  Crear Producto                    [Paso ○●○○○○]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ¿En qué categoría se enfoca tu producto?               │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐           │
│  │   💪             │  │   🍽️             │           │
│  │   FITNESS        │  │   NUTRICIÓN      │           │
│  │                  │  │                  │           │
│  │  Entrenamiento   │  │  Planes           │           │
│  │  físico,         │  │  alimentarios,    │           │
│  │  ejercicios,     │  │  dietas,          │           │
│  │  rutinas         │  │  suplementación   │           │
│  │                  │  │                  │           │
│  └──────────────────┘  └──────────────────┘           │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [← Atrás]                    [Siguiente →]            │
└─────────────────────────────────────────────────────────┘
```

### **Elementos:**
- **2 Cards grandes** con iconos y descripción
- **Selección:** Click en card (se marca con borde naranja)
- **Iconos:** 💪 Fitness, 🍽️ Nutrición
- **Validación:** No se puede avanzar sin seleccionar

---

## 📝 PASO 3: INFORMACIÓN BÁSICA

### **Diseño Visual:**
```
┌─────────────────────────────────────────────────────────┐
│  [X]  Crear Producto                    [Paso ○○●○○○]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Información Básica                                     │
│                                                          │
│  📝 Título del producto *                               │
│  [___________________________________________]          │
│                                                          │
│  📄 Descripción *                                       │
│  [___________________________________________]          │
│  [___________________________________________]          │
│  [50/500 caracteres]                                    │
│                                                          │
│  🎯 Objetivos *                                         │
│  [Pérdida de peso] [Ganancia muscular] [Resistencia]   │
│  [Flexibilidad] [Rehabilitación] [Bienestar general]    │
│                                                          │
│  🔥 Nivel de intensidad *                               │
│  [▼ Principiante ▼]                                     │
│                                                          │
│  💰 Precio (USD) *                                      │
│  [$______] [ ] Gratis                                   │
│                                                          │
│  📷 Imagen/Video de portada                             │
│  ┌─────────────────────────────────────┐               │
│  │  [📷 Subir imagen]  [▶️ Subir video] │               │
│  │  o                                   │               │
│  │  [📂 Seleccionar existente]          │               │
│  └─────────────────────────────────────┘               │
│                                                          │
│  🌐 Modalidad * (solo Programa/Taller)                  │
│  ( ) Online  ( ) Presencial  ( ) Híbrido               │
│                                                          │
│  👥 Capacidad (solo Programa/Taller)                    │
│  ( ) Ilimitada  ( ) Limitada: [___] cupos             │
│                                                          │
│  📅 Días de acceso (solo Programa)                      │
│  [30] días                                              │
│                                                          │
│  🔒 Visibilidad                                         │
│  [ ] Producto VIP (solo clientes premium)               │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [← Atrás]                    [Siguiente →]            │
└─────────────────────────────────────────────────────────┘
```

### **Campos Requeridos:**
1. **Título** - Input texto, máximo 100 caracteres
2. **Descripción** - Textarea, mínimo 50, máximo 500 caracteres
3. **Objetivos** - Tags seleccionables múltiples
4. **Nivel de intensidad** - Dropdown (Principiante/Intermedio/Avanzado)
5. **Precio** - Input numérico, opción "Gratis"
6. **Imagen/Video** - Upload o selección de existente
7. **Modalidad** - Radio buttons (solo Programa/Taller)
8. **Capacidad** - Radio + input numérico (solo Programa/Taller)
9. **Días de acceso** - Input numérico (solo Programa)
10. **Visibilidad VIP** - Checkbox

### **Validaciones:**
- Título: Requerido, no vacío
- Descripción: Mínimo 50 caracteres
- Objetivos: Al menos 1 seleccionado
- Nivel: Requerido
- Precio: >= 0
- Imagen/Video: Opcional pero recomendado

---

## 📋 PASO 4: CONTENIDO ESPECÍFICO

### **🔄 Flujo Condicional:**

#### **4A. EJERCICIOS DEL PROGRAMA** (Programa + Fitness)
```
┌─────────────────────────────────────────────────────────┐
│  [X]  Crear Producto                    [Paso ○○○●○○]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Agregá los ejercicios de tu programa                   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [1️⃣ Crear manualmente]                         │   │
│  │  [2️⃣ Subir CSV]                                 │   │
│  │  [3️⃣ Seleccionar existentes]                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  [TABLA DE EJERCICIOS]                                  │
│  ┌──────┬─────────────┬─────────┬──────────┬──────┐   │
│  │ Nombre│ Descripción │ Duración│ Calorías │ Video│   │
│  ├──────┼─────────────┼─────────┼──────────┼──────┤   │
│  │ ...  │ ...         │ ...     │ ...      │ ...  │   │
│  └──────┴─────────────┴─────────┴──────────┴──────┘   │
│                                                          │
│  [+ Agregar ejercicio]                                  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [← Atrás]                    [Siguiente →]            │
└─────────────────────────────────────────────────────────┘
```

**Opciones:**
1. **Crear manualmente:** Formulario con campos (nombre, descripción, duración, calorías, tipo, intensidad, equipo, partes del cuerpo, series, video)
2. **Subir CSV:** Upload de archivo CSV con plantilla descargable
3. **Seleccionar existentes:** Lista de ejercicios ya creados con filtros y búsqueda

#### **4B. PLATOS DEL PROGRAMA** (Programa + Nutrición)
```
┌─────────────────────────────────────────────────────────┐
│  [X]  Crear Producto                    [Paso ○○○●○○]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Agregá los platos de tu programa nutricional           │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [1️⃣ Crear manualmente]                         │   │
│  │  [2️⃣ Subir CSV]                                 │   │
│  │  [3️⃣ Seleccionar existentes]                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  [TABLA DE PLATOS]                                      │
│  ┌──────┬─────────────┬─────────┬──────────┬──────┐   │
│  │ Nombre│ Tipo comida │ Tiempo  │ Dificultad│ Img │   │
│  ├──────┼─────────────┼─────────┼──────────┼──────┤   │
│  │ ...  │ ...         │ ...     │ ...      │ ...  │   │
│  └──────┴─────────────┴─────────┴──────────┴──────┘   │
│                                                          │
│  [+ Agregar plato]                                      │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [← Atrás]                    [Siguiente →]            │
└─────────────────────────────────────────────────────────┘
```

**Opciones:**
1. **Crear manualmente:** Formulario con campos (nombre, descripción, tipo de comida, tiempo preparación, dificultad, porciones, ingredientes, instrucciones, info nutricional, imagen, video)
2. **Subir CSV:** Upload de archivo CSV con plantilla descargable
3. **Seleccionar existentes:** Lista de platos ya creados con filtros y búsqueda

#### **4C. ADJUNTAR PDF** (Taller)
```
┌─────────────────────────────────────────────────────────┐
│  [X]  Crear Producto                    [Paso ○○○●○○]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ¿Querés adjuntar un PDF del taller?                    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [📄 Subir PDF]                                  │   │
│  │  o                                               │   │
│  │  [📂 Seleccionar existente]                     │   │
│  │                                                  │   │
│  │  [Preview del PDF si hay]                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  [ ] Adjuntar PDF general                               │
│  [ ] Adjuntar PDF por tema                              │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [← Atrás]                    [Siguiente →]            │
└─────────────────────────────────────────────────────────┘
```

**Opciones:**
- **PDF General:** Un PDF para todo el taller
- **PDF por Tema:** Un PDF diferente para cada tema del taller

---

## 📅 PASO 5: PLANIFICACIÓN

### **🔄 Flujo Condicional:**

#### **5A. PLANIFICACIÓN DE EJERCICIOS** (Programa + Fitness)
```
┌─────────────────────────────────────────────────────────┐
│  [X]  Crear Producto                    [Paso ○○○○●○]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Organizá los ejercicios por días y semanas             │
│                                                          │
│  [Semana 1] [Semana 2] [Semana 3] ... [+ Agregar]      │
│                                                          │
│  ┌─────────────────────────────────────────────────┐  │
│  │  L  │  M  │  X  │  J  │  V  │  S  │  D  │         │  │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤         │  │
│  │ 💪 │ 💪 │     │ 💪 │     │ 💪 │     │         │  │
│  │ 💪 │     │     │     │     │     │     │         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                          │
│  [Lista de ejercicios disponibles]                      │
│  ┌─────────────────────────────────────────────────┐  │
│  │  [ ] Sentadillas                                 │  │
│  │  [ ] Flexiones                                    │  │
│  │  [ ] Plancha                                      │  │
│  │  ...                                              │  │
│  └─────────────────────────────────────────────────┘  │
│                                                          │
│  [Resumen]                                               │
│  • Semanas: 8                                            │
│  • Sesiones: 24                                          │
│  • Ejercicios totales: 120                               │
│  • Ejercicios únicos: 15                                 │
│  • Tiempo estimado: 40 horas                             │
│                                                          │
│  [Repetir patrón de semana 1]                            │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [← Atrás]                    [Siguiente →]            │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- **Tabs de semanas:** Navegar entre semanas (1-52)
- **Grid semanal:** Lunes a Domingo con drag & drop
- **Lista de ejercicios:** Selección múltiple con checkboxes
- **Asignación:** Drag & drop ejercicios a días
- **Resumen:** Estadísticas en tiempo real
- **Repetir patrón:** Copiar semana base a siguientes

#### **5B. TEMAS Y HORARIOS** (Taller)
```
┌─────────────────────────────────────────────────────────┐
│  [X]  Crear Producto                    [Paso ○○○○●○]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Definí los temas y horarios de tu taller               │
│                                                          │
│  [+ Agregar tema]                                       │
│                                                          │
│  [LISTA DE TEMAS]                                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🎓 Tema 1: Introducción al Yoga                │   │
│  │     📅 Lunes 10:00-12:00                        │   │
│  │     📅 Miércoles 10:00-12:00                    │   │
│  │     [✏️ Editar] [🗑️ Eliminar]                  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  🎓 Tema 2: Posturas Avanzadas                  │   │
│  │     📅 Viernes 14:00-16:00                      │   │
│  │     [✏️ Editar] [🗑️ Eliminar]                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  [Calendario interactivo]                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [<]  Diciembre 2025  [>]                       │   │
│  │  L  M  X  J  V  S  D                             │   │
│  │  1  2  3  4  5  6  7                             │   │
│  │  8  9 10 11 12 13 14                             │   │
│  │  ... (días seleccionados marcados)                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  [Resumen]                                               │
│  • Temas: 3                                             │
│  • Sesiones: 5                                           │
│  • Horarios: 10:00-12:00, 14:00-16:00                  │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [← Atrás]                    [Siguiente →]            │
└─────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- **Crear tema:** Título, descripción, días, horarios
- **Calendario:** Selección múltiple de fechas
- **Horarios:** Hora inicio y fin por tema
- **Gestión:** Editar, eliminar temas
- **Resumen:** Estadísticas de temas y sesiones

---

## ✅ PASO 6: RESUMEN Y PUBLICACIÓN

### **Diseño Visual:**
```
┌─────────────────────────────────────────────────────────┐
│  [X]  Crear Producto                    [Paso ○○○○○●]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Revisá tu producto antes de publicarlo                 │
│                                                          │
│  [CARD DE PREVIEW DEL PRODUCTO]                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  [Imagen/Video]                                   │   │
│  │                                                   │   │
│  │  Título del Producto                             │   │
│  │  Descripción breve...                             │   │
│  │                                                   │   │
│  │  💰 $99.99  🔥 Intermedio  🌐 Online             │   │
│  │  📦 Programa  💪 Fitness                         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  [Detalles específicos]                                 │
│  • Semanas: 8                                            │
│  • Ejercicios únicos: 15                                 │
│  • Sesiones por semana: 3                                │
│  • Tiempo estimado: 40 horas                             │
│                                                          │
│  [Configuración de publicación]                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🔒 Visibilidad                                  │   │
│  │  ( ) Público                                     │   │
│  │  ( ) Privado                                    │   │
│  │  ( ) Borrador                                   │   │
│  │                                                  │   │
│  │  📅 Disponibilidad                              │   │
│  │  [ ] Disponible inmediatamente                  │   │
│  │  [Fecha de publicación: __/__/____]            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  [Validaciones]                                          │
│  ✅ Título completo                                     │
│  ✅ Descripción completa                                │
│  ✅ Precio definido                                     │
│  ✅ Imagen/Video agregado                               │
│  ✅ Ejercicios agregados                                │
│  ✅ Planificación completa                              │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  [← Atrás]              [🚀 Publicar Producto]         │
└─────────────────────────────────────────────────────────┘
```

### **Elementos:**
- **Preview card:** Vista exacta de cómo lo verá el cliente
- **Detalles específicos:** Resumen según tipo de producto
- **Configuración:** Visibilidad y disponibilidad
- **Validaciones:** Checklist de requisitos completados
- **Botón publicar:** Naranja grande con icono 🚀

---

## 🎨 ESTILOS Y COMPONENTES

### **Colores:**
- **Primario:** `#FF7939` (Naranja)
- **Fondo modal:** `#1E1E1E`
- **Fondo cards:** `#2A2A2A`
- **Texto:** `#FFFFFF` (principal), `#9CA3AF` (secundario)
- **Bordes:** `rgba(255, 255, 255, 0.1)`

### **Tipografía:**
- **Títulos:** `font-bold text-xl`
- **Subtítulos:** `font-semibold text-lg`
- **Texto:** `text-sm` o `text-base`
- **Labels:** `text-xs text-gray-400`

### **Componentes Reutilizables:**
- **Input:** `Input` de shadcn/ui con estilos custom
- **Textarea:** `Textarea` de shadcn/ui
- **Select:** `Select` de shadcn/ui
- **Button:** `Button` de shadcn/ui con variantes
- **Switch:** `Switch` de shadcn/ui
- **Badge:** `Badge` para tags y estados

### **Animaciones:**
- **Transiciones:** `framer-motion` para cambios de paso
- **Hover:** `hover:scale-105` en cards
- **Loading:** Spinner naranja en botones

---

## 🔄 NAVEGACIÓN ENTRE PASOS

### **Botones:**
- **← Atrás:** Vuelve al paso anterior (mantiene datos)
- **Siguiente →:** Avanza al siguiente paso (valida antes)
- **X Cerrar:** Modal de confirmación "¿Descartar cambios?"
- **🚀 Publicar:** Guarda todo en BD y cierra modal

### **Validaciones:**
- **Paso 1:** Requiere tipo seleccionado
- **Paso 2:** Requiere categoría seleccionada
- **Paso 3:** Requiere título, descripción, objetivos, nivel, precio
- **Paso 4:** Requiere mínimo 1 ejercicio/plato
- **Paso 5:** Requiere mínimo 1 sesión/día asignado
- **Paso 6:** Todas las validaciones anteriores + preview

### **Persistencia:**
- **Datos se mantienen** al navegar entre pasos
- **SessionStorage** para borradores
- **Confirmación** al cerrar si hay cambios sin guardar

---

## 📱 RESPONSIVE

### **Mobile:**
- Modal full-screen
- Cards apiladas verticalmente
- Inputs full-width
- Botones full-width en stack

### **Desktop:**
- Modal centrado con max-width
- Cards en grid horizontal
- Inputs con ancho fijo
- Botones inline

---

## 🎯 ESTADOS ESPECIALES

### **Edición:**
- **Pre-fill:** Todos los campos se cargan desde BD
- **Modo edición:** Mismo flujo pero con datos existentes
- **Validación:** Permite guardar sin cambiar todo

### **Taller Finalizado:**
- **Encuesta:** Si todas las fechas pasaron, muestra encuesta primero
- **Agregar fechas:** Opción para reactivar agregando nuevas fechas
- **Confirmación:** Modal de confirmación antes de continuar

---

## 🔧 BACKEND Y DATOS

### **Tablas Principales:**
- `activities` - Producto base
- `activity_media` - Imágenes/videos
- `organizacion_ejercicios` - Ejercicios del programa
- `nutrition_program_details` - Platos del programa
- `planificacion_ejercicios` - Planificación semanal
- `taller_detalles` - Temas y horarios del taller
- `activity_resources` - PDFs y recursos

### **Storage:**
- **Supabase Storage:** Imágenes, videos, PDFs
- **Bunny.net:** Videos de ejercicios (streaming)
- **Buckets:** `product-media`, `exercise-videos`, `workshop-pdfs`

---

Este es el flujo completo de creación de productos con todos los pasos, diseño, frames y orden. ¿Quieres que profundice en algún paso específico?




