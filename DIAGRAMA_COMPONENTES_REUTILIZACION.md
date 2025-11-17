# 🔄 DIAGRAMA DE REUTILIZACIÓN DE COMPONENTES

## 📊 Tabla de Componentes por Rol

Este diagrama muestra qué componentes, scripts y código usa cada rol (Cliente y Coach) para identificar reutilización y duplicación.

---

## 📋 **TABLA PRINCIPAL DE COMPONENTES**

| **Componente/Script** | **Tipo** | **Nombre** | **Cliente** | **Coach** | **Compartido** | **Notas** |
|------------------------|----------|------------|-------------|-----------|----------------|-----------|
| **📱 PANTALLAS PRINCIPALES** | | | | | | |
| Screen | Componente | `SearchScreen` | ✅ Buscar productos | ❌ | ❌ | Solo cliente |
| Screen | Componente | `ActivityScreen` | ✅ Mis actividades | ❌ | ❌ | Solo cliente |
| Screen | Componente | `CommunityScreen` | ✅ Feed social | ✅ Feed social | ✅ | **COMPARTIDO** |
| Screen | Componente | `CalendarScreen` | ✅ Calendario personal | ❌ | ❌ | Solo cliente |
| Screen | Componente | `ProfileScreen` | ✅ Perfil personal | ✅ Perfil coach | ✅ | **COMPARTIDO** |
| Screen | Componente | `ClientsScreen` | ❌ | ✅ Gestión clientes | ❌ | Solo coach |
| Screen | Componente | `ProductsManagementScreen` | ❌ | ✅ Gestión productos | ❌ | Solo coach |
| Screen | Componente | `TodayScreen` | ✅ Ejercicios del día | ❌ | ❌ | Solo cliente |
| **🔧 MODALES** | | | | | | |
| Modal | Componente | `ClientProductModal` | ✅ Preview producto | ✅ Preview producto | ✅ | **COMPARTIDO** |
| Modal | Componente | `ClientDetailModal` | ❌ | ✅ Detalle cliente | ❌ | Solo coach |
| Modal | Componente | `CreateProductModal` | ❌ | ✅ Crear producto | ❌ | Solo coach |
| Modal | Componente | `ProfileEditModal` | ✅ Editar perfil | ✅ Editar perfil | ✅ | **COMPARTIDO** |
| Modal | Componente | `BiometricsModal` | ✅ Biométricas | ✅ Ver biométricas | ✅ | **COMPARTIDO** |
| Modal | Componente | `InjuriesModal` | ✅ Lesiones | ✅ Ver lesiones | ✅ | **COMPARTIDO** |
| Modal | Componente | `ObjectivesModal` | ✅ Objetivos | ✅ Ver objetivos | ✅ | **COMPARTIDO** |
| **🎬 MULTIMEDIA** | | | | | | |
| Player | Componente | `UniversalVideoPlayer` | ✅ Ver videos | ✅ Ver videos | ✅ | **COMPARTIDO** |
| Upload | Componente | `MediaUploader` | ✅ Subir archivos | ✅ Subir archivos | ✅ | **COMPARTIDO** |
| Preview | Componente | `ImagePreview` | ✅ Preview imágenes | ✅ Preview imágenes | ✅ | **COMPARTIDO** |
| **📊 CARDS Y LISTAS** | | | | | | |
| Card | Componente | `ActivityCard` | ✅ Lista productos | ✅ Lista productos | ✅ | **COMPARTIDO** |
| Card | Componente | `ProductPreviewCard` | ✅ Preview rápido | ✅ Preview rápido | ✅ | **COMPARTIDO** |
| Card | Componente | `ClientCard` | ❌ | ✅ Lista clientes | ❌ | Solo coach |
| Card | Componente | `CoachCard` | ✅ Lista coaches | ❌ | ❌ | Solo cliente |
| **🧭 NAVEGACIÓN** | | | | | | |
| Nav | Componente | `BottomNavigation` | ✅ Nav cliente | ✅ Nav coach | ❌ | Diferentes tabs |
| Nav | Componente | `TopNavigation` | ✅ Header | ✅ Header | ✅ | **COMPARTIDO** |
| **🔧 HOOKS PERSONALIZADOS** | | | | | | |
| Hook | Script | `useAuth` | ✅ Autenticación | ✅ Autenticación | ✅ | **COMPARTIDO** |
| Hook | Script | `useProductCreation` | ❌ | ✅ Crear productos | ❌ | Solo coach |
| Hook | Script | `useProductMedia` | ❌ | ✅ Multimedia | ❌ | Solo coach |
| Hook | Script | `useProductPlanning` | ❌ | ✅ Planificación | ❌ | Solo coach |
| Hook | Script | `useClientData` | ❌ | ✅ Datos cliente | ❌ | Solo coach |
| Hook | Script | `useActivityData` | ✅ Datos actividad | ❌ | ❌ | Solo cliente |
| Hook | Script | `useVideoPlayer` | ✅ Reproductor | ✅ Reproductor | ✅ | **COMPARTIDO** |
| Hook | Script | `useFileUpload` | ✅ Upload archivos | ✅ Upload archivos | ✅ | **COMPARTIDO** |
| **🌐 APIs Y ENDPOINTS** | | | | | | |
| API | Script | `GET /api/products` | ✅ Listar productos | ✅ Listar productos | ✅ | **COMPARTIDO** |
| API | Script | `POST /api/products` | ❌ | ✅ Crear producto | ❌ | Solo coach |
| API | Script | `PUT /api/products/[id]` | ❌ | ✅ Editar producto | ❌ | Solo coach |
| API | Script | `DELETE /api/products/[id]` | ❌ | ✅ Eliminar producto | ❌ | Solo coach |
| API | Script | `GET /api/clients` | ❌ | ✅ Listar clientes | ❌ | Solo coach |
| API | Script | `GET /api/clients/[id]` | ❌ | ✅ Detalle cliente | ❌ | Solo coach |
| API | Script | `POST /api/clients/[id]/todo` | ❌ | ✅ Tareas cliente | ❌ | Solo coach |
| API | Script | `GET /api/activities` | ✅ Mis actividades | ❌ | ❌ | Solo cliente |
| API | Script | `POST /api/enrollments/direct` | ✅ Comprar producto | ❌ | ❌ | Solo cliente |
| API | Script | `GET /api/coaches` | ✅ Listar coaches | ❌ | ❌ | Solo cliente |
| API | Script | `GET /api/coaches/[id]` | ✅ Perfil coach | ✅ Perfil coach | ✅ | **COMPARTIDO** |
| API | Script | `GET /api/taller-detalles` | ❌ | ✅ Datos de taller | ❌ | Solo coach |
| API | Script | `POST /api/taller-detalles` | ❌ | ✅ Crear tema taller | ❌ | Solo coach |
| API | Script | `PUT /api/taller-detalles` | ❌ | ✅ Actualizar tema taller | ❌ | Solo coach |
| API | Script | `DELETE /api/taller-detalles` | ❌ | ✅ Eliminar tema taller | ❌ | Solo coach |
| **🗄️ UTILIDADES** | | | | | | |
| Util | Script | `formatPrice` | ✅ Formatear precio | ✅ Formatear precio | ✅ | **COMPARTIDO** |
| Util | Script | `formatDate` | ✅ Formatear fecha | ✅ Formatear fecha | ✅ | **COMPARTIDO** |
| Util | Script | `validateEmail` | ✅ Validar email | ✅ Validar email | ✅ | **COMPARTIDO** |
| Util | Script | `uploadToSupabase` | ✅ Upload archivos | ✅ Upload archivos | ✅ | **COMPARTIDO** |
| Util | Script | `getVideoUrl` | ✅ URL videos | ✅ URL videos | ✅ | **COMPARTIDO** |
| **🎨 COMPONENTES UI** | | | | | | |
| UI | Componente | `Button` | ✅ Botones | ✅ Botones | ✅ | **COMPARTIDO** |
| UI | Componente | `Input` | ✅ Inputs | ✅ Inputs | ✅ | **COMPARTIDO** |
| UI | Componente | `Modal` | ✅ Modales | ✅ Modales | ✅ | **COMPARTIDO** |
| UI | Componente | `Card` | ✅ Cards | ✅ Cards | ✅ | **COMPARTIDO** |
| UI | Componente | `Loading` | ✅ Loading | ✅ Loading | ✅ | **COMPARTIDO** |
| UI | Componente | `Toast` | ✅ Notificaciones | ✅ Notificaciones | ✅ | **COMPARTIDO** |
| **📱 LAYOUTS** | | | | | | |
| Layout | Componente | `MobileLayout` | ✅ Layout móvil | ✅ Layout móvil | ✅ | **COMPARTIDO** |
| Layout | Componente | `AuthLayout` | ✅ Layout auth | ✅ Layout auth | ✅ | **COMPARTIDO** |
| Layout | Componente | `DashboardLayout` | ✅ Layout dashboard | ✅ Layout dashboard | ✅ | **COMPARTIDO** |

---

## 📊 **ANÁLISIS DE REUTILIZACIÓN**

### **🟢 COMPONENTES COMPARTIDOS (Alta Reutilización):**
- **`ClientProductModal`** - Modal de preview de producto
- **`UniversalVideoPlayer`** - Reproductor de video
- **`ActivityCard`** - Card de producto
- **`ProfileScreen`** - Pantalla de perfil
- **`CommunityScreen`** - Feed social
- **`useAuth`** - Hook de autenticación
- **`formatPrice`** - Utilidad de formateo
- **Componentes UI básicos** - Button, Input, Modal, etc.

### **🟡 COMPONENTES PARCIALMENTE COMPARTIDOS:**
- **`BottomNavigation`** - Diferentes tabs por rol
- **`ProfileEditModal`** - Campos diferentes por rol
- **`BiometricsModal`** - Vista diferente por rol

### **🔴 COMPONENTES ESPECÍFICOS (Sin Reutilización):**
- **Cliente:** `SearchScreen`, `ActivityScreen`, `TodayScreen`
- **Coach:** `ClientsScreen`, `ProductsManagementScreen`, `CreateProductModal`
- **Hooks específicos:** `useProductCreation`, `useClientData`, `useActivityData`

---

## 🎯 **RECOMENDACIONES DE OPTIMIZACIÓN**

### **1. Componentes a Consolidar:**
- **`ProfileEditModal`** → Crear variantes por rol
- **`BiometricsModal`** → Crear variantes por rol
- **`BottomNavigation`** → Crear variantes por rol

### **2. Hooks a Crear:**
- **`useRoleBasedData`** - Hook genérico para datos por rol
- **`useModalState`** - Hook genérico para estado de modales
- **`useFormValidation`** - Hook genérico para validaciones

### **3. APIs a Optimizar:**
- **`GET /api/products`** - Agregar filtros por rol
- **`GET /api/coaches/[id]`** - Agregar campos por rol
- **`POST /api/enrollments/direct`** - Solo cliente

### **4. Componentes a Eliminar:**
- **Duplicados** en `components/client/` y `components/coach/`
- **Hooks obsoletos** no utilizados
- **APIs no utilizadas** o duplicadas

---

## 📈 **MÉTRICAS DE REUTILIZACIÓN**

| **Categoría** | **Total** | **Compartidos** | **% Reutilización** |
|---------------|-----------|-----------------|-------------------|
| **Pantallas** | 8 | 3 | 37.5% |
| **Modales** | 7 | 5 | 71.4% |
| **Hooks** | 7 | 3 | 42.9% |
| **APIs** | 16 | 4 | 25.0% |
| **Utilidades** | 5 | 5 | 100% |
| **UI Components** | 6 | 6 | 100% |
| **TOTAL** | **49** | **26** | **53.1%** |

---

## 🔧 **PLAN DE REFACTORING**

### **Fase 1: Consolidación de Componentes Compartidos**
1. Mover componentes compartidos a `components/shared/`
2. Crear variantes por rol donde sea necesario
3. Eliminar duplicados

### **Fase 2: Optimización de Hooks**
1. Crear hooks genéricos reutilizables
2. Consolidar lógica común
3. Eliminar hooks obsoletos

### **Fase 3: Optimización de APIs**
1. Agregar filtros por rol en endpoints compartidos
2. Consolidar endpoints similares
3. Eliminar APIs no utilizadas

### **Fase 4: Limpieza Final**
1. Eliminar archivos no utilizados
2. Optimizar imports
3. Actualizar documentación

---

## 📝 **NOTAS TÉCNICAS**

### **Componentes con Mayor Potencial de Reutilización:**
- **`ClientProductModal`** - Usado por ambos roles
- **`UniversalVideoPlayer`** - Reproductor universal
- **`ActivityCard`** - Card de producto universal
- **`formatPrice`** - Utilidad universal

### **Componentes que Requieren Refactoring:**
- **`BottomNavigation`** - Crear variantes por rol
- **`ProfileEditModal`** - Campos dinámicos por rol
- **`BiometricsModal`** - Vista adaptativa por rol

### **APIs que Requieren Optimización:**
- **`GET /api/products`** - Agregar filtros por rol
- **`GET /api/coaches/[id]`** - Campos adaptativos
- **`POST /api/enrollments/direct`** - Solo cliente

---

**Última actualización:** $(date)
**Versión:** 1.0
**Autor:** Sistema de Análisis de Componentes
