# 👤 Perfil del Coach

Documentación sobre la gestión de datos maestros del coach.

## 📡 Flujo de Consulta
El perfil se carga al iniciar la sesión y se mantiene en el `AuthContext`.

*   **Datos Básicos**: Nombre, biografía, especialidades y redes sociales.
*   **Media**: Foto de perfil (Avatar) y galería.
*   **Configuración**: Preferencias de notificaciones y ajustes de cuenta.

## 🔑 Tablas Clave
*   `profiles`: Tabla central de usuarios (coaches y clientes).
*   `coaches_details` (si aplica): Para información extendida específica de la profesión.

---
> [!IMPORTANT]
> Los cambios en el perfil suelen requerir una actualización del cache del cliente para reflejarse inmediatamente en toda la plataforma.
