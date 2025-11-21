# 🗑️ ANÁLISIS DE ELIMINACIÓN ADICIONAL - OMNIA

## 📊 Resumen de lo ya eliminado
- ✅ ~100+ archivos de componentes y hooks eliminados
- ✅ 10 carpetas vacías eliminadas
- ✅ Servidor funcionando correctamente (200 OK)

---

## 🎯 CATEGORÍAS ADICIONALES PARA ELIMINAR

### 1. 📄 ARCHIVOS SQL EN LA RAÍZ (Prioridad ALTA)

Estos archivos SQL están en la raíz y probablemente son temporales o de migración:

| Archivo | Razón | Prioridad |
|---------|-------|-----------|
| `create-planificacion-platos.sql` | Migración temporal | **ALTA** |
| `create-progreso-cliente-nutricion.sql` | Migración temporal | **ALTA** |
| `DELETE_STORAGE_USAGE.sql` | Script de limpieza temporal | **ALTA** |
| `EJECUTAR_ESTE_SQL.sql` | Script temporal | **ALTA** |
| `EJECUTAR_MIGRACION_STORAGE.sql` | Migración temporal | **ALTA** |
| `INSERT_PLAN_COACH.sql` | Script de prueba | **ALTA** |
| `QUERIES_DEBUG_STORAGE.sql` | Debug temporal | **ALTA** |
| `update-nutrition-program-details.sql` | Migración temporal | **ALTA** |

**Total: 8 archivos SQL**

---

### 2. 📁 ARCHIVOS DE TEST Y EJEMPLOS (Prioridad ALTA)

| Archivo | Razón | Prioridad |
|---------|-------|-----------|
| `ejercicios_ejemplo.csv` | Archivo de ejemplo | **ALTA** |
| `test-nutrition-complete.csv` | Archivo de test | **ALTA** |
| `test-nutrition-data.csv` | Archivo de test | **ALTA** |
| `test-nutrition-simple.csv` | Archivo de test | **ALTA** |
| `test-nutrition.csv` | Archivo de test | **ALTA** |
| `test-media/nutrition-test.mp4` | Video de test | **ALTA** |
| `test-media/nutrition-test.png` | Imagen de test | **ALTA** |

**Total: 7 archivos de test**

---

### 3. 🌐 APIs NO USADAS (Prioridad MEDIA/BAJA)

#### **APIs de Debug (Prioridad ALTA - Eliminar)**
| API | Ubicación | Razón |
|-----|-----------|-------|
| `GET /api/debug-activity-category` | `app/api/debug-activity-category/route.ts` | Solo debug |
| `GET /api/debug-migration` | `app/api/debug-migration/route.ts` | Solo debug |
| `GET /api/debug-nutrition-data` | `app/api/debug-nutrition-data/route.ts` | Solo debug |
| `GET /api/debug-progreso` | `app/api/debug-progreso/route.ts` | Solo debug |
| `GET /api/debug-simple-query` | `app/api/debug-simple-query/route.ts` | Solo debug |
| `GET /api/debug-stats` | `app/api/debug-stats/route.ts` | Solo debug |
| `GET /api/debug-today-nutrition` | `app/api/debug-today-nutrition/route.ts` | Solo debug |
| `GET /api/verify-db` | `app/api/verify-db/route.ts` | Solo verificación |
| `GET /api/verify-migration` | `app/api/verify-migration/route.ts` | Solo verificación |
| `GET /api/test-media` | `app/api/test-media/route.ts` | Solo test |

**Total: 10 APIs de debug**

#### **APIs de Admin/Migración (Prioridad BAJA - Mantener si se usan internamente)**
| API | Ubicación | Razón |
|-----|-----------|-------|
| `POST /api/admin/run-migration-file-name` | `app/api/admin/run-migration-file-name/route.ts` | Admin interno |
| `POST /api/run-migration-file-name` | `app/api/run-migration-file-name/route.ts` | Migración |
| `POST /api/create-nutrition-planning-table` | `app/api/create-nutrition-planning-table/route.ts` | Migración |
| `POST /api/create-nutrition-progress-table` | `app/api/create-nutrition-progress-table/route.ts` | Migración |
| `POST /api/migrate-nutrition-planning` | `app/api/migrate-nutrition-planning/route.ts` | Migración |

**Total: 5 APIs de migración**

#### **APIs de Bunny (Prioridad MEDIA - Verificar uso)**
| API | Ubicación | Razón |
|-----|-----------|-------|
| `POST /api/bunny/batch-migrate` | `app/api/bunny/batch-migrate/route.ts` | Migración Bunny |
| `POST /api/bunny/migrate-video` | `app/api/bunny/migrate-video/route.ts` | Migración Bunny |
| `GET /api/bunny/migration-stats` | `app/api/bunny/migration-stats/route.ts` | Stats migración |
| `POST /api/bunny/upload-video` | `app/api/bunny/upload-video/route.ts` | **USADO** - Mantener |

**Total: 3 APIs de migración Bunny (1 se usa)**

#### **APIs de Google (Prioridad MEDIA - No mencionadas en diagramas)**
| API | Ubicación | Razón |
|-----|-----------|-------|
| `POST /api/google/calendar/create-meeting` | `app/api/google/calendar/create-meeting/route.ts` | No mencionada |
| `POST /api/google/calendar/sync-event` | `app/api/google/calendar/sync-event/route.ts` | No mencionada |
| `POST /api/google/meet/sync-attendance` | `app/api/google/meet/sync-attendance/route.ts` | No mencionada |
| `POST /api/google/meet/sync-window` | `app/api/google/meet/sync-window/route.ts` | No mencionada |
| `GET /api/google/oauth/callback` | `app/api/google/oauth/callback/route.ts` | No mencionada |

**Total: 5 APIs de Google**

#### **APIs de Meetings (Prioridad MEDIA - No mencionadas en diagramas)**
| API | Ubicación | Razón |
|-----|-----------|-------|
| `POST /api/meetings/join` | `app/api/meetings/join/route.ts` | No mencionada |
| `POST /api/meetings/leave` | `app/api/meetings/leave/route.ts` | No mencionada |
| `GET /api/meetings/notes` | `app/api/meetings/notes/route.ts` | No mencionada |
| `GET /api/meetings/status` | `app/api/meetings/status/route.ts` | No mencionada |
| `GET /api/meetings/summary` | `app/api/meetings/summary/route.ts` | No mencionada |

**Total: 5 APIs de Meetings**

#### **APIs de Messages (Prioridad MEDIA - No mencionadas en diagramas)**
| API | Ubicación | Razón |
|-----|-----------|-------|
| `GET /api/messages/[id]` | `app/api/messages/[id]/route.ts` | No mencionada |
| `GET /api/messages/conversations` | `app/api/messages/conversations/route.ts` | No mencionada |

**Total: 2 APIs de Messages**

#### **APIs No Usadas (Prioridad MEDIA)**
| API | Ubicación | Razón |
|-----|-----------|-------|
| `GET /api/activities/[id]/first-day` | `app/api/activities/[id]/first-day/route.ts` | No mencionada |
| `GET /api/activities/[id]/stats` | `app/api/activities/[id]/stats/route.ts` | No mencionada |
| `POST /api/activities/exercises/bulk` | `app/api/activities/exercises/bulk/route.ts` | No mencionada |
| `POST /api/activities/initialize-nutrition-progress` | `app/api/activities/initialize-nutrition-progress/route.ts` | No mencionada |
| `GET /api/activities/nutrition-today` | `app/api/activities/nutrition-today/route.ts` | No mencionada |
| `GET /api/activity-exercises/[id]` | `app/api/activity-exercises/[id]/route.ts` | No mencionada |
| `POST /api/activity-exercises/bulk` | `app/api/activity-exercises/bulk/route.ts` | No mencionada |
| `GET /api/activity-nutrition/[id]` | `app/api/activity-nutrition/[id]/route.ts` | No mencionada |
| `POST /api/activity-nutrition/bulk` | `app/api/activity-nutrition/bulk/route.ts` | No mencionada |
| `POST /api/coach/consultations` | `app/api/coach/consultations/route.ts` | No mencionada |
| `GET /api/coach/stats-simple` | `app/api/coach/stats-simple/route.ts` | No mencionada |
| `GET /api/coach/storage-files` | `app/api/coach/storage-files/route.ts` | No mencionada |
| `POST /api/coach/sync-storage` | `app/api/coach/sync-storage/route.ts` | No mencionada |
| `POST /api/coach/initialize-storage` | `app/api/coach/initialize-storage/route.ts` | No mencionada |
| `GET /api/coach/plan-limits` | `app/api/coach/plan-limits/route.ts` | No mencionada |
| `POST /api/coach/plan/renew` | `app/api/coach/plan/renew/route.ts` | Cron job - **MANTENER** |
| `GET /api/coach-media` | `app/api/coach-media/route.ts` | No mencionada |
| `POST /api/delete-activity-final` | `app/api/delete-activity-final/route.ts` | No mencionada |
| `GET /api/ejecuciones-ejercicio` | `app/api/ejecuciones-ejercicio/route.ts` | No mencionada |
| `GET /api/existing-exercises` | `app/api/existing-exercises/route.ts` | No mencionada |
| `GET /api/executions/day` | `app/api/executions/day/route.ts` | No mencionada |
| `GET /api/fix-missing-exercise` | `app/api/fix-missing-exercise/route.ts` | Fix temporal |
| `GET /api/product-completion` | `app/api/product-completion/route.ts` | No mencionada |
| `GET /api/product-stats/[id]` | `app/api/product-stats/[id]/route.ts` | No mencionada |
| `POST /api/products/[id]/pause` | `app/api/products/[id]/pause/route.ts` | No mencionada |
| `GET /api/profile/biometrics` | `app/api/profile/biometrics/route.ts` | No mencionada |
| `GET /api/profile/combined` | `app/api/profile/combined/route.ts` | No mencionada |
| `GET /api/profile/exercise-progress` | `app/api/profile/exercise-progress/route.ts` | No mencionada |
| `GET /api/profile/goals` | `app/api/profile/goals/route.ts` | No mencionada |
| `GET /api/profile/injuries` | `app/api/profile/injuries/route.ts` | No mencionada |
| `POST /api/save-exercise-videos` | `app/api/save-exercise-videos/route.ts` | No mencionada |
| `GET /api/search-coaches` | `app/api/search-coaches/route.ts` | No mencionada |
| `POST /api/update-exercise-activo-flag` | `app/api/update-exercise-activo-flag/route.ts` | No mencionada |
| `GET /api/update-progress-calories` | `app/api/update-progress-calories/route.ts` | No mencionada |
| `POST /api/upload-media` | `app/api/upload-media/route.ts` | No mencionada |
| `POST /api/upload-nutrition-complete` | `app/api/upload-nutrition-complete/route.ts` | No mencionada |
| `POST /api/upload-organized` | `app/api/upload-organized/route.ts` | No mencionada |
| `POST /api/workshop-reactivation` | `app/api/workshop-reactivation/route.ts` | No mencionada |

**Total: ~35 APIs no usadas**

---

### 4. 📜 SCRIPTS NO USADOS (Prioridad MEDIA)

| Script | Ubicación | Razón | Prioridad |
|--------|-----------|-------|-----------|
| `check-migration-status.js` | `scripts/check-migration-status.js` | Script de migración | **MEDIA** |
| `check-storage-files.js` | `scripts/check-storage-files.js` | Script de verificación | **MEDIA** |
| `detailed-storage-check.js` | `scripts/detailed-storage-check.js` | Script de verificación | **MEDIA** |
| `execute-migration-file-name.js` | `scripts/execute-migration-file-name.js` | Script de migración | **MEDIA** |
| `export-for-figma.js` | `scripts/export-for-figma.js` | Script de exportación | **BAJA** |
| `populate-storage-usage.js` | `scripts/populate-storage-usage.js` | Script de población | **MEDIA** |
| `run-migration.js` | `scripts/run-migration.js` | Script de migración | **MEDIA** |
| `update-file-names.js` | `scripts/update-file-names.js` | Script de actualización | **MEDIA** |
| `verificar-storage.js` | `scripts/verificar-storage.js` | Script de verificación | **MEDIA** |
| `verify-storage-completeness.js` | `scripts/verify-storage-completeness.js` | Script de verificación | **MEDIA** |

**Total: 10 scripts**

---

### 5. 📚 DOCUMENTACIÓN OBSOLETA/DUPLICADA (Prioridad BAJA)

| Archivo | Razón | Prioridad |
|---------|-------|-----------|
| `CORRECCION_COMPLETADA.md` | Documentación temporal | **BAJA** |
| `ESTRATEGIA_NEGOCIO.md` | Documentación de negocio | **BAJA** |
| `FILTRO_TALLERES_FINALIZADOS.md` | Documentación específica | **BAJA** |
| `LOGICA_FINALIZACION_PRODUCTOS.md` | Documentación específica | **BAJA** |
| `PLANES_ALMACENAMIENTO.md` | Documentación específica | **BAJA** |
| `POLITICAS_REEMBOLSO_TALLERES.md` | Documentación específica | **BAJA** |
| `SETUP_BUNNY.md` | Documentación de setup | **BAJA** |
| `SISTEMA_PLANES_IMPLEMENTADO.md` | Documentación temporal | **BAJA** |
| `SOLUCION_DETALLE_PRODUCTO.md` | Documentación temporal | **BAJA** |
| `SOLUCION_OBJETIVOS_CARDS.md` | Documentación temporal | **BAJA** |

**Total: 10 archivos de documentación**

---

### 6. 🖼️ IMÁGENES PLACEHOLDER DUPLICADAS (Prioridad MEDIA)

| Archivo | Razón | Prioridad |
|---------|-------|-----------|
| `public/placeholder-1qe7z.png` | Placeholder duplicado | **MEDIA** |
| `public/placeholder-akuc0.png` | Placeholder duplicado | **MEDIA** |
| `public/placeholder-gei0f.png` | Placeholder duplicado | **MEDIA** |
| `public/placeholder-o37ij.png` | Placeholder duplicado | **MEDIA** |
| `public/placeholder-logo.png` | Placeholder duplicado | **MEDIA** |
| `public/placeholder-logo.svg` | Placeholder duplicado | **MEDIA** |

**Nota:** Mantener `placeholder.jpg`, `placeholder.svg`, `placeholder-user.jpg` que son los principales.

**Total: 6 imágenes placeholder duplicadas**

---

### 7. 🎨 LOGOS DUPLICADOS (Prioridad BAJA)

| Archivo | Razón | Prioridad |
|---------|-------|-----------|
| `public/omnia-logo-3d-bubbly.svg` | Variante de logo | **BAJA** |
| `public/omnia-logo-3d.png` | Variante de logo | **BAJA** |
| `public/omnia-logo-3d.svg` | Variante de logo | **BAJA** |
| `public/omnia-logo-bubble-gummy.svg` | Variante de logo | **BAJA** |
| `public/omnia-logo-bubbly-exact.svg` | Variante de logo | **BAJA** |
| `public/omnia-logo-original.svg` | Variante de logo | **BAJA** |

**Nota:** Verificar cuál logo se usa realmente y mantener solo ese.

**Total: 6 logos duplicados**

---

### 8. 📱 PÁGINAS ADMIN NO USADAS (Prioridad MEDIA)

Según el diagrama, las rutas `/admin/*` no están permitidas:

| Página | Ubicación | Razón | Prioridad |
|--------|-----------|-------|-----------|
| `app/admin/coach-setup/page.tsx` | `app/admin/coach-setup/` | Ruta no permitida | **MEDIA** |
| `app/admin/setup/page.tsx` | `app/admin/setup/` | Ruta no permitida | **MEDIA** |
| `app/admin/storage-admin/page.tsx` | `app/admin/storage-admin/` | Ruta no permitida | **MEDIA** |
| `app/admin/storage-setup/page.tsx` | `app/admin/storage-setup/` | Ruta no permitida | **MEDIA** |
| `app/admin/update-schema/page.tsx` | `app/admin/update-schema/` | Ruta no permitida | **MEDIA** |
| `app/admin/vimeo-setup/page.tsx` | `app/admin/vimeo-setup/` | Ruta no permitida | **MEDIA** |

**Total: 6 páginas admin**

---

### 9. 🧩 COMPONENTES ADMIN NO USADOS (Prioridad MEDIA)

| Componente | Ubicación | Razón | Prioridad |
|------------|-----------|-------|-----------|
| `components/admin/bunny-migration-dashboard.tsx` | `components/admin/` | Solo admin | **MEDIA** |
| `components/admin/database-setup.tsx` | `components/admin/` | Solo admin | **MEDIA** |
| `components/admin/run-vimeo-migration.tsx` | `components/admin/` | Solo admin | **MEDIA** |

**Total: 3 componentes admin**

---

### 10. 📄 ARCHIVOS DE ACCIONES NO USADOS (Prioridad MEDIA)

| Archivo | Ubicación | Razón | Prioridad |
|---------|-----------|-------|-----------|
| `app/actions/db-actions.ts` | `app/actions/` | Verificar uso | **MEDIA** |
| `app/actions/ensure-client-record.ts` | `app/actions/` | Verificar uso | **MEDIA** |
| `app/actions/force-insert-enrollment.ts` | `app/actions/` | Verificar uso | **MEDIA** |
| `app/actions/process-activity-purchase.ts` | `app/actions/` | Verificar uso | **MEDIA** |
| `app/actions/purchase-activity.ts` | `app/actions/` | Verificar uso | **MEDIA** |
| `app/actions/setup-db.ts` | `app/actions/` | Verificar uso | **MEDIA** |
| `app/actions/start-activity.ts` | `app/actions/` | Verificar uso | **MEDIA** |

**Total: 7 archivos de acciones**

---

### 11. 🗄️ ARCHIVOS SQL EN DB/ (Prioridad BAJA - Mantener)

Los archivos en `db/migrations/`, `db/queries/`, `db/functions/`, `db/triggers/` son parte del esquema de base de datos y **NO deben eliminarse** a menos que se verifique que no se usan.

---

## 📊 RESUMEN POR PRIORIDAD

### 🔴 **PRIORIDAD ALTA - Eliminar inmediatamente**

1. **Archivos SQL en raíz:** 8 archivos
2. **Archivos de test:** 7 archivos
3. **APIs de debug:** 10 APIs
4. **Imágenes placeholder duplicadas:** 6 archivos

**Total Prioridad ALTA: ~31 archivos**

---

### 🟡 **PRIORIDAD MEDIA - Revisar antes de eliminar**

1. **APIs no usadas:** ~35 APIs
2. **Scripts de migración:** 10 scripts
3. **Páginas admin:** 6 páginas
4. **Componentes admin:** 3 componentes
5. **Archivos de acciones:** 7 archivos
6. **APIs de Google/Meetings/Messages:** 12 APIs

**Total Prioridad MEDIA: ~73 archivos**

---

### 🟢 **PRIORIDAD BAJA - Mantener o revisar cuidadosamente**

1. **Documentación:** 10 archivos (pueden ser útiles)
2. **Logos duplicados:** 6 archivos (verificar cuál se usa)
3. **APIs de migración/admin:** 5 APIs (pueden ser necesarias internamente)

**Total Prioridad BAJA: ~21 archivos**

---

## 🎯 ESTIMACIÓN TOTAL ADICIONAL

| Categoría | Archivos a Eliminar |
|-----------|---------------------|
| **Prioridad ALTA** | ~31 archivos |
| **Prioridad MEDIA** | ~73 archivos |
| **Prioridad BAJA** | ~21 archivos (revisar) |
| **TOTAL** | **~125 archivos adicionales** |

---

## ✅ RECOMENDACIÓN

**Eliminar primero:**
1. ✅ Archivos SQL en raíz (8 archivos)
2. ✅ Archivos de test (7 archivos)
3. ✅ APIs de debug (10 APIs)
4. ✅ Imágenes placeholder duplicadas (6 archivos)

**Luego revisar:**
- APIs no usadas (verificar con búsqueda exhaustiva)
- Scripts de migración (verificar si se usan en producción)
- Páginas admin (verificar si se acceden directamente)

---

**Última actualización:** $(date)
**Versión:** 1.0
























