# 🤝 Comunidad (Community Screen)

Espacio de interacción social entre clientes y coaches, permitiendo compartir logros y contenido.

## 📐 Esquema de la Pantalla

### [FEED_HEADER] - Creación de Contenido
- **Input de Publicación**: Caja de texto con opción de adjuntar imagen/video.
- **Acción**: Botón "Publicar".

### [SOCIAL_FEED] - Muro de Publicaciones
- **Contenedor**: scroll vertical infinito.
- **Post Card**:
  - Avatar y nombre del autor.
  - Timestamp (hace X min).
  - Texto del post.
  - Imagen/Video adjunto.
  - Acciones: Like (Corazón) y Comentario (Burbuja).

---

## 📊 Datos y Tablas

### Sección: Publicaciones
- **Tabla**: `community_posts`
  - Variables: `content`, `media_url`, `author_id`, `created_at`.
- **Tabla**: `user_profiles` (Vía JOIN)
  - Variables: `full_name`, `avatar_url`.

### Sección: Interacciones
- **Tabla**: `community_likes`
  - Variables: `post_id`, `user_id`.
- **Tabla**: `community_comments`
  - Variables: `post_id`, `content`, `author_id`.

---

## 🧩 Componentes Reutilizables

- **`PostCard`**: Componente central del feed, diseñado para ser fluido y permitir visualización de media.
- **`MediaUploader`**: El mismo sistema de carga de imágenes usado en el perfil y creación de productos.
