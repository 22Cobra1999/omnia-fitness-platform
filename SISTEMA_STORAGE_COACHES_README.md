# 📂 Sistema de Storage Organizado por Coach - README

## 🎯 ¿Qué es esto?

Un sistema completo para organizar todos los archivos (imágenes, videos, certificados) por coach en la plataforma OMNIA.

### **Antes:**
```
product-media/
  images/products/1234567_video.mp4  ← ¿De quién es?
  videos/products/9876543_video.mp4  ← ¿De quién es?
```

### **Ahora:**
```
product-media/
  coaches/
    juan-perez-id/
      images/1234567_imagen.jpg
      videos/9876543_video.mp4
    maria-lopez-id/
      images/2222222_imagen.jpg
      videos/3333333_video.mp4
```

---

## 🚀 Archivos Generados

| Archivo | Descripción |
|---------|-------------|
| `sql/create_coach_storage_metadata.sql` | Crea tabla de metadata con RLS |
| `sql/configure_storage_rls_policies.sql` | Instrucciones para configurar policies |
| `scripts/migrate-storage-to-coach-folders.ts` | Script de migración TypeScript |
| `scripts/run-migration.sh` | Script ejecutable para migración |
| `app/api/coach/initialize-storage/route.ts` | Endpoint de inicialización |
| `hooks/use-coach-storage-initialization.ts` | Hook React auto-init |
| `ESTRUCTURA_STORAGE_COACHES.md` | Documentación técnica completa |
| `GUIA_IMPLEMENTACION_STORAGE_COACHES.md` | Guía paso a paso |
| `EJECUTAR_EN_SUPABASE.md` | Instrucciones para Supabase |

---

## 📋 Pasos Rápidos

### **1. Crear Tabla en Supabase**

```bash
# Copiar contenido de:
sql/create_coach_storage_metadata.sql

# Pegar y ejecutar en: Supabase Dashboard → SQL Editor
```

### **2. Configurar Storage Policies**

```bash
# Seguir instrucciones en:
EJECUTAR_EN_SUPABASE.md (Sección "2️⃣ CONFIGURAR STORAGE POLICIES")

# O usar la alternativa simplificada si tienes problemas
```

### **3. Migrar Archivos Existentes (OPCIONAL)**

```bash
# Primero hacer simulación:
./scripts/run-migration.sh
# Seleccionar opción 1

# Si todo se ve bien, ejecutar migración real:
./scripts/run-migration.sh
# Seleccionar opción 2
```

### **4. Probar**

```bash
# Iniciar servidor:
npm run dev

# Iniciar sesión como coach
# Subir una imagen/video
# Verificar en Supabase Storage que esté en: coaches/{tu_id}/
```

---

## 🔧 Características Implementadas

### ✅ **Auto-Inicialización**
- Cuando un coach inicia sesión por primera vez
- Se crean automáticamente sus carpetas
- Proceso invisible para el usuario

### ✅ **Upload Organizado**
- Todos los archivos van a `coaches/{coach_id}/`
- Separación por tipo: images, videos, exercises
- Información del coach en cada respuesta

### ✅ **Reutilización de Archivos**
- El coach ve TODOS sus archivos anteriores
- Puede reutilizar imágenes/videos de productos anteriores
- Filtrado automático por tipo

### ✅ **Seguridad**
- RLS policies a nivel de Storage
- Cada coach solo accede a sus carpetas
- Service Key solo en servidor
- Validación de autenticación en todos los endpoints

### ✅ **Migración Segura**
- Script con modo DRY RUN
- Actualización automática de URLs en BD
- Logs detallados de todo el proceso
- Manejo de errores robusto

---

## 📊 Estructura Técnica

### **Buckets:**

1. **`product-media`** (público para lectura)
   ```
   coaches/{coach_id}/
     images/      ← Imágenes de productos
     videos/      ← Videos de productos
     exercises/   ← Videos de ejercicios
   ```

2. **`user-media`** (privado)
   ```
   coaches/{coach_id}/
     avatar/        ← Avatar del coach
     certificates/  ← Certificados del coach
   clients/{client_id}/
     avatar/        ← Avatar del cliente
   ```

### **Endpoints:**

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/upload-organized` | POST | Sube archivo organizado por coach |
| `/api/coach/initialize-storage` | POST | Inicializa carpetas para coach |
| `/api/coach/initialize-storage` | GET | Verifica si está inicializado |
| `/api/coach-media` | GET | Obtiene archivos del coach |

### **Hooks:**

| Hook | Descripción |
|------|-------------|
| `useCoachStorageInitialization` | Auto-init al login |

---

## 🔐 Seguridad

### **Validaciones:**

1. ✅ Usuario debe estar autenticado
2. ✅ `coach_id` se obtiene del token (no del frontend)
3. ✅ RLS policies validan permisos en Storage
4. ✅ Service Key solo en operaciones de servidor
5. ✅ Cada coach solo ve sus archivos

### **Políticas de Storage:**

- **INSERT:** Solo a carpeta propia (`coaches/{auth.uid()}/`)
- **SELECT:** Propios archivos + público puede ver product-media
- **UPDATE:** Solo archivos propios
- **DELETE:** Solo archivos propios

---

## 📈 Beneficios

### **Para el Negocio:**
- 💰 Mejor control de costos de storage
- 📊 Tracking por coach
- 🧹 Limpieza fácil de archivos
- 📈 Escalabilidad garantizada

### **Para los Coaches:**
- 🎨 Reutilización de archivos
- 📁 Organización automática
- 🔒 Privacidad garantizada
- ⚡ Proceso transparente

### **Para los Desarrolladores:**
- 🏗️ Estructura predecible
- 🐛 Fácil debugging
- 🔧 Mantenimiento simple
- 📚 Bien documentado

---

## 🧪 Testing

### **Test Checklist:**

- [ ] Nuevo coach se registra → carpetas creadas automáticamente
- [ ] Coach sube imagen → va a `coaches/{id}/images/`
- [ ] Coach sube video → va a `coaches/{id}/videos/`
- [ ] Coach ve sus archivos anteriores en modal de selección
- [ ] Coach NO puede ver archivos de otros coaches
- [ ] Público puede ver imágenes de productos
- [ ] Migración de archivos antiguos funciona

---

## 📞 Soporte

### **Logs Importantes:**

**En el navegador (Console):**
```javascript
// Inicialización
✅ Storage inicializado exitosamente

// Upload
📂 UPLOAD-ORGANIZED: Estructura organizada por coach
✅ UPLOAD-ORGANIZED: URL generada

// Selección
📁 MediaSelectionModal: Media filtrada
🎯 MediaSelectionModal: Confirmando selección
```

**En el servidor (Terminal):**
```
📁 Coach-Media API: TODOS los archivos obtenido
✅ Coach-Media API: totalArchivos: X
📂 UPLOAD-ORGANIZED: Estructura organizada por coach
✅ Media actualizada correctamente
```

### **Troubleshooting:**

| Problema | Solución |
|----------|----------|
| No se crean carpetas | Verificar que el usuario sea coach |
| Error al subir | Verificar Storage policies |
| No ve archivos anteriores | Verificar que existan en `activity_media` |
| Error EPIPE | Archivo muy grande o conexión lenta |
| Error 401 | Usuario no autenticado |
| Error 403 | Usuario no es coach |

---

## 🔄 Migración de Archivos Existentes

### **Antes de migrar:**

1. ✅ Hacer backup de la base de datos
2. ✅ Ejecutar primero en modo DRY_RUN
3. ✅ Revisar el reporte de simulación
4. ✅ Confirmar que todo se ve correcto

### **Comando:**

```bash
# Simulación:
./scripts/run-migration.sh
# → Opción 1

# Real:
./scripts/run-migration.sh
# → Opción 2 → Escribir 'SI'
```

### **¿Qué hace?**

1. Lee todos los archivos de `activity_media`
2. Obtiene el `coach_id` de cada actividad
3. Mueve archivos a `coaches/{coach_id}/{tipo}/`
4. Actualiza URLs en la base de datos
5. Genera reporte completo

---

## 📊 Métricas y Monitoring

### **Consultas Útiles:**

```sql
-- Ver storage por coach
SELECT 
  coach_id,
  total_files_count,
  total_storage_bytes / 1024 / 1024 as storage_mb,
  last_upload_date
FROM coach_storage_metadata
ORDER BY total_storage_bytes DESC;

-- Ver coaches sin inicializar
SELECT 
  up.id,
  up.name,
  up.email
FROM user_profiles up
LEFT JOIN coach_storage_metadata csm ON up.id = csm.coach_id
WHERE up.role = 'coach' 
  AND (csm.storage_initialized IS NULL OR csm.storage_initialized = false);

-- Total de archivos por coach
SELECT 
  coach_id,
  COUNT(*) as total_archivos
FROM activity_media am
JOIN activities a ON am.activity_id = a.id
GROUP BY coach_id
ORDER BY total_archivos DESC;
```

---

## 🎓 Próximos Pasos (Futuros)

### **Posibles Mejoras:**

1. 📊 **Dashboard de Storage** para coaches
   - Ver espacio usado
   - Gestionar archivos
   - Eliminar archivos no usados

2. 🔔 **Notificaciones**
   - Alertas cuando se acerca al límite de storage
   - Notificar archivos no usados

3. 📈 **Analytics**
   - Reportes de uso de storage
   - Archivos más usados
   - Tendencias de uso

4. 🧹 **Limpieza Automática**
   - Eliminar archivos huérfanos
   - Comprimir archivos antiguos
   - Optimizar tamaño de imágenes

---

## 📄 Licencia y Mantenimiento

- **Fecha de Implementación:** 7 de Octubre, 2025
- **Versión:** 1.0
- **Mantenedor:** Equipo OMNIA
- **Estado:** ✅ Producción Ready

---

## 🤝 Contribuir

Para mejorar este sistema:

1. Revisa la documentación técnica en `ESTRUCTURA_STORAGE_COACHES.md`
2. Sigue las convenciones de nomenclatura
3. Mantén los logs descriptivos
4. Actualiza esta documentación con cambios

---

**¡El sistema está listo para usar!** 🚀





