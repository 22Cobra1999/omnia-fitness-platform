# 🏋️ Omnia - Plataforma de Coaching Deportivo

## 🚀 Descripción

Omnia es una plataforma completa para coaches deportivos que permite crear, gestionar y vender programas de fitness y nutrición. Incluye funcionalidades avanzadas de verificación de redes sociales y gestión de certificaciones.

## ✨ Características Principales

### 🎯 **Gestión de Productos**
- ✅ Creación de programas de fitness y nutrición
- ✅ Subida de archivos CSV con ejercicios/recetas
- ✅ Gestión de imágenes y videos de portada
- ✅ Categorización por tipo (Programa, Taller, Documento) y categoría (Fitness, Nutrición)
- ✅ Vista previa profesional de productos

### 👥 **Perfil de Coach**
- ✅ Dashboard con estadísticas (ingresos, clientes, productos, publicaciones)
- ✅ Sistema de calificaciones y reseñas
- ✅ Gestión de especialidades y experiencia
- ✅ Modal de edición de perfil completo

### 🔗 **Verificación de Redes Sociales**
- ✅ **Instagram OAuth 2.0**: Conexión oficial con Instagram
- ✅ **WhatsApp**: Verificación por código SMS
- ✅ **LinkedIn**: Verificación por código en perfil
- ✅ Interfaz profesional con modales dedicados

### 📜 **Gestión de Certificaciones**
- ✅ Subida de certificaciones en PDF
- ✅ Validación de archivos y metadatos
- ✅ Almacenamiento seguro en Supabase Storage
- ✅ Vista previa y gestión de certificaciones

### 🛒 **Experiencia de Cliente**
- ✅ Catálogo de productos con filtros
- ✅ Modal expandido con información detallada
- ✅ Reproducción automática de videos
- ✅ Sistema de "swipe to buy"
- ✅ Información completa del coach

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Base de Datos**: PostgreSQL (Supabase)
- **Storage**: Supabase Storage
- **Autenticación**: Supabase Auth
- **Animaciones**: Framer Motion
- **Iconos**: Lucide React

## 🚀 Instalación y Configuración

### 1. **Clonar el Repositorio**
```bash
git clone <repository-url>
cd omnia
```

### 2. **Instalar Dependencias**
```bash
npm install
```

### 3. **Configurar Variables de Entorno**
Copia el archivo `env.example` como `.env.local` y configura las variables:

```bash
cp env.example .env.local
```

### 4. **Configurar Supabase**
- Crea un proyecto en [Supabase](https://supabase.com)
- Configura las variables de entorno con tus credenciales
- Ejecuta los scripts SQL para crear las tablas

### 5. **Ejecutar el Proyecto**
```bash
npm run dev
```

## 🔧 Configuración de APIs

### 📸 **Instagram OAuth 2.0**

1. **Crear App en Facebook Developers**
   - Ve a [Facebook Developers](https://developers.facebook.com/)
   - Crea una nueva aplicación
   - Agrega el producto "Instagram Basic Display"

2. **Configurar Variables**
```env
INSTAGRAM_CLIENT_ID=tu_client_id
INSTAGRAM_CLIENT_SECRET=tu_client_secret
INSTAGRAM_REDIRECT_URI=https://tu-dominio.com/api/coach/instagram-callback
```

3. **URLs de Redirección**
```
https://tu-dominio.com/api/coach/instagram-callback
http://localhost:3000/api/coach/instagram-callback (desarrollo)
```

### 📱 **WhatsApp (Futuro)**
```env
TWILIO_ACCOUNT_SID=tu_twilio_sid
TWILIO_AUTH_TOKEN=tu_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 💼 **LinkedIn (Futuro)**
```env
LINKEDIN_CLIENT_ID=tu_linkedin_client_id
LINKEDIN_CLIENT_SECRET=tu_linkedin_client_secret
LINKEDIN_REDIRECT_URI=https://tu-dominio.com/api/coach/linkedin-callback
```

## 🗄️ Estructura de Base de Datos

### **Tablas Principales**
- `activities`: Productos de coaches
- `coaches`: Perfiles de coaches
- `user_profiles`: Perfiles de usuarios
- `fitness_exercises`: Ejercicios de programas
- `activity_media`: Media de productos

### **Tablas de Verificación**
- `whatsapp_verifications`: Códigos de WhatsApp
- `linkedin_verifications`: Códigos de LinkedIn
- `coach_certifications`: Certificaciones PDF

### **Campos de Redes Sociales**
- `instagram_username`, `instagram_verified`, `instagram_connected_at`
- `whatsapp_verified`, `whatsapp_verified_at`
- `linkedin_url`, `linkedin_verified`, `linkedin_verified_at`

## 📁 Estructura del Proyecto

```
omnia/
├── app/
│   ├── api/
│   │   ├── coach/
│   │   │   ├── connect-instagram/
│   │   │   ├── verify-whatsapp/
│   │   │   ├── connect-linkedin/
│   │   │   └── upload-certification/
│   │   └── auth/
│   │       └── instagram/
│   │           └── callback/
│   ├── products/
│   └── mobile/
├── components/
│   ├── mobile/
│   │   ├── coach-profile-screen.tsx
│   │   ├── social-verification-modal.tsx
│   │   └── certification-upload-modal.tsx
│   ├── create-product-modal.tsx
│   └── client-product-modal.tsx
├── contexts/
│   └── auth-context.tsx
├── types/
│   └── activity.ts
└── db/
    └── database_social_verification_tables.sql
```

## 🔄 Flujos de Usuario

### **1. Conexión de Instagram**
```
Coach → Modal Profesional → Instagram OAuth → Callback → Perfil Actualizado
```

### **2. Verificación de WhatsApp**
```
Coach → Modal → Enviar Código → Recibir SMS → Verificar → Perfil Actualizado
```

### **3. Verificación de LinkedIn**
```
Coach → Modal → Generar Código → Agregar a Perfil → Verificar → Perfil Actualizado
```

### **4. Subida de Certificaciones**
```
Coach → Modal → Seleccionar PDF → Validar → Subir → Perfil Actualizado
```

## 🎨 Interfaz de Usuario

### **Diseño Responsivo**
- ✅ Mobile-first design
- ✅ Componentes reutilizables
- ✅ Animaciones suaves
- ✅ Feedback visual inmediato

### **Modales Profesionales**
- ✅ Instagram: Gradientes oficiales
- ✅ WhatsApp: Diseño limpio
- ✅ LinkedIn: Colores corporativos
- ✅ Certificaciones: Interfaz intuitiva

### **Estados Visuales**
- ✅ Conectado (checkmark verde)
- ✅ Conectando (spinner)
- ✅ Error (mensaje claro)
- ✅ Redirigiendo (feedback)

## 🔒 Seguridad

### **OAuth 2.0**
- ✅ Flujo de autorización estándar
- ✅ Verificación de estado
- ✅ Tokens temporales
- ✅ Redirección segura

### **Validaciones**
- ✅ Verificación de usuario autenticado
- ✅ Validación de archivos PDF
- ✅ Límites de tamaño
- ✅ Tipos de archivo permitidos

### **Base de Datos**
- ✅ RLS (Row Level Security)
- ✅ Políticas de acceso
- ✅ Limpieza automática
- ✅ Timestamps de auditoría

## 🚀 Funcionalidades Avanzadas

### **Modo Simulado**
- Para desarrollo sin configuración real
- Simula todos los flujos
- Logs detallados
- Fallbacks seguros

### **Manejo de Errores**
- Variables de entorno faltantes
- Errores de red
- Errores de autorización
- Errores de base de datos

### **Performance**
- Caching de coaches
- Debouncing en búsquedas
- Lazy loading de componentes
- Optimización de imágenes

## 📊 Métricas y Analytics

### **Estadísticas de Coach**
- Total de ingresos
- Número de clientes
- Productos publicados
- Publicaciones en comunidad

### **Verificaciones**
- Estado de redes sociales
- Certificaciones subidas
- Fechas de verificación
- Historial de conexiones

## 🔧 Desarrollo

### **Scripts Disponibles**
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linting
```

### **Logs de Debug**
- 🔍 Instagram OAuth - Auth check
- ✅ Instagram OAuth - Coach verified
- 🔍 Instagram OAuth - Environment check
- ✅ Instagram OAuth - Auth URL generated

## 🚀 Próximos Pasos

### **Mejoras Inmediatas**
1. **Refresh Tokens**: Renovación automática de Instagram
2. **Webhooks**: Actualizaciones en tiempo real
3. **Analytics**: Métricas detalladas
4. **Bulk Import**: Conectar múltiples cuentas

### **Integración Avanzada**
1. **Instagram Stories**: Mostrar contenido
2. **Instagram Posts**: Sincronización
3. **Instagram Insights**: Métricas
4. **Instagram Live**: Integración en vivo

### **Nuevas Funcionalidades**
1. **Pagos**: Integración con Stripe
2. **Notificaciones**: Push notifications
3. **Chat**: Sistema de mensajería
4. **Calendario**: Programación de sesiones

## 📞 Soporte

Para problemas específicos:
1. Revisar logs en consola del navegador
2. Verificar logs del servidor
3. Comprobar configuración en Facebook Developers
4. Verificar variables de entorno

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**Desarrollado con ❤️ para la comunidad de coaches deportivos**
