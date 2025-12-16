# 🗺️ Guía de Diagramas de Omnia

Esta guía centraliza **todos los diagramas funcionales y técnicos** del proyecto y los organiza por:

- **Sección funcional** (Navegación, Productos, Datos, etc.).
- **Nivel de detalle** (alto nivel → detalle técnico).

> Nota: Algunos diagramas viven en la raíz del repo por compatibilidad histórica. Desde esta guía tenés links directos a todos.

---

## 1️⃣ Diagramas de Navegación y UX

- **Alto nivel**
  - `DIAGRAMA_NAVEGACION_COACH.md`  
    - Flujo completo de navegación para **cliente** y **coach**.
    - Tabs, modales, relación entre pantallas principales.

- **Reutilización de componentes**
  - `DIAGRAMA_COMPONENTES_REUTILIZACION.md`  
    - Tabla de qué componentes se usan por rol.
    - Identificación de componentes **compartidos** vs **específicos**.

---

## 2️⃣ Diagramas de Productos, Contenido y Planificación

- **Flujo de creación y edición de productos**
  - Sección **“TAB: PRODUCTS”** dentro de `DIAGRAMA_NAVEGACION_COACH.md`.
  - Explica los **6 pasos** de `CreateProductModal`:
    - Tipo de producto, categoría, información básica, contenido (ejercicios/platos), planificación, publicación.

- **Flujo de compras y modificaciones (X/Z vs X.2/Z.2)**
  - `docs/diagramas/FLUJO_COMPRAS_Y_MODIFICACIONES_ACTIVIDADES.md`  
    - Diagrama específico para:
      - Cómo se manejan **ejercicios/platos originales** vs **nuevas versiones**.
      - Cómo se generan filas de **progreso_cliente** al empezar una actividad.
      - Por qué se marca `active=false` en `nutrition_program_details` / `ejercicios_detalles` en lugar de borrar.
      - Cuándo se pueden limpiar definitivamente:
        - Filas de `nutrition_program_details` / `ejercicios_detalles`.
        - Filas de `planificacion_ejercicios`.
      - Cómo se respetan los límites del plan del coach contando **solo elementos activos**.

---

## 3️⃣ Diagramas de Arquitectura de Datos y Rendimiento

- **Arquitectura de datos y procesos web**
  - `docs/ARQUITECTURA_DATOS_Y_PROCESOS.md`  
    - Capas de caché (CDN, Redis, memoria, BD).
    - Jerarquía y prioridad de datos.
    - Estrategias de caché, debouncing, throttling, request deduplication.
    - Tabla “Dónde guardar cada tipo de dato”.

- **Planes y límites del coach**
  - Sección **“SISTEMA DE PLANES Y SUSCRIPCIÓN”** en `DIAGRAMA_NAVEGACION_COACH.md`.  
  - Relacionado con:
    - Límite de **productos**, **semanas**, **ejercicios/platos únicos** por producto.
    - Esta guía se complementa con el flujo de X/Z vs X.2/Z.2 descrito en  
      `FLUJO_COMPRAS_Y_MODIFICACIONES_ACTIVIDADES.md`.

---

## 4️⃣ Cómo usar estos diagramas según la tarea

- **Quiero entender la experiencia completa del coach o cliente**
  - Empezar por: `DIAGRAMA_NAVEGACION_COACH.md`.

- **Quiero ver qué componentes puedo reutilizar o limpiar**
  - Ir a: `DIAGRAMA_COMPONENTES_REUTILIZACION.md`.

- **Quiero modificar la lógica de productos, platos/ejercicios o planificación**
  - Leer:
    - Sección de productos en `DIAGRAMA_NAVEGACION_COACH.md`.
    - Luego: `FLUJO_COMPRAS_Y_MODIFICACIONES_ACTIVIDADES.md`.

- **Quiero optimizar rendimiento, caché o dónde guardar datos**
  - Ir a: `docs/ARQUITECTURA_DATOS_Y_PROCESOS.md`.

---

## 5️⃣ Próximos diagramas sugeridos

Para mantener todo organizado, futuros diagramas deberían agregarse en esta carpeta y linkearse acá, por ejemplo:

- `FLUJO_PAGOS_MERCADOPAGO.md` – flujo de checkout y callbacks.
- `FLUJO_PROGRESO_CLIENTE.md` – detalle de cómo se generan y actualizan filas de progreso.
- `FLUJO_LIMPIEZA_HISTORICA.md` – detalle operativo de scripts de limpieza (cuando estén implementados).


















