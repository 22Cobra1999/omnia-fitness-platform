# 📋 LÓGICA DE FINALIZACIÓN DE PRODUCTOS

## 🎯 **DETECCIÓN DE FINALIZACIÓN**

### **Para TALLERES:**
- **Finalización del taller**: Última fecha de cualquier tema ya pasó
- **Finalización del cliente**: Cliente completó todas sus sesiones compradas
- **Estado en `activity_enrollments.status`**: 
  - `'activa'` → Cliente tiene sesiones pendientes
  - `'finalizada'` → Cliente completó todas sus sesiones
  - `'completed'` → Producto finalizado (última fecha pasó)

### **Para PROGRAMAS:**
- **Finalización del programa**: Cliente completó todos los ejercicios/platos
- **Estado en `activity_enrollments.status`**:
  - `'activa'` → Cliente tiene días pendientes futuros
  - `'finalizada'` → Pasó la última fecha de progreso cliente
  - `'completed'` → El cliente no tiene ningún día pendiente

### **Para DOCUMENTOS:**
- **Finalización del documento**: Cliente accedió al contenido
- **Estado en `activity_enrollments.status`**:
  - `'activa'` → Cliente puede acceder
  - `'finalizada'` → Cliente accedió al documento
  - `'completed'` → Pasó la fecha de expiración de acceso

---

## 🔄 **LÓGICA DE EXTENSIÓN/REACTIVACIÓN**

### **Escenario A: Taller Finalizado Completamente**
```
- Última fecha pasó
- Todos los clientes tienen status 'finalizada' o 'completed'
- Acción: REACTIVAR (agregar nuevas fechas) → aplica a próximas compras
- Estado del producto: Se reactiva manualmente agregando fechas
```

### **Escenario B: Taller No Finalizado**
```
- Última fecha no pasó
- Algunos clientes 'finalizada', otros 'activa' (no hay completed porque no se finalizó)
- Acción: EXTENDER (regalar más sesiones)
- Estado del producto: Se extiende para todos
```

### **Escenario C: Programa con Nuevos Contenidos**
```
- Coach agrega ejercicios/platos
- Decisión: Regalar a existentes o solo nuevos
- Si regala: Se agrega manualmente a cada cliente
- Si no regala: Solo aplica a nuevas compras
- Nota: Cuando un cliente empieza un programa se generan automáticamente en progreso_cliente las filas y fechas
```

---

## 📊 **USO DE COLUMNAS EXISTENTES**

### **`activity_enrollments.status`:**
- **`'activa'`**: Cliente tiene contenido pendiente
- **`'finalizada'`**: Cliente completó su contenido
- **`'completed'`**: Producto finalizado para este cliente
- **`'pausada'`**: Cliente pausó su progreso
- **`'cancelada'`**: Cliente canceló

### **`activity_enrollments.todo_list`:**
- **Array de notas del coach** para cada cliente
- **Tareas simples** tipo "cambiar peso de X ejercicio"
- **No se usa** para contenido del producto
- **Se mantiene** como herramienta de gestión del coach

### **`activity_enrollments.progress`:**
- **Se elimina** (es un campo calculado con otras tablas)
- **Se calcula** dinámicamente desde `progreso_cliente`

### **`activity_enrollments.expiration_date`:**
- **Solo para documentos y programas** (no talleres)
- **Tiempo para comenzar** el programa o acceder al documento
- **Opciones**: 15, 30, 60 días
- **Se configura** en el paso 3 de creación del producto

---

## 🎯 **FLUJO DE DECISIONES**

### **Para TALLERES:**
1. **Verificar última fecha** del taller
2. **Contar clientes** con status 'finalizada'
3. **Si todos finalizaron** → REACTIVAR (nuevas fechas para próximas compras)
4. **Si algunos finalizaron** → EXTENDER (regalar más sesiones)
5. **Si ninguno finalizó** → EXTENDER

### **Para PROGRAMAS:**
1. **Verificar progreso** de todos los clientes
2. **Si todos completaron** → Producto finalizado
3. **Si algunos completaron** → EXTENDER
4. **Si ninguno completó** → EXTENDER

### **Para DOCUMENTOS:**
1. **Verificar acceso** de todos los clientes
2. **Si todos accedieron** → Producto finalizado
3. **Si algunos accedieron** → EXTENDER
4. **Si ninguno accedió** → EXTENDER

---

## 📱 **INTERFAZ DE USUARIO**

### **Para el Coach:**
- **Botón "Extender"**: Si algunos clientes finalizaron
- **Botón "Reactivar"**: Si todos los clientes finalizaron
- **Opción "Regalar"**: Al agregar nuevos contenidos
- **Opción "Solo nuevos"**: Al agregar nuevos contenidos
- **Campo "Días para comenzar"**: En paso 3 para documentos y programas

### **Para el Cliente:**
- **Estado visual**: Verde (activo), Gris (finalizado)
- **Progreso**: Calculado dinámicamente
- **Contenido**: Lista de tareas pendientes
- **Acceso**: Hasta fecha de expiración (solo documentos/programas)

---

## 🔧 **IMPLEMENTACIÓN TÉCNICA**

### **Función de Detección:**
```sql
-- Verificar si producto está finalizado
SELECT 
  CASE 
    WHEN last_date < NOW() AND all_clients_finished THEN 'completed'
    WHEN last_date < NOW() AND some_clients_finished THEN 'extend'
    WHEN last_date >= NOW() THEN 'active'
  END as product_status
```

### **Función de Extensión:**
```sql
-- Extender producto para todos los clientes
UPDATE activity_enrollments 
SET 
  status = 'activa',
  expiration_date = new_expiration_date,
  todo_list = updated_todo_list
WHERE activity_id = ? AND status != 'cancelada'
```

### **Función de Reactivación:**
```sql
-- Reactivar producto con nuevas fechas
UPDATE activity_enrollments 
SET 
  status = 'activa',
  expiration_date = new_expiration_date,
  todo_list = new_todo_list
WHERE activity_id = ? AND status != 'cancelada'
```

---

## 🎯 **VENTAJAS DE ESTA IMPLEMENTACIÓN**

1. **Sin nuevas tablas**: Usa estructura existente
2. **Lógica simple**: Estados claros y predecibles
3. **Flexible**: Maneja todos los escenarios
4. **Escalable**: Funciona para cualquier tipo de producto
5. **Mantenible**: Fácil de entender y modificar
6. **Eficiente**: Elimina campos calculados innecesarios

---

## 📋 **CAMBIOS REQUERIDOS**

### **1. Eliminar campo `progress`:**
- Se calcula dinámicamente desde `progreso_cliente`
- No necesita almacenamiento redundante

### **2. Agregar campo "Días para comenzar" en paso 3:**
- Solo para documentos y programas
- Opciones: 15, 30, 60 días
- Se guarda en `expiration_date`

### **3. Lógica de estados:**
- Implementar detección automática de finalización
- Botones de extensión/reactivación
- Opciones de regalo de contenido

### **4. Interfaz de usuario:**
- Estados visuales claros
- Botones contextuales
- Opciones de gestión

---

**Última actualización:** $(date)
**Versión:** 1.0
**Autor:** Sistema de Lógica OMNIA

