# Configuración de Instagram OAuth

## 🚀 Integración Profesional con Instagram

Se ha implementado un flujo de autenticación OAuth 2.0 oficial con Instagram para conectar las cuentas de los coaches de forma segura y profesional.

## 📋 Flujo de Autenticación

### 1. **Inicio del Proceso**
- El coach hace clic en "Conectar con Instagram"
- Se abre un modal profesional con información de seguridad
- Al confirmar, se redirige a la página oficial de Instagram

### 2. **Autorización en Instagram**
- Instagram muestra la pantalla de autorización oficial
- El coach ve exactamente qué permisos se solicitan
- Solo se solicita acceso de lectura al perfil

### 3. **Callback y Verificación**
- Instagram redirige de vuelta a nuestra aplicación
- Se intercambia el código por un token de acceso
- Se obtiene la información del usuario de Instagram
- Se actualiza automáticamente el perfil del coach

## 🔧 Configuración Requerida

### 1. **Crear App en Facebook Developers**

1. Ve a [Facebook Developers](https://developers.facebook.com/)
2. Crea una nueva aplicación
3. Agrega el producto "Instagram Basic Display"
4. Configura las URLs de redirección

### 2. **Variables de Entorno**

Agrega estas variables a tu archivo `.env.local`:

```env
# Instagram OAuth Configuration
INSTAGRAM_CLIENT_ID=tu_instagram_client_id_aqui
INSTAGRAM_CLIENT_SECRET=tu_instagram_client_secret_aqui
INSTAGRAM_REDIRECT_URI=https://tu-dominio.com/api/coach/instagram-callback

# URL de la aplicación
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### 3. **URLs de Redirección en Facebook Developers**

En la configuración de tu app de Facebook, agrega estas URLs de redirección:

```
https://tu-dominio.com/api/coach/instagram-callback
http://localhost:3000/api/coach/instagram-callback (para desarrollo)
```

## 🎯 Características Implementadas

### ✅ **Seguridad**
- Autenticación OAuth 2.0 oficial
- Solo permisos de lectura
- Verificación de estado para prevenir CSRF
- Manejo seguro de tokens

### ✅ **UX Profesional**
- Modal con información de seguridad
- Indicadores visuales de confianza
- Redirección transparente
- Feedback inmediato

### ✅ **Manejo de Errores**
- Errores de autorización
- Errores de red
- Errores de configuración
- Mensajes informativos

### ✅ **Desarrollo**
- Modo simulado para desarrollo
- Logs detallados
- Manejo de variables faltantes
- Fallbacks seguros

## 🔄 Flujo Completo

### **Paso 1: Inicio**
```
Coach → Modal Profesional → Instagram OAuth
```

### **Paso 2: Autorización**
```
Instagram → Pantalla Oficial → Coach Autoriza
```

### **Paso 3: Callback**
```
Instagram → Nuestra API → Base de Datos → Perfil Actualizado
```

### **Paso 4: Confirmación**
```
Toast de Éxito → Perfil Actualizado → URL Limpia
```

## 📱 Interfaz de Usuario

### **Modal Profesional**
- 🎨 Diseño con gradientes de Instagram
- 🔒 Indicadores de seguridad
- 📋 Información clara de permisos
- ⚡ Botón de acción prominente

### **Estados Visuales**
- ✅ Conectado (checkmark verde)
- 🔄 Conectando (spinner)
- ❌ Error (mensaje claro)
- 📱 Redirigiendo (feedback)

## 🛠️ APIs Creadas

### 1. **`/api/coach/connect-instagram`**
- **POST**: Inicia el flujo OAuth
- **DELETE**: Desconecta Instagram
- Maneja configuración y validación

### 2. **`/api/coach/instagram-callback`**
- **GET**: Maneja el callback de Instagram
- Intercambia código por token
- Actualiza el perfil del coach

## 🔒 Seguridad

### **OAuth 2.0**
- Flujo de autorización estándar
- Tokens de acceso temporales
- Verificación de estado
- Redirección segura

### **Validaciones**
- Verificación de usuario autenticado
- Verificación de permisos de coach
- Validación de parámetros
- Manejo de errores

### **Base de Datos**
- Solo campos necesarios
- Timestamps de conexión
- Estado de verificación
- Limpieza automática

## 🚀 Próximos Pasos

### **Producción**
1. Configurar app en Facebook Developers
2. Agregar variables de entorno
3. Configurar URLs de redirección
4. Probar flujo completo

### **Mejoras**
1. **Refresh Tokens**: Renovación automática
2. **Webhooks**: Actualizaciones en tiempo real
3. **Analytics**: Métricas de conexión
4. **Bulk Import**: Conectar múltiples cuentas

### **Integración Avanzada**
1. **Instagram Stories**: Mostrar contenido
2. **Instagram Posts**: Sincronización
3. **Instagram Insights**: Métricas
4. **Instagram Live**: Integración en vivo

## 📝 Notas de Desarrollo

### **Modo Simulado**
- Para desarrollo sin configuración real
- Simula el flujo completo
- Usuario: `usuario_instagram_simulado`
- Logs detallados en consola

### **Logs de Debug**
```javascript
🔍 Instagram OAuth - Auth check
✅ Instagram OAuth - Coach verified
🔍 Instagram OAuth - Environment check
✅ Instagram OAuth - Auth URL generated
```

### **Manejo de Errores**
- Variables de entorno faltantes
- Errores de red
- Errores de autorización
- Errores de base de datos

## 🎨 Personalización

### **Colores de Instagram**
```css
--instagram-gradient: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
--instagram-pink: #E4405F;
--instagram-purple: #833AB4;
```

### **Iconos y Elementos**
- Logo oficial de Instagram
- Gradientes de marca
- Tipografía consistente
- Animaciones suaves

## 🔧 Troubleshooting

### **Error: "Missing environment variables"**
- Verificar variables en `.env.local`
- Reiniciar servidor de desarrollo
- Verificar nombres exactos

### **Error: "Invalid redirect URI"**
- Verificar URL en Facebook Developers
- Incluir protocolo (https://)
- Verificar dominio exacto

### **Error: "Authorization failed"**
- Verificar permisos de la app
- Verificar configuración de Instagram Basic Display
- Revisar logs de Facebook Developers

### **Error: "Token exchange failed"**
- Verificar client_secret
- Verificar que el código no haya expirado
- Revisar logs de red

## 📞 Soporte

Para problemas específicos:
1. Revisar logs en consola del navegador
2. Verificar logs del servidor
3. Comprobar configuración en Facebook Developers
4. Verificar variables de entorno
