import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { addDays, format, parse, addMinutes } from "date-fns"
// Duración predeterminada de las consultas en minutos
const DEFAULT_CONSULTATION_DURATION = 30
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const coachId = searchParams.get("coach_id")
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const consultationType = searchParams.get("consultation_type") || "videocall"
    if (!coachId || !startDate) {
      return NextResponse.json({ error: "Coach ID and start date are required" }, { status: 400 })
    }
    const supabase = createRouteHandlerClient({ cookies })
    // Calcular fecha de fin si no se proporciona (7 días desde la fecha de inicio)
    const calculatedEndDate = endDate || format(addDays(new Date(startDate), 7), "yyyy-MM-dd")
    // 1. Obtener la disponibilidad regular del coach
    const { data: regularAvailability, error: availabilityError } = await supabase
      .from("coach_availability")
      .select("*")
      .eq("coach_id", coachId)
      .eq("is_active", true)
      .or(`consultation_type.eq.${consultationType},consultation_type.eq.both`)
    if (availabilityError) {
      console.error("Error fetching coach availability:", availabilityError)
      return NextResponse.json({ error: "Failed to fetch availability" }, { status: 500 })
    }
    // 2. Obtener excepciones de disponibilidad
    const { data: exceptions, error: exceptionsError } = await supabase
      .from("coach_availability_exceptions")
      .select("*")
      .eq("coach_id", coachId)
      .gte("date", startDate)
      .lte("date", calculatedEndDate)
    if (exceptionsError) {
      console.error("Error fetching exceptions:", exceptionsError)
      return NextResponse.json({ error: "Failed to fetch availability exceptions" }, { status: 500 })
    }
    // 3. Obtener reservas existentes
    const { data: existingBookings, error: bookingsError } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("coach_id", coachId)
      .gte("start_time", `${startDate}T00:00:00`)
      .lte("start_time", `${calculatedEndDate}T23:59:59`)
    if (bookingsError) {
      console.error("Error fetching existing bookings:", bookingsError)
      return NextResponse.json({ error: "Failed to fetch existing bookings" }, { status: 500 })
    }
    // 4. Generar slots disponibles
    const availableSlots = generateAvailableSlots(
      regularAvailability || [],
      exceptions || [],
      existingBookings || [],
      startDate,
      calculatedEndDate,
      consultationType as string,
    )
    return NextResponse.json(availableSlots)
  } catch (error) {
    console.error("Error in available slots API:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
function generateAvailableSlots(
  regularAvailability: any[],
  exceptions: any[],
  existingBookings: any[],
  startDate: string,
  endDate: string,
  consultationType: string,
) {
  const slots: any[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  // Para cada día en el rango
  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    const currentDate = format(day, "yyyy-MM-dd")
    const dayOfWeek = day.getDay() // 0 = Domingo, 6 = Sábado
    // Verificar si hay una excepción para este día
    const dayException = exceptions.find((exc) => exc.date === currentDate && exc.exception_type === "unavailable")
    // Si el día está marcado como no disponible, saltar al siguiente día
    if (dayException) {
      continue
    }
    // Obtener disponibilidad personalizada para este día si existe
    const customHours = exceptions.find(
      (exc) =>
        exc.date === currentDate &&
        exc.exception_type === "custom_hours" &&
        (exc.consultation_type === consultationType || exc.consultation_type === "both"),
    )
    // Determinar qué horarios usar (personalizados o regulares)
    let dayAvailability
    if (customHours) {
      // Usar horarios personalizados
      dayAvailability = [
        {
          day_of_week: dayOfWeek,
          start_time: customHours.start_time,
          end_time: customHours.end_time,
          consultation_type: customHours.consultation_type,
        },
      ]
    } else {
      // Usar horarios regulares para este día de la semana
      dayAvailability = regularAvailability.filter((avail) => avail.day_of_week === dayOfWeek)
    }
    // Para cada bloque de disponibilidad en este día
    for (const timeBlock of dayAvailability) {
      // Convertir las horas de inicio y fin a objetos Date
      const startTime = parse(timeBlock.start_time, "HH:mm:ss", day)
      const endTime = parse(timeBlock.end_time, "HH:mm:ss", day)
      // Generar slots de 30 minutos
      let slotStart = new Date(startTime)
      while (addMinutes(slotStart, DEFAULT_CONSULTATION_DURATION) <= endTime) {
        const slotEnd = addMinutes(slotStart, DEFAULT_CONSULTATION_DURATION)
        // Verificar si este slot se superpone con alguna reserva existente
        const isBooked = existingBookings.some((booking) => {
          const bookingStart = new Date(booking.start_time)
          const bookingEnd = new Date(booking.end_time)
          return (
            (slotStart >= bookingStart && slotStart < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
            (slotStart <= bookingStart && slotEnd >= bookingEnd)
          )
        })
        if (!isBooked) {
          slots.push({
            id: `${currentDate}-${format(slotStart, "HH:mm")}-${format(slotEnd, "HH:mm")}`,
            date: currentDate,
            start_time: format(slotStart, "HH:mm"),
            end_time: format(slotEnd, "HH:mm"),
            is_available: true,
            consultation_type: consultationType,
            coach_id: regularAvailability[0]?.coach_id,
          })
        }
        // Avanzar al siguiente slot
        slotStart = slotEnd
      }
    }
  }
  return slots
}
