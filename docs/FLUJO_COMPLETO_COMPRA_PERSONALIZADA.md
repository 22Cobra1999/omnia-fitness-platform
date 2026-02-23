# 🔄 Flujo Completo: Compra y Personalización Dinámica (OMNIA)

Este documento detalla el ciclo de vida de un producto desde el pago hasta la instanciación personalizada basada en biometría y encuestas.

## 1. Fase de Pago y Activación
1.  **Transacción**: El cliente completa el pago vía Mercado Pago.
2.  **Webhook**: El sistema valida el pago y registra la transacción en `banco`.
3.  **Enrollment**: Se crea el registro en `activity_enrollments` vinculando al cliente con el producto.
4.  **Verificación de Perfil**: El sistema verifica si existen respuestas en `onboarding_answers` y `physicalData` (Biometría).

## 2. El Motor de Personalización (Conditional Rules)
Antes de que el cliente vea su primera rutina, el sistema procesa las **Reglas Condicionales** definidas por el Coach.

### 📊 Inputs del Motor:
-   **Encuestas**: Nivel de exigencia, deseo de cambio, constancia, relación con el coach.
-   **Biometría**: Edad, Peso, Altura, Género.
-   **Salud**: Lesiones declaradas (Rodilla, Espalda, etc.).

### ⚙️ Lógica de Match (`product_conditional_rules`):
-   El motor busca reglas en la tabla `product_conditional_rules` que coincidan con el perfil del cliente.
-   **Ejemplo de Regla**: 
    -   *Criterio*: `Género == Femenino` AND `Objetivo == Fuerza`.
    -   *Ajuste*: `Peso = Base * 0.9`, `Reps = Base + 2`.

## 3. El Momento de la Verdad: El Botón "Empezar" (Start)

A diferencia de otros sistemas, OMNIA no genera el plan al comprar, sino al **presionar "Empezar" (Start)**. Esto garantiza que si el cliente actualizó su peso o salud ayer, el plan se calcule con los datos más frescos hoy.

### Secuencia Técnica de Instanciación:

1.  **Fase de Definición de Variables (The "How"):**
    -   **Consulta de Contenido**: El sistema lee la librería base (`ejercicios_detalles` o `nutrition_program_details`).
    -   **Consulta de Perfil**: Lee las respuestas de la tabla **`client_onboarding_responses`** (Biometría + Encuestas + Salud).
    -   **Cálculo Condicional**: Cruza lo anterior con **`product_conditional_rules`** para obtener las **Variables Finales**.

2.  **Fase de Estructura (The "When"):**
    -   **Consulta de Planificación**: Lee la agenda maestra (`planificacion_ejercicios` o `planificacion_platos`).
    -   **Consulta de Ciclos**: Lee la tabla **`periodos`** para saber cuántas veces replicar esa agenda.

3.  **Fase de Ejecución (The "Action"):**
    -   **Inserción Masiva**: Con las variables ya "cocinadas", se insertan todas las filas en **`progreso_cliente`** (Fitness) o **`progreso_cliente_nutricion`** (Nutrición).
    -   Cada fila es un registro único e independiente (Snapshot).

## 4. Gestión de Fechas y Vencimiento (`activity_enrollments`)

La tabla **`activity_enrollments`** es el cerebro que controla la vida de la compra. Sus campos clave son:

-   **`start_date`**: Fecha real en que el cliente presionó Start.
-   **`expiration_date`**: Fecha límite total de la compra. Superada esta fecha, el producto expira.
-   **`program_end_date`**: Fecha calculada del fin del programa actual.
-   **`dias_para_empezar`**: Limite de tiempo antes de que el sistema fuerce el inicio.

### 🧹 El Proceso de Expiración (Purga)

Cuando la `expiration_date` se cumple:
1.  **Borrado de Detalle**: Todas las filas pesadas de **`progreso_cliente`** y **`progreso_cliente_nutricion`** (donde están todos los pesos/reps de cada día) se eliminan para liberar espacio.
2.  **Persistencia del Resumen**: Lo único que sobrevive para siempre es el registro en **`progreso_diario_actividad`**.
    -   Este registro es el "diario" consolidado (calorías totales, minutos totales, % completado).
    -   Esto permite que el cliente vea su historia en el calendario sin saturar la base de datos con detalles técnicos viejos.

---
> [!NOTE]
> Este diseño permite que el cliente pueda re-comprar el mismo plan (`activity_id`) sin que las rutinas viejas choquen con las nuevas, gracias a que el `enrollment_id` es único para cada compra.
