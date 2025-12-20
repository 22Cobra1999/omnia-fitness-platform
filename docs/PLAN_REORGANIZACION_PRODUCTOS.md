# 📋 Plan de Reorganización: Gestión de Productos, Ejercicios/Platos y Almacenamiento

## 🎯 Objetivo

Reorganizar la gestión de ejercicios/platos desde el Paso 4 del modal de creación de productos hacia una sección dedicada en la pestaña "Products", permitiendo administración genérica y centralizada.

---

## 📊 Estructura Actual

### Ubicación Actual:
- **Ejercicios/Platos**: Paso 4 del `CreateProductModal` (dentro de cada actividad)
- **Almacenamiento**: Tab "Perfil" del coach
- **Productos**: Tab "Products" (products-management-screen.tsx)

### Componentes Actuales:
- `CSVManagerEnhanced`: Componente usado en Paso 4 para gestionar ejercicios/platos
- `storage-usage-widget.tsx`: Widget de almacenamiento en perfil
- `products-management-screen.tsx`: Pantalla principal de productos

---

## 🏗️ Estructura Propuesta

### Tab "Products" - Nueva Organización con 3 Tabs:

```
┌─────────────────────────────────────────────────────────┐
│  Tab: Products                                          │
├─────────────────────────────────────────────────────────┤
│  [Mis Productos] [Mis Ejercicios/Platos] [Almacenamiento] │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Contenido según tab activo                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📑 Tab 1: "Mis Productos" (ACTUAL - Sin Cambios)

### Funcionalidad:
- ✅ Mantener exactamente como está ahora
- Lista de productos del coach
- Filtros por tipo (fitness, nutrición, consultas, etc.)
- Ordenamiento
- Acciones: Crear, Editar, Ver, Eliminar

### Componentes:
- `products-management-screen.tsx` (modificar para agregar tabs)
- `ProductCard` (sin cambios)
- `CreateProductModal` (sin cambios)

---

## 📑 Tab 2: "Mis Ejercicios/Platos" (NUEVO)

### Objetivo:
Administración genérica de ejercicios/platos independiente de productos específicos.

### Estructura:
```
┌─────────────────────────────────────────────────────────┐
│  Mis Ejercicios/Platos                                  │
├─────────────────────────────────────────────────────────┤
│  [Fitness] [Nutrición]                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Contenido según sub-tab activo                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Sub-Tab "Fitness":
- **Componente base**: Adaptar `CSVManagerEnhanced` para trabajar sin `activityId` específico
- **Funcionalidades**:
  - ✅ Ver todos los ejercicios del coach (de `ejercicios_detalles`)
  - ✅ Subir archivo Excel/CSV con ejercicios
  - ✅ Crear ejercicios manualmente
  - ✅ Agregar ejercicios existentes desde catálogo
  - ✅ Editar ejercicios (modal inline o modal separado)
  - ✅ Eliminar/desactivar ejercicios
  - ✅ Ver dónde se usan (qué productos/actividades)
  - ✅ Contador de usos por ejercicio
  - ✅ Filtros y búsqueda
  - ✅ Asignar videos a ejercicios

### Sub-Tab "Nutrición":
- **Componente base**: Mismo `CSVManagerEnhanced` pero con `productCategory='nutricion'`
- **Funcionalidades**:
  - ✅ Ver todos los platos del coach (de `nutrition_program_details`)
  - ✅ Subir archivo Excel/CSV con platos
  - ✅ Crear platos manualmente
  - ✅ Agregar platos existentes desde catálogo
  - ✅ Editar platos (modal inline o modal separado)
  - ✅ Eliminar/desactivar platos
  - ✅ Ver dónde se usan (qué productos/actividades)
  - ✅ Contador de usos por plato
  - ✅ Filtros y búsqueda
  - ✅ Asignar videos a platos

### Características Comunes:
- **Tabla editable**: Similar a la del Paso 4
- **Columnas a mostrar**:
  - ID
  - Nombre
  - Tipo (para fitness: tipo de ejercicio, para nutrición: tipo de comida)
  - Estado (activo/inactivo)
  - Usado en (lista de productos/actividades)
  - Veces usado (contador)
  - Acciones (Editar, Eliminar, Ver detalles)

### Nuevas Funcionalidades a Implementar:

#### 1. **"Ver dónde se usan"**:
   - Query: Buscar en `planificacion_ejercicios` qué actividades usan cada ejercicio/plato
   - Mostrar lista de actividades/productos que lo usan
   - Click en actividad → abrir modal de preview o edición

#### 2. **Contador de usos**:
   - Contar cuántas veces aparece cada ejercicio/plato en todas las planificaciones
   - Mostrar en columna "Veces usado"

#### 3. **Edición genérica**:
   - Modal de edición que no requiere `activityId`
   - Guardar cambios directamente en `ejercicios_detalles` o `nutrition_program_details`
   - Actualizar todas las referencias si es necesario

### Componentes a Crear/Modificar:

#### Nuevos Componentes:
1. **`ExercisesPlatesManagementScreen.tsx`**:
   - Componente principal del Tab 2
   - Maneja sub-tabs (Fitness/Nutrición)
   - Renderiza `CSVManagerGeneric` según sub-tab

2. **`CSVManagerGeneric.tsx`**:
   - Versión genérica de `CSVManagerEnhanced`
   - No requiere `activityId` (o usa `activityId=0` para modo genérico)
   - Carga todos los ejercicios/platos del coach
   - Agrega columna "Usado en" y "Veces usado"

3. **`ExerciseUsageModal.tsx`**:
   - Modal que muestra dónde se usa un ejercicio/plato
   - Lista de actividades/productos
   - Links para abrir cada actividad

#### Componentes a Modificar:
1. **`CSVManagerEnhanced.tsx`**:
   - Hacer `activityId` opcional
   - Si `activityId` es 0 o undefined, modo "genérico"
   - En modo genérico, cargar todos los ejercicios/platos del coach
   - Agregar lógica para calcular "usado en" y "veces usado"

2. **`products-management-screen.tsx`**:
   - Agregar sistema de tabs
   - Tab 1: "Mis Productos" (actual)
   - Tab 2: "Mis Ejercicios/Platos" (nuevo)
   - Tab 3: "Almacenamiento" (nuevo)

### Endpoints API a Crear/Modificar:

#### Nuevos Endpoints:
1. **`GET /api/coach/exercises`**:
   - Obtener todos los ejercicios del coach
   - Parámetros: `category` (fitness/nutricion), `active` (true/false)
   - Retorna: Lista de ejercicios/platos con metadata de uso

2. **`GET /api/coach/exercises/:id/usage`**:
   - Obtener dónde se usa un ejercicio/plato
   - Retorna: Lista de actividades/productos que lo usan

3. **`PUT /api/coach/exercises/:id`**:
   - Actualizar ejercicio/plato genérico
   - No requiere `activityId`

4. **`DELETE /api/coach/exercises/:id`**:
   - Eliminar/desactivar ejercicio/plato genérico
   - Verificar si está en uso antes de eliminar

#### Endpoints a Modificar:
1. **`GET /api/activity-nutrition/:id`**:
   - Hacer compatible con modo genérico (si `id=0`, retornar todos)

---

## 📑 Tab 3: "Almacenamiento" (NUEVO - Movido desde Perfil)

### Objetivo:
Mover la funcionalidad de almacenamiento desde el tab "Perfil" al tab "Products".

### Funcionalidad:
- ✅ Ver resumen de almacenamiento (videos, imágenes, PDFs)
- ✅ Ver desglose por tipo de archivo
- ✅ Ver qué productos/actividades usan cada tipo
- ✅ Gestión de archivos (eliminar, optimizar)
- ✅ Alertas de límite

### Componentes:
- **Reutilizar**: `storage-usage-widget.tsx` (mover desde perfil)
- **Crear**: `StorageManagementScreen.tsx` (versión expandida del widget)

### Estructura:
```
┌─────────────────────────────────────────────────────────┐
│  Almacenamiento                                         │
├─────────────────────────────────────────────────────────┤
│  Total usado: 0.03 GB / 100 GB                         │
│  [====....................................] 0.0%        │
├─────────────────────────────────────────────────────────┤
│  📹 Videos: 0.03 GB                                     │
│  🖼️ Imágenes: 0.00 GB                                  │
│  📄 PDFs: 0.00 GB                                       │
├─────────────────────────────────────────────────────────┤
│  Usado en actividades:                                 │
│  📹 Videos: #78 (1)                                    │
│  🖼️ Imágenes: #48, #59, #78, #90 (4)                  │
│  📄 PDFs: [vacío]                                       │
└─────────────────────────────────────────────────────────┘
```

### Componentes a Mover/Crear:
1. **Mover**: `components/coach/storage-usage-widget.tsx` → `components/mobile/storage-management-screen.tsx`
2. **Expandir funcionalidad**: Agregar gestión de archivos individuales

---

## 🔄 Flujo de Trabajo Propuesto

### Antes (Actual):
```
1. Coach crea producto
2. En Paso 4, sube ejercicios/platos específicos para ese producto
3. Ejercicios/platos están "atados" a ese producto
```

### Después (Propuesto):
```
1. Coach va a Tab "Mis Ejercicios/Platos"
2. Sube/crea ejercicios/platos genéricos (biblioteca personal)
3. Al crear producto, en Paso 4 puede:
   - Agregar ejercicios/platos desde su biblioteca
   - O crear nuevos (que se agregan a la biblioteca)
```

### Ventajas:
- ✅ Reutilización de ejercicios/platos entre productos
- ✅ Administración centralizada
- ✅ Ver dónde se usa cada ejercicio/plato
- ✅ Edición genérica sin abrir productos
- ✅ Mejor organización

---

## 📝 Cambios en CreateProductModal (Paso 4)

### Modificaciones Necesarias:
1. **Paso 4 debe permitir**:
   - Agregar ejercicios/platos desde biblioteca genérica
   - Crear nuevos (que se agregan a biblioteca)
   - Ver ejercicios/platos ya asignados a este producto

2. **Componente CSVManagerEnhanced en Paso 4**:
   - Mantener funcionalidad actual
   - Agregar modo "agregar desde biblioteca"
   - Cuando se crea nuevo ejercicio/plato, guardarlo también en biblioteca genérica

---

## 🗂️ Estructura de Archivos Propuesta

```
components/
├── mobile/
│   ├── products-management-screen.tsx (MODIFICAR: agregar tabs)
│   ├── exercises-plates-management-screen.tsx (NUEVO)
│   └── storage-management-screen.tsx (NUEVO - mover desde coach/)
│
├── shared/
│   ├── csv/
│   │   ├── csv-manager-enhanced.tsx (MODIFICAR: modo genérico)
│   │   └── csv-manager-generic.tsx (NUEVO - opcional, o extender enhanced)
│   │
│   └── exercises/
│       └── exercise-usage-modal.tsx (NUEVO)
│
└── coach/
    └── storage-usage-widget.tsx (MOVER a mobile/ o reutilizar)
```

---

## 🔌 Endpoints API Propuestos

### Nuevos Endpoints:
```
GET    /api/coach/exercises
GET    /api/coach/exercises/:id
GET    /api/coach/exercises/:id/usage
POST   /api/coach/exercises
PUT    /api/coach/exercises/:id
DELETE /api/coach/exercises/:id
```

### Endpoints Existentes a Modificar:
```
GET    /api/activity-nutrition/:id (hacer id opcional o 0 para todos)
GET    /api/coach/storage-usage (ya existe, reutilizar)
GET    /api/coach/storage-files (ya existe, reutilizar)
```

---

## 📊 Base de Datos

### Sin Cambios en Schema:
- ✅ `ejercicios_detalles` ya tiene `coach_id`
- ✅ `nutrition_program_details` ya tiene `coach_id`
- ✅ `storage_usage` ya existe

### Queries Necesarias:

#### Obtener ejercicios/platos del coach:
```sql
-- Fitness
SELECT * FROM ejercicios_detalles 
WHERE coach_id = :coach_id 
AND is_active = true;

-- Nutrición
SELECT * FROM nutrition_program_details 
WHERE coach_id = :coach_id 
AND is_active = true;
```

#### Obtener dónde se usa un ejercicio/plato:
```sql
-- Buscar en planificacion_ejercicios
SELECT DISTINCT activity_id, numero_semana
FROM planificacion_ejercicios
WHERE (
  lunes::jsonb @> '[{"id": :exercise_id}]' OR
  martes::jsonb @> '[{"id": :exercise_id}]' OR
  -- ... otros días
);
```

---

## ✅ Checklist de Implementación

### Fase 1: Estructura Base
- [ ] Modificar `products-management-screen.tsx` para agregar sistema de tabs
- [ ] Crear `ExercisesPlatesManagementScreen.tsx` (componente base)
- [ ] Crear sub-tabs (Fitness/Nutrición)

### Fase 2: Gestión Genérica de Ejercicios/Platos
- [ ] Modificar `CSVManagerEnhanced` para modo genérico (sin activityId)
- [ ] Crear endpoint `GET /api/coach/exercises`
- [ ] Crear endpoint `GET /api/coach/exercises/:id/usage`
- [ ] Implementar columna "Usado en" en tabla
- [ ] Implementar columna "Veces usado" en tabla
- [ ] Crear `ExerciseUsageModal.tsx`

### Fase 3: Edición Genérica
- [ ] Crear endpoint `PUT /api/coach/exercises/:id`
- [ ] Crear endpoint `DELETE /api/coach/exercises/:id`
- [ ] Implementar edición inline o modal
- [ ] Implementar eliminación con verificación de uso

### Fase 4: Integración con Paso 4
- [ ] Modificar Paso 4 para permitir agregar desde biblioteca
- [ ] Asegurar que nuevos ejercicios/platos se guarden en biblioteca

### Fase 5: Almacenamiento
- [ ] Mover `storage-usage-widget.tsx` a `mobile/storage-management-screen.tsx`
- [ ] Integrar en Tab 3 de Products
- [ ] Expandir funcionalidad si es necesario

### Fase 6: Testing
- [ ] Probar creación de ejercicios/platos genéricos
- [ ] Probar edición genérica
- [ ] Probar ver "usado en"
- [ ] Probar integración con Paso 4
- [ ] Probar almacenamiento

---

## 🎨 Consideraciones de UX

### Navegación:
- Tabs principales claramente visibles
- Sub-tabs (Fitness/Nutrición) dentro de "Mis Ejercicios/Platos"
- Breadcrumbs o indicador de ubicación

### Feedback:
- Mensajes claros cuando se elimina ejercicio/plato en uso
- Confirmación antes de eliminar
- Indicadores de carga

### Consistencia:
- Mantener mismo estilo visual que Paso 4
- Mismas acciones (editar, eliminar, ver)
- Misma tabla con mismas columnas (más las nuevas)

---

## ❓ Preguntas Pendientes

1. **¿Los ejercicios/platos genéricos deben tener `activity_id`?**
   - Opción A: `activity_id = NULL` para genéricos
   - Opción B: `activity_id = 0` para genéricos
   - Opción C: Nueva tabla separada para biblioteca genérica

2. **¿Al eliminar ejercicio/plato genérico, qué pasa con los productos que lo usan?**
   - Opción A: No permitir eliminar si está en uso
   - Opción B: Desactivar (soft delete) y mostrar advertencia
   - Opción C: Eliminar y remover de todas las planificaciones

3. **¿En Paso 4, se pueden crear ejercicios/platos "locales" (solo para ese producto)?**
   - Opción A: Todos se guardan en biblioteca genérica
   - Opción B: Opción de "solo para este producto" vs "agregar a biblioteca"

---

## 📌 Notas Adicionales

- Mantener compatibilidad con productos existentes
- No romper funcionalidad actual del Paso 4
- Considerar migración de datos si es necesario
- Documentar cambios en API


























