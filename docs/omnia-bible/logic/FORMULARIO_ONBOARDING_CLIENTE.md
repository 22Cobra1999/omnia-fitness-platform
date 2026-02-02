# Formulario Onboarding Cliente OMNIA

Este documento define el diseño y flujos del nuevo formulario de onboarding para clientes de OMNIA. El objetivo es recopilar información clave de manera empática para personalizar la experiencia, mejorar el matching con coaches y actividades, y aumentar la retención.

## Filosofía de diseño

*   **Conversacional:** No debe sentirse como un cuestionario burocrático, sino como una charla.
*   **Simple y Visual:** Uso de cards, iconos y microinteracciones.
*   **Sin Juicios:** Lenguaje neutro y empático, especialmente en preguntas sobre constancia.
*   **Orientado a la Acción:** Cada paso tiene un propósito claro para la personalización posterior.

## Estructura del Formulario (7 Pasos)

### 🟠 PASO 1 — Nivel de exigencia

**Objetivo:** Medir ritmo deseado y tolerancia a la exigencia.

*   **Pregunta:** ¿Qué tan fuerte querés ir con esto?
*   **Respuestas (Single Choice - Cards):**
    *   🌱 Tranquilo, paso a paso
    *   ⚖️ Constante y equilibrado
    *   🔥 Exigente, quiero ver resultados
    *   🚀 A fondo, voy con todo

### 🟠 PASO 2 — Deseo de cambio

**Objetivo:** Detectar transición vs mantenimiento.

*   **Pregunta:** ¿Qué estás buscando cambiar hoy?
*   **Respuestas (Single Choice):**
    *   Quiero arrancar desde cero
    *   Quiero mejorar lo que ya hago
    *   Quiero mantenerme activo
    *   Depende del momento / semana

### 🟠 PASO 3 — Horizonte del progreso

**Objetivo:** Medir ansiedad vs paciencia (Time Preference).

*   **Pregunta:** ¿Cuándo te gustaría empezar a notar cambios?
*   **Respuestas (Single Choice):**
    *   Esta semana
    *   En un mes
    *   En 2–3 meses
    *   No tengo apuro, quiero algo sostenible

### 🟠 PASO 4 — Constancia (sin juicio)

**Objetivo:** Estimar riesgo de abandono y necesidad de notificaciones/gamificación.

*   **Pregunta:** En general, ¿qué tan fácil te resulta sostener hábitos?
*   **Respuestas (Escala):**
    *   Me cuesta bastante, abandono fácil
    *   Arranco bien pero me desinflo
    *   Soy bastante constante
    *   Soy disciplinado/a
*   **Microcopy:** "No hay respuestas buenas o malas. Esto nos ayuda a acompañarte mejor."

### 🟠 PASO 5 — Relación con el coach

**Objetivo:** Definir nivel de acompañamiento ideal.

*   **Pregunta:** ¿Cómo te sentís más cómodo/a trabajando con un coach?
*   **Respuestas (Single Choice):**
    *   👤 Independiente: dame el plan
    *   🤝 Acompañado: feedback y ajustes
    *   🧑🏫 Guiado: seguimiento cercano
    *   🔔 Necesito que estén encima mío

### 🟠 PASO 6 — Modalidad + intereses

**Objetivo:** Filtrar formato y tipo de actividad para el feed y recomendaciones.

*   **Pregunta 1:** ¿Cómo te gustaría entrenar principalmente?
    *   Presencial
    *   Online
    *   Híbrido
    *   Me adapto según el momento

*   **Pregunta 2:** ¿Qué tipo de actividades te interesan hoy? (Checkbox, máx. 5)
    *   🏋️ Fuerza / gimnasio
    *   ⚡ Alta intensidad / HIIT / pliometría
    *   🧘 Movilidad / yoga / bienestar
    *   🥗 Nutrición / hábitos
    *   🧠 Mental / foco / respiración
    *   🎯 Programas estructurados
    *   🔁 Rutinas cortas
    *   👥 Actividades grupales
    *   👤 Acompañamiento 1:1

### 🟣 PASO 7 — Últimos detalles (Datos y Conexiones)

**Objetivo:** Recopilar datos duros ("Hard Data") sin fricción al final del flujo.

#### 🩺 Salud
*   **Lesiones (Checkbox):** Rodilla, Espalda, Hombro, Cadera, Tobillo, Muñeca, Ninguna.
*   **Condiciones / patologías:** Cardíaca, Respiratoria, Metabólica, Estrés / ansiedad, Dolor crónico, Otra, Ninguna.
*   **Campo opcional:** "¿Querés aclarar algo?"
*   *Microcopy:* "No es médico. Solo para adaptar mejor las actividades."

#### 📅 Datos personales
*   Fecha de nacimiento
*   Altura (cm)
*   Peso (kg)

#### 📍 Ubicación (Opcional)
*   Búsqueda de Google Places / Mapa
*   Botón: "Usar mi ubicación actual"

#### 🔗 Conectar cuentas (Opcional)
*   **💳 Mercado Pago:** "Pagos simples, créditos de clases, reservas sin fricción".
*   **📆 Google Calendar:** "Clases automáticas, recordatorios, menos olvidos".
*   *Microcopy:* "Podés hacerlo más adelante desde tu perfil."

### ✅ Cierre

*   **Botón Principal:** "Listo, empezar"
*   **Texto:** "Gracias por responder. A partir de ahora, OMNIA se adapta a vos."

## Integración Técnica

### Flujo de Datos
Este formulario poblará principalmente la tabla `profiles` (campo `physicalData` o `onboarding_answers` JSONB) y potencialmente tablas auxiliares para tags de intereses.

### Puntos de Entrada
1.  **Post-Registro:** Inmediatamente después de crear la cuenta (Sign Up).
2.  **Antes de Primera Compra:** Si el usuario saltó el onboarding inicial, se le puede requerir antes de comprar un producto que necesite personalización.
3.  **Desde Perfil:** Opción de "Completar Perfil" si está incompleto.

### Impacto en "Progreso del Cliente"
Las respuestas de este formulario servirán como *seed* (semilla) para la generación automática del progreso y plan inicial del cliente. Por ejemplo:
*   Si elige "Me cuesta sostener hábitos" -> El sistema sugerirá recordatorios más frecuentes.
*   Si elige "Alta intensidad" y "Rodilla" (lesión) -> El sistema alertará o filtrará ejercicios de alto impacto.
