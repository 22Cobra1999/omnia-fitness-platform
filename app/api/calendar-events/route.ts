import { NextResponse } from "next/server"
import { query, insert, getAll, getById, update, remove } from "@/lib/db"
// Implementar caché en memoria para reducir consultas a la base de datos
const EVENTS_CACHE = new Map<string, { data: any[]; timestamp: number }>()
const CACHE_TTL = 2 * 60 * 1000 // 2 minutos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const coachId = searchParams.get("coach_id")
    const clientId = searchParams.get("client_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const fastResponse = searchParams.get("fast") === "true"
    // Generar clave de caché basada en los parámetros
    const cacheKey = `events_${id || ""}_${coachId || ""}_${clientId || ""}_${startDate || ""}_${endDate || ""}`
    // Verificar caché
    const now = Date.now()
    const cachedEvents = EVENTS_CACHE.get(cacheKey)
    // Si se solicita respuesta rápida y hay caché, devolverla inmediatamente
    if (fastResponse && cachedEvents && now - cachedEvents.timestamp < CACHE_TTL) {
      console.log("Returning fast cached events for key:", cacheKey)
      return NextResponse.json(cachedEvents.data)
    }
    // Si hay caché válida (no rápida), usarla
    if (cachedEvents && now - cachedEvents.timestamp < CACHE_TTL) {
      console.log("Returning cached events for key:", cacheKey)
      // Actualizar caché en segundo plano si está por expirar
      if (now - cachedEvents.timestamp > CACHE_TTL * 0.8) {
        console.log("Events cache nearing expiration, refreshing in background")
        setTimeout(() => {
          refreshEventsCache(cacheKey, id, coachId, clientId, startDate, endDate).catch((e) =>
            console.error("Error refreshing events cache:", e),
          )
        }, 100)
      }
      return NextResponse.json(cachedEvents.data)
    }
    let dateFilter = ""
    const params: any[] = []
    if (startDate && endDate) {
      dateFilter = "AND start_time >= $3 AND end_time <= $4"
      params.push(startDate, endDate)
    }
    if (id) {
      const event = await getById("calendar_events", Number.parseInt(id))
      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
      }
      // Guardar en caché
      EVENTS_CACHE.set(cacheKey, { data: event, timestamp: now })
      return NextResponse.json(event)
    }
    if (coachId) {
      params.unshift(coachId)
      const events = await query(
        `
        SELECT ce.*, c.name as client_name
        FROM calendar_events ce
        LEFT JOIN clients cl ON ce.client_id = cl.id
        LEFT JOIN users c ON cl.user_id = c.id
        WHERE ce.coach_id = $1 ${dateFilter}
        ORDER BY ce.start_time
      `,
        params,
      )
      // Guardar en caché
      EVENTS_CACHE.set(cacheKey, { data: events, timestamp: now })
      return NextResponse.json(events)
    }
    if (clientId) {
      params.unshift(clientId)
      const events = await query(
        `
        SELECT ce.*, co.name as coach_name
        FROM calendar_events ce
        LEFT JOIN coaches ch ON ce.coach_id = ch.id
        LEFT JOIN users co ON ch.user_id = co.id
        WHERE ce.client_id = $1 ${dateFilter}
        ORDER BY ce.start_time
      `,
        params,
      )
      // Guardar en caché
      EVENTS_CACHE.set(cacheKey, { data: events, timestamp: now })
      return NextResponse.json(events)
    }
    // Get all events
    const events = await getAll("calendar_events")
    // Guardar en caché
    EVENTS_CACHE.set(cacheKey, { data: events, timestamp: now })
    return NextResponse.json(events)
  } catch (error) {
    console.error("Error fetching calendar events:", error)
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 })
  }
}
// Función para actualizar la caché en segundo plano
async function refreshEventsCache(
  cacheKey: string,
  id: string | null,
  coachId: string | null,
  clientId: string | null,
  startDate: string | null,
  endDate: string | null,
) {
  try {
    let dateFilter = ""
    const params: any[] = []
    if (startDate && endDate) {
      dateFilter = "AND start_time >= $3 AND end_time <= $4"
      params.push(startDate, endDate)
    }
    let result
    if (id) {
      result = await getById("calendar_events", Number.parseInt(id))
    } else if (coachId) {
      params.unshift(coachId)
      result = await query(
        `
        SELECT ce.*, c.name as client_name
        FROM calendar_events ce
        LEFT JOIN clients cl ON ce.client_id = cl.id
        LEFT JOIN users c ON cl.user_id = c.id
        WHERE ce.coach_id = $1 ${dateFilter}
        ORDER BY ce.start_time
      `,
        params,
      )
    } else if (clientId) {
      params.unshift(clientId)
      result = await query(
        `
        SELECT ce.*, co.name as coach_name
        FROM calendar_events ce
        LEFT JOIN coaches ch ON ce.coach_id = ch.id
        LEFT JOIN users co ON ch.user_id = co.id
        WHERE ce.client_id = $1 ${dateFilter}
        ORDER BY ce.start_time
      `,
        params,
      )
    } else {
      result = await getAll("calendar_events")
    }
    // Actualizar caché
    EVENTS_CACHE.set(cacheKey, { data: result, timestamp: Date.now() })
    console.log("Events cache refreshed for key:", cacheKey)
  } catch (error) {
    console.error("Error in background refresh of events cache:", error)
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      coach_id,
      client_id,
      title,
      description,
      start_time,
      end_time,
      event_type,
      status,
      timezone_offset,
      timezone_name,
    } = body
    // Validar required fields
    if (!coach_id || !title || !start_time || !end_time) {
      return NextResponse.json({ error: "Coach ID, title, start time, and end time are required" }, { status: 400 })
    }
    // Log timezone information for debugging
    console.log("Timezone info:", { timezone_offset, timezone_name })
    console.log("Event start time:", start_time)
    console.log("Event end time:", end_time)
    // Create event
    const newEvent = await insert("calendar_events", {
      coach_id,
      client_id,
      title,
      description,
      start_time,
      end_time,
      event_type,
      status: status || "scheduled",
      // Eliminamos el campo timezone_info que estaba causando el error
    })
    return NextResponse.json(newEvent, { status: 201 })
  } catch (error) {
    console.error("Error creating calendar event:", error)
    return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 })
  }
}
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }
    const body = await request.json()
    const updatedEvent = await update("calendar_events", Number.parseInt(id), body)
    if (!updatedEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.error("Error updating calendar event:", error)
    return NextResponse.json({ error: "Failed to update calendar event" }, { status: 500 })
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }
    const deletedEvent = await remove("calendar_events", Number.parseInt(id))
    if (!deletedEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    console.error("Error deleting calendar event:", error)
    return NextResponse.json({ error: "Failed to delete calendar event" }, { status: 500 })
  }
}
