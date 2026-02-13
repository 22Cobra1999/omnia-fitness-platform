# Informe de Datos e Integridad - Módulo de Nutrición

## 1. Introducción
Este documento analiza la estructura actual de los datos en la tabla `progreso_cliente_nutricion`, identifica inconsistencias críticas en el almacenamiento de estados de progreso (pendientes vs completados) y propone una solución estandarizada para garantizar la integridad de los datos.

## 2. Análisis del Estado Actual

### 2.1 Campos Clave Analizados
- `ejercicios_pendientes`: JSONB que almacena los ítems por realizar.
- `ejercicios_completados`: JSONB que almacena los ítems ya realizados.
- `macros`: JSONB con la información nutricional (calorías, minutos, etc.) indexada por claves compuestas.

### 2.2 Patrones Inconsistentes Detectados
La base de datos presenta al menos 3 estructuras diferentes conviviendo, lo cual dificulta enormemente el mantenimiento y cálculo de métricas.

#### Patrón A: Objetos con Claves Numéricas (El más problemático)
Observado en registros recientes (ej. ID 41 antes del fix).
```json
// PENDIENTES
{
  "0": { "id": 753, "bloque": 1 },
  "1": { "id": 758, "bloque": 2 },
  "blockCount": 3 // Metadatos mezclados con datos
}

// COMPLETADOS
{
  "758_2_7": { "id": 758, "bloque": 2, "orden": 7 } // Clave compuesta arbitraria
}
```
**Problema Crítico:** Al completar un ítem, el frontend intenta eliminarlo de `pendientes` buscando la clave `758_2_7`. Como en pendientes está guardado bajo la clave `"1"`, no lo encuentra, no lo borra, y el ítem queda DUPLICADO en ambos estados.

#### Patrón B: Arrays Planos (El más limpio)
Observado en la mayoría de registros históricos (IDs 23-40).
```json
// PENDIENTES
{
  "ejercicios": [
    { "id": 753, "bloque": 1 },
    { "id": 761, "bloque": 2 }
  ]
}
```
**Ventaja:** Fáciles de iterar y contar.

#### Patrón C: Objetos sin Clave Raíz
Observado en registros antiguos (ej. ID 44).
```json
// COMPLETADOS
{
  "749_1_1": { "id": 749 },
  "759_4_4": { "id": 759 }
}
```
**Problema:** Dificulta saber qué es un ítem y qué es metadata si no se estandarizan las claves.

### 2.3 Problemas de `macros` y `NULLs`
El campo `macros` usa claves como `"753_3"` (ID_ORDEN o ID_BLOQUE).
Si el registro de un ejercicio cambia de orden o bloque, la clave en `ejercicios_completados` podría no coincidir con la de `macros`, resultando en métricas `NULL` o `0` (minutos, calorías perdidas).

## 3. Propuesta de Estandarización Definitive (The Fix)

Para eliminar la deuda técnica y los bugs recurrentes, se debe migrar a una estructura única y predecible.

### 3.1 Nueva Estructura JSON Definida
Tanto `pendientes` como `completados` deben ser **ARRAYS** de objetos uniformes.

```json
// PENDIENTES Y COMPLETADOS
{
  "ejercicios": [
    {
      "id": 753,          // Inmutable
      "bloque": 1,        // Contexto
      "orden": 3,         // Contexto
      "key": "753_1_3"    // (Opcional) ID único generado
    },
    ...
  ],
  "meta": {               // Metadatos SEPARADOS
    "blockCount": 3
  }
}
```

### 3.2 Lógica de Estado (Frontend/Backend)
1.  **Identidad Única:** Un ejercicio se identifica únicamente por su `id` (o la combinación `id` + `bloque` si se repite).
2.  **Transición Atómica:** Al pasar a COMPLETADO:
    *   Se agrega al array `completados`.
    *   Se filtra del array `pendientes` por su ID.
3.  **Trigger Robusto:** La base de datos (ya actualizada) maneja inconsistencias históricas, pero el frontend debe dejar de generar nuevas.

## 4. Plan de Acción Inmediato

1.  **Limpieza Histórica (YA EJECUTADO):** Se han normalizado los registros corruptos (ID 41) a formato Array.
2.  **Trigger Blindado (YA EJECUTADO):** El trigger de cálculo ahora es capaz de parsear las 3 estructuras existentes sin fallar.
3.  **Constraint de Validación (RECOMENDADO):** Agregar un `CHECK CONSTRAINT` en la tabla para rechazar inserciones que contengan claves numéricas `"0", "1"` en los JSONs, forzando al frontend a corregirse.
4.  **Refactor Frontend:** Actualizar la lógica de guardado en el cliente para usar siempre Arrays y limpiar pendientes correctamente.

## 5. Conclusión
El sistema actual es funcional gracias a la "capa de contención" implementada en SQL (triggers de sanitización), pero requiere una actualización en la capa de aplicación (Frontend) para alinearse con el patrón B (Arrays Planos) y evitar reintroducir inconsistencias.
