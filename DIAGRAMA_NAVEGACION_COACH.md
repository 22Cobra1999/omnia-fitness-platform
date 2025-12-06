# 📋 DIAGRAMA COMPLETO DE NAVEGACIÓN - COACH & CLIENTE

## 🎯 URL Base: `http://localhost:3000/`

**Arquitectura:** Navegación por tabs en la misma URL, sin rutas adicionales.

---

# 👤 SECCIÓN CLIENTE

## 📍 TABS DISPONIBLES (Bottom Navigation - Cliente)

**Total de tabs:** 5
1. **Community** (Home/Feed)
2. **Search** (Buscar)
3. **Activity** (Actividad del día)
4. **Calendar** (Calendario)
5. **Profile** (Perfil)

---

### 🔍 **TAB: SEARCH** (Buscar)

**Componente principal:** `SearchScreen`
**Ubicación:** `components/shared/search/search-screen.tsx`

#### **Vista Principal:**
- Sección de **Coaches**:
  - Lista horizontal de coaches disponibles
  - Cada coach muestra:
    - Foto de perfil
    - Nombre del coach
    - Años de experiencia
    - Especialidades
    - Rating (si disponible)
  - Botón "Ver más" para ver todos los coaches

- Sección de **Actividades**:
  - Grid de actividades/productos disponibles
  - Cada actividad muestra:
    - Imagen/thumbnail
    - Badge "NUEVO" (si aplica)
    - Título del producto
    - Descripción breve
    - Número de sesiones
    - Número de ejercicios
    - Tipo (FITNESS, NUTRICION, etc.)
    - Categoría (PROGRAMA, TALLER)
    - Cupos disponibles (si aplica)
    - Precio
  - Botón "Ver más" para ver todas las actividades

#### **Acciones disponibles:**
1. **Click en Coach** → Abre `CoachProfileModal`
2. **Click en Actividad** → Abre `ClientProductModal` (modal de preview del producto)
3. **Click en "Ver más" (Coaches)** → Muestra lista completa de coaches
4. **Click en "Ver más" (Actividades)** → Muestra lista completa de actividades

---

### 📦 **MODAL: CLIENT PRODUCT MODAL** (Preview de Producto)

**Componente:** `ClientProductModal`
**Ubicación:** `components/client/activities/client-product-modal.tsx`
**Se abre desde:** 
- **Cliente:** SearchScreen, CoachProfileModal, RecommendedActivities
- **Coach:** ProductsManagementScreen (tab Products), CoachProfileModal (cuando ve perfil de otro coach)

**⚠️ IMPORTANTE:** Este es un componente **compartido** - el MISMO código se usa tanto para coach como para cliente. No hay duplicación de código.

#### **Estructura del Modal:**

**1. Sección Superior - Video/Imagen:**
- Video player con:
  - Reproducción automática (con mute activado)
  - Click en pantalla → Pausa/Reproduce
  - Botón de mute flotante (esquina inferior derecha)
  - Componente: `UniversalVideoPlayer`
- Badge del tipo de producto (PROGRAMA, TALLER, etc.)
- Badge "NUEVO" (si aplica)
- Botón X para cerrar

**2. Sección de Información:**
- **Título del producto**
- **Información del coach:**
  - Foto del coach
  - Nombre del coach
  - Años de experiencia
  - Rating
  - Click → Abre perfil del coach
- **Descripción completa** del producto
- **Detalles técnicos:**
  - Número de sesiones
  - Número de ejercicios
  - Modalidad (Online/Presencial)
  - Duración
- **Sección de comentarios** (si hay)
- **Botón de compra:**
  - Muestra precio
  - Indica "Primera compra" o estado del producto
  - Click → Procesa la compra

#### **Flujo de Carga del Video:**

**Tecnologías utilizadas:**
- **UniversalVideoPlayer** (`components/shared/video/universal-video-player.tsx`)
- **HLS.js** para streaming de videos `.m3u8`
- **Bunny.net CDN** para delivery de videos

**Proceso de carga:**

1. **Obtención de datos del producto:**
   ```typescript
   // Desde SearchScreen o CoachProfileModal
   const product = {
     id: 78,
     title: "Pliométricos de Ronaldinho",
     activity_media: [{
       bunny_video_id: "b8f1c3da-864c-4d9a-8d00-e9d5fa9ac7fa",
       bunny_library_id: "510910",
       video_url: "https://vz-37d7814d-402.b-cdn.net/[ID]/playlist.m3u8",
       image_url: "[URL de imagen]"
     }]
   }
   ```

2. **Renderizado del UniversalVideoPlayer:**
   ```typescript
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

3. **Inicialización de HLS.js:**
   - Si `bunnyVideoId` existe:
     - Construye URL: `https://vz-37d7814d-402.b-cdn.net/${bunnyVideoId}/playlist.m3u8`
     - Verifica si HLS.js está soportado
     - Inicializa HLS.js con configuración optimizada
     - Carga el stream y lo adjunta al elemento `<video>`
   - Si es Safari (soporte nativo HLS):
     - Usa el elemento `<video>` nativo
   - Para otros formatos (MP4, etc.):
     - Reproducción directa con `<video>`

4. **Controles del video:**
   - **Play/Pause:** Click en la pantalla del video
   - **Mute/Unmute:** Click en el botón flotante
   - Sin barra de herramientas visible
   - Estado manejado en React con hooks

**Variables de entorno necesarias:**
```env
NEXT_PUBLIC_BUNNY_LIBRARY_ID=510910
BUNNY_STREAM_CDN_URL=https://vz-37d7814d-402.b-cdn.net
```

#### **APIs utilizadas:**

1. **GET /api/activities/search**
   - Obtiene lista de actividades disponibles
   - Incluye datos de `activity_media`

2. **GET /api/activities/[id]/purchase-status**
   - Verifica si el cliente ya compró el producto
   - Retorna estado de la compra

3. **POST /api/enrollments/direct** (al comprar)
   - Crea el enrollment del cliente
   - Genera registros de `progreso_cliente`
   - Retorna confirmación de compra

#### **Tablas de Base de Datos:**

**Lectura:**
- `activities` - Datos del producto
- `activity_media` - Video, imagen, y metadatos multimedia
  - `bunny_video_id` - ID del video en Bunny.net
  - `bunny_library_id` - ID de la librería en Bunny.net
  - `video_url` - URL del stream HLS
  - `video_thumbnail_url` - URL del thumbnail
  - `image_url` - Imagen de portada
- `coaches` - Información del coach
- `activity_enrollments` - Verificar si ya está inscrito

**Escritura (al comprar):**
- `activity_enrollments` - Nuevo enrollment
- `progreso_cliente` - Registros de progreso pre-generados

---

# 🎓 SECCIÓN COACH

---

## 📍 TABS DISPONIBLES (Bottom Navigation)

**Total de tabs:** 4
1. **Community** (Home/Feed)
2. **Clients** (Clientes)
3. **Products** (Productos)
4. **Profile** (Perfil)

---

### 1️⃣ **TAB: COMMUNITY** (Home/Feed)
**Componente principal:** `CommunityScreen` / `FeedScreen`
**Ubicación:** `components/mobile/feed-screen.tsx` o similar

#### **Vista Principal:**
- Feed de actividades
- Posts de la comunidad
- Tabs: "For You" / "Following"
- Posts mostrando:
  - Avatar del usuario
  - Nombre y username
  - Tiempo desde publicación
  - Contenido del post
  - Imagen/video del post
  - Botones de interacción:
    - Like (con contador)
    - Comentarios (con contador)
    - Guardar
    - Compartir

#### **Acciones disponibles:**
1. **Scroll del feed** → Carga más posts
2. **Click en like** → Da like al post
3. **Click en comentarios** → Abre comentarios
4. **Click en usuario** → Ver perfil del usuario
5. **Click en guardar** → Guarda el post
6. **Click en compartir** → Comparte el post

---

### 2️⃣ **TAB: CLIENTS** (Clientes)
**Componente principal:** `ClientsScreen`
**Ubicación:** `components/mobile/clients-screen.tsx`

#### **Vista Principal:**
- Título: "Mis Clientes"
- Barra de búsqueda con icono de lupa (placeholder: "Buscar clientes...")
- Botón "Filtro" (con icono de filtro)
- Filtros rápidos (tabs horizontales):
  - **Todos** (seleccionado por defecto)
  - **Activos**
  - **Pendientes**
  - **Inactivos**
- Lista de clientes (cards verticales) mostrando:
  - Avatar del cliente (imagen circular)
  - **Nombre del cliente** (bold)
  - **Ingresos totales** (en USD, ej: "$171.99")
  - **Última ejercitación**: [fecha] (ej: "15/10/2025")
  - **Métricas en 3 columnas:**
    - ACTIVIDADES: [número]
    - TO DO: [número]
    - PROGRESO: [porcentaje%]

#### **Acciones disponibles:**

1. **Click en cliente** → Abre `ClientDetailModal`
   
   **El modal muestra:**
   
   **📍 Sección superior (Header):**
   - Avatar del cliente (imagen grande circular)
   - **Información del cliente:**
     - Nombre completo (heading grande, naranja)
     - Email (texto pequeño)
     - Última ejercitación: [fecha]
   - **Botones de acción:**
     - Botón opciones (⋮) - esquina superior derecha
     - Botón cerrar (X) - esquina superior derecha
   
   **📊 Métricas principales (4 cards en grid 2x2):**
   
   | Progreso | Actividades |
   |----------|-------------|
   | **53%** | **2** |
   | Progreso | Actividades |
   
   | To Do | Ingresos |
   |-------|----------|
   | **0** | **$171.99** |
   | To Do *(expandible)* | Ingresos |
   
   Detalles de cada métrica:
   - **Progreso**: Porcentaje de completitud general (ej: "53%")
   - **Actividades**: Número de actividades TOTALES (activas + finalizadas + compradas)
   - **To Do**: Número de tareas pendientes (0-4 máximo) - **SECCIÓN EXPANDIBLE** ⬇️
   - **Ingresos**: Ingresos totales generados por el cliente (ej: "$171.99")
   
   **🔽 Sección "To Do" (cuando se expande haciendo click en la card):**
   - Título: **"Tareas (0/4)"** (indica cuántas tareas hay del máximo permitido)
   - **Input de nueva tarea:**
     - Placeholder: "Nueva tarea..."
     - Botón "+" para agregar (deshabilitado si input vacío o si ya hay 4 tareas)
   - **Lista de tareas:**
     - Cada tarea con checkbox para marcar como completada (elimina)
     - Si no hay tareas: lista vacía
   
   **Backend endpoint:** `/api/coach/clients/[id]/todo`
   - **GET**: Obtener lista de tareas del cliente
   - **POST**: Agregar nueva tarea (máximo 4)
   - **DELETE**: Eliminar tarea por índice
   
   **📋 Secciones expandibles (con botón "Ver"/"Ocultar"):**
   
   Cada sección muestra un icono, título con contador, y botón "Ver":
   
   1. **🩹 Lesiones** (expandible)
      - Título: "Lesiones (1)" - contador entre paréntesis
      - Botón: "Ver" → cambia a "Ocultar" al expandir
      - Al expandir: muestra lista detallada de lesiones del cliente
      
   2. **📊 Biométricas** (expandible)
      - Título: "Biométricas (2)"
      - Botón: "Ver" → cambia a "Ocultar" al expandir
      - Al expandir: muestra datos biométricos del cliente (peso, altura, etc.)
      
   3. **🎯 Objetivos** (expandible)
      - Título: "Objetivos (2)"
      - Botón: "Ver" → cambia a "Ocultar" al expandir
      - Al expandir: muestra lista de objetivos del cliente
   
   **🏃 Actividades Activas:**
   - Título: **"Actividades Activas (2)"** - contador de actividades
   - **Lista de actividades:**
     - Cada item muestra:
       - Nombre del producto/actividad (ej: "Pliométricos de Ronaldinho - Dominio del Fútbol")
       - Precio (ej: "$0" si es gratis)
   
   4. **📅 Calendario de Actividades** (expandible)
      - Icono de calendario
      - Título: "Calendario de Actividades"
      - Botón: "Ver" → expande el calendario completo
      - Al expandir: muestra calendario con todas las actividades del cliente

2. **Búsqueda de clientes** → Filtra lista en tiempo real mientras se escribe

3. **Filtros rápidos** → Al hacer click cambia la vista según el estado del cliente

4. **Botón "Filtro"** → Abre modal con filtros avanzados

---

### 3️⃣ **TAB: PRODUCTS** (Productos)
**Componente principal:** `ProductsManagementScreen`
**Ubicación:** `components/mobile/products-management-screen.tsx`

#### **📊 Vista Principal:**
- **Estadísticas del coach (cards superiores):**
  - Total Ingresos (con icono 💰)
  - Total Productos (con icono 📦)
  - Rating promedio (con icono ⭐)
  
- **Consultas disponibles:**
  - Título: "Consultas Disponibles"
  - Lista de tipos de consulta:
    - **Café** (precio editable, toggle on/off)
    - **Meet 30 min** (precio editable, toggle on/off)
    - **Meet 1 hora** (precio editable, toggle on/off)
  
- **Lista de productos:**
  - Botón "Crear" (esquina superior derecha)
  - Cards de productos mostrando:
    - Imagen/thumbnail del producto
    - Título del producto
    - Descripción breve
    - Precio
    - Botones de acción (editar, eliminar)

#### **🎯 Acciones disponibles:**

1. **Botón "Crear"** → Abre `CreateProductModal` (Formulario progresivo de 6 pasos)
    
## 🚀 **FLUJO COMPLETO DE CREACIÓN DE PRODUCTOS**

### **📋 ÍNDICE DEL PROCESO:**
1. **[PASO 1: TIPO DE PRODUCTO](#paso-1-tipo-de-producto)** 🏷️
2. **[PASO 2: CATEGORÍA](#paso-2-categoría)** 🎯
3. **[PASO 3: INFORMACIÓN BÁSICA](#paso-3-información-básica)** 📝
4. **[PASO 4: CONTENIDO ESPECÍFICO](#paso-4-contenido-específico)** 📋
5. **[PASO 5: PLANIFICACIÓN](#paso-5-planificación)** 📅
6. **[PASO 6: RESUMEN Y PUBLICACIÓN](#paso-6-resumen-y-publicación)** ✅

### **🔄 FLUJO CONDICIONAL POR TIPO:**

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
├── Si Programa + Fitness → PASO 4: EJERCICIOS DEL PROGRAMA
├── Si Programa + Nutrición → PASO 4: PLATOS DEL PROGRAMA
├── Si Taller → PASO 4: ADJUNTAR PDF (opcional)
└── Si Documento → PASO 5: RECURSOS ADICIONALES

PASO 5: PLANIFICACIÓN (condicional)
├── Si Programa → PASO 5: PLANIFICACIÓN DE DÍAS
├── Si Taller → PASO 5: TEMAS Y HORARIOS
└── Si Documento → PASO 6: RESUMEN Y PUBLICACIÓN

PASO 6: RESUMEN Y PUBLICACIÓN (todos los tipos)
```

---

## **PASO 1: TIPO DE PRODUCTO** 🏷️

**Pregunta:** "¿Qué tipo de producto querés crear?"

**Opciones disponibles:**
- **Programa** - Programa estructurado con semanas y días
- **Documento** - PDF, guía, manual descargable
- **Taller** - Sesión única o workshop

**Comportamiento:**
- Selección única (radio buttons)
- Cada opción tiene icono descriptivo
- Al seleccionar se habilita botón "Siguiente"
- No se puede avanzar sin seleccionar un tipo

**Backend:** El tipo seleccionado determina:
- Campos obligatorios en pasos siguientes
- Estructura de datos a guardar
- Validaciones específicas

---

## **PASO 2: CATEGORÍA** 🎯

**Pregunta:** "¿En qué categoría se enfoca tu producto?"

**Opciones disponibles:**
- **Fitness** - Entrenamiento físico, ejercicios, rutinas
- **Nutrición** - Planes alimentarios, dietas, suplementación

**Comportamiento:**
- Visible para todos los tipos de producto (Programa, Documento, Taller)
- Selección única (radio buttons)
- Al seleccionar se habilita botón "Siguiente"
- No se puede avanzar sin seleccionar una categoría

**Backend:** La categoría determina:
- Campos específicos en pasos siguientes
- Validaciones de contenido
- Estructura de planificación
- Filtros y búsquedas en el catálogo

---

## **PASO 3: INFORMACIÓN BÁSICA** 📝

**Campos requeridos:**

1. **Título del producto** *(obligatorio)*
   - Input de texto
   - Máximo 100 caracteres
   - Placeholder: "Ej: Plan de Entrenamiento Funcional 8 Semanas"
   - Validación: No puede estar vacío

2. **Descripción** *(obligatorio)*
   - Textarea
   - Máximo 500 caracteres
   - Contador de caracteres visible
   - Placeholder: "Describe tu producto, qué incluye, para quién está dirigido..."
   - Validación: Mínimo 50 caracteres

3. **Objetivos** *(obligatorio)*
   - Tags/chips seleccionables debajo de la descripción
   - Opciones predefinidas:
     - Pérdida de peso
     - Ganancia muscular
     - Resistencia
     - Flexibilidad
     - Rehabilitación
     - Bienestar general
   - Puede seleccionar múltiples
   - Se guarda en `workshop_type` como JSON con tags separados por comas

4. **Nivel de intensidad** *(obligatorio)*
   - Select dropdown
   - Opciones:
     - Principiante
     - Intermedio
     - Avanzado
     - Todos los niveles

5. **Precio** *(obligatorio)*
   - Input numérico
   - Formato: USD ($)
   - Placeholder: "0.00"
   - Validación: Debe ser >= 0
   - Opción: "Gratis" (checkbox que setea precio en 0)

**Campos opcionales:**

6. **Duración estimada**
   - Input numérico + selector de unidad (días/semanas/meses)
   - Solo visible si tipo = "Programa" o "Taller"

7. **Modalidad** *(condicional)*
   - **Si Programa o Taller**: Radio buttons
     - ⚪ Online
     - ⚪ Presencial
     - ⚪ Híbrido
   - **Si Documento**: Campo fijo (siempre "Online")

**Botones:**
- "Atrás" → Vuelve al Paso 2
- "Siguiente" → Avanza al Paso 4 (solo si campos obligatorios completos)
    
    ---
    
## **PASO 4: CONTENIDO ESPECÍFICO** 📋

### **🔄 FLUJO CONDICIONAL POR CATEGORÍA:**

```
Si Programa + Fitness → PASO 4A: EJERCICIOS DEL PROGRAMA
Si Programa + Nutrición → PASO 4B: PLATOS DEL PROGRAMA
Si Taller → PASO 4C: ADJUNTAR PDF
Si Documento → PASO 4D: RECURSOS ADICIONALES
```

---

## **PASO 4A: EJERCICIOS DEL PROGRAMA** 💪
*(Solo si tipo = "Programa" + categoría = "Fitness")*

**Pregunta:** "Agregá los ejercicios de tu programa"

### **📋 Opciones disponibles:**

#### **1. Crear ejercicios manualmente**
- **Formulario con campos:**
  - **Nombre de la actividad** *(obligatorio)*
  - **Descripción** *(obligatorio)*
  - **Duración** (minutos)
  - **Calorías** (opcional)
  - **Tipo de ejercicio** (dropdown)
  - **Nivel de intensidad** (dropdown)
  - **Equipo necesario** (múltiples opciones)
  - **Partes del cuerpo** (múltiples opciones)
  - **Detalles de series**:
    - Peso (kg)
    - Repeticiones
    - Series
  - **Video del ejercicio** (opcional):
    - Upload de video MP4/WebM
    - Tamaño máximo: 50 MB
    - Duración máxima: 5 minutos
    - Preview del video
    - Botón "Eliminar video"
  - **Bloques** (puede crear múltiples)
- **Botón "Agregar a la tabla"**

#### **2. Subir CSV**
- **Upload de archivo CSV** con las mismas columnas
- **Formato requerido del CSV:**
  - Columnas: `nombre, descripción, duración, calorías, tipo, intensidad, equipo, partes_cuerpo, peso, repeticiones, series, video_url`
  - Separador: coma (,)
  - Encoding: UTF-8
  - **Video_url**: URL del video (opcional, puede estar vacío)
- **Botón "Descargar plantilla modelo"**
- **Validación de formato y datos**

#### **3. Agregar ejercicios existentes**
- **Lista de ejercicios** ya creados por el coach
- **Filtros** por tipo, intensidad, equipo
- **Búsqueda** por nombre
- **Selección múltiple**
- **Preview de cada ejercicio:**
  - Thumbnail del video (si tiene)
  - Nombre del ejercicio
  - Duración
  - Tipo e intensidad
  - Botón "Ver video" (si aplica)

### **🔧 Backend:**
- **Guarda en tabla:** `ejercicios_detalles`
- **Relación con:** `activity_id`
- **Videos:** Supabase Storage (bucket: `exercise-videos`)
- **Validaciones:** Datos obligatorios

### **🔄 Gestión de Estados (is_active):**
- **Nuevo ejercicio:** Se crea con `is_active = TRUE` (visible para todos)
- **Desactivar ejercicio:** El coach marca `is_active = FALSE` desde la tabla
  - ❌ **NO elimina** el ejercicio de la base de datos
  - ❌ **NO afecta** a clientes que ya compraron (mantienen acceso)
  - ✅ **Solo afecta** a compras nuevas (no ven ejercicios desactivados)
  - Icono: 🔌 PowerOff (cambia de 🗑️ Trash)
- **Eliminar de planificación:** Se quita de la planificación semanal cuando se desactiva
- **Reactivar:** Coach puede volver a activar ejercicios desactivados en el futuro

---

## **PASO 4B: PLATOS DEL PROGRAMA** 🍽️
*(Solo si tipo = "Programa" + categoría = "Nutrición")*

**Pregunta:** "Agregá los platos de tu programa nutricional"

### **📋 Opciones disponibles:**

#### **1. Crear platos manualmente**
- **Formulario con campos:**
  - **Nombre del plato** *(obligatorio)*
  - **Descripción** *(obligatorio)*
  - **Tipo de comida** (dropdown):
    - Desayuno
    - Almuerzo
    - Cena
    - Snack
    - Merienda
  - **Tiempo de preparación** (minutos)
  - **Dificultad** (dropdown):
    - Fácil
    - Intermedio
    - Avanzado
  - **Porciones** (número de personas)
  - **Ingredientes** (lista):
    - Nombre del ingrediente
    - Cantidad
    - Unidad (gramos, tazas, cucharadas, etc.)
  - **Instrucciones de preparación** (textarea)
  - **Información nutricional** (opcional):
    - Calorías por porción
    - Proteínas (g)
    - Carbohidratos (g)
    - Grasas (g)
  - **Imagen del plato** (opcional):
    - Upload de imagen JPG/PNG
    - Tamaño máximo: 10 MB
    - Preview de la imagen
    - Botón "Eliminar imagen"
  - **Video de preparación** (opcional):
    - Upload de video MP4/WebM
    - Tamaño máximo: 50 MB
    - Duración máxima: 10 minutos
    - Preview del video
    - Botón "Eliminar video"
- **Botón "Agregar a la tabla"**

#### **2. Subir CSV de platos**
- **Upload de archivo CSV** con las mismas columnas
- **Formato requerido del CSV:**
  - Columnas: `nombre, descripción, tipo_comida, tiempo_preparacion, dificultad, porciones, ingredientes, instrucciones, calorias, proteinas, carbohidratos, grasas, imagen_url, video_url`
  - Separador: coma (,)
  - Encoding: UTF-8
  - **Ingredientes**: JSON string con array de objetos `{nombre, cantidad, unidad}`
  - **Imagen_url**: URL de la imagen (opcional)
  - **Video_url**: URL del video (opcional)
- **Botón "Descargar plantilla modelo"**
- **Validación de formato y datos**

#### **3. Agregar platos existentes**
- **Lista de platos** ya creados por el coach
- **Filtros** por tipo de comida, dificultad, tiempo de preparación
- **Búsqueda** por nombre
- **Selección múltiple**
- **Preview de cada plato:**
  - Imagen del plato (si tiene)
  - Nombre del plato
  - Tipo de comida
  - Tiempo de preparación
  - Dificultad
  - Botón "Ver imagen" (si aplica)
  - Botón "Ver video" (si aplica)

### **🔧 Backend:**
- **Guarda en tabla:** `nutrition_program_details`
- **Relación con:** `activity_id`
- **Imágenes/Videos:** Supabase Storage (buckets varios)
- **Validaciones:** Datos obligatorios

### **🔄 Gestión de Estados (is_active):**
- **Nuevo plato:** Se crea con `is_active = TRUE` (visible para todos)
- **Desactivar plato:** El coach marca `is_active = FALSE` desde la tabla
  - ❌ **NO elimina** el plato de la base de datos
  - ❌ **NO afecta** a clientes que ya compraron (mantienen acceso)
  - ✅ **Solo afecta** a compras nuevas (no ven platos desactivados)
  - Icono: 🔌 PowerOff (cambia de 🗑️ Trash)
- **Eliminar de planificación:** Se quita de la planificación semanal cuando se desactiva
- **Reactivar:** Coach puede volver a activar platos desactivados en el futuro

---

## **PASO 4C: ADJUNTAR PDF** 📄
*(Solo si tipo = "Taller")*

**Pregunta:** "¿Querés adjuntar un PDF del taller?"

### **📋 Opciones:**
- **Sí, adjuntar PDF**
  - Upload de archivo PDF
  - Tamaño máximo: 20 MB
  - Preview del PDF
  - Opción de eliminar y reemplazar
- **No, continuar sin PDF**
  - Salta directamente al Paso 5

### **🔧 Backend:**
- **Upload a:** Supabase Storage (bucket: `product-media`)
- **Guarda en tabla:** `activity_resources`

---

## **PASO 4D: RECURSOS ADICIONALES** 📎
*(Solo si tipo = "Documento")*

**Pregunta:** "Agregá recursos adicionales para tu documento"

### **📋 Opciones:**
- **Subir documentos PDF**
- **Enlaces externos**
- **Videos explicativos**

### **🔧 Botones:**
- "Atrás" → Vuelve al Paso 3
- "Siguiente" → Avanza al Paso 5
    
---

## **PASO 5: PLANIFICACIÓN** 📅

### **🔄 FLUJO CONDICIONAL POR TIPO:**

```
Si Programa + Fitness → PASO 5A: PLANIFICACIÓN DE EJERCICIOS
Si Programa + Nutrición → PASO 5B: PLANIFICACIÓN DE PLATOS
Si Taller → PASO 5C: TEMAS Y HORARIOS
Si Documento → PASO 6: RESUMEN Y PUBLICACIÓN
```

---

## **PASO 5A: PLANIFICACIÓN DE EJERCICIOS** 💪
*(Solo si tipo = "Programa" + categoría = "Fitness")*

**Pregunta:** "Organizá los ejercicios por días y semanas"

### **📋 Funcionalidades:**

#### **1. Selección de ejercicios**
- **Lista de ejercicios** cargados en el Paso 4
- **Filtros** por tipo, intensidad, equipo
- **Búsqueda** por nombre
- **Selección múltiple** con checkboxes

#### **2. Asignación a días**
- **Calendario semanal** (Lunes a Domingo)
- **Drag & drop** de ejercicios a días específicos
- **Cantidad de ejercicios** por día
- **Orden de ejercicios** dentro del día

#### **3. Múltiples semanas**
- **Selector de número de semanas** (1-52)
- **Tabs** para navegar entre semanas
- **Patrón base** para la primera semana

#### **4. Repetir patrón**
- **Botón "Repetir patrón"**
- **Selector** de cuántas veces repetir
- **Aplica el patrón** de la semana base a las siguientes
- **Opción de modificar** semanas individuales

#### **5. Vista de resumen**
- **Semanas**: Total de semanas configuradas
- **Sesiones**: Total de días con ejercicios
- **Ejercicios totales**: Suma de todos los ejercicios
- **Ejercicios únicos**: Ejercicios diferentes utilizados
- **Tiempo estimado**: Duración total del programa
- **Actualización en tiempo real** al agregar/modificar

### **🔧 Backend:**
- **Guarda en tabla:** `planificacion_ejercicios`
- **Estructura JSON** por semana y día
- **Relación con:** ejercicios del Paso 4

---

## **PASO 5B: PLANIFICACIÓN DE PLATOS** 🍽️
*(Solo si tipo = "Programa" + categoría = "Nutrición")*

**Pregunta:** "Organizá los platos por días y semanas"

### **📋 Funcionalidades:**

#### **1. Selección de platos**
- **Lista de platos** cargados en el Paso 4
- **Filtros** por tipo de comida, dificultad, tiempo de preparación
- **Búsqueda** por nombre
- **Selección múltiple** con checkboxes

#### **2. Asignación a días**
- **Calendario semanal** (Lunes a Domingo)
- **Drag & drop** de platos a días específicos
- **Cantidad de platos** por día
- **Orden de platos** dentro del día
- **Distribución por comidas:**
  - Desayuno
  - Almuerzo
  - Cena
  - Snacks

#### **3. Múltiples semanas**
- **Selector de número de semanas** (1-52)
- **Tabs** para navegar entre semanas
- **Patrón base** para la primera semana

#### **4. Repetir patrón**
- **Botón "Repetir patrón"**
- **Selector** de cuántas veces repetir
- **Aplica el patrón** de la semana base a las siguientes
- **Opción de modificar** semanas individuales

#### **5. Vista de resumen**
- **Semanas**: Total de semanas configuradas
- **Sesiones**: Total de días con platos
- **Platos totales**: Suma de todos los platos
- **Platos únicos**: Platos diferentes utilizados
- **Tiempo estimado**: Duración total del programa
- **Actualización en tiempo real** al agregar/modificar

### **🔧 Backend:**
- **Guarda en tabla:** `planificacion_platos`
- **Estructura JSON** por semana y día
- **Relación con:** platos del Paso 4

---

## **PASO 5C: TEMAS Y HORARIOS** 🕐
*(Solo si tipo = "Taller")*

**Pregunta:** "Definí los temas y horarios de tu taller"

### **📋 Funcionalidades:**

#### **1. Crear tema**
- **Título del tema** *(obligatorio)*
- **Descripción** *(opcional)*
- **Días del calendario** (selección múltiple)
- **Horarios** (hora inicio y fin)
- **Botón "Finalizar tema"**

#### **2. Gestión de temas**
- **Lista de temas** creados
- **Editar tema** existente
- **Eliminar tema**
- **Agregar nuevo tema**

#### **3. Calendario interactivo**
- **Vista mensual**
- **Días seleccionados** marcados
- **Navegación** entre meses

#### **4. Configuración de horarios**
- **Horarios** (único horario por tema)
  - Input de hora inicio (ej: 10:00)
  - Input de hora fin (ej: 12:00)
  - Duración calculada automáticamente
  - Botón "Agregar horario"
- **Cada tema** puede tener múltiples combinaciones de días-horarios
- **Ejemplo:** "Yoga Matutino" - Lunes 9:00-10:00, Miércoles 9:00-10:00
- **Vista de resumen** de todas las sesiones

### **🔧 Backend:**
- **Guarda en tabla:** `taller_detalles`
- **Estructura JSON** con temas y horarios
- **Relación con:** `actividad_id`

---

## **GESTIÓN DE TALLERES ACTIVOS** 🎯
*(Funcionalidades post-publicación para talleres)*

### **📋 Estados del Taller:**

#### **1. Taller ACTIVO** 🟢
- **Estado:** Verde, disponible para compra
- **Funcionalidades disponibles:**
  - Agregar nuevas fechas
  - Pausar fechas específicas
  - Agregar nuevos temas
  - Cancelar temas individuales
  - Reprogramar temas

#### **2. Taller PAUSADO** 🟡
- **Estado:** Amarillo, no disponible para nuevas compras
- **Funcionalidades disponibles:**
  - Reactivar fechas pausadas
  - Agregar nuevas fechas
  - Gestionar clientes existentes
  - Finalizar taller

#### **3. Taller FINALIZADO** ⚫
- **Estado:** Gris, completamente deshabilitado
- **Condición:** Última fecha de cualquier tema ya pasó
- **Funcionalidades disponibles:**
  - Reactivar agregando nuevas fechas
  - Marcar como finalizado definitivamente
  - Eliminar de productos

### **📅 Gestión de Fechas:**

#### **1. Agregar Nuevas Fechas**
- **Coach puede:** Agregar fechas en cualquier momento
- **Restricción:** No puede eliminar fechas ya compradas
- **Efecto:** Nuevas fechas disponibles para nuevos clientes
- **Notificación:** Clientes existentes reciben notificación

#### **2. Pausar Fechas Específicas**
- **Coach puede:** Pausar fechas ya compradas para cortar más compras
- **Efecto:** Esa fecha específica no acepta nuevos clientes
- **Clientes existentes:** No se ven afectados, mantienen su acceso
- **Reactivación:** Coach puede reactivar fechas pausadas

#### **3. Cancelar Temas Individuales**
- **Con más de 72 horas:**
  - Cliente **DEBE** aceptar nueva fecha o **PIERDE** el tema
  - No hay reembolso automático
  - Decisión binaria: acepta o pierde
- **Con menos de 72 horas:**
  - Coach debe ofrecer reembolso ADEMÁS de nueva fecha
  - Cliente puede elegir entre reembolso o nueva fecha

### **🎁 Gestión de Nuevos Temas:**

#### **1. Agregar Nuevos Temas**
- **Coach decide:** Regalar a TODOS los clientes existentes o a NINGUNO
- **No hay opción individual:** Decisión global para todos los clientes previos
- **Clientes nuevos:** Solo acceden si compran DESPUÉS de agregar los temas
- **Notificación:** Clientes existentes reciben notificación de nuevos temas

#### **2. Política de Regalo de Créditos**
- **Opción A:** Regalar acceso a todos los clientes existentes
- **Opción B:** No regalar, solo clientes nuevos acceden
- **Decisión del coach:** Una vez tomada, no se puede cambiar
- **Transparencia:** Clientes ven si tienen acceso o no

### **💰 Sistema de Reembolsos:**

#### **1. Fórmula de Reembolso por Tema Cancelado**
```
Reembolso = (Porcentaje del tema cancelado) × 3
```
- **Ejemplos:**
  - Cancela 1 tema de 10: 10% × 3 = **30%**
  - Cancela 1 tema de 20: 5% × 3 = **15%**
  - Cancela 1 tema de 2: 50% × 3 = **100%** (tope máximo)

#### **2. Cancelación Completa del Taller**
- **Menos del 50% cubierto:** Reembolso 100%
- **50% - 75% cubierto:** Reembolso 60%
- **75% - 100% cubierto:** Reembolso 40%

### **🔧 Backend para Gestión de Talleres:**
- **Tabla:** `taller_estados` - Estados del taller
- **Tabla:** `taller_fechas_pausadas` - Fechas pausadas
- **Tabla:** `taller_cancelaciones` - Historial de cancelaciones
- **Tabla:** `taller_reembolsos` - Reembolsos procesados
- **API:** `/api/taller-gestion` - Endpoints de gestión

---

## **PASO 6: RESUMEN Y PUBLICACIÓN** ✅

**Pregunta:** "Revisá tu producto antes de publicarlo"

### **📋 Vista de resumen:**

#### **1. Card del producto** (igual que lo vería un cliente)
- **Imagen/Video de portada**
- **Título del producto**
- **Descripción** (primeras líneas)
- **Precio**
- **Categoría** (Fitness/Nutrición)
- **Nivel de intensidad**
- **Modalidad** (Online/Presencial/Híbrido)

#### **2. Detalles específicos por tipo:**

**Si es Programa:**
- **Total de semanas**
- **Ejercicios únicos** (Fitness) / **Platos únicos** (Nutrición)
- **Sesiones por semana**
- **Tiempo estimado total**

**Si es Taller:**
- **Total de temas**
- **Sesiones programadas**
- **Horarios disponibles**
- **PDF adjunto** (si aplica)

**Si es Documento:**
- **Recursos adicionales**
- **Enlaces externos**
- **Videos explicativos**

#### **3. Configuración de publicación:**
- **Visibilidad:**
  - ⚪ Público (cualquiera puede comprarlo)
  - ⚪ Privado (solo clientes asignados)
  - ⚪ Borrador (no visible para nadie)

- **Disponibilidad:**
  - Checkbox: "Disponible inmediatamente"
  - Si no marcado: selector de fecha de publicación
   
- **Límite de cupos** (solo para Taller):
  - Checkbox: "Limitar cupos disponibles"
  - Input numérico para cantidad

#### **4. Validaciones finales:**
- ✅ **Todos los campos obligatorios** completos
- ✅ **Al menos un ejercicio** (si es Programa Fitness)
- ✅ **Al menos un plato** (si es Programa Nutrición)
- ✅ **Al menos un tema** (si es Taller)
- ✅ **Precio válido**
- ⚠️ **Advertencias** (no bloquean):
  - "No agregaste video de portada"
  - "No hay recursos adicionales"

#### **5. Botones:**
- **"Atrás"** → Vuelve al Paso 5
- **"Guardar como borrador"** → Guarda sin publicar (estado: borrador)
- **"Publicar producto"** (botón principal, naranja) → Publica el producto

### **🚀 Proceso de Publicación:**

**Al hacer click en "Publicar producto":**

1. **Loading spinner** con mensaje "Publicando producto..."
2. **Se ejecutan múltiples llamadas al backend:**
   - `POST /api/products` - Crea el producto
   - `POST /api/products/[id]/media` - Vincula media
   - `POST /api/products/[id]/planning` - Guarda planificación (si es Programa)
   - `POST /api/products/[id]/workshop` - Guarda horarios (si es Taller)
   - `POST /api/products/[id]/resources` - Guarda recursos
3. **Si todo OK:**
   - **Toast de éxito:** "✅ ¡Producto publicado exitosamente!"
   - **Cierra el modal**
   - **Recarga lista de productos**
   - **Muestra el nuevo producto** en la lista
4. **Si hay error:**
   - **Toast de error** con mensaje específico
   - **No cierra el modal**
   - **Permite reintentar**

2. **Click en producto** → Abre `ClientProductModal` (vista de preview)
   
   **El modal muestra la vista como la vería un cliente:**
   
   **📹 Video de portada (si existe):**
   - Se reproduce **automáticamente** al abrir (muted por defecto)
   - Usa `UniversalVideoPlayer` con soporte **HLS.js** para archivos `.m3u8`
   - **Botón "Activar audio"** (floating, esquina inferior derecha)
   - **Click en el video** → pausa/reproduce
   - **Al terminar el video** → muestra botón naranja de replay (NO se cierra el modal)
   - Video viene de tabla `activity_media` (NO de ejercicios individuales)
   
   **📝 Información del producto:**
   - Título del producto
   - Descripción completa
   - Precio
   - Duración
   - Nivel de intensidad
   - Objetivos
   
   **🔘 Botones de acción (solo visibles para el coach):**
   - Botón "Editar producto" → Abre formulario de edición
   - Botón "Eliminar producto" → Confirma y elimina
   - Botón "Cerrar" (X) → Cierra el modal

3. **Toggle consultas** → Activa/desactiva disponibilidad de cada tipo de consulta

4. **Editar precio de consultas** → Modifica precio inline

5. **Filtros de productos** → Filtra productos por tipo/categoría

### **🎯 Gestión de Talleres Activos:**
*(Solo visible para productos tipo "Taller")*

#### **6. Acciones de Gestión de Taller:**
- **Agregar nuevas fechas** → Modal para agregar fechas adicionales
- **Pausar fechas específicas** → Pausar fechas para cortar nuevas compras
- **Agregar nuevos temas** → Modal para agregar temas con opción de regalar
- **Cancelar tema individual** → Cancelar tema con notificación a clientes
- **Reprogramar tema** → Ofrecer nueva fecha a clientes
- **Finalizar taller** → Marcar como finalizado (gris)
- **Reactivar taller** → Agregar fechas para reactivar

#### **7. Estados Visuales del Taller:**
- **🟢 ACTIVO** → Verde, disponible para compra
- **🟡 PAUSADO** → Amarillo, no nuevas compras
- **⚫ FINALIZADO** → Gris, completamente deshabilitado
- **🔴 CANCELADO** → Rojo, reembolsos pendientes

#### **8. Gestión de Créditos:**
- **Regalar nuevos temas** → Decisión global para todos los clientes
- **No regalar** → Solo clientes nuevos acceden
- **Transparencia** → Clientes ven si tienen acceso o no

#### **9. Sistema de Reembolsos:**
- **Fórmula automática** → (Porcentaje del tema cancelado) × 3
- **Reembolsos por cobertura** → 100%, 60%, 40% según progreso
- **Procesamiento automático** → Reembolsos se procesan automáticamente

---

### 4️⃣ **TAB: PROFILE** (Perfil)
**Componente principal:** `ProfileScreen`
**Ubicación:** `components/mobile/profile-screen.tsx`

#### **Vista Principal:**
- Avatar del coach (grande, circular)
- Nombre completo
- Email
- **Información profesional:**
  - Especialización
  - Años de experiencia
  - Rating promedio
  - Número de clientes
  - Número de productos
  
- **Estadísticas:**
  - Ingresos totales
  - Productos vendidos
  - Clientes activos

#### **Acciones disponibles:**

1. **Botón "Editar perfil"** → Abre `ProfileEditModal`
   - Cambiar avatar (subir imagen)
   - Editar nombre
   - Editar email
   - Editar especialización
   - Editar años de experiencia
   - Editar biografía
   - Botón guardar

2. **Ver estadísticas** → Muestra métricas detalladas del coach

3. **Configuración** → Abre ajustes de la cuenta
   - Cambiar contraseña
   - Notificaciones
   - Privacidad
   - Ayuda y soporte

4. **Cerrar sesión** → Logout (confirma antes)

5. **Gestión de Planes y Suscripción** → Sección "Mi Suscripción"
   - Muestra el plan actual del coach
   - Barra de uso de almacenamiento
   - Precio y período de facturación
   - Botón "Ver Planes" para expandir lista completa
   - Tabla comparativa de todas las características
   - Botón "Cambiar a este plan" en cada opción

---

## 💳 SISTEMA DE PLANES Y SUSCRIPCIÓN

### **📦 Planes Disponibles**

| Plan | Precio Mensual (ARS) | Almacenamiento | Productos Activos | Clientes Recomendados | Comisión |
|------|---------------------|----------------|-------------------|---------------------|----------|
| 🟢 **Free / Inicial** | $0 (3 meses o hasta 3 ventas) | **1 GB** | 3 | hasta 10 | 8% |
| ⚫ **Básico** | $12.000 | **5 GB** | 5 | hasta 30 | 8% |
| 🔵 **Black** | $22.000 | **25 GB** | 10 | hasta 70 | 6% |
| 🟣 **Premium** | $35.000 | **100 GB** | 20 | hasta 150 | 5% |

### **📊 Características Detalladas por Plan**

| Característica | Free | Básico | Black | Premium |
|---------------|------|--------|-------|---------|
| **Almacenamiento** | 1 GB | 5 GB | 25 GB | 100 GB |
| **Productos activos** | 3 | 5 | 10 | 20 |
| **Clientes por producto** | 10 | 30 | 70 | 150 |
| **Actividades por producto** | 20 | 40 | 60 | 100 |
| **Ejercicios/Platos únicos activos por producto** | 20 | 40 | 60 | 100 |
| **Comisión por venta** | 8% | 8% | 6% | 5% |
| **Duración de video (máx)** | — | 30 s | 60 s | 120 s |
| **Duración de producto (uso por cliente)** | 7–14 días | 30 días | 60 días | 90–120 días |
| **Video de portada** | ❌ | ✅ | ✅ | ✅ |
| **Analítica** | — | Básica | Avanzada | Completa |
| **Soporte** | E-mail | E-mail prioritario | Chat directo | Soporte técnico directo |

### **🔧 Implementación Técnica**

#### **Componente: PlanManagement**
- **Ubicación:** `components/coach/plan-management.tsx`
- **Función:** Gestión completa de planes y suscripciones
- **Características:**
  - Muestra plan actual con icono y colores distintivos
  - Barra de progreso de uso de almacenamiento
  - Lista expandible de todos los planes disponibles
  - Tabla comparativa completa
  - Validación al cambiar de plan (verifica espacio suficiente)
  - Estados de carga y error

#### **API: `/api/coach/plan`**
- **GET**: Obtiene el plan activo del coach
  - Si no tiene plan, crea uno 'free' por defecto
  - Retorna: `{ success: true, plan: {...} }`
  
- **POST**: Cambia el plan del coach
  - Valida que el nuevo plan tenga suficiente espacio
  - Desactiva el plan anterior
  - Crea el nuevo plan activo
  - Retorna: `{ success: true, plan: {...}, message: "..." }`

#### **Tabla de Base de Datos: `planes_uso_coach`**
- **Campos principales:**
  - `id`: UUID (PK)
  - `coach_id`: UUID (FK a coaches)
  - `plan_type`: VARCHAR ('free', 'basico', 'black', 'premium')
  - `storage_limit_gb`: DECIMAL (límite según plan)
  - `storage_used_gb`: DECIMAL (uso actual)
  - `storage_available_gb`: GENERATED (calculado automáticamente)
  - `status`: VARCHAR ('active', 'cancelled', 'expired', 'trial')
  - `started_at`, `expires_at`: TIMESTAMP

- **Características:**
  - Constraint único: un coach solo puede tener un plan activo
  - RLS habilitado con políticas de seguridad
  - Trigger para actualizar `updated_at` automáticamente
  - Índices para mejor performance

#### **Flujo de Usuario**

1. **Ver Plan Actual:**
   - Sección "Mi Suscripción" en Profile Tab
   - Muestra plan activo con barra de uso de almacenamiento
   - Precio y período de facturación

2. **Ver Todos los Planes:**
   - Click en "Ver Planes"
   - Lista expandible con todos los planes
   - Tabla comparativa completa de características

3. **Cambiar Plan:**
   - Click en "Cambiar a este plan" en cualquier plan
   - Validación automática (verifica espacio suficiente)
   - Actualización inmediata en la UI
   - Reload de página para actualizar widget

4. **Sincronización:**
   - El widget de almacenamiento se actualiza automáticamente
   - La tabla `planes_uso_coach` refleja el uso real
   - API `/api/coach/sync-storage` para sincronización manual

### **💰 Modelo de Negocio**

- **Plan Free/Inicial:** Gratis durante 3 meses o hasta 3 ventas
- **Planes de Pago:** Facturación mensual en ARS
- **Comisiones:** Reducción de comisión según el plan (mayor plan = menor comisión)
- **Límites Escalables:** Más almacenamiento, productos y clientes según el plan
- **Beneficios Premium:** Video de portada, analítica avanzada, soporte prioritario

### **🔄 Sistema de Renovaciones Automáticas**

#### **Renovación Mensual (31 días)**
Todos los planes se renuevan automáticamente cada 31 días:
- **Duración fija:** 31 días exactos desde `started_at` hasta `expires_at`
- **Renovación automática:** Se ejecuta diariamente mediante cron job
- **Nueva fila:** Cada renovación crea un nuevo registro en `planes_uso_coach`

#### **Campo `renewal_count`**
El campo `renewal_count` trackea el número de renovaciones automáticas:

- **`renewal_count = 0`:** Plan inicial (primer período de 31 días)
- **`renewal_count = 1`:** Primera renovación automática
- **`renewal_count = 2`:** Segunda renovación automática
- **`renewal_count = 3`:** Tercera renovación automática

#### **Límite de Renovaciones para Plan Free**
El plan Free tiene un límite de **3 renovaciones automáticas** (4 períodos totales):

1. **Período Inicial:** `renewal_count = 0` (31 días)
2. **Primera Renovación:** `renewal_count = 1` (31 días)
3. **Segunda Renovación:** `renewal_count = 2` (31 días)
4. **Tercera Renovación:** `renewal_count = 3` (31 días)
5. **Después de 3 renovaciones:** El plan Free NO se renueva automáticamente
   - El coach debe cambiar a un plan de pago
   - Total: 4 períodos × 31 días = **124 días** (≈ 4 meses)

#### **Planes de Pago (Básico, Black, Premium)**
- **Renovación ilimitada:** No tienen límite de renovaciones
- **`renewal_count` siempre es 0:** Solo aplica al plan Free
- **Renovación automática:** Continúa indefinidamente mientras el plan esté activo

#### **API de Renovación Automática**
- **Endpoint:** `POST /api/coach/plan/renew`
- **Ejecución:** Diariamente mediante cron job
- **Función:** 
  - Busca planes activos con `expires_at <= now`
  - Valida renovación (plan Free: máximo 3)
  - Crea nuevo plan con 31 días nuevos
  - Desactiva plan anterior (`status = 'expired'`)

### **📅 Lógica de Upgrade y Downgrade**

#### **UPGRADE (Plan Peor → Mejor)**
- **Cambio:** Inmediato
- **Días regalados:** Se suman los días restantes del plan anterior
- **Cálculo:** `expires_at = now + (días_restantes + 31 días nuevos)`
- **Ejemplo:** 
  - Plan actual expira en 15 días
  - Upgrade a plan mejor
  - Nuevo plan: `expires_at = now + 15 días + 31 días = 46 días totales`
- **Beneficios:** El coach aprovecha los beneficios del plan mejor inmediatamente

#### **DOWNGRADE (Plan Mejor → Peor)**
- **Cambio:** Programado para cuando termine el plan actual
- **Conserva días:** El plan actual continúa hasta su expiración
- **Cálculo:** 
  - `started_at del nuevo plan = expires_at del plan actual`
  - `expires_at del nuevo plan = started_at + 31 días`
- **Ejemplo:**
  - Plan actual expira en 20 días
  - Downgrade a plan peor
  - Nuevo plan empieza en 20 días, dura 31 días más
- **Ventaja:** El coach no pierde los días restantes del plan mejor

#### **Ejemplo Visual de Upgrade:**
```
Plan Básico (actual):     |==== 15 días restantes ====| (expira)
Plan Black (nuevo):        |==== 15 días regalados + 31 días nuevos ====|
                                                         ↑
                                                      Cambio inmediato
```

#### **Ejemplo Visual de Downgrade:**
```
Plan Black (actual):       |==== 20 días restantes ====| (expira)
Plan Básico (nuevo):                                    |==== 31 días ====|
                                                         ↑
                                                      Empieza aquí
```

### **🗄️ Campos de la Tabla `planes_uso_coach`**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Identificador único |
| `coach_id` | UUID | ID del coach |
| `plan_type` | VARCHAR | 'free', 'basico', 'black', 'premium' |
| `storage_limit_gb` | DECIMAL | Límite de almacenamiento según plan |
| `storage_used_gb` | DECIMAL | Almacenamiento usado actualmente |
| `storage_available_gb` | DECIMAL | Calculado automáticamente |
| `status` | VARCHAR | 'active', 'cancelled', 'expired', 'trial' |
| `started_at` | TIMESTAMP | Fecha de inicio del plan |
| `expires_at` | TIMESTAMP | Fecha de expiración (started_at + 31 días) |
| `renewal_count` | INTEGER | Número de renovaciones (solo Free, máximo 3) |
| `created_at` | TIMESTAMP | Fecha de creación del registro |
| `updated_at` | TIMESTAMP | Última actualización |

### **🔍 Validaciones y Reglas**

1. **Un coach solo puede tener un plan activo a la vez** (constraint único)
2. **Plan activo:** `status = 'active'` Y `started_at <= now`
3. **Plan programado (downgrade):** `status = 'active'` Y `started_at > now`
4. **Renovación Free:** Solo si `renewal_count < 3`
5. **Validación de almacenamiento:** No permite downgrade si el uso excede el nuevo límite

---

## 🔝 HEADER (Siempre visible en todas las tabs)

### **Logo central:** "omnia"

### **Botones disponibles:**

1. **⚙️ Settings** (esquina superior izquierda)
   - Configuración de la cuenta
   - Preferencias de la app
   - Ajustes de notificaciones

2. **💬 Messages** (esquina superior derecha)
   - Ver conversaciones con clientes
   - Chat en tiempo real
   - Notificaciones de mensajes no leídos
   - Badge con número de mensajes pendientes

---

## 📊 COMPONENTES COMPARTIDOS IDENTIFICADOS

### **Modales:**
- `ClientDetailModal` - Detalle completo de cliente con métricas y secciones expandibles
- `ClientProductModal` - Vista de preview de producto (usado tanto por coach como por cliente)
- `CreateProductModal` - Crear/editar producto
- `EventDetailModal` - Detalle de evento del calendario (NO implementado aún)
- `ProfileEditModal` - Editar perfil del coach
- `BiometricsModal` - Ver/editar biométricas del cliente
- `InjuriesModal` - Ver/editar lesiones del cliente
- `ObjectivesModal` - Ver/editar objetivos del cliente

### **Componentes de video:**
- `UniversalVideoPlayer` - Reproductor con soporte HLS.js
  - Detecta automáticamente archivos `.m3u8`
  - Usa HLS.js en navegadores que lo requieren
  - Usa HLS nativo en Safari
  - Controles: play/pause (click), mute/unmute (botón)
  - Botón de replay al finalizar

### **Screens principales:**
- `CommunityScreen` / `FeedScreen` - Feed de la comunidad
- `ClientsScreen` - Lista de clientes del coach
- `ProductsManagementScreen` - Gestión de productos
- `ProfileScreen` - Perfil del coach

---

## 🎬 FLUJO ESPECIAL: VIDEO EN PRODUCTOS

**Ruta completa:** Products Tab → Click en producto → Modal con video

**Comportamiento detallado del video:**

1. ✅ **Autoplay:** Se reproduce automáticamente al abrir el modal (muted por defecto)
2. ✅ **Player:** Usa `UniversalVideoPlayer` con soporte **HLS.js** para streaming `.m3u8`
3. ✅ **Click en video:** Alterna entre pausa y reproducción
4. ✅ **Botón de audio:** Floating button en esquina inferior derecha para mute/unmute
5. ✅ **Al terminar:** Muestra botón naranja grande de "replay" con icono de play
6. ✅ **NO se cierra:** El modal permanece abierto cuando termina el video
7. ✅ **Origen del video:** Viene de tabla `activity_media` (campo `video_url`), NO de ejercicios individuales
8. ✅ **Loop:** Deshabilitado (para que muestre el botón de replay)

**Implementación técnica:**
- **Archivo:** `components/client/activities/client-product-modal.tsx`
- **Player:** `components/shared/video/universal-video-player.tsx`
- **Dependencia:** `hls.js` (instalada vía npm)
- **Formato soportado:** HLS (`.m3u8`), MP4, WebM

---

## 🔒 RESTRICCIONES DE RUTAS

**✅ Solo permitido:** `http://localhost:3000/`

**❌ NO permitido (rutas eliminadas):**
- `/products/78` o cualquier `/products/[id]`
- `/coach/activities` o cualquier `/coach/*`
- `/activities/*`
- `/my-programs`
- `/my-products`
- `/my-activities`
- `/program-tracker`
- `/exercise/*`
- `/feed`
- `/community`
- `/coaches`
- `/booking/*`
- `/pricing`
- `/mobile/*`
- `/web/*`
- `/client/*`
- `/messages` (ruta separada)
- `/login` (ruta separada)
- `/dashboard/*`
- `/settings/*`
- `/about`

**Nota:** Toda la navegación del coach se maneja por tabs en la URL base `http://localhost:3000/`. No hay rutas adicionales.

---

## 🧩 **COMPONENTES, SCRIPTS Y APIs DEL TAB PRODUCTS**

### **📱 Componentes Principales:**

#### **1. ProductsManagementScreen**
- **Ubicación:** `components/mobile/products-management-screen.tsx`
- **Función:** Pantalla principal del tab Products
- **Características:**
  - Estadísticas del coach (ingresos, productos, rating)
  - Lista de productos existentes
  - Botón "Crear" para nuevo producto
  - Consultas disponibles (Café, Meet 30 min, Meet 1 hora)

#### **2. CreateProductModal**
- **Ubicación:** `components/mobile/create-product-modal.tsx`
- **Función:** Modal de creación de productos (6 pasos)
- **Características:**
  - Formulario progresivo
  - Validaciones por paso
  - Navegación entre pasos
  - Guardado de borrador
  - Publicación final

#### **3. ClientProductModal**
- **Ubicación:** `components/client/activities/client-product-modal.tsx`
- **Función:** Modal de preview de producto (compartido)
- **Características:**
  - Video de portada con HLS.js
  - Información completa del producto
  - Botones de acción (editar, eliminar)
  - Vista como la vería un cliente

### **🔧 Scripts y Hooks:**

#### **1. useProductCreation**
- **Ubicación:** `hooks/useProductCreation.ts`
- **Función:** Hook para manejar el estado de creación de productos
- **Características:**
  - Estado del formulario por pasos
  - Validaciones
  - Navegación entre pasos
  - Guardado de borrador

#### **2. useProductMedia**
- **Ubicación:** `hooks/useProductMedia.ts`
- **Función:** Hook para manejar multimedia de productos
- **Características:**
  - Upload de imágenes
  - Upload de videos
  - Preview de archivos
  - Validaciones de tamaño y formato

#### **3. useProductPlanning**
- **Ubicación:** `hooks/useProductPlanning.ts`
- **Función:** Hook para manejar la planificación de productos
- **Características:**
  - Drag & drop de ejercicios/platos
  - Calendario semanal
  - Múltiples semanas
  - Repetir patrones

### **🌐 APIs y Endpoints:**

#### **1. Productos**
- **`POST /api/products`** - Crear nuevo producto
- **`GET /api/products`** - Listar productos del coach
- **`PUT /api/products/[id]`** - Actualizar producto
- **`DELETE /api/products/[id]`** - Eliminar producto

#### **2. Ejercicios y Platos**
- **`POST /api/activities/exercises/bulk`** - Insertar ejercicios en bulk
- **`POST /api/activity-nutrition/bulk`** - Insertar platos en bulk (versión actual del programa)
- **`DELETE /api/delete-exercise-items`**  
  - Marca ejercicios como **inactivos** para una actividad:
    - Actualiza el JSONB `activity_id` con `activo=false` para esa `actividad_id`.
    - Si ningún activity del mapa queda activo, puede además poner `is_active=false`.
  - No borra filas inmediatamente; se dejan para que clientes históricos sigan viendo sus ejercicios originales.
- **`DELETE /api/delete-nutrition-items`**  
  - Igual lógica que `delete-exercise-items` pero para `nutrition_program_details`.
  - Soporta el caso donde:
    - Clientes que compraron antes mantienen sus X platos y Z días originales.
    - Nuevas compras usan la versión X.2 / Z.2 del programa.
- **`GET /api/activity-exercises/[id]`** - Obtener ejercicios (coach ve todos)
- **`GET /api/activity-nutrition/[id]`** - Obtener platos activos (filtrado automático)

#### **4. Multimedia**
- **`POST /api/products/[id]/media`** - Subir multimedia
- **`GET /api/products/[id]/media`** - Obtener multimedia
- **`DELETE /api/products/[id]/media`** - Eliminar multimedia

#### **5. Planificación**
- **`POST /api/products/[id]/planning`** - Guardar planificación
- **`GET /api/products/[id]/planning`** - Obtener planificación
- **`PUT /api/products/[id]/planning`** - Actualizar planificación

#### **6. Talleres**
- **`POST /api/products/[id]/workshop`** - Guardar horarios de taller
- **`GET /api/products/[id]/workshop`** - Obtener horarios
- **`PUT /api/products/[id]/workshop`** - Actualizar horarios

#### **7. Recursos**
- **`POST /api/products/[id]/resources`** - Guardar recursos
- **`GET /api/products/[id]/resources`** - Obtener recursos
- **`DELETE /api/products/[id]/resources`** - Eliminar recursos

### **🗄️ Tablas de Base de Datos:**

#### **1. Tablas Principales:**
- **`activities`** - Información básica del producto
- **`activity_media`** - Multimedia del producto
- **`ejercicios_detalles`** - Ejercicios de programas fitness
- **`platos_detalles`** - Platos de programas nutrición
- **`planificacion_ejercicios`** - Planificación de ejercicios
- **`planificacion_platos`** - Planificación de platos
- **`taller_detalles`** - Detalles de talleres
- **`activity_resources`** - Recursos adicionales

#### **2. Relaciones:**
- **`activities.id`** → **`ejercicios_detalles.activity_id`**
- **`activities.id`** → **`nutrition_program_details.activity_id`** (platos)
- **`activities.id`** → **`planificacion_ejercicios.activity_id`**
- **`activities.id`** → **`planificacion_platos.activity_id`**
- **`activities.id`** → **`taller_detalles.activity_id`**
- **`activities.id`** → **`activity_resources.activity_id`**

#### **3. Sistema de Estados (is_active) y versiones X/Z**
```
ejercicios_detalles
├── id
├── activity_id
├── nombre_ejercicio
├── ... (otros campos)
└── is_active BOOLEAN DEFAULT TRUE ⭐

nutrition_program_details
├── id
├── activity_id
├── nombre
├── ... (otros campos)
└── is_active BOOLEAN DEFAULT TRUE ⭐
```

**Comportamiento:**
- **Coach ve:** TODOS los ejercicios/platos (activos e inactivos) para gestionar.
- **Cliente ve en catálogo / nuevas compras:** solo ejercicios/platos donde:
  - `is_active = TRUE` **y**
  - `getActiveFlagForActivity(activity_id, actividad_id, true) = true`.
- **Límites del plan (ejercicios/platos únicos por producto):**
  - Solo cuentan los elementos **activos** según la regla anterior.
  - Ejercicios/platos históricos marcados como `activo=false` para esa actividad **no consumen cupo** del plan.
- **Desactivar (flujo de edición de programa):**
  - Se actualiza el JSONB `activity_id` marcando `activo=false` para esa `actividad_id`.
  - Opcionalmente se pone `is_active=false` si ya no está activo para ninguna actividad.
  - No se borra la fila para preservar:
    - Triggers de creación de progreso.
    - Posibilidad de que un cliente cambie un ejercicio/plato solo entre sus opciones originales.
- **Reactivar:** se vuelve a marcar `activo=true` para una actividad o `is_active=true` a nivel global.
- **Clientes que ya compraron:**
  - Al empezar la actividad, sus filas de `progreso_cliente` se generan usando la versión **vigente para su compra** (X, Z).
  - Cuando el coach modifica el programa (X.2, Z.2), los clientes antiguos mantienen su versión y solo las nuevas compras usan la nueva.

Para el detalle completo de este flujo (compras, modificaciones, limpieza diferida de datos históricos) ver  
`docs/diagramas/FLUJO_COMPRAS_Y_MODIFICACIONES_ACTIVIDADES.md`.

**Migración:** `db/migrations/add-is-active-to-exercises-and-nutrition.sql`

### **📦 Storage Buckets:**

#### **1. Supabase Storage:**
- **`exercise-videos`** - Videos de ejercicios
- **`dish-images`** - Imágenes de platos
- **`dish-videos`** - Videos de preparación de platos
- **`product-media`** - Multimedia general de productos

### **🔍 Validaciones:**

#### **1. Frontend:**
- Campos obligatorios por paso
- Validaciones de formato (CSV, imágenes, videos)
- Límites de tamaño de archivos
- Validaciones de datos en tiempo real

#### **2. Backend:**
- Validaciones de permisos
- Validaciones de datos
- Validaciones de archivos
- Validaciones de relaciones

### **📊 Métricas y Logs:**

#### **1. Logs de Creación:**
- `🧩 COMPONENT: CreateProductModal` - Modal abierto
- `📝 PRODUCT: Paso X completado` - Paso completado
- `✅ PRODUCT: Producto publicado` - Producto publicado exitosamente
- `❌ PRODUCT: Error en publicación` - Error en publicación

#### **2. Logs de Multimedia:**
- `📤 MEDIA: Archivo subido` - Archivo subido exitosamente
- `❌ MEDIA: Error en upload` - Error en upload
- `🎥 VIDEO: Video procesado` - Video procesado

#### **3. Logs de Planificación:**
- `📅 PLANNING: Planificación guardada` - Planificación guardada
- `🔄 PLANNING: Patrón repetido` - Patrón repetido
- `📊 PLANNING: Resumen actualizado` - Resumen actualizado

---

## 📝 **COMPONENTES USADOS (Para tracking y limpieza)**

**Logs identificados con `🧩 COMPONENT:`:**
- `MobileApp` - Componente principal que renderiza toda la app
- `ClientsScreen` - Tab Clients
- `ProductsManagementScreen` - Tab Products
- `ProfileScreen` - Tab Profile
- `CommunityScreen` / `FeedScreen` - Tab Community

**Componentes de uso compartido:**
- `BottomNavigation` - Navegación inferior con tabs
- `ClientDetailModal` - Modal de detalle de cliente
- `ClientProductModal` - Modal de preview de producto
- `UniversalVideoPlayer` - Reproductor de video HLS

---

## 🆕 NUEVOS ENDPOINTS IMPLEMENTADOS

### **`/api/coach/clients/[id]/todo`**

**Métodos:**
- **GET**: Obtiene las tareas (to-do) del cliente
  - Parámetros: `id` del cliente en la URL
  - Respuesta: `{ success: true, tasks: string[] }`
  - Límite: Máximo 4 tareas por cliente
  
- **POST**: Agrega una nueva tarea
  - Parámetros: 
    - `id` del cliente en la URL
    - Body: `{ task: string }`
  - Validación: No permite más de 4 tareas
  - Respuesta: `{ success: true, tasks: string[] }`
  
- **DELETE**: Elimina una tarea por índice
  - Parámetros:
    - `id` del cliente en la URL
    - Body: `{ taskIndex: number }`
  - Respuesta: `{ success: true, tasks: string[] }`

**Almacenamiento:** Las tareas se guardan en la tabla `clients`, campo `todo_tasks` (array de strings)

---

## 🗑️ PRÓXIMO PASO: LIMPIEZA DE CÓDIGO

Basándose en este diagrama completo, se pueden identificar y eliminar:

1. ✅ **Rutas no usadas** (ya eliminadas)
2. **Componentes no usados:**
   - Buscar componentes que no aparecen en ningún screen
   - Eliminar modales obsoletos
   - Limpiar componentes duplicados
   
3. **Hooks no utilizados:**
   - Identificar hooks en `hooks/` que no se importan
   - Eliminar hooks obsoletos
   
4. **APIs no llamadas:**
   - Verificar endpoints en `app/api/` que no se usan
   - Eliminar endpoints obsoletos
   
5. **Archivos de configuración obsoletos:**
   - Limpiar archivos de test no usados
   - Eliminar configuraciones duplicadas

**Método de identificación:**
- Los logs `🧩 COMPONENT:` ayudan a identificar qué se usa realmente
- Usar grep para buscar imports de cada componente
- Si un componente no se importa en ningún lado → candidato para eliminación

---

## 📈 MÉTRICAS Y LOGS ACTUALES

**Logs importantes:**
- `🧩 COMPONENT: MobileApp` - App principal cargada
- `👥 ClientsScreen: Clientes cargados` - Clientes obtenidos del backend
- `👤 ClientsScreen: Abriendo modal del cliente` - Modal de detalle abierto
- `👤 ClientsScreen: Detalles del cliente cargados` - Detalles completos obtenidos
- `✅ Storage ya inicializado para coach` - Storage de Bunny inicializado
- `Auth state change: SIGNED_IN` - Usuario autenticado
- `User found in session` - Sesión activa

**Estos logs ayudan a:**
1. Debugging en tiempo real
2. Identificar qué componentes se están usando
3. Tracking de flujo de navegación
4. Detección de errores

---

## ✅ CORRECCIONES IMPLEMENTADAS

### **1. Eliminación de sección "Debug Info"**
- **Archivo:** `components/mobile/clients-screen.tsx`
- **Cambio:** Eliminada sección de debug que mostraba JSON raw del cliente

### **2. Creación de endpoint para To-Do tasks**
- **Archivo:** `app/api/coach/clients/[id]/todo/route.ts`
- **Métodos:** GET, POST, DELETE
- **Funcionalidad:** Gestión de tareas del cliente (máximo 4)

### **3. Corrección de video en productos**
- **Archivo:** `components/client/activities/client-product-modal.tsx`
- **Cambio:** Cambiado de `<video>` tag a `UniversalVideoPlayer`
- **Motivo:** Soporte para archivos HLS (`.m3u8`) de Bunny CDN
- **Mejoras:**
  - Autoplay al abrir
  - Botón de mute/unmute
  - Click para pausar/reproducir
  - Botón de replay al terminar
  - NO se cierra al finalizar el video

### **4. Instalación de HLS.js**
- **Comando:** `npm install hls.js`
- **Propósito:** Soporte para streaming HLS en navegadores que no lo soportan nativamente
- **Uso:** En `UniversalVideoPlayer` para detectar y reproducir archivos `.m3u8`

---

## 📌 NOTAS IMPORTANTES

1. **No hay tab de "Search"** - La navegación tiene 4 tabs, no 5
2. **Video de portada** - Viene de `activity_media`, NO de `ejercicios_detalles`
3. **To-Do tasks** - Máximo 4 tareas por cliente, almacenadas en campo `todo_tasks`
4. **Rutas restringidas** - Solo `/` permitido, todo lo demás eliminado
5. **HLS support** - Requerido para videos de Bunny CDN (formato `.m3u8`)

