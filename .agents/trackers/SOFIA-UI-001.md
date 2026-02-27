# Detalle de Tarea: TASK-001 & TASK-002

## 🎯 Objetivo
Corregir la desalineación de los comentarios flotantes en la tab de Comunidad y añadir un sistema de cambio automático (auto-cycle) entre las diferentes vistas de productos.

## 🛠 Cambios Realizados

### 1. Alineación de Comentarios (TASK-001)
- **Problema:** Los comentarios usaban porcentajes (`top: "30%"`) relativos a un contenedor con altura variable, lo que hacía que se desplazaran hacia abajo de forma inconsistente.
- **Solución:** Se movió el contenedor de comentarios `AnimatePresence` a un nivel superior hermano de la grilla de productos y se fijó su altura y posición absoluta para que los comentarios aparezcan siempre en las mismas coordenadas visuales (`top: fixed pixels`).

### 2. Auto-Cycle de Tabs (TASK-002)
- **Implementación:** Se añadió un `useEffect` con un `setInterval` de 5 segundos.
- **Lógica:**
    - Alterna entre **Taller -> Documento -> Programa**.
    - Al completar el ciclo de tipos, alterna entre **Fitness -> Nutrición**.
- **UX:** El ciclo se detiene si el usuario interactúa manualmente con los botones (opcional, actualmente activo por defecto).

## 🚀 Resultado
Una landing de descubrimiento mucho más dinámica y profesional, con una visualización limpia de las reseñas de los clientes.
