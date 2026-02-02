# 💬 Mensajes (Messages Screen)

Centro de comunicación directa entre clientes y sus coaches asignados.

## 📐 Esquema de la Pantalla

### [CHAT_LIST] - Bandeja de Entrada
- **Buscador de Chats**: Filtro por nombre de coach.
- **Lista de Conversaciones**:
  - Avatar del contacto.
  - Último mensaje recibido/enviado.
  - Indicador de mensajes no leídos (Punto naranja).

### [CHAT_WINDOW] - Ventana de Conversación
- **Header**: Nombre del coach y estado (Online/Offline).
- **History**: Burbujas de chat diferenciadas por color (Naranja para el usuario, Gris para el coach).
- **Input Area**: Campo de texto con botón de envío e icono de adjuntos.

---

## 📊 Datos y Tablas

### Sección: Mensajería
- **Tabla**: `messages`
  - Variables: `chat_id`, `sender_id`, `content`, `is_read`, `created_at`.
- **Tabla**: `chats`
  - Variables: `user_1_id`, `user_2_id`, `last_message_at`.

---

## 🧩 Componentes Reutilizables

- **`ChatBubble`**: Estilo estandarizado de mensajes.
- **`OnlineStatusIndicator`**: Refleja la disponibilidad en tiempo real mediante Supabase Presence o similar.
