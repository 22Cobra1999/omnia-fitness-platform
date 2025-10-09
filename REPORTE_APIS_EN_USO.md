# REPORTE DE APIs EN USO - OMNIA

## 📊 Metodología
Este reporte fue generado usando el sistema de tracking automático que intercepta todas las llamadas a `fetch()`.

## ✅ APIs CONFIRMADAS EN USO (según tracking real)

### Durante navegación en Products Tab (Coach):
1. `GET /api/messages/conversations` - Mensajería
2. `GET /api/coach/initialize-storage` - Inicializar storage del coach
3. `GET /api/products` - Lista de productos del coach
4. `GET /api/coach/consultations` - Consultas disponibles
5. `GET /api/get-product-planning` - Planificación de ejercicios guardados
6. `GET /api/coach/stats-simple` - Estadísticas del coach
7. `PUT /api/coach/consultations` - Actualizar consultas

## 📦 APIs ACTUALES EN EL PROYECTO (26 total)

```
activities/
activity-exercises/[id]/
activity-media/
auth/
calendar-events/
client-daily-activities/
client-progress/
clients/
coach/
coach-activities/
coaches/
delete-activity-final/
enrollments/
executions/
exercises/
existing-exercises/
get-product-planning/
messages/
product-statistics/
products/
profile/
search-coaches/
search-coaches-optimized/
taller-detalles/
upload-avatar/
upload-media/
```

## ❓ APIs NO VISTAS EN TRACKING (posiblemente sin uso)

**Nota:** Estas APIs NO aparecieron en la sesión de navegación. 
Necesitan ser probadas en diferentes flujos antes de eliminar.

### Cliente:
- `GET /api/activities` - ¿Se usa en tab Search/Activity?
- `GET /api/search-coaches` - ¿Se usa en tab Search?
- `GET /api/search-coaches-optimized` - ¿Reemplaza a search-coaches?
- `GET /api/client-daily-activities` - ¿Se usa en tab Activity?
- `GET /api/client-progress` - ¿Se usa en tab Activity?
- `GET /api/enrollments` - ¿Se usa en tab Activity?
- `GET /api/executions` - ¿Se usa en TodayScreen?
- `GET /api/coaches` - ¿Se usa en tab Search?

### Coach:
- `GET /api/clients` - ¿Se usa en tab Clients?
- `GET /api/coach-activities` - ¿Se usa en algún lado?
- `GET /api/coach/stats` - ¿Se usa o solo stats-simple?

### Productos:
- `GET /api/activity-media` - ¿Se usa al cargar productos?
- `GET /api/product-statistics` - ¿Se usa en algún lado?
- `POST /api/products` - ¿Se usa al crear producto?
- `PUT /api/products` - ¿Se usa al editar producto?
- `DELETE /api/delete-activity-final` - ¿Se usa al eliminar?

### Otros:
- `GET /api/calendar-events` - ¿Se usa en Calendar tab?
- `POST /api/calendar-events` - ¿Se usa al programar?
- `GET /api/exercises` - ¿Se usa en algún lado?
- `GET /api/existing-exercises` - ¿Se usa en CSV manager?
- `GET /api/activity-exercises/[id]` - ¿Se usa al editar?
- `GET /api/taller-detalles` - ¿Se usa en workshops?
- `POST /api/upload-avatar` - ¿Se usa en Profile?
- `POST /api/upload-media` - ¿Se usa al crear producto?
- `GET /api/profile` - ¿Se usa en Profile tab?
- `PUT /api/profile` - ¿Se usa al editar perfil?
- `GET /api/messages` - ¿Diferente de conversations?

## 🎯 PRÓXIMA ACCIÓN

Para determinar qué eliminar con PRECISIÓN, necesitamos:

1. **Navegar como COACH por todos los tabs:**
   - ✅ Products (ya hecho)
   - ⏳ Clients (abrir lista, ver detalle de cliente)
   - ⏳ Calendar
   - ⏳ Community  
   - ⏳ Profile

2. **Navegar como CLIENTE por todos los tabs:**
   - ⏳ Search (buscar coaches/productos)
   - ⏳ Activity (ver productos comprados, abrir TodayScreen)
   - ⏳ Calendar
   - ⏳ Community
   - ⏳ Profile

3. **Flujos especiales:**
   - ⏳ Crear un producto nuevo
   - ⏳ Editar un producto (✅ parcial - solo abriste)
   - ⏳ Eliminar un producto
   - ⏳ Comprar un producto (como cliente)
   - ⏳ Subir avatar
   - ⏳ Crear taller
   - ⏳ Enviar mensaje

4. **Al finalizar:**
   - Ejecutar `window.__getUsageReport()` en consola
   - Copiar el array completo de APIs
   - Eliminar lo que NO aparezca en ningún flujo

## 💡 TIP

Mantén la consola abierta y verás en tiempo real las APIs que se van usando con el ícono 🌐

¿Quieres que continue con el análisis o prefieres navegar tú y luego me compartes el reporte completo?

