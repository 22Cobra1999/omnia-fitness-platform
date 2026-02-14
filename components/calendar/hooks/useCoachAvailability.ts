
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/supabase-client'
import { startOfMonth, endOfMonth, addDays, format, startOfWeek } from 'date-fns'

interface CoachAvailabilityRow {
    id: string
    weekday: number
    start_time: string
    end_time: string
    scope: 'always' | 'month'
    year: number | null
    month: number | null
    timezone: string | null
}

interface CoachConsultationInfo {
    active: boolean
    price: number
    time: number
    name: string
}

export const useCoachAvailability = (
    selectedCoachId: string | null,
    meetViewMode: 'month' | 'week' | 'day_split',
    meetWeekStart: Date,
    currentDate: Date,
    durationMinutes: number = 30
) => {
    const supabase = useMemo(() => createClient(), [])

    // Consultations State
    const [coachConsultations, setCoachConsultations] = useState<{
        express: CoachConsultationInfo
        puntual: CoachConsultationInfo
        profunda: CoachConsultationInfo
    }>({
        express: { active: false, price: 0, time: 15, name: 'Express' },
        puntual: { active: false, price: 0, time: 30, name: 'Consulta puntual' },
        profunda: { active: false, price: 0, time: 60, name: 'Sesión profunda' },
    })

    // Availability Rows
    const [coachAvailabilityRows, setCoachAvailabilityRows] = useState<CoachAvailabilityRow[]>([])

    // Booked Slots
    const [bookedSlotsByDay, setBookedSlotsByDay] = useState<Record<string, Set<string>>>({})
    const [bookedSlotsByDayMonth, setBookedSlotsByDayMonth] = useState<Record<string, Set<string>>>({})

    // Load Coach Consultations
    useEffect(() => {
        const loadCoachConsultations = async () => {
            try {
                if (!selectedCoachId) return
                const { data, error } = await (supabase
                    .from('coaches') as any)
                    .select('cafe, cafe_enabled, meet_30, meet_30_enabled, meet_1, meet_1_enabled')
                    .eq('id', selectedCoachId)
                    .single()

                if (error || !data) return

                setCoachConsultations({
                    express: {
                        active: !!(data as any).cafe_enabled,
                        price: Number((data as any).cafe ?? 0) || 0,
                        time: 15,
                        name: 'Express',
                    },
                    puntual: {
                        active: !!(data as any).meet_30_enabled,
                        price: Number((data as any).meet_30 ?? 0) || 0,
                        time: 30,
                        name: 'Consulta puntual',
                    },
                    profunda: {
                        active: !!(data as any).meet_1_enabled,
                        price: Number((data as any).meet_1 ?? 0) || 0,
                        time: 60,
                        name: 'Sesión profunda',
                    },
                })
            } catch {
                // ignore
            }
        }

        loadCoachConsultations()
    }, [selectedCoachId, supabase])

    // Load Coach Availability Rows
    useEffect(() => {
        const loadCoachAvailability = async () => {
            try {
                if (!selectedCoachId) {
                    setCoachAvailabilityRows([])
                    return
                }

                const { data, error } = await (supabase
                    .from('coach_availability_rules') as any)
                    .select('id, weekday, start_time, end_time, scope, year, month, timezone')
                    .eq('coach_id', selectedCoachId)

                if (error) {
                    console.error('Error fetching coach availability rules:', error)
                    setCoachAvailabilityRows([])
                    return
                }

                const toHHMM = (t: any) => {
                    const s = String(t || '')
                    if (!s) return ''
                    return s.slice(0, 5)
                }

                setCoachAvailabilityRows(
                    (Array.isArray(data) ? data : []).map((r: any) => ({
                        id: String(r.id),
                        weekday: Number(r.weekday),
                        start_time: toHHMM(r.start_time),
                        end_time: toHHMM(r.end_time),
                        scope: String(r.scope || '').toLowerCase() === 'month' ? 'month' : 'always',
                        year: r.year == null ? null : Number(r.year),
                        month: r.month == null ? null : Number(r.month),
                        timezone: r.timezone ?? null,
                    }))
                )
            } catch (e) {
                console.error('Error fetching coach availability rules:', e)
                setCoachAvailabilityRows([])
            }
        }

        loadCoachAvailability()
    }, [selectedCoachId, supabase])

    // Load Booked Slots (Week)
    useEffect(() => {
        const loadBookedSlots = async () => {
            try {
                if (!selectedCoachId || meetViewMode !== 'week') {
                    setBookedSlotsByDay({})
                    return
                }

                const start = meetWeekStart
                const end = addDays(meetWeekStart, 7)

                const { data, error } = await (supabase
                    .from('calendar_events') as any)
                    .select('start_time, end_time, event_type, coach_id')
                    .eq('coach_id', selectedCoachId)
                    .eq('event_type', 'consultation')
                    .gte('start_time', start.toISOString())
                    .lt('start_time', end.toISOString())

                if (error) {
                    console.error('Error fetching booked meet slots:', error)
                    setBookedSlotsByDay({})
                    return
                }

                const map: Record<string, Set<string>> = {}
                    ; (data || []).forEach((row: any) => {
                        const startDt = new Date(row.start_time)
                        const endDt = row.end_time
                            ? new Date(row.end_time)
                            : new Date(startDt.getTime() + 30 * 60 * 1000)

                        const startMs = startDt.getTime()
                        const endMs = endDt.getTime()
                        if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return

                        const cursor = new Date(startDt)
                        cursor.setSeconds(0, 0)
                        while (cursor.getTime() < endMs) {
                            const dayKey = format(cursor, 'yyyy-MM-dd')
                            const timeKey = format(cursor, 'HH:mm')
                            if (!map[dayKey]) map[dayKey] = new Set<string>()
                            map[dayKey].add(timeKey)
                            cursor.setMinutes(cursor.getMinutes() + 15)
                        }
                    })
                setBookedSlotsByDay(map)
            } catch (e) {
                console.error('Error fetching booked meet slots:', e)
                setBookedSlotsByDay({})
            }
        }

        loadBookedSlots()
    }, [meetViewMode, meetWeekStart, selectedCoachId, supabase])

    // Load Booked Slots (Month)
    useEffect(() => {
        const loadBookedSlotsMonth = async () => {
            try {
                if (!selectedCoachId) {
                    setBookedSlotsByDayMonth({})
                    return
                }

                const start = startOfMonth(currentDate)
                const end = addDays(endOfMonth(currentDate), 1)

                const { data, error } = await (supabase
                    .from('calendar_events') as any)
                    .select('start_time, end_time, event_type, coach_id')
                    .eq('coach_id', selectedCoachId)
                    .eq('event_type', 'consultation')
                    .gte('start_time', start.toISOString())
                    .lt('start_time', end.toISOString())

                if (error) {
                    console.error('Error fetching month booked meet slots:', error)
                    setBookedSlotsByDayMonth({})
                    return
                }

                const map: Record<string, Set<string>> = {}
                    ; (data || []).forEach((row: any) => {
                        const startDt = new Date(row.start_time)
                        const endDt = row.end_time
                            ? new Date(row.end_time)
                            : new Date(startDt.getTime() + 30 * 60 * 1000)

                        const startMs = startDt.getTime()
                        const endMs = endDt.getTime()
                        if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return

                        const cursor = new Date(startDt)
                        cursor.setSeconds(0, 0)
                        while (cursor.getTime() < endMs) {
                            const dayKey = format(cursor, 'yyyy-MM-dd')
                            const timeKey = format(cursor, 'HH:mm')
                            if (!map[dayKey]) map[dayKey] = new Set<string>()
                            map[dayKey].add(timeKey)
                            cursor.setMinutes(cursor.getMinutes() + 15)
                        }
                    })
                setBookedSlotsByDayMonth(map)
            } catch (e) {
                console.error('Error fetching month booked meet slots:', e)
                setBookedSlotsByDayMonth({})
            }
        }

        loadBookedSlotsMonth()
    }, [selectedCoachId, currentDate, supabase])

    // Get Slots For Date
    const getSlotsForDate = useCallback((date: Date, durationMinutes: number = 30): string[] => {
        if (!selectedCoachId) return []

        const weekday = date.getDay()
        const month = date.getMonth() + 1
        const year = date.getFullYear()

        const toMinutes = (hhmm: string) => {
            const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10))
            if (!Number.isFinite(h) || !Number.isFinite(m)) return 0
            return h * 60 + m
        }
        const toHHMM = (mins: number) => {
            const h = Math.floor(mins / 60)
            const m = mins % 60
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        }

        // Handle DB weekday format differences if any (0=Sunday vs 1=Sunday etc)
        // Original logic from CalendarView:
        const weekdayDbCandidates = new Set<number>([
            weekday,
            // specific adjustments if DB uses 1-7 (1=Monday) vs 0-6 (0=Sunday)
            // The original code had: weekday, weekday === 0 ? 7 : weekday, (weekday + 6) % 7
            // This covers multiple conventions.
            weekday === 0 ? 7 : weekday,
            (weekday + 6) % 7,
        ])

        const rows = coachAvailabilityRows.filter((r) => {
            if (!weekdayDbCandidates.has(r.weekday)) return false
            if (r.scope === 'always') return true
            if (!r.year || !r.month) return false
            return r.year === year && r.month === month
        })

        const dayKey = format(date, 'yyyy-MM-dd')
        const booked = (meetViewMode === 'week' ? bookedSlotsByDay?.[dayKey] : bookedSlotsByDayMonth?.[dayKey]) || new Set<string>()

        const requiredSlotBlocks = Math.ceil(durationMinutes / 15)
        const slots = new Set<string>()

        rows.forEach(r => {
            const startMins = toMinutes(r.start_time)
            const endMins = toMinutes(r.end_time)

            // Loop in 15 min increments
            for (let t = startMins; t + 15 <= endMins; t += 15) {
                let ok = true
                // Check if the sequence of blocks fits and is not booked
                for (let i = 0; i < requiredSlotBlocks; i++) {
                    const checkMins = t + i * 15
                    // If this block goes beyond end time of availability
                    if (checkMins + 15 > endMins) {
                        ok = false
                        break
                    }
                    // Check if booked
                    const timeStr = toHHMM(checkMins)
                    if (booked.has(timeStr)) {
                        ok = false
                        break
                    }
                }
                if (ok) {
                    slots.add(toHHMM(t))
                }
            }
        })

        return Array.from(slots).sort((a, b) => a.localeCompare(b))

    }, [coachAvailabilityRows, selectedCoachId, meetViewMode, bookedSlotsByDay, bookedSlotsByDayMonth])

    // Available Slots Count By Day (Month View) - Now using RPC
    const [availableSlotsCountByDay, setAvailableSlotsCountByDay] = useState<Record<string, number>>({})

    useEffect(() => {
        const loadAvailabilitySummary = async () => {
            if (!selectedCoachId) {
                setAvailableSlotsCountByDay({})
                return
            }

            const monthStart = startOfMonth(currentDate)
            const monthEnd = endOfMonth(currentDate)

            // Add margin to be safe (e.g. previous/next days for grid edges if needed, but grid usually stricter)
            // Just fetching current month is fine.

            const { data, error } = await supabase.rpc('get_coach_availability_summary', {
                p_coach_id: selectedCoachId,
                p_start_date: format(monthStart, 'yyyy-MM-dd'),
                p_end_date: format(monthEnd, 'yyyy-MM-dd')
            })

            if (error) {
                console.error('Error fetching availability summary:', error)
                return
            }

            const map: Record<string, number> = {}
            if (data && Array.isArray(data)) {
                data.forEach((row: any) => {
                    if (row.has_slots) {
                        map[row.day_date] = row.total_minutes_available
                    }
                })
            }
            setAvailableSlotsCountByDay(map)
        }

        loadAvailabilitySummary()
    }, [selectedCoachId, currentDate, supabase])

    return {
        coachConsultations,
        coachAvailabilityRows,
        bookedSlotsByDay,
        bookedSlotsByDayMonth,
        getSlotsForDate,
        availableSlotsCountByDay
    }
}
