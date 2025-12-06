# 📋 Plantillas Excel/CSV para Programas

## 📊 Resumen de Plantillas Disponibles

### ✅ Fitness - Plantilla Excel (.xlsx)
**Archivo descargable:** `plantilla-fitness ejemplo.xlsx`  
**Formato:** Excel con múltiples hojas  
**Estado:** ✅ Disponible para descarga

### ⚠️ Nutrición - Plantilla CSV
**Archivo descargable:** `plantilla-nutricion.csv`  
**Formato:** CSV simple  
**Estado:** ⚠️ Solo CSV (no Excel como Fitness)

---

## 🏋️ PLANTILLA FITNESS (Excel)

### Estructura del Archivo Excel
El archivo Excel contiene **4 hojas**:

1. **Plantilla** - Hoja principal con datos de ejemplo
2. **Opciones** - Catálogos de valores válidos
3. **Estructura** - Documentación de cada columna
4. **Guía** - Instrucciones paso a paso

### Columnas de la Hoja "Plantilla"

| # | Columna | Tipo | Obligatorio | Descripción | Valores Permitidos |
|---|---------|------|-------------|-------------|-------------------|
| 1 | **Nombre de la Actividad** | Texto (max 100 chars) | ✅ Sí | Nombre único del ejercicio | Texto libre (no puede repetirse) |
| 2 | **Descripción** | Texto (max 255 chars) | ❌ No | Descripción detallada del ejercicio | Texto libre (opcional) |
| 3 | **Duración (min)** | Número entero | ✅ Sí | Duración en minutos | >= 1 |
| 4 | **Tipo de Ejercicio** | Catálogo | ✅ Sí | Categoría del ejercicio | Ver hoja "Opciones" |
| 5 | **Nivel de Intensidad** | Catálogo | ✅ Sí | Intensidad del ejercicio | Ver hoja "Opciones" |
| 6 | **Equipo Necesario** | Catálogo (múltiples) | ❌ No | Equipamiento requerido | Ver hoja "Opciones" (separar con `;`) |
| 7 | **Detalle de Series (peso-repeticiones-series)** | Texto estructurado | ❌ No | Formato de series | Ver formato abajo |
| 8 | **Partes del Cuerpo** | Catálogo (múltiples) | ✅ Sí | Músculos trabajados | Ver hoja "Opciones" (separar con `;`) |
| 9 | **Calorías** | Número entero | ❌ No | Calorías aproximadas | >= 0 |

### Valores del Catálogo (Hoja "Opciones")

#### Tipo de Ejercicio
- Fuerza
- Cardio
- HIIT
- Movilidad
- Flexibilidad
- Equilibrio
- Funcional

#### Nivel de Intensidad
- Bajo
- Medio
- Alto

#### Equipo Necesario
- (vacío)
- Bandas
- Banco
- Barra
- Chaleco
- Kettlebell
- Mancuernas
- Máquinas
- Mat de yoga
- Rack

#### Partes del Cuerpo
- Pecho
- Espalda
- Hombros
- Brazos
- Antebrazos
- Core
- Glúteos
- Piernas
- Cuádriceps
- Isquiotibiales
- Pantorrillas
- Caderas
- Cuerpo Completo

### Formato de Series (Columna 7)

**Formato simple:**
```
(12-10-3)
```
Donde: `(peso-repeticiones-series)`

**Formato múltiples bloques:**
```
(12-10-3); (10-12-2)
```
Separar cada bloque con `; ` (punto y coma + espacio)

**Ejemplos:**
- `(50-12-3)` - 50kg, 12 repeticiones, 3 series
- `(0-12-3); (0-10-3)` - Sin peso, 12 reps x 3 series; luego 10 reps x 3 series
- `(33-10-3);(80-8-2);(32-11-1)` - Múltiples bloques

### Ejemplo de Fila (Fitness)

| Nombre de la Actividad | Descripción | Duración (min) | Tipo de Ejercicio | Nivel de Intensidad | Equipo Necesario | Detalle de Series | Partes del Cuerpo | Calorías |
|------------------------|-------------|----------------|-------------------|---------------------|------------------|-------------------|-------------------|----------|
| Press con mancuernas | Press de pecho utilizando mancuernas en banco plano. | 12 | Fuerza | Medio | Banco; Mancuernas | (12-10-3); (10-12-2) | Pecho; Hombros; Brazos | 70 |

---

## 🥗 PLANTILLA NUTRICIÓN (CSV)

### ⚠️ Nota Importante
La plantilla de Nutrición **solo está disponible como CSV**, no como Excel con múltiples hojas como Fitness.

### Columnas del CSV

| # | Columna | Tipo | Obligatorio | Descripción | Valores Permitidos |
|---|---------|------|-------------|-------------|-------------------|
| 1 | **Día** | Texto | ✅ Sí | Día de la semana | Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo |
| 2 | **Comida** | Texto | ✅ Sí | Tipo de comida | Desayuno, Almuerzo, Cena, Snack |
| 3 | **Nombre** | Texto | ✅ Sí | Nombre del plato | Texto libre |
| 4 | **Descripción** | Texto | ❌ No | Descripción o receta | Texto libre (puede incluir pasos numerados) |
| 5 | **Calorías** | Número | ✅ Sí | Calorías totales | >= 0 |
| 6 | **Proteínas (g)** | Número | ✅ Sí | Gramos de proteína | >= 0 |
| 7 | **Carbohidratos (g)** | Número | ✅ Sí | Gramos de carbohidratos | >= 0 |
| 8 | **Grasas (g)** | Número | ✅ Sí | Gramos de grasas | >= 0 |
| 9 | **video_url** | URL | ❌ No | URL del video demostrativo | URL válida (opcional) |

### Ejemplo de Fila (Nutrición)

```csv
Día,Comida,Nombre,Descripción,Calorías,Proteínas (g),Carbohidratos (g),Grasas (g),video_url
Lunes,Desayuno,Avena con frutas,"1. Cocina la avena con agua o leche. 2. Agrega frutas frescas por encima. 3. Endulza con miel si deseas.",300,10,50,8,https://vimeo.com/avena_demo
```

### Valores Permitidos

#### Día
- Lunes
- Martes
- Miércoles
- Jueves
- Viernes
- Sábado
- Domingo

#### Comida
- Desayuno
- Almuerzo
- Cena
- Snack

---

## 📝 Diferencias Clave entre Plantillas

| Característica | Fitness | Nutrición |
|----------------|---------|-----------|
| **Formato** | Excel (.xlsx) con 4 hojas | CSV simple |
| **Columnas** | 9 columnas | 9 columnas |
| **Incluye Semana** | ❌ No (solo en CSV de ejemplo) | ❌ No |
| **Incluye Día** | ❌ No (solo en CSV de ejemplo) | ✅ Sí |
| **Catálogos** | ✅ Sí (hoja "Opciones") | ❌ No (valores libres) |
| **Documentación** | ✅ Sí (hojas "Estructura" y "Guía") | ❌ No |
| **Ejemplos** | ✅ 5 ejercicios de ejemplo | ✅ 3 platos de ejemplo |

---

## 🔄 CSV de Ejemplo (Fitness)

**Nota:** El sistema también acepta CSV para Fitness, pero con columnas adicionales:

```csv
Semana,Día,Nombre de la Actividad,Descripción,Duración (min),Tipo de Ejercicio,Nivel de Intensidad,Equipo Necesario,Detalle de Series (peso-repeticiones-series),Partes del Cuerpo,Calorías,video_url
```

**Columnas adicionales en CSV:**
- `Semana` - Número de semana (1, 2, 3, etc.)
- `Día` - Día de la semana
- `video_url` - URL del video (opcional)

---

## 📥 Cómo Descargar las Plantillas

### Fitness
1. En el modal de creación de producto
2. Paso 4: "Actividades"
3. Click en "Descargar plantilla"
4. Se descarga: `plantilla-fitness ejemplo.xlsx`

### Nutrición
1. En el modal de creación de producto
2. Paso 4: "Actividades" (con categoría Nutrición)
3. Click en "Descargar plantilla"
4. Se descarga: `plantilla-nutricion.csv`

---

## ⚠️ Recomendaciones

### Para Fitness
- ✅ Usa el Excel con todas sus hojas para tener la documentación completa
- ✅ Consulta la hoja "Opciones" para valores válidos
- ✅ Revisa la hoja "Estructura" para entender cada columna
- ✅ Sigue la hoja "Guía" para el proceso correcto

### Para Nutrición
- ⚠️ Solo hay CSV disponible (no Excel)
- ✅ Usa el CSV de ejemplo como referencia
- ✅ Valida manualmente los valores de "Día" y "Comida"
- 💡 **Sugerencia:** Considerar crear un Excel similar a Fitness para Nutrición

---

## 🎯 Próximos Pasos Sugeridos

1. **Crear Excel para Nutrición** similar al de Fitness con:
   - Hoja "Plantilla" con ejemplos
   - Hoja "Opciones" con catálogos (Día, Comida)
   - Hoja "Estructura" con documentación
   - Hoja "Guía" con instrucciones

2. **Unificar formato** entre Fitness y Nutrición

3. **Agregar validación** de valores en la descarga de plantilla de Nutrición





