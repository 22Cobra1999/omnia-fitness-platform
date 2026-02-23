# Motor de Reglas OMNIA: Árbol de Decisión

Este documento explica cómo el motor resuelve la aplicación de reglas condicionales cuando un perfil de cliente coincide con múltiples reglas simultáneamente.

## 🌳 Árbol de Resolución de Conflictos

Cuando un cliente interactúa con un producto, el motor evalúa las reglas en este orden:

1.  **¿Coincide el perfil?**
    *   Si el cliente NO cumple con los filtros (Edad, Peso, Género, Nivel, Objetivos, Lesiones), la regla se descarta.
    *   Si coincide, pasa al siguiente nivel.

2.  **Jerarquía por Especificidad (Override)**
    *   **Regla de Oro:** La regla más específica siempre anula a la más general.
    *   **¿Cómo se calcula?** Se asigna un "Score de Especificidad" basado en la cantidad y tipo de filtros.
        *   Filtros Demográficos: +1 punto.
        *   Objetivos/Niveles: +2 puntos por cada uno.
        *   Lesiones: +5 puntos por cada una (Máxima prioridad).
    *   **Resultado:** Si la Regla A es un subconjunto de los criterios de la Regla B (ej: A = "Deportistas", B = "Deportistas con Lesión de Rodilla"), solo se aplica la **Regla B**.

3.  **Acumulación por Complementariedad (Sumatorio)**
    *   Si las reglas coinciden con el cliente pero apuntan a categorías de criterios distintas que no son subconjuntos entre sí.
    *   **Ejemplo:**
        *   Regla A: "Objetivo Ganancia de Fuerza" (+10% peso).
        *   Regla B: "Nivel Avanzado" (+5% series).
    *   **Resultado:** Ambas se aplican y sus efectos se **SUMAN**.

4.  **Resolución de Net-Out (Compensación)**
    *   Si dos reglas aplicables (complementarias) tienen efectos opuestos sobre la misma variable.
    *   **Ejemplo:**
        *   Regla A: +20% peso.
        *   Regla B: -20% peso.
    *   **Resultado:** El motor compensa los valores y el cambio final es **0% (Net-Out)**.

---

## 🏷️ Categorías de Reglas en la Interfaz

| Categoría | Color | Acción del Motor | Descripción |
| :--- | :--- | :--- | :--- |
| **Bloqueo / Conflicto** | 🔴 Rojo | **BLOQUEA** | No se puede crear. Existe una regla idéntica. |
| **Jerarquía** | 🟠 Naranja | **ANULA** | Una regla es más específica que la otra. La específica "gana". |
| **Sumatoria** | 🔵 Azul | **SUMA** | Son reglas complementarias. Los efectos se acumulan. |

---

## ⚖️ El factor "OMNIA Redondea"

El motor aplica un redondeo inteligente después de todos los cálculos para asegurar que:
- Los pesos sean valores lógicos (múltiplos de 1.25kg o 2.5kg según equipo).
- Las repeticiones y series sean números enteros coherentes.
- Las porciones en nutrición no tengan decimales impracticables.
