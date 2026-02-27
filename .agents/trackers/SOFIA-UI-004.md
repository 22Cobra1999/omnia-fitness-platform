# Detalle de Tarea: TASK-004

## 🎯 Objetivo
Hacer que todos los controles de la sección de productos (Intensidad, Modalidad, Modo de Taller) roten automáticamente y que el sistema se pause al interactuar manualmente, reiniciándose solo al hacer scroll fuera y volver a entrar.

## 🛠 Cambios Realizados

### 1. Sistema de Pausa Dinámica
- Se implementó el estado `isAutoPlaying`.
- Al hacer click en cualquier filtro o botón de interacción, `isAutoPlaying` se pone en `false`, deteniendo el `setInterval`.

### 2. Reinicio por Scroll (Intersection Observer)
- Se añadió un observador de intersección en la sección principal.
- Si el usuario ha pausado el sistema manualmente, al hacer scroll hacia abajo (saliendo de la sección) y volver a subir, el sistema detecta la visibilidad y pone `isAutoPlaying` de nuevo en `true`.

### 3. Rotación Multidimensión
- El ciclo automático ahora no solo cambia el tipo y categoría de producto, sino que también alterna:
    - **Intensidad:** Rota entre Básico, Intermedio y Avanzado.
    - **Modalidad:** Rota entre Online, Híbrido y Presencial.
    - **Modo Taller:** Rota entre Grupal y 1:1.

## 🚀 Resultado
Una experiencia de usuario "manos libres" que muestra todas las capacidades de la plataforma automáticamente, pero que respeta la voluntad del usuario si decide explorar algo específico, retomando su curso natural tras la navegación.
