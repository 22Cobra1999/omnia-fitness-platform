# 🔄 Flujo de Compras y Modificaciones de Actividades (Fitness & Nutrición)

## 📌 Objetivo del diagrama

- Definir cómo se comportan **compras**, **modificaciones** y **limpieza histórica** para:
  - `ejercicios_detalles` (fitness) y `nutrition_program_details` (nutrición).
  - `planificacion_ejercicios`.
  - Tablas de **progreso del cliente**.
- Asegurar que:
  - Los clientes que compran **antes** de una modificación mantienen siempre la **versión original** \(X, Z\).
  - Los clientes que compran **después** usan la **versión nueva** \(X.2, Z.2\).
  - Solo se cuentan elementos **activos** para los límites de plan.
  - Se puedan limpiar filas viejas cuando ya no haya clientes que las necesiten ni otras actividades que las usen.

---

## 🧱 Entidades y tablas involucradas

- **Producto / Actividad**
  - Tabla: `activities`
  - Campos relevantes: `id`, `categoria` (`fitness` / `nutricion`), `type` (`program`, `workshop`, etc.).

- **Contenido del producto**
  - Fitness:
    - Tabla: `ejercicios_detalles`
    - Campo clave: `activity_id` (JSONB, mapa `{ actividadId: { activo: boolean } }`)
    - Campo de estado: `is_active` (boolean, nivel global del ejercicio).
  - Nutrición:
    - Tabla: `nutrition_program_details`
    - Campo clave: `activity_id` (JSONB, mismo formato).
    - Campo de estado: `is_active` (boolean).

- **Planificación base del producto**
  - Tabla: `planificacion_ejercicios`
  - Campos: `actividad_id`, `numero_semana`, `lunes..domingo` (JSON por día con `ejercicios`, `blockNames`, `blockCount`).
  - Para nutrición se reutiliza la misma tabla con IDs de `nutrition_program_details`.

- **Progreso del cliente**
  - Tabla(s): `progreso_cliente` (y derivadas).
  - Al **iniciar** una actividad para un cliente se generan filas en base a:
    - La planificación vigente (`planificacion_ejercicios`) de ese momento.
    - Los IDs reales de `ejercicios_detalles` / `nutrition_program_details`.
  - Estas filas son **históricas** y **no se tocan** cuando el coach modifica el producto.

- **Límites de plan del coach**
  - Tabla: `planes_uso_coach`
  - Función: `getPlanLimit(planType, 'uniqueExercisesPerProduct' | 'uniquePlatesPerProduct' | 'weeksPerProduct')`
  - Los contadores usan solo **elementos activos**.

---

## 🧮 Definición de X, Z, X.2 y Z.2

- **X** = cantidad de **elementos únicos activos** asociados a una actividad:
  - Fitness: cantidad de ejercicios únicos en `ejercicios_detalles` con:
    - `hasActivity(activity_id, actividad_id)` = `true`
    - `getActiveFlagForActivity(activity_id, actividad_id, true)` = `true`
    - `is_active = TRUE`
  - Nutrición: igual pero en `nutrition_program_details`.

- **Z** = cantidad de **días efectivos de planificación**:
  - Contar días con contenido en `planificacion_ejercicios` para esa `actividad_id`:
    - Algún día (`lunes..domingo`) con `ejercicios.length > 0`.

- **X.2 / Z.2**:
  - Nuevas versiones de contenido y planificación después de que el coach edita el programa.
  - Se calculan con la misma lógica pero **sobre la versión actualizada** \(nuevos platos/ejercicios activos, nueva planificación\).

---

## 📅 Línea de tiempo: compras y modificaciones

### 🟢 Día 1 – El coach publica un programa (versión 1)

- El producto tiene:
  - **X ejercicios/platos activos**.
  - **Z días** configurados en `planificacion_ejercicios`.
- El **cliente A** compra la actividad en Día 1:
  - Se crea un registro en `activity_enrollments`.
  - **Aún no** se clonan filas de progreso si el cliente no empieza.

### 🟡 Día 3 – El coach modifica el programa (versión 2)

- El coach entra al modal de edición y:
  - Elimina algunos ejercicios/platos.
  - Sube un nuevo CSV o agrega nuevos elementos.
  - Reconfigura la planificación semanal.

#### 1. Manejo de contenido (ejercicios / platos)

- Cuando el coach “elimina” elementos desde el paso de contenido:
  - Frontend llama:
    - Fitness: `DELETE /api/delete-exercise-items`.
    - Nutrición: `DELETE /api/delete-nutrition-items`.
- Backends (`delete-exercise-items` y `delete-nutrition-items`):
  - **NO borran filas** inmediatamente.
  - Actualizan el JSONB `activity_id`:
    - `setActiveFlagForActivity(activity_id, actividad_id, false)`.
  - Si después de actualizar:
    - **Ninguna actividad** tiene `activo = true` en ese mapa:
      - Ponen `is_active = FALSE` en la fila.
      - La fila se considera “muerta” para nuevos productos, pero sigue existiendo para historia.

#### 2. Manejo de planificación base

- El coach guarda una nueva planificación con `POST /api/save-weekly-planning`:
  - Se borra la planificación anterior de `planificacion_ejercicios` para esa `actividad_id`.
  - Se inserta la nueva planificación basada en los nuevos IDs válidos.
  - Esta planificación **no afecta** a `progreso_cliente` ya generado.

#### 3. Nuevas compras después del cambio

- El **cliente B** compra la misma actividad después del cambio:
  - Al momento de empezar, sus filas de `progreso_cliente` se generan usando:
    - La **nueva planificación** de `planificacion_ejercicios`.
    - Los **nuevos ejercicios/platos activos** → **X.2, Z.2**.

---

## 👤 Lógica para clientes que ya habían comprado

### 1. Cliente que compró antes pero empieza después

- El **cliente A** compró en Día 1 pero empieza la actividad en Día 3:
  - Al “empezar”:
    - Se dispara el proceso que crea sus filas en `progreso_cliente`.
    - Este proceso **SIEMPRE** usa una **copia lógica** de:
      - La planificación **vigente en el momento de empezar**.
      - Los IDs de ejercicios/platos activos asociados en ese momento.
  - Para mantener tus reglas:
    - La lógica de generación de progreso debe:
      - Buscar las filas históricas en `nutrition_program_details` / `ejercicios_detalles` correspondientes a la versión con la que **compró**.
      - O bien, almacenar en `activity_enrollments` un “snapshot de versión” para luego reproducirla.
    - En Omnia se logra vía:
      - Mantener filas antiguas en `nutrition_program_details` / `ejercicios_detalles` con `activo=false`/`is_active=false` **solo para nuevas compras**, pero aún disponibles para consultas internas del trigger.

### 2. Cliente que quiere cambiar un ejercicio/plato

- Dentro del flujo de edición personalizada de un día:
  - Para el **cliente A**, las opciones disponibles para reemplazar un ejercicio/plato deben ser:
    - Solo la **lista original** (X) con la que se generó su progreso.
    - No debe ver opciones nuevas introducidas en la versión 2.
- Esto se puede implementar consultando:
  - Los ejercicios/platos referenciados en sus filas de `progreso_cliente` + sus equivalentes históricos en `ejercicios_detalles`/`nutrition_program_details`.
  - Filtrando las listas de selección con esa “whitelist” individual por cliente/compra.

---

## 📏 Límites de plan: solo elementos activos cuentan

- Cada plan del coach tiene límites, por ejemplo:
  - Máximo de **X ejercicios únicos** por producto.
  - Máximo de **Y platos únicos** por producto de nutrición.
  - Máximo de **Z semanas** en planificación.
- **Regla clave:**  
  - Los contadores **solo consideran** elementos con:
    - `is_active = TRUE`.
    - Y `getActiveFlagForActivity(activity_id, actividad_id, true) = true`.
- Consecuencias:
  - El coach puede **reemplazar** contenido:
    - Viejos ejercicios/platos pasan a `activo=false` para esa actividad → dejan de contar contra el límite.
    - Nuevos ejercicios/platos activos se suman → siempre se respeta el tope del plan.
  - Las filas viejas siguen existiendo para historial, pero no “consumen cupo” del plan.

---

## 🧹 Limpieza diferida (hard delete)

### 1. Candidatos a eliminación

Un ejercicio/plato en `ejercicios_detalles` / `nutrition_program_details` es candidato a **borrado definitivo** solo cuando:

1. `is_active = FALSE`.
2. En su `activity_id` JSONB:
   - Ninguna actividad tiene `activo = true`.
3. No se necesita para **compras vigentes**:
   - No existe ningún cliente con `activity_enrollments` **activo/pending** para esa actividad cuya compra:
     - Se haya hecho **antes** de la modificación que generó la versión nueva (X.2 / Z.2) y
     - Todavía tenga actividad pendiente por hacer (no está marcada como completamente finalizada).
   - Es decir: primero se espera a que **todas** las compras “versión vieja” terminen su ciclo (estado *finalizada*).
4. Una vez cumplido lo anterior, se puede verificar que:
   - No se usa en `planificacion_ejercicios` / `planificacion_platos` vigente (las planificaciones viejas asociadas a esas compras ya no son necesarias).
   - Y, opcionalmente, que no lo requiere ningún flujo de auditoría de `progreso_cliente` (o que este ya guarda un snapshot propio que no depende de esos IDs).

### 2. Limpieza de planificación

- En paralelo, filas de `planificacion_ejercicios` pueden limpiarse cuando:
  - Todas las compras que dependían de esa planificación están:
    - **Finalizadas** (según `progreso_cliente` y estado de actividad_enrollments).
  - La actividad ha sido modificada y tiene una planificación nueva que ya está en uso.
- Regla:
  - Solo se conservan **planificaciones en uso** (para nuevas compras) y aquellas necesarias para reconstruir progreso en curso.
  - El resto puede borrarse sin afectar la experiencia del cliente.

### 3. Estrategia práctica

- Implementar un proceso batch (script cron o comando manual) que:
  1. Recorra `nutrition_program_details` / `ejercicios_detalles` con `is_active=false`.
  2. Verifique:
     - `activity_id` sin actividades activas.
     - Ausencia de referencias en `planificacion_ejercicios`.
     - Ausencia de referencias en `progreso_cliente`.
  3. Elimine esas filas.
  4. Haga lo mismo con planificaciones antiguas en `planificacion_ejercicios`.

---

## 🧷 Resumen visual (versión simplificada)

```text
🟢 DÍA 1
Coach publica programa (X, Z)
↓
Cliente A compra
↓
(Aún no empieza → sin progreso generado)

🟡 DÍA 3
Coach edita programa → crea X.2, Z.2
  - delete-*-items → marca ejercicios/platos como inactivos (NO los borra)
  - save-weekly-planning → reemplaza planificación base

Cliente B compra después del cambio
  → Usará X.2, Z.2 al generar su progreso

Cliente A empieza después del cambio
  → Trigger de progreso usa versión histórica ligada a su compra
  → Mantiene X, Z originales

🧮 Límites de plan
  - Solo cuentan elementos activos (is_active=TRUE + activo=TRUE en activity_id)

🧹 Limpieza
  - Cuando:
    - is_active = FALSE
    - activity_id sin actividades activas
    - Sin referencias en planificacion_* ni progreso_cliente
  → Se pueden borrar filas viejas de nutrition_program_details / ejercicios_detalles
  → Se pueden borrar planificaciones viejas en planificacion_ejercicios
```

---

## 🔗 Relación con otros diagramas

- `DIAGRAMA_NAVEGACION_COACH.md`
  - Sección **“Sistema de Estados (is_active)”** y **“Planes y límites”** → usa esta lógica para explicar que solo se cuentan elementos activos.
- `ARQUITECTURA_DATOS_Y_PROCESOS.md`
  - Sección **“Datos de Productos/Actividades”** → este diagrama define específicamente cómo se maneja la **historia de versiones** y la **limpieza diferida**.


