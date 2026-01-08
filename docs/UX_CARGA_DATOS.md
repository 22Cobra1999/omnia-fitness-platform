# UX - Uso y carga de datos (Products)

## Objetivo
Reducir latencia percibida y evitar consultas redundantes cuando el coach navega dentro de **Products** (Productos / Ejercicios-Platos / Almacenamiento) y cuando abre/cierra **Ver detalles**.

## Principios
1. **Mantener datos en memoria mientras el usuario está en la tab Products**
2. **Dedupe**: si ya se consultó hace poco, no volver a pedir lo mismo
3. **Stale-While-Revalidate**: mostrar lo último disponible y refrescar en background solo cuando sea necesario
4. **Invalidación explícita**: solo forzar refresh cuando el coach efectivamente cambia algo (crear/editar/eliminar/pausar)

---

## Flujo recomendado dentro de Products

### 1) Primera entrada a Products
- Se carga:
  - lista de productos (`/api/products`)
  - (si aplica) datos auxiliares (consultas del coach, etc.)

### 2) Navegación entre sub-tabs (Productos / Ejercicios-Platos / Almacenamiento)
- **No volver a consultar** por defecto.
- Se conserva estado y datos en memoria.

Implementación aplicada:
- Los paneles principales no se desmontan al cambiar `activeMainTab` (solo se ocultan con CSS).
  - Evita que componentes internos vuelvan a ejecutar efectos de carga.

### 3) “Ver detalles” de un producto
- Abrir el modal debe ser instantáneo usando los datos ya disponibles.
- Las consultas “pesadas” dentro del modal se cachean por `productId` con TTL.

Implementación aplicada:
- `client-product-modal.tsx`:
  - Cache TTL (5 min) para:
    - Temas/Horarios de talleres: `GET /api/taller-detalles?actividad_id=<id>`
    - Stats de planificación: `GET /api/get-product-planning?actividad_id=<id>`

Resultado esperado:
- Si el coach abre/cierra el modal y vuelve a abrir el mismo producto durante ~5 min:
  - **no** se vuelve a pedir la misma info.

---

## Cuándo refrescar (invalidación)

### Eventos que deben invalidar/forzar refresh
- Crear producto
- Editar producto
- Eliminar producto
- Cambiar estado de pausa
- Cambiar horarios/fechas (taller)

Regla:
- Si ocurrió un cambio real, refrescar lista (`/api/products`) y, opcionalmente, limpiar caches relacionadas.

### Eventos que NO deben refrescar
- Cambiar sub-tab dentro de Products
- Abrir/cerrar “Ver detalles” sin editar
- Volver atrás dentro de Products

---

## Alcance del cache (lifecycle)

### Mientras estás en Products
- Mantener caches en memoria y reutilizarlas.

### Cuando salís de Products (ej: vas a Calendar)
- Está OK dejar que la memoria se libere.
- Si querés ser más agresivo con memoria:
  - limpiar caches al salir de Products.

---

## TTL sugeridos
- Temas/Horarios taller: **5 min**
- Planning stats: **5 min**
- Lista de productos: **depende UX**
  - recomendado: usar revalidación por evento (create/edit/delete/pause) más que por tiempo.

---

## Notas de implementación
- En una evolución futura conviene centralizar esto con:
  - **SWR** o **React Query**
  - claves por recurso + `staleTime`/`cacheTime`/`invalidateQueries`
  - cache compartido entre pantallas y modales
