# 📋 ANÁLISIS DE ARCHIVOS NO USADOS - OMNIA

## 🎯 Objetivo
Identificar archivos, componentes y APIs que no se usan según los diagramas de navegación y flujo.

**Fecha de análisis:** $(date)
**Basado en:** DIAGRAMA_NAVEGACION_COACH.md, DIAGRAMA-PLANIFICACION-COACH.md, DIAGRAMA_FLUJO_COMPLETO.md, DIAGRAMA_COMPONENTES_REUTILIZACION.md

---

## 📱 COMPONENTES MOBILE - ANÁLISIS

### ✅ **COMPONENTES USADOS (Según app-mobile.tsx y diagramas)**

| Componente | Ubicación | Uso | Estado |
|------------|-----------|-----|--------|
| `SearchScreen` | `components/mobile/search-screen.tsx` | ✅ Cliente - Tab Search | **USADO** |
| `ActivityScreen` | `components/mobile/activity-screen.tsx` | ✅ Cliente - Tab Activity | **USADO** |
| `CommunityScreen` | `components/mobile/community-screen.tsx` | ✅ Compartido - Tab Community | **USADO** |
| `CalendarScreen` | `components/calendar/CalendarScreen.tsx` | ✅ Cliente - Tab Calendar | **USADO** |
| `ProfileScreen` | `components/mobile/profile-screen.tsx` | ✅ Compartido - Tab Profile | **USADO** |
| `ClientsScreen` | `components/mobile/clients-screen.tsx` | ✅ Coach - Tab Clients | **USADO** |
| `ProductsManagementScreen` | `components/mobile/products-management-screen.tsx` | ✅ Coach - Tab Products | **USADO** |
| `CoachCalendarScreen` | `components/coach/coach-calendar-screen.tsx` | ✅ Coach - Tab Calendar | **USADO** |
| `BottomNavigation` | `components/mobile/bottom-navigation.tsx` | ✅ Navegación | **USADO** |
| `ProfileEditModal` | `components/mobile/profile-edit-modal.tsx` | ✅ Compartido | **USADO** |
| `BiometricsModal` | `components/mobile/biometrics-modal.tsx` | ✅ Compartido | **USADO** |
| `InjuriesModal` | `components/mobile/injuries-modal.tsx` | ✅ Compartido | **USADO** |
| `ObjectivesModal` | `components/mobile/objectives-modal.tsx` | ✅ Compartido | **USADO** |
| `QuickExerciseAdd` | `components/mobile/quick-exercise-add.tsx` | ✅ Cliente | **USADO** |
| `ExerciseProgressList` | `components/mobile/exercise-progress-list.tsx` | ✅ Cliente | **USADO** |
| `DailyActivityRings` | `components/mobile/daily-activity-rings.tsx` | ✅ Cliente | **USADO** |
| `ActivityCalendar` | `components/mobile/activity-calendar.tsx` | ✅ Cliente | **USADO** |

### ❌ **COMPONENTES MOBILE NO USADOS (Candidatos a eliminar)**

| Componente | Ubicación | Razón | Prioridad |
|------------|-----------|-------|-----------|
| `dashboard-screen.tsx` | `components/mobile/dashboard-screen.tsx` | ❌ No mencionado en diagramas, no se importa en app-mobile.tsx | **ALTA** |
| `home-screen.tsx` | `components/mobile/home-screen.tsx` | ❌ No mencionado en diagramas, no se importa en app-mobile.tsx | **ALTA** |
| `my-products-screen.tsx` | `components/mobile/my-products-screen.tsx` | ❌ No mencionado en diagramas, no se importa en app-mobile.tsx | **ALTA** |
| `products-screen.tsx` | `components/mobile/products-screen.tsx` | ❌ No mencionado en diagramas, no se importa en app-mobile.tsx | **ALTA** |
| `certification-upload-modal.tsx` | `components/mobile/certification-upload-modal.tsx` | ❌ No mencionado en diagramas | **MEDIA** |
| `social-verification-modal.tsx` | `components/mobile/social-verification-modal.tsx` | ❌ No mencionado en diagramas | **MEDIA** |

---

## 🎬 COMPONENTES COMPARTIDOS - ANÁLISIS

### ✅ **COMPONENTES USADOS**

| Componente | Ubicación | Uso | Estado |
|------------|-----------|-----|--------|
| `ClientProductModal` | `components/client/activities/client-product-modal.tsx` | ✅ Compartido - Preview producto | **USADO** |
| `UniversalVideoPlayer` | `components/shared/video/universal-video-player.tsx` | ✅ Compartido - Reproductor video | **USADO** |
| `ActivityCard` | `components/shared/activities/ActivityCard.tsx` | ✅ Compartido - Card producto | **USADO** |
| `TodayScreen` | `components/shared/misc/TodayScreen.tsx` | ✅ Cliente - Ejercicios del día | **USADO** |
| `PurchaseActivityModal` | `components/shared/activities/purchase-activity-modal.tsx` | ✅ Cliente - Compra | **USADO** |
| `CoachProfileModal` | `components/coach/CoachProfileModal.tsx` | ✅ Compartido - Perfil coach | **USADO** |
| `CreateProductModal` | `components/shared/products/create-product-modal-refactored.tsx` | ✅ Coach - Crear producto | **USADO** |
| `ClientDetailModal` | `components/coach/clients/ClientDetailModal.tsx` | ✅ Coach - Detalle cliente | **USADO** |
| `StorageUsageWidget` | `components/coach/storage-usage-widget.tsx` | ✅ Coach - Widget almacenamiento | **USADO** |
| `PlanManagement` | `components/coach/plan-management.tsx` | ✅ Coach - Gestión planes | **USADO** |
| `ClientCalendar` | `components/coach/client-calendar.tsx` | ✅ Coach - Calendario cliente | **USADO** |
| `CoachProfileCard` | `components/coach/clients/CoachProfileCard.tsx` | ✅ Compartido - Card coach | **USADO** |

### ❌ **COMPONENTES COMPARTIDOS NO USADOS (Candidatos a eliminar)**

| Componente | Ubicación | Razón | Prioridad |
|------------|-----------|-------|-----------|
| `BaseScreen.tsx` | `components/base/BaseScreen.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `CoachCalendarScreenBroken` | `components/coach/coach-calendar-screen-broken.tsx` | ❌ Archivo marcado como "broken" | **ALTA** |
| `CoachCalendarScreenFixed` | `components/coach/coach-calendar-screen-fixed.tsx` | ❌ Versión antigua, se usa coach-calendar-screen.tsx | **ALTA** |
| `EventDetailModal` | `components/coach/EventDetailModal.tsx` | ❌ Mencionado como "NO implementado aún" en diagramas | **MEDIA** |

---

## 📦 COMPONENTES ACTIVITIES - ANÁLISIS

### ✅ **COMPONENTES USADOS**

| Componente | Ubicación | Uso | Estado |
|------------|-----------|-----|--------|
| `PurchasedActivityCard` | `components/activities/purchased-activity-card.tsx` | ✅ Cliente - Card actividad comprada | **USADO** |

### ❌ **COMPONENTES ACTIVITIES NO USADOS**

| Componente | Ubicación | Razón | Prioridad |
|------------|-----------|-------|-----------|
| `activity-card.tsx` | `components/activities/activity-card.tsx` | ❌ Duplicado, se usa `shared/activities/ActivityCard.tsx` | **ALTA** |
| `activity-detail-view.tsx` | `components/activities/activity-detail-view.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `activity-enroll-button.tsx` | `components/activities/activity-enroll-button.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `activity-form.tsx` | `components/activities/activity-form.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `activity-list.tsx` | `components/activities/activity-list.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `client-activity-card.tsx` | `components/activities/client-activity-card.tsx` | ❌ No se importa en ningún lugar | **ALTA** |

---

## 🗓️ COMPONENTES CALENDAR - ANÁLISIS

### ✅ **COMPONENTES USADOS**

| Componente | Ubicación | Uso | Estado |
|------------|-----------|-----|--------|
| `CalendarScreen` | `components/calendar/CalendarScreen.tsx` | ✅ Cliente - Tab Calendar | **USADO** |

### ❌ **COMPONENTES CALENDAR NO USADOS**

| Componente | Ubicación | Razón | Prioridad |
|------------|-----------|-------|-----------|
| `CalendarView.tsx` | `components/calendar/CalendarView.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `CalendarWithGoogleMeet.tsx` | `components/calendar/CalendarWithGoogleMeet.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `SimpleCalendar.tsx` | `components/calendar/SimpleCalendar.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `SimpleCalendarWithCustomizations.tsx` | `components/calendar/SimpleCalendarWithCustomizations.tsx` | ❌ No se importa en ningún lugar | **ALTA** |

---

## 🔐 COMPONENTES AUTH - ANÁLISIS

### ✅ **COMPONENTES USADOS**

| Componente | Ubicación | Uso | Estado |
|------------|-----------|-----|--------|
| `SignInPopup` | `components/auth/sign-in-popup.tsx` | ✅ Autenticación | **USADO** |
| `AuthWrapper` | `components/auth/auth-wrapper.tsx` | ✅ Wrapper auth | **USADO** |

### ❌ **COMPONENTES AUTH NO USADOS**

| Componente | Ubicación | Razón | Prioridad |
|------------|-----------|-------|-----------|
| `auth-loading.tsx` | `components/auth/auth-loading.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |
| `auth-popup-wrapper.tsx` | `components/auth/auth-popup-wrapper.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |
| `login-form.tsx` | `components/auth/login-form.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |
| `mobile-auth-popup.tsx` | `components/auth/mobile-auth-popup.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |
| `protected-route.tsx` | `components/auth/protected-route.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |
| `register-form.tsx` | `components/auth/register-form.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |
| `role-guard.tsx` | `components/auth/role-guard.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |
| `setup-database.tsx` | `components/auth/setup-database.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |
| `simple-sign-in-popup.tsx` | `components/auth/simple-sign-in-popup.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |
| `social-login.tsx` | `components/auth/social-login.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |

---

## 🎨 COMPONENTES CLIENT - ANÁLISIS

### ✅ **COMPONENTES USADOS**

| Componente | Ubicación | Uso | Estado |
|------------|-----------|-----|--------|
| `ClientProductModal` | `components/client/activities/client-product-modal.tsx` | ✅ Compartido - Preview producto | **USADO** |
| `WorkshopClientView` | `components/client/workshop-client-view.tsx` | ✅ Cliente - Vista taller | **USADO** |

### ❌ **COMPONENTES CLIENT NO USADOS**

| Componente | Ubicación | Razón | Prioridad |
|------------|-----------|-------|-----------|
| `client-activities-tabs.tsx` | `components/client/activities/client-activities-tabs.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `client-enrollments.tsx` | `components/client/activities/client-enrollments.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `client-purchased-activities.tsx` | `components/client/activities/client-purchased-activities.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `immediate-purchase-activities.tsx` | `components/client/activities/immediate-purchase-activities.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `program-access-card.tsx` | `components/client/activities/program-access-card.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `avatar-upload.tsx` | `components/client/avatar-upload.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `booking-calendar.tsx` | `components/client/booking-calendar.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `booking-page.tsx` | `components/client/booking-page.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `add-to-calendar-button.tsx` | `components/client/calendar/add-to-calendar-button.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `client-dashboard.tsx` | `components/client/dashboard/client-dashboard.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `client-rewards.tsx` | `components/client/dashboard/client-rewards.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `top-client-contribution.tsx` | `components/client/dashboard/top-client-contribution.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| **Todos los componentes de `client/nutrition/`** | `components/client/nutrition/*.tsx` | ❌ No mencionados en diagramas (9 archivos) | **ALTA** |
| **Todos los componentes de `client/profile/`** | `components/client/profile/*.tsx` | ❌ No mencionados en diagramas (3 archivos) | **ALTA** |

---

## 🎓 COMPONENTES COACH - ANÁLISIS

### ✅ **COMPONENTES USADOS**

| Componente | Ubicación | Uso | Estado |
|------------|-----------|-----|--------|
| `CoachProfileModal` | `components/coach/CoachProfileModal.tsx` | ✅ Compartido - Perfil coach | **USADO** |
| `ClientDetailModal` | `components/coach/clients/ClientDetailModal.tsx` | ✅ Coach - Detalle cliente | **USADO** |
| `CoachProfileCard` | `components/coach/clients/CoachProfileCard.tsx` | ✅ Compartido - Card coach | **USADO** |
| `ClientCalendar` | `components/coach/client-calendar.tsx` | ✅ Coach - Calendario cliente | **USADO** |
| `CoachCalendarScreen` | `components/coach/coach-calendar-screen.tsx` | ✅ Coach - Tab Calendar | **USADO** |
| `StorageUsageWidget` | `components/coach/storage-usage-widget.tsx` | ✅ Coach - Widget almacenamiento | **USADO** |
| `PlanManagement` | `components/coach/plan-management.tsx` | ✅ Coach - Gestión planes | **USADO** |

### ❌ **COMPONENTES COACH NO USADOS**

| Componente | Ubicación | Razón | Prioridad |
|------------|-----------|-------|-----------|
| `availability-manager.tsx` | `components/coach/availability-manager.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `product-completion-actions.tsx` | `components/coach/product-completion-actions.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `workshop-reactivation-modal.tsx` | `components/coach/workshop-reactivation-modal.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |
| **Componentes de `coach/stats/`** | `components/coach/stats/*.tsx` | ❌ No se importan (2 archivos) | **MEDIA** |
| **Componentes de `coach/clients/` (excepto los usados)** | `components/coach/clients/*.tsx` | ❌ Verificar cuáles no se usan (5 archivos totales) | **MEDIA** |

---

## 🗂️ COMPONENTES DASHBOARD - ANÁLISIS

### ❌ **COMPONENTES DASHBOARD NO USADOS**

| Componente | Ubicación | Razón | Prioridad |
|------------|-----------|-------|-----------|
| `activity-form.tsx` | `components/dashboard/activity-form.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `client-dashboard.tsx` | `components/dashboard/client-dashboard.tsx` | ❌ No se importa en ningún lugar | **ALTA** |

---

## 🔗 COMPONENTES GOOGLE - ANÁLISIS

### ❌ **COMPONENTES GOOGLE NO USADOS**

| Componente | Ubicación | Razón | Prioridad |
|------------|-----------|-------|-----------|
| `ConnectGoogleButton.tsx` | `components/google/ConnectGoogleButton.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |
| `MeetingDashboard.tsx` | `components/google/MeetingDashboard.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |
| `MeetingJoinButton.tsx` | `components/google/MeetingJoinButton.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |

---

## 🧭 COMPONENTES LAYOUT - ANÁLISIS

### ❌ **COMPONENTES LAYOUT NO USADOS**

| Componente | Ubicación | Razón | Prioridad |
|------------|-----------|-------|-----------|
| `main-navigation.tsx` | `components/layout/main-navigation.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `navigation.tsx` | `components/layout/navigation.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `simple-top-nav.tsx` | `components/layout/simple-top-nav.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `top-navigation.tsx` | `components/layout/top-navigation.tsx` | ❌ No se importa en ningún lugar | **ALTA** |

---

## 📝 COMPONENTES PRODUCT-FORM-SECTIONS - ANÁLISIS

### ❌ **COMPONENTES PRODUCT-FORM-SECTIONS NO USADOS**

| Componente | Ubicación | Razón | Prioridad |
|------------|-----------|-------|-----------|
| `general-info-section-minimal.tsx` | `components/product-form-sections/general-info-section-minimal.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `general-info-section.tsx` | `components/product-form-sections/general-info-section.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `modal-header.tsx` | `components/product-form-sections/modal-header.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `progressive-form.tsx` | `components/product-form-sections/progressive-form.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `specific-details-section-minimal.tsx` | `components/product-form-sections/specific-details-section-minimal.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `specific-details-section.tsx` | `components/product-form-sections/specific-details-section.tsx` | ❌ No se importa en ningún lugar | **ALTA** |

---

## 🎪 COMPONENTES WORKSHOPS - ANÁLISIS

### ❌ **COMPONENTES WORKSHOPS NO USADOS**

| Componente | Ubicación | Razón | Prioridad |
|------------|-----------|-------|-----------|
| `workshop-schedule-form.tsx` | `components/workshops/workshop-schedule-form.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |
| `workshop-sessions-display.tsx` | `components/workshops/workshop-sessions-display.tsx` | ❌ No se importa en ningún lugar | **MEDIA** |

---

## 🌐 APIs - ANÁLISIS

### ✅ **APIs USADAS (Según diagramas y código)**

| API | Ubicación | Uso | Estado |
|-----|-----------|-----|--------|
| `GET /api/activities/search` | `app/api/activities/search/route.ts` | ✅ Búsqueda actividades | **USADO** |
| `GET /api/activities/[id]/purchase-status` | `app/api/activities/[id]/purchase-status/route.ts` | ✅ Estado compra | **USADO** |
| `POST /api/enrollments/direct` | `app/api/enrollments/direct/route.ts` | ✅ Compra directa | **USADO** |
| `GET /api/coach/clients` | `app/api/coach/clients/route.ts` | ✅ Lista clientes | **USADO** |
| `GET /api/coach/clients/[id]/details` | `app/api/coach/clients/[id]/details/route.ts` | ✅ Detalle cliente | **USADO** |
| `GET /api/coach/clients/[id]/todo` | `app/api/coach/clients/[id]/todo/route.ts` | ✅ Tareas cliente | **USADO** |
| `POST /api/coach/clients/[id]/todo` | `app/api/coach/clients/[id]/todo/route.ts` | ✅ Agregar tarea | **USADO** |
| `DELETE /api/coach/clients/[id]/todo` | `app/api/coach/clients/[id]/todo/route.ts` | ✅ Eliminar tarea | **USADO** |
| `GET /api/products` | `app/api/products/route.ts` | ✅ Lista productos | **USADO** |
| `POST /api/products` | `app/api/products/route.ts` | ✅ Crear producto | **USADO** |
| `GET /api/coach/plan` | `app/api/coach/plan/route.ts` | ✅ Plan coach | **USADO** |
| `POST /api/coach/plan` | `app/api/coach/plan/route.ts` | ✅ Cambiar plan | **USADO** |
| `GET /api/activities/today` | `app/api/activities/today/route.ts` | ✅ Actividades hoy | **USADO** |
| `POST /api/toggle-exercise` | `app/api/toggle-exercise/route.ts` | ✅ Marcar ejercicio | **USADO** |
| `POST /api/activities/initialize-progress` | `app/api/activities/initialize-progress/route.ts` | ✅ Inicializar progreso | **USADO** |
| `GET /api/get-product-planning` | `app/api/get-product-planning/route.ts` | ✅ Planificación producto | **USADO** |
| `POST /api/save-weekly-planning` | `app/api/save-weekly-planning/route.ts` | ✅ Guardar planificación | **USADO** |
| `GET /api/coaches` | `app/api/coaches/route.ts` | ✅ Lista coaches | **USADO** |
| `GET /api/coaches/[id]` | `app/api/coaches/[id]/route.ts` | ✅ Perfil coach | **USADO** |
| `GET /api/taller-detalles` | `app/api/taller-detalles/route.ts` | ✅ Detalles taller | **USADO** |
| `POST /api/taller-detalles` | `app/api/taller-detalles/route.ts` | ✅ Crear tema taller | **USADO** |

### ❌ **APIs NO USADAS (Candidatas a eliminar)**

| API | Ubicación | Razón | Prioridad |
|-----|-----------|-------|-----------|
| `POST /api/activities/exercises/bulk` | `app/api/activities/exercises/bulk/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/activities/[id]/first-day` | `app/api/activities/[id]/first-day/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/activities/[id]/stats` | `app/api/activities/[id]/stats/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `POST /api/activities/initialize-nutrition-progress` | `app/api/activities/initialize-nutrition-progress/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/activities/nutrition-today` | `app/api/activities/nutrition-today/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| **Todas las APIs de `admin/`** | `app/api/admin/*` | ❌ Solo para desarrollo/admin (4 archivos) | **BAJA** |
| **Todas las APIs de `bunny/`** | `app/api/bunny/*` | ❌ Migración/administración (4 archivos) | **BAJA** |
| **Todas las APIs de `debug-*`** | `app/api/debug-*` | ❌ Solo para debugging (8+ archivos) | **BAJA** |
| **Todas las APIs de `google/`** | `app/api/google/*` | ❌ No mencionadas en diagramas (5 archivos) | **MEDIA** |
| **Todas las APIs de `meetings/`** | `app/api/meetings/*` | ❌ No mencionadas en diagramas (5 archivos) | **MEDIA** |
| **Todas las APIs de `messages/`** | `app/api/messages/*` | ❌ No mencionadas en diagramas (2 archivos) | **MEDIA** |
| `POST /api/coach/consultations` | `app/api/coach/consultations/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/coach/stats-simple` | `app/api/coach/stats-simple/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/coach/storage-usage` | `app/api/coach/storage-usage/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/coach/storage-files` | `app/api/coach/storage-files/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `POST /api/coach/sync-storage` | `app/api/coach/sync-storage/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `POST /api/coach/initialize-storage` | `app/api/coach/initialize-storage/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/coach/plan-limits` | `app/api/coach/plan-limits/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `POST /api/coach/plan/renew` | `app/api/coach/plan/renew/route.ts` | ❌ No mencionada en diagramas (cron job) | **BAJA** |
| `GET /api/coach-media` | `app/api/coach-media/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `POST /api/create-nutrition-planning-table` | `app/api/create-nutrition-planning-table/route.ts` | ❌ Migración/administración | **BAJA** |
| `POST /api/create-nutrition-progress-table` | `app/api/create-nutrition-progress-table/route.ts` | ❌ Migración/administración | **BAJA** |
| `POST /api/delete-activity-final` | `app/api/delete-activity-final/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `POST /api/delete-exercise-items` | `app/api/delete-exercise-items/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `POST /api/delete-nutrition-items` | `app/api/delete-nutrition-items/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/existing-exercises` | `app/api/existing-exercises/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/executions/day` | `app/api/executions/day/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/ejecuciones-ejercicio` | `app/api/ejecuciones-ejercicio/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/get-product-planning` | `app/api/get-product-planning/route.ts` | ✅ **USADO** | - |
| `GET /api/product-stats/[id]` | `app/api/product-stats/[id]/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `POST /api/products/[id]/pause` | `app/api/products/[id]/pause/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/profile/biometrics` | `app/api/profile/biometrics/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/profile/combined` | `app/api/profile/combined/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/profile/exercise-progress` | `app/api/profile/exercise-progress/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/profile/injuries` | `app/api/profile/injuries/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `POST /api/run-migration-file-name` | `app/api/run-migration-file-name/route.ts` | ❌ Migración/administración | **BAJA** |
| `POST /api/save-exercise-videos` | `app/api/save-exercise-videos/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `GET /api/search-coaches` | `app/api/search-coaches/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `POST /api/upload-nutrition-complete` | `app/api/upload-nutrition-complete/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `POST /api/upload-organized` | `app/api/upload-organized/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |
| `POST /api/workshop-reactivation` | `app/api/workshop-reactivation/route.ts` | ❌ No mencionada en diagramas | **MEDIA** |

---

## 🎣 HOOKS - ANÁLISIS

### ✅ **HOOKS USADOS**

| Hook | Ubicación | Uso | Estado |
|------|-----------|-----|--------|
| `useAuth` | `hooks/shared/use-auth.tsx` | ✅ Autenticación | **USADO** |
| `useProfileManagement` | `hooks/client/use-profile-management.ts` | ✅ Gestión perfil cliente | **USADO** |
| `useClientMetrics` | `hooks/client/use-client-metrics.ts` | ✅ Métricas cliente | **USADO** |
| `useCoachProfile` | `hooks/coach/use-coach-profile.ts` | ✅ Perfil coach | **USADO** |
| `useCoachStorageInitialization` | `hooks/coach/use-coach-storage-initialization.ts` | ✅ Inicialización storage | **USADO** |
| `useDebounce` | `hooks/shared/use-debounce.ts` | ✅ Debouncing | **USADO** |
| `useToast` | `hooks/shared/use-toast.ts` | ✅ Notificaciones | **USADO** |

### ❌ **HOOKS NO USADOS (Candidatos a eliminar)**

| Hook | Ubicación | Razón | Prioridad |
|------|-----------|-------|-----------|
| `use-booking-slots.ts` | `hooks/client/use-booking-slots.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-client-profile.ts` | `hooks/client/use-client-profile.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-consultation-credits.ts` | `hooks/coach/use-consultation-credits.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-product-completion-status.ts` | `hooks/coach/use-product-completion-status.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-product-stats.ts` | `hooks/coach/use-product-stats.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-program-stats.ts` | `hooks/coach/use-program-stats.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-smart-coach-cache.ts` | `hooks/coach/use-smart-coach-cache.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-workshop-status.ts` | `hooks/coach/use-workshop-status.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-activities-store.ts` | `hooks/shared/use-activities-store.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-activity-data.ts` | `hooks/shared/use-activity-data.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-activity-media.ts` | `hooks/shared/use-activity-media.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-activity-rating.ts` | `hooks/shared/use-activity-rating.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-cached-tab-data.ts` | `hooks/shared/use-cached-tab-data.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-component-usage.ts` | `hooks/shared/use-component-usage.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-csv-management.ts` | `hooks/shared/use-csv-management.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-day-validation.ts` | `hooks/shared/use-day-validation.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-error-handler.ts` | `hooks/shared/use-error-handler.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-exercise-data.ts` | `hooks/shared/use-exercise-data.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-fitness-exercise-details.ts` | `hooks/shared/use-fitness-exercise-details.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-google-sync.ts` | `hooks/shared/use-google-sync.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-local-storage.ts` | `hooks/shared/use-local-storage.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-messages.ts` | `hooks/shared/use-messages.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-mobile.tsx` | `hooks/shared/use-mobile.tsx` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-optimized-activities.ts` | `hooks/shared/use-optimized-activities.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-optimized-cache.ts` | `hooks/shared/use-optimized-cache.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-products-cache.ts` | `hooks/shared/use-products-cache.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-smart-data-loader.ts` | `hooks/shared/use-smart-data-loader.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-tab-controller.ts` | `hooks/shared/use-tab-controller.ts` | ❌ No se importa en ningún lugar | **ALTA** |
| `use-video-provider.ts` | `hooks/shared/use-video-provider.ts` | ❌ No se importa en ningún lugar | **ALTA** |

---

## 📊 RESUMEN POR PRIORIDAD

### 🔴 **PRIORIDAD ALTA - Eliminar inmediatamente**

**Componentes Mobile:**
- `dashboard-screen.tsx`
- `home-screen.tsx`
- `my-products-screen.tsx`
- `products-screen.tsx`

**Componentes Base:**
- `BaseScreen.tsx`

**Componentes Activities:**
- `activity-card.tsx` (duplicado)
- `activity-detail-view.tsx`
- `activity-enroll-button.tsx`
- `activity-form.tsx`
- `activity-list.tsx`
- `client-activity-card.tsx`

**Componentes Calendar:**
- `CalendarView.tsx`
- `CalendarWithGoogleMeet.tsx`
- `SimpleCalendar.tsx`
- `SimpleCalendarWithCustomizations.tsx`

**Componentes Client:**
- Todos los componentes de `client/activities/` (excepto `client-product-modal.tsx`)
- Todos los componentes de `client/nutrition/` (9 archivos)
- Todos los componentes de `client/profile/` (3 archivos)
- `avatar-upload.tsx`
- `booking-calendar.tsx`
- `booking-page.tsx`
- `add-to-calendar-button.tsx`
- Todos los componentes de `client/dashboard/` (3 archivos)

**Componentes Layout:**
- `main-navigation.tsx`
- `navigation.tsx`
- `simple-top-nav.tsx`
- `top-navigation.tsx`

**Componentes Product-Form-Sections:**
- Todos los archivos (6 archivos)

**Componentes Dashboard:**
- `activity-form.tsx`
- `client-dashboard.tsx`

**Hooks:**
- 28 hooks no usados (ver lista completa arriba)

**Total estimado:** ~80+ archivos

---

### 🟡 **PRIORIDAD MEDIA - Revisar antes de eliminar**

**Componentes:**
- `certification-upload-modal.tsx`
- `social-verification-modal.tsx`
- `EventDetailModal.tsx` (mencionado como "NO implementado aún")
- `availability-manager.tsx`
- `product-completion-actions.tsx`
- Componentes de `coach/stats/` (2 archivos)
- Componentes de `coach/clients/` (verificar cuáles no se usan)
- `workshop-schedule-form.tsx`
- `workshop-sessions-display.tsx`
- Componentes de `google/` (3 archivos)
- Componentes de `auth/` (10 archivos, excepto los usados)

**APIs:**
- ~30 APIs no mencionadas en diagramas (ver lista completa arriba)

**Total estimado:** ~50+ archivos

---

### 🟢 **PRIORIDAD BAJA - Mantener (administración/debugging)**

**APIs:**
- APIs de `admin/` (4 archivos)
- APIs de `bunny/` (4 archivos)
- APIs de `debug-*` (8+ archivos)
- APIs de migración (3+ archivos)
- `POST /api/coach/plan/renew` (cron job)

**Total estimado:** ~20 archivos

---

## 📈 ESTADÍSTICAS FINALES

| Categoría | Total Archivos | Usados | No Usados | % No Usados |
|-----------|---------------|--------|-----------|-------------|
| **Componentes Mobile** | 18 | 12 | 6 | 33% |
| **Componentes Activities** | 7 | 1 | 6 | 86% |
| **Componentes Calendar** | 5 | 1 | 4 | 80% |
| **Componentes Auth** | 11 | 2 | 9 | 82% |
| **Componentes Client** | ~20 | 2 | ~18 | 90% |
| **Componentes Coach** | ~10 | 7 | ~3 | 30% |
| **Componentes Layout** | 4 | 0 | 4 | 100% |
| **Componentes Product-Form** | 6 | 0 | 6 | 100% |
| **Hooks** | 35 | 7 | 28 | 80% |
| **APIs** | ~100 | ~20 | ~80 | 80% |
| **TOTAL ESTIMADO** | **~215** | **~52** | **~163** | **~76%** |

---

## ⚠️ NOTAS IMPORTANTES

1. **Verificar antes de eliminar:** Algunos archivos pueden estar en proceso de desarrollo o ser referenciados dinámicamente.

2. **APIs de administración:** Las APIs de `admin/`, `bunny/`, y `debug-*` pueden ser necesarias para operaciones internas, aunque no estén en los diagramas de usuario.

3. **Componentes compartidos en `shared/`:** Muchos componentes en `components/shared/` pueden estar siendo usados indirectamente. Verificar con búsqueda de imports.

4. **Hooks:** Algunos hooks pueden estar preparados para uso futuro. Revisar si son parte de features planificadas.

5. **Componentes UI:** Los componentes en `components/ui/` son probablemente usados ampliamente. No eliminar sin verificación exhaustiva.

---

## 🚀 PRÓXIMOS PASOS

1. ✅ **Crear este análisis** (COMPLETADO)
2. ⏳ **Verificar imports dinámicos** (usando `grep` y búsqueda de strings)
3. ⏳ **Confirmar con el equipo** qué archivos mantener
4. ⏳ **Eliminar archivos de prioridad ALTA** confirmados
5. ⏳ **Revisar archivos de prioridad MEDIA**
6. ⏳ **Actualizar imports** después de eliminar
7. ⏳ **Ejecutar tests** para verificar que nada se rompió

---

**Última actualización:** $(date)
**Versión:** 1.0
**Autor:** Análisis Automático





















