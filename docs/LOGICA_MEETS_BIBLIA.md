---
description: Guía completa de lógica de negocio y UI para reuniones (Meets).
---

# Lógica de Negocio y UI: Reuniones (Meets)

Este documento detalla los flujos, reglas de negocio y representación visual de las reuniones en la plataforma Omnia. Es la "Biblia" para entender cómo se gestionan las Meets desde la perspectiva del Coach y del Cliente.

## 0. Iconografía y Estándares Visuales

La plataforma utiliza iconos consistentes de `lucide-react` en toda la aplicación para mejorar la experiencia del usuario y mantener coherencia visual.

### Iconos Estándar por Tipo de Evento

| Concepto | Icono | Uso |
|----------|-------|-----|
| **Online** | `<Globe />` | Eventos virtuales, videollamadas, talleres en línea |
| **Presencial** | `<MapPin />` | Eventos físicos, ubicación geográfica |
| **Grupal** | `<Users />` | Actividades con múltiples participantes |
| **1:1 / Individual** | `<User />` | Consultas individuales, sesiones personales |
| **Taller** | `<Users />` | Workshops, seminarios grupales |
| **Meet/Consulta** | `<Video />` | Reuniones de consulta individuales o grupales |
| **Calendario** | `<CalendarIcon />` | Fechas, eventos programados |
| **Hora** | `<Clock />` | Horarios, duración |
| **Documento/PDF** | `<FileText />` | Archivos adjuntos, materiales |
| **Ver** | `<Eye />` | Visualizar contenido |
| **Editar** | `<Pencil />` | Modificar información |
| **Actualizar** | `<RefreshCw />` | Cambiar, reemplazar contenido |
| **Eliminar** | `<Trash2 />` | Borrar elementos |

### Aplicación en Activity Cards

En las tarjetas de actividades, usar badges/tags con estos iconos:
- **Modalidad**: `<Globe />` (Online) o `<MapPin />` (Presencial)
- **Tipo**: `<Users />` (Grupal) o `<User />` (Individual/1:1)

### Paleta de Colores

- **Naranja Principal**: `#FF7939` - Acciones primarias, estado "Con vos", elementos activos
- **Blanco/Negro**: Para tags de tipo (Taller, Grupal, etc.)
- **Gris/Zinc**: Elementos secundarios, estados inactivos
- **Rojo**: Acciones destructivas (eliminar)

## 1. Conceptos Generales

Una **Meet** (consulta, videollamada) es un evento en el calendario que involucra a un Coach y uno o más Clientes.

-   **Tabla Principal**: `calendar_events` (type: `consultation`).
-   **Participantes**: `calendar_event_participants` (M-to-N).
-   **Integración**: Google Meet (opcional, automático).

## 2. Tipos de Eventos en Calendario

Existen dos categorías principales de visualización:
1.  **Owned (Propio)**: "Con vos".
    -   Coach ID = Coach Logueado.
    -   (Workaround) Coach ID = Cliente ID (para eventos asignados "al cliente" en legacy o visualización).
2.  **Other (Otro)**:
    -   Eventos de otros coaches.
    -   Se muestran genéricos ("Otro") y sin detalles ricos para respetar privacidad o simplificar la vista, a menos que se tenga permiso explícito.

## 3. Visualización en Calendario (Grid)

El calendario mensual muestra "píldoras" por día. Para evitar confusión, se separan Actividades de Meets.

### Diseño de Celda (Día)
`[Fecha]`

**Fila 1: Actividades (Píldora)**
-   **Contenido**: `X Act` o `Xh Ym`.
-   **Colores**:
    -   **Naranja Sólido**: Todo completado.
    -   **Amarillo**: Pendiente / En curso.
    -   **Rojo (Transparente)**: Pasado y sin empezar (Ausente).
    -   **Gris**: Futuro o sin estado crítico.

**Fila 2: Meets (Icono + Texto)**
-   **Contenido**: `<VideoIcon /> HH:mm`.
-   **Color**: Naranja (`#FF7939`).
-   **Regla**: Solo aparece si hay una Meet "Owned" (Con vos). Si es una meet de otro coach, no se destaca en el grid (o se cuenta en el total genérico si se decidiera, pero actualmente se solicitó separación).

## 4. Visualización en Lista Detallada

Al seleccionar un día, se expande la lista de eventos.

### Estructura de Fila
-   **Icono**:
    -   `<VideoIcon />` (Naranja si es Con Vos, Gris si es Otro).
-   **Título**: Nombre de la Meet.
-   **Etiqueta**: `Con Vos` (debajo del título, en naranja) si eres el organizador.
-   **Estado**: Duración estimada.

### Expansión
Al hacer click, se despliegan los detalles:
-   Horario exacto.
-   Descripción/Notas.
-   **Link de Meet**: "Unirse a la llamada" (si existe).
-   **Botón Acción**: "Ir al detalle" (navega al `coach-calendar-screen` o modal de edición).

## 5. Reglas de Negocio: Edición y Restricciones

### A. Meets Pasadas
**Regla de Oro**: "Ni el coach ni el cliente pueden cambiar una meet que ya pasó."

-   **Frontend**:
    -   Botón de Edición (Lápiz) se reemplaza por un Candado (`LockIcon`).
    -   Tooltip: "No se puede editar una reunión pasada".
    -   Validación en modal: Si `Fecha + Hora Fin < Ahora`, modo solo lectura.
-   **Backend**: Debe rechazar updates a eventos pasados (RLS o lógica de API).

### B. Notificaciones y Confirmación
1.  **Coach crea Meet**: Estado `scheduled`.
    -   Participante (Cliente): Estado `pending`.
2.  **Cliente ve Meet**:
    -   Aparece en su calendario como pendiente ("Por confirmar" o similar, dependiendo del diseño de cliente).
    -   Debe "Confirmar".
3.  **Confirmación**:
    -   Estado pasa a `confirmed`.
    -   **Impacto en Créditos**:
        -   Si tiene créditos: Se descuentan (o se marcan para consumo).
        -   Si es Pago: Se marca como "A pagar" o se procesa pago.
        -   Si es Gratis: Solo cambia estado.

## 6. Lógica de Créditos y Cobro

-   **Con Precio**:
    -   Requiere pago (MercadoPago o saldo a favor).
-   **Sin Precio (Gratis)**:
    -   Puede consumir **Créditos de Meet** (packs comprados previamente) si aplica, o ser totalmente bonificado.
    -   Regla actual: "Gratis (+ usa X créditos)" si el coach lo configura para consumir pack, o "Gratis" puro.

## 7. Integración Google Meet

-   Al crear/editar, si el coach tiene Google Calendar conectado:
    -   Se crea evento en Google Calendar.
    -   Se genera link de `meet.google.com`.
    -   Este link se guarda en `meet_link` y se muestra a ambos participantes.

## 8. Tablas de Base de Datos Clave

```sql
-- Eventos
calendar_events (
  id,
  coach_id,
  client_id, -- Legacy/owner
  title,
  start_time,
  end_time,
  meet_link,
  event_type -- 'consultation'
)

-- Participantes (Estado y Pago)
calendar_event_participants (
  event_id,
  client_id,
  rsvp_status, -- 'pending', 'confirmed', 'declined'
  payment_status, -- 'unpaid', 'paid', 'credit_deduction', 'free'
  participant_role
)

-- Créditos
client_meet_credits_ledger (
  client_id,
  coach_id,
  meet_credits_available
)
```

---
*Documento generado automáticamente por Antigravity para Omnia Fitness Platform.*
