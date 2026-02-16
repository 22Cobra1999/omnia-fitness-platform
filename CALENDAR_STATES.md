# Estados de la Agenda (Meet & Eventos)

## Estados Generales del Evento (`status`)
El estado del evento define la validez global de la reunión.

| Estado (`status`) | Descripción | Color/Indicador Visual |
| :--- | :--- | :--- |
| **scheduled** | La reunión está activa y programada. | Depende del RSVP (Ver abajo). |
| **cancelled** | La reunión ha sido eliminada o cancelada por el organizador. | **ROJO** (Badge: CANCELADA). Borde rojo, fondo rojo tenulo. |
| **rescheduled** | La reunión ha sido movida a otra fecha/hora (histórico). | **AZUL** (Badge: REPROGRAMADA). |
| **confirmed** | Estado activo normal (alias de scheduled en algunos contextos). | **NARANJA** (Badge: CONFIRMADA). |

## Estados de Asistencia (`rsvp_status`)
Estado personal de cada participante respecto al evento.

| Estado (`rsvp`) | Descripción | Color/Indicador Visual |
| :--- | :--- | :--- |
| **pending** | Invitación recibida, aún no respondida. | **AMARILLO** (Badge: PENDIENTE). |
| **confirmed** / **accepted** | Asistencia confirmada. | **NARANJA** (Badge: CONFIRMADA). Icono Video lleno. |
| **declined** | Asistencia rechazada o cancelada. | **ROJO** (Badge: RECHAZADA). Icono rojo. |

## Estados de Reprogramación (`pending_reschedule`)
Cuando existe una solicitud de cambio de horario pendiente.

| Condición | Descripción | Indicador Visual |
| :--- | :--- | :--- |
| `pending_reschedule` existe | Hay una propuesta de cambio esperando respuesta. | **ROJO/BORDE** (Badge: CAMBIO SOLICITADO). |

---

# Transiciones de Estado

### De Asistencia (Usuario)
1.  **Pendiente → Confirmada:** Usuario acepta la invitación (`Aceptar`).
    *   **Acción:** Botón "Aceptar".
    *   **Resultado Visual:** Cambia a Naranja (CONFIRMADA).
2.  **Pendiente → Rechazada:** Usuario rechaza la invitación (`Rechazar`).
    *   **Acción:** Botón "Rechazar".
    *   **Resultado Visual:** Cambia a Rojo (RECHAZADA).
3.  **Confirmada → Rechazada:** Usuario cancela su asistencia previamente confirmada (`Cancelar asistencia`).
    *   **Acción:** Botón "Cancelar mi asistencia".
    *   **Resultado Visual:** Cambia a Rojo (RECHAZADA).
    *   **Nota:** *No reversible por el usuario (Reconsideración desactivada).*

### De Evento (Organizador)
1.  **Programada → Cancelada:** Organizador elimina el evento.
    *   **Acción:** Cancelar Evento.
    *   **Resultado Visual:** Rojo (CANCELADA) para todos los participantes.
2.  **Programada → Reprogramada:** Se acepta una solicitud de cambio.
    *   **Acción:** Aceptar Reprogramación.
    *   **Resultado Visual:** El evento original pasa a `rescheduled` (o se mueve), y se crea uno nuevo `confirmed`.

### De Reprogramación
1.  **Solicitud Creada:** Usuario/Coach propone nuevo horario.
    *   **Estado:** Aparece indicador "CAMBIO SOLICITADO".
2.  **Solicitud Cancelada:** Solicitante cancela su propuesta.
    *   **Acción:** "Cancelar reprogramación".
    *   **Resultado Visual:** Regresa al estado anterior (Confirmada/Pendiente).
3.  **Solicitud Aceptada:** Destinatario acepta el cambio.
    *   **Acción:** Aceptar propuesta.
    *   **Resultado Visual:** Evento se mueve a nueva fecha.
4.  **Solicitud Rechazada:** Destinatario rechaza el cambio.
    *   **Acción:** Rechazar propuesta.
    *   **Resultado Visual:** Propuesta desaparece, evento original se mantiene.

---

# Lógica de Optimización (Direct Update)
Para evitar la duplicación de eventos y simplificar la gestión de la agenda:

### Actualización Directa de Turnos Pendientes
Si un usuario intenta modificar un turno que **él mismo creó** y que aún está **pendiente de respuesta** por parte del destinatario:
- **No se genera una nueva solicitud de reprogramación.**
- Se actualiza directamente el `start_time` y `end_time` del evento original.
- El ID del evento se mantiene, preservando la integridad de las relaciones en la base de datos.
---

# Escenarios de Créditos y Cancelaciones

Lógica de negocio para el manejo de créditos según quién inicie, acepte o cancele la sesión.

### 1. Coach cancela Meet, Cliente organizó
- **Escenario:** El cliente solicita una meet (consume crédito pendiente), el coach la recibe pero decide cancelarla/rechazarla.
- **Deducción de Créditos:** NO debe ocurrir hasta que el coach acepte. Si ya se "apartó", debe devolverse íntegramente.
- **Registro:** Se debe marcar `cancelled_by` con el ID del Coach.

### 2. Coach aceptó Meet, Cliente luego cancela
- **Escenario:** Ambos confirmaron la sesión. El cliente decide cancelarla después.
- **Deducción de Créditos:** El crédito ya fue descontado al confirmar. 
- **Política:** Dependerá de la política de cancelación (ej: si es con menos de 24hs, no se devuelve).
- **Registro:** Se debe marcar `cancelled_by` con el ID del Cliente.

### 3. Coach creó Meet, Cliente rechaza
- **Escenario:** El coach propone un horario. El cliente no puede y rechaza (declined).
- **Deducción de Créditos:** NO debe ocurrir. El crédito solo se descuenta si hay mutuo acuerdo (Aceptación del cliente).
- **Registro:** El rsvp del cliente queda en `declined`.

### 4. Coach creó Meet, Cliente aceptó y luego canceló
- **Escenario:** El coach propone, el cliente acepta (se descuenta crédito). Luego el cliente cancela.
- **Deducción de Créditos:** Ocurrió al momento de la aceptación.
- **Política:** Aplica devolución total o parcial según el tiempo de antelación.
- **Registro:** Se debe marcar `cancelled_by` con el ID del Cliente.

---

# Atributos de Auditoría de Cancelación

Para soportar estas lógicas, los eventos y participaciones deben trackear:
- `cancelled_by_user_id`: Quién efectuó la acción de cancelación.
- `cancellation_reason`: Motivo (opcional).
- `cancellation_at`: Marca de tiempo del evento.
- `init_role`: Rol que inició la solicitud (Coach o Cliente).
