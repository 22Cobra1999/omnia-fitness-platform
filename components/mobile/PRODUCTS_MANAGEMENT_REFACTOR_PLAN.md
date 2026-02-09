# 📋 Plan de Refactorización: Products Management Screen

## 🎯 Objetivo
Transformar el archivo monolítico `products-management-screen.tsx` (2,351 líneas) en una estructura modular, escalable y fácil de mantener, siguiendo el patrón de **Separación de Responsabilidades** (Data/Logic vs. UI).

## 🏗️ Nueva Estructura Sugerida

La nueva carpeta `components/mobile/ProductsManagement/` tendrá la siguiente estructura:

```text
ProductsManagement/
├── index.tsx                 # Punto de entrada (UI Assembly)
├── hooks/
│   ├── useProductsLogic.ts   # El "Cerebro": Fetching, Filtros, CRUD
│   └── useConsultations.ts   # Lógica específica de Consultas/Meet
├── components/
│   ├── Header/               # Logo, Título, Acciones principales
│   ├── Tabs/                 # Selector de Productos / Ventas / Consultas
│   ├── Products/             # Lista y Cards de productos
│   ├── Sales/                # Historial de ventas y métricas
│   ├── Consultations/        # Configuración de Meet/Consultas
│   └── Modals/               # Modals de edición, creación y Meet
├── utils.ts                  # Formateadores, colores, tipos
└── types.ts                  # Definiciones de TypeScript
```

## 🛠️ Pasos de la Refactorización

### 1. Extracción de Tipos y Utilidades
*   Mover las interfaces `Product`, `SortField`, etc., a `types.ts`.
*   Mover funciones puras como `getTypeColor`, `getCategoryLabel`, `getValidImageUrl` a `utils.ts`.

### 2. Creación del Hook `useProductsLogic`
*   Migrar los estados `products`, `sales`, `loading`.
*   Migrar los efectos de carga inicial y listeners de Supabase.
*   Implementar la lógica de filtrado y búsqueda.

### 3. Creación del Hook `useConsultations` (Opcional o Integrado)
*   Manejar la lógica de `toggleConsultation` y `updateConsultationPrice`.

### 4. Modularización de la UI
*   **`ProductCard`**: Extraerlo para que sea reutilizable.
*   **`ConsultationSection`**: Convertirlo en un componente limpio.
*   **`SalesList`**: Extraer el renderizado de ventas.

### 5. Ensamblaje Final
*   Actualizar `index.tsx` para que actúe como un coordinador delgado.
*   Reemplazar la referencia en `app-mobile.tsx`.

## 📦 Beneficios Esperados
*   **Mantenibilidad**: Archivos de < 300 líneas.
*   **Performance**: Memoización selectiva de componentes pesados como la lista de ventas.
*   **Testeo**: Lógica pura testeable sin necesidad de montar el DOM.
