# 🎥 Gestión de Videos (Bunny.net)

Omnia utiliza Bunny.net para el almacenamiento y streaming de videos de alta calidad.

## 📡 Flujo de Subida
El proceso se maneja a través de `/api/bunny/upload-video`.

1.  **Frontend**: El coach selecciona un video y dispara el upload.
2.  **Detección de Duplicados**: El sistema busca en `ejercicios_detalles` si ya existe un video con el mismo `video_file_name` para evitar resubidas innecesarias.
3.  **API Bunny**: 
    *   Si no es duplicado, se sube a Bunny Stream mediante `bunnyClient`.
    *   Bunny genera un `videoId`, `libraryId` y URLs de streaming/thumbnail.
4.  **Vinculación**: Se actualiza el registro correspondiente (`ejercicios_detalles` o `activity_media`) con los metadatos de Bunny.

## 📊 Tablas y Campos
*   `bunny_video_id`: ID oficial en Bunny.
*   `bunny_library_id`: ID de la librería de Bunny.
*   `video_url`: URL del playlist (.m3u8) para streaming.
*   `video_thumbnail_url`: URL de la miniatura.
*   `video_file_name`: Nombre original del archivo para tracking.

> [!IMPORTANT]
> Nunca se eliminan videos físicamente de Bunny a menos que se confirme que ningún otro ejercicio o actividad lo está utilizando (`video-cleanup` logic).
