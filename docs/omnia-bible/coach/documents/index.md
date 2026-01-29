# 📄 Gestión de Documentos

Los productos de tipo `document` permiten una estructura jerárquica de temas y archivos PDF.

## 📡 Flujo de Creación
Se gestiona dentro del POST/PUT de la pestaña **Products** (`/api/products`).

1.  **Actividad**: Se crea la entrada principal en `activities` con `type = 'document'`.
2.  **Media**: El PDF principal (si existe) se guarda en `activity_media`.
3.  **Temas (Topics)**: 
    *   Cada tema se inserta en la tabla `document_topics`.
    *   Cada tema puede tener su propio `pdf_url` y `description`.

## 📊 Estructura de Datos
*   **Tabla `document_topics`**:
    *   `activity_id`: Referencia a la actividad.
    *   `title`: Título del tema.
    *   `description`: Explicación del contenido.
    *   `pdf_url`: Link al archivo en storage.

---
> [!TIP]
> Al consultar un documento desde el cliente, se cargan todos los `document_topics` ordenados por fecha de creación para mantener la secuencia de lectura.
