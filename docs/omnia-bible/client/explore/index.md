# 🔍 Explorar (Search / Marketplace Screen)

Ventana para descubrir nuevos productos, coaches y servicios disponibles en la plataforma.

## 📐 Esquema de la Pantalla

### [SEARCH_HEADER] - Buscador y Filtros
- **Barra de Búsqueda (Search)**: Input con lupa para búsqueda por texto (título o coach).
- **Selector de Categoría**: Chips horizontales (Todos, Fitness, Nutrición, Mental).
- **Botón Filtros (Filter)**: Acceso a filtros avanzados (Precio, Duración, Rating).

### [CONTENT_SECTIONS] - Secciones de Descubrimiento
- **`Coaches Destacados`**: Carrusel horizontal de **Coach Cards**.
- **`Nuevas Actividades`**: Lista o grid de **Activity Cards**.
- **`Categorías Populares`**: Cards visuales por tipo de modalidad.

### [ITEM_DETAILS] - Cards de Producto
- **Activity Card (ActivityCard/SearchActivityCard)**:
  - Imagen representativa (envolvente).
  - Título y nombre del Coach.
  - Precio o tag de "Suscripción".
  - Rating (Estrellas).
  - Badge de modalidad (Taller/Programa).

---

## 📊 Datos y Tablas

### Sección: Resultados de Búsqueda
- **Tabla**: `activities`
  - Variables: `title`, `description`, `price`, `type`, `modality`, `rating`, `image_url`.
  - Filtro: `status = 'published'`.
- **Tabla**: `user_profiles` (de los Coaches)
  - Variables: `full_name` (del coach), `avatar_url`, `specialty`.

### Sección: Interacción
- **Lógica de Compra**: Inicia el flujo hacia `/checkout` y genera una preferencia en Mercado Pago.

---

## 🧩 Componentes Reutilizables

- **`ActivityCard`**: Se utiliza en el Home/Explorar y en las listas de búsqueda. A diferencia de `PurchasedActivityCard`, esta muestra precio e información de venta.
- **`CoachCard`**: Tarjeta estandarizada para mostrar el perfil resumido de un coach, usada en el buscador y el carrusel de destacados.
- **`SearchBar`**: Componente de búsqueda global consistente en toda la app.
