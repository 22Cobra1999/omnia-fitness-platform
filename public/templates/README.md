# 📋 Templates CSV para Programas

## 🚀 Características del Sistema

### ✅ Detección Automática de Tipo
El sistema detecta automáticamente si tu CSV es de **Fitness**, **Nutrición** o **Mixto** basándose en las columnas del archivo.

### ✅ Procesamiento Inteligente
- **Saltado automático de encabezados**: La primera fila se ignora automáticamente
- **Validación específica por tipo**: Cada tipo tiene sus propias reglas de validación
- **Feedback detallado**: Errores específicos por fila y columna

### ✅ Interfaz Visual
- **Badges de tipo**: Indicadores visuales del tipo detectado (🏋️ Fitness, 🥗 Nutrición, 🔄 Mixto)
- **Contadores de filas**: Total procesadas, válidas y errores
- **Preview de datos**: Primera y última fila para verificación

## 🏋️ Programa de Fitness

### Estructura de Columnas:
1. **Semana** - Número de la semana (1, 2, 3, etc.)
2. **Día** - Día de la semana (Lunes, Martes, etc.)
3. **Nombre de la Actividad** - Nombre del ejercicio
4. **Descripción** - Descripción detallada del ejercicio
5. **Duración (min)** - Duración en minutos
6. **Tipo de Ejercicio** - Categoría (Fuerza, Flexibilidad, Resistencia, etc.)
7. **Nivel de Intensidad** - Alta, Moderada, Baja
8. **Equipo Necesario** - Equipamiento requerido
9. **1RM** - Una repetición máxima (opcional)
10. **Detalle de Series (peso-repeticiones-series)** - Formato: [(peso-repeticiones-series)] o múltiples bloques: [(peso1-rep1-ser1);(peso2-rep2-ser2);...]
11. **video_url** - URL del video demostrativo (opcional)

### Ejemplo:
```csv
Semana,Día,Nombre de la Actividad,Descripción,Duración (min),Tipo de Ejercicio,Nivel de Intensidad,Equipo Necesario,1RM,Detalle de Series (peso-repeticiones-series),video_url
1,Lunes,Remo con barra,Ejercicio para trabajar piernas.,40,Flexibilidad,Alta,Ninguno,,[(75-14-2)],https://vimeo.com/ejercicio_demo
```

## 🥗 Programa de Nutrición

### Estructura de Columnas:
1. **Semana** - Número de la semana (1, 2, 3, etc.)
2. **Día** - Día de la semana (Lunes, Martes, etc.)
3. **Comida** - Tipo de comida (Desayuno, Almuerzo, Cena, Snack)
4. **Nombre** - Nombre del plato
5. **Calorías** - Calorías totales
6. **Proteínas (g)** - Gramos de proteína
7. **Carbohidratos (g)** - Gramos de carbohidratos
8. **Peso** - Peso en gramos
9. **Receta** - Instrucciones de preparación
10. **video_url** - URL del video demostrativo (opcional)

### Ejemplo:
```csv
Semana,Día,Comida,Nombre,Calorías,Proteínas (g),Carbohidratos (g),Peso,Receta,video_url
1,Lunes,Desayuno,Avena con frutas,300,10,50,250,"1. Cocina la avena y agrega las frutas frescas por encima.",https://vimeo.com/ejercicio_demo
```

## 📝 Instrucciones de Uso:

1. **Descarga el template** correspondiente a tu tipo de programa
2. **Completa los datos** siguiendo la estructura exacta
3. **Guarda como CSV** (UTF-8 encoding)
4. **Sube el archivo** en la sección "CSV de actividades"

## ⚠️ Notas Importantes:

- **Mantén el orden exacto** de las columnas
- **Usa comillas** para campos que contengan comas
- **El formato de series** debe ser: `[(peso-repeticiones-series)]`
- **Los videos son opcionales** pero recomendados
- **Asegúrate de que los días** coincidan con tu programa

## 🔧 Formato de Series (Fitness):

- **Peso**: Kilogramos (ej: 50)
- **Repeticiones**: Número de repeticiones (ej: 12)
- **Series**: Número de series (ej: 3)
- **Formato simple**: `[(50-12-3)]`
- **Formato múltiples bloques**: `[(33-10-3);(80-8-2);(32-11-1)]`
- **Separador**: Usa `;` para separar múltiples bloques de series

## 📊 Ejemplos de Niveles de Intensidad:

- **Alta**: Ejercicios intensos, alta frecuencia cardíaca
- **Moderada**: Ejercicios de intensidad media
- **Baja**: Ejercicios suaves, de recuperación

## 🎯 Proceso de Validación

### 1. Detección Automática
- El sistema analiza las columnas del CSV
- Compara con patrones de Fitness y Nutrición
- Determina el tipo automáticamente
- Muestra badge visual del tipo detectado

### 2. Validación de Encabezados
- Verifica que todas las columnas requeridas estén presentes
- Identifica columnas faltantes específicas por tipo
- Proporciona mensajes de error claros

### 3. Validación de Datos
- **Fitness**: Valida duración, formato de series
- **Nutrición**: Valida calorías, proteínas, carbohidratos
- **Ambos**: Verifica números positivos y formatos correctos

### 4. Feedback Completo
- **Total de filas**: Número total procesadas
- **Filas válidas**: Que pasaron todas las validaciones
- **Errores**: Lista detallada por fila y tipo de error
- **Preview**: Primera y última fila para verificación

## ⚠️ Notas Importantes

- **Encabezados**: La primera fila debe contener los nombres de las columnas (se ignora automáticamente)
- **Formato CSV**: Guarda desde Excel como "Valores separados por comas (.csv)"
- **Codificación**: Usa UTF-8 para caracteres especiales
- **Series múltiples**: Separa bloques con punto y coma (;)
- **URLs de video**: Asegúrate de que sean URLs válidas de Vimeo

## 🎉 Beneficios

✅ **Detección automática** - No necesitas seleccionar tipo manualmente  
✅ **Validación inteligente** - Errores específicos por tipo de programa  
✅ **Feedback visual** - Badges y contadores claros  
✅ **Procesamiento robusto** - Maneja encabezados automáticamente  
✅ **Formato flexible** - Soporta series simples y múltiples




