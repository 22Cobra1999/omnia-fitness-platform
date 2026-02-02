# Omnia Fitness Platform - La Biblia de Procesos

Este documento describe los procesos core de la plataforma, el flujo de datos y el funcionamiento de las tablas.

## 1. Flujo de Compra de Programas (Cliente)

El proceso de adquisición de una actividad (programa, clase, dieta, documento) sigue estos pasos:

### Paso 1: Selección y Pago
- El cliente selecciona un producto en el buscador o catálogo.
- Se inicia el proceso de pago (MercadoPago).
- **Tablas involucradas:** `activities` (para obtener el precio y detalles).

### Paso 2: Notificación y Registro (Webhook/Return)
- Una vez confirmado el pago, se notifican los cambios a la plataforma.
- Se registra la transacción en la tabla `banco`.
- Se crea la inscripción en `activity_enrollments`.
- **Tablas involucradas:** 
    - `banco`: Registra `amount_paid`, `payment_status`, `activity_id`, `client_id`, `enrollment_id`.
    - `activity_enrollments`: Registra `activity_id`, `client_id`, `status` (active), `start_date`.

### Paso 3: Onboarding y Personalización
- Si es un cliente nuevo, completa el **Cuestionario de Onboarding**.
- Sus respuestas se guardan en `client_onboarding_responses`.
- Datos físicos (peso, altura, edad) se guardan en `clients`.
- Perfil básico (avatar, ubicación) se guarda en `user_profiles`.
- **Tablas involucradas:**
    - `client_onboarding_responses`: Preferencias de entrenamiento, nivel de consistencia, estilo de coaching.
    - `clients`: Datos físicos y médicos (`fitness_goals`, `sports`, `health_conditions`).
    - `user_profiles`: `full_name`, `avatar_url`, `location`.
    - `user_injuries`: Registro de lesiones y su severidad.

### Paso 4: Seguimiento y Progreso
- Dependiendo del tipo de programa, el coach puede asignar rutinas o el programa se desbloquea automáticamente.
- El cliente registra su progreso.
- **Tablas involucradas:**
    - `client_metrics`: Registra peso, grasa corporal, etc.
    - `exercise_progress`: Registra récords personales (Pecho, Peso Muerto, etc.) y objetivos específicos.
    - `client_progress_logs`: Registro diario de entrenamientos y actividad física.

## 2. Tipos de Programas y su Funcionamiento

| Tipo | Acceso | Tabla de Contenido |
| :--- | :--- | :--- |
| **Clase presencial** | Calendario | `meets` / `availability_slots` |
| **Programa Online** | Dashboard Cliente | `program_modules` / `program_lessons` |
| **Nutrición** | Perfil / Comidas | `nutrition_plans` |
| **Documentos** | Sección Documentos | `documents` |

## 3. Relación entre Onboarding y Progreso
El Onboarding define el **punto de partida**:
1. El coach utiliza las `client_onboarding_responses` para entender el estilo y metas del cliente.
2. Los `fitness_goals` definen qué métricas serán prioritarias.
3. Las `user_injuries` condicionan los ejercicios asignados (se filtran o adaptan).
4. El progreso se visualiza en el perfil comparando el estado actual con los objetivos definidos en `exercise_progress`.
