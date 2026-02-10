import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/supabase-client"
import { toast } from 'sonner'

export interface AvailabilityRule {
    id: string
    dbKey?: {
        start: string
        end: string
        scope: 'always' | 'month'
        year?: number | null
        month?: number | null
    }
    dbIds?: string[]
    start: string
    end: string
    days: number[]
    months?: number[]
    scope: 'always' | 'months'
}

export function useCoachAvailability(coachId: string | null) {
    const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([])
    const [availabilitySaving, setAvailabilitySaving] = useState(false)
    const [availabilityDrafts, setAvailabilityDrafts] = useState<
        Record<
            string,
            {
                start: string
                end: string
                days: number[]
                months: number[]
            }
        >
    >({})

    const supabase = createClient()

    const getTimezone = () => {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone
        } catch {
            return 'UTC'
        }
    }

    const isAllDays = (days: number[]) => {
        return days.length === 7 && [0, 1, 2, 3, 4, 5, 6].every((d) => days.includes(d))
    }

    const isAllMonths = (months: number[]) => {
        return months.length === 12 && [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].every((m) => months.includes(m))
    }

    const loadAvailability = async () => {
        if (!coachId) return
        try {
            const { data, error } = await supabase
                .from('coach_availability_rules')
                .select('id, coach_id, weekday, start_time, end_time, scope, year, month, timezone')
                .eq('coach_id', coachId)
                .order('start_time', { ascending: true })

            if (error) {
                console.error('Error loading coach availability:', error)
                return
            }

            const toHHMM = (t: any) => {
                const s = String(t || '')
                if (!s) return ''
                return s.slice(0, 5)
            }

            const rows = Array.isArray(data) ? data : []

            type Group = {
                id: string
                dbIds: string[]
                start: string
                end: string
                scope: 'always' | 'months'
                dbKey: { start: string; end: string; scope: 'always' | 'month'; year?: number | null; month?: number | null }
                days: Set<number>
                months: Set<number>
            }

            const groups = new Map<string, Group>()

            for (const r of rows as any[]) {
                const start = toHHMM(r?.start_time)
                const end = toHHMM(r?.end_time)
                const weekday = Number(r?.weekday)
                const dbScope = String(r?.scope || '').toLowerCase() === 'month' ? 'month' : 'always'
                const year = r?.year == null ? null : Number(r.year)
                const month = r?.month == null ? null : Number(r.month)
                const id = String(r?.id || '')

                if (!id || !start || !end || !Number.isFinite(weekday)) continue

                const key = `${start}|${end}|${dbScope}|${year ?? ''}|${month ?? ''}`
                const existing = groups.get(key)
                if (!existing) {
                    const monthIndex = dbScope === 'month' && Number.isFinite(month) ? (month as number) - 1 : null
                    groups.set(key, {
                        id: key,
                        dbIds: [id],
                        start,
                        end,
                        scope: dbScope === 'month' ? 'months' : 'always',
                        dbKey: { start, end, scope: dbScope, year, month },
                        days: new Set([weekday]),
                        months: new Set(monthIndex == null ? [] : [monthIndex]),
                    })
                } else {
                    existing.dbIds.push(id)
                    existing.days.add(weekday)
                    if (dbScope === 'month' && Number.isFinite(month)) existing.months.add((month as number) - 1)
                }
            }

            const uiRules = Array.from(groups.values())
                .map((g) => {
                    const days = Array.from(g.days.values()).sort((a, b) => a - b)
                    const months = Array.from(g.months.values()).sort((a, b) => a - b)
                    return {
                        id: g.id,
                        dbKey: g.dbKey,
                        dbIds: g.dbIds,
                        start: g.start,
                        end: g.end,
                        days,
                        months: g.scope === 'months' ? months : undefined,
                        scope: g.scope,
                    }
                })
                .sort((a, b) => (a.start + a.end).localeCompare(b.start + b.end))

            setAvailabilityRules(uiRules)

            // Inicializar drafts
            const drafts: any = {}
            uiRules.forEach((r: any) => {
                drafts[r.id] = {
                    start: r.start,
                    end: r.end,
                    days: [...r.days],
                    months: r.months ? [...r.months] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                }
            })
            setAvailabilityDrafts(drafts)

        } catch (e) {
            console.error('Error loading coach availability:', e)
        }
    }

    const saveAvailability = async (currentYear: number) => {
        if (!coachId) return
        setAvailabilitySaving(true)
        try {
            const tz = getTimezone()
            const year = currentYear
            const all: Array<{ oldDbIds: string[]; inserts: any[]; ruleId: string }> = []

            for (const r of availabilityRules) {
                const d = availabilityDrafts[r.id]
                if (!d) continue

                const start = String(d.start || '').slice(0, 5)
                const end = String(d.end || '').slice(0, 5)
                const days = Array.isArray(d.days) ? Array.from(new Set(d.days)).sort((a, b) => a - b) : []
                const months = Array.isArray(d.months) ? Array.from(new Set(d.months)).sort((a, b) => a - b) : []

                if (!start || !end || days.length === 0) continue

                const always = isAllDays(days) && (months.length === 0 || isAllMonths(months))
                const inserts: any[] = []

                if (always) {
                    for (const wd of days) {
                        inserts.push({
                            coach_id: coachId,
                            weekday: wd,
                            start_time: `${start}:00`,
                            end_time: `${end}:00`,
                            scope: 'always',
                            year: null,
                            month: null,
                            timezone: tz,
                        })
                    }
                } else {
                    for (const m of months) {
                        for (const wd of days) {
                            inserts.push({
                                coach_id: coachId,
                                weekday: wd,
                                start_time: `${start}:00`,
                                end_time: `${end}:00`,
                                scope: 'month',
                                year,
                                month: m + 1,
                                timezone: tz,
                            })
                        }
                    }
                }

                all.push({ oldDbIds: Array.isArray(r.dbIds) ? r.dbIds : [], inserts, ruleId: r.id })
            }

            for (const item of all) {
                if (item.oldDbIds.length > 0) {
                    const { error: delErr } = await supabase
                        .from('coach_availability_rules')
                        .delete()
                        .in('id', item.oldDbIds as any)

                    if (delErr) {
                        console.error('Error deleting old availability rows:', delErr)
                        toast.error(delErr.message || 'No se pudo guardar la disponibilidad')
                        return
                    }
                }

                if (item.inserts.length > 0) {
                    const { error: insErr } = await supabase
                        .from('coach_availability_rules')
                        .insert(item.inserts as any)

                    if (insErr) {
                        console.error('Error inserting availability rows:', insErr)
                        toast.error(insErr.message || 'No se pudo guardar la disponibilidad')
                        return
                    }
                }
            }

            toast.success('Disponibilidad guardada')
            await loadAvailability()
        } finally {
            setAvailabilitySaving(false)
        }
    }

    const deleteAvailabilityRule = async (id: string) => {
        const rule = availabilityRules.find((r) => r.id === id)
        if (!rule?.dbIds || rule.dbIds.length === 0) {
            setAvailabilityRules((prev) => prev.filter((r) => r.id !== id))
            return
        }

        try {
            const { error } = await supabase
                .from('coach_availability_rules')
                .delete()
                .in('id', rule.dbIds as any)

            if (error) {
                console.error('Error deleting availability rule:', error)
                toast.error(error.message || 'No se pudo eliminar la regla')
                return
            }

            setAvailabilityRules((prev) => prev.filter((r) => r.id !== id))
        } catch (e) {
            console.error('Error deleting availability rule:', e)
            toast.error('No se pudo eliminar la regla')
        }
    }

    useEffect(() => {
        if (coachId) loadAvailability()
    }, [coachId])

    return {
        availabilityRules,
        setAvailabilityRules,
        availabilityDrafts,
        setAvailabilityDrafts,
        availabilitySaving,
        saveAvailability,
        deleteAvailabilityRule,
        loadAvailability
    }
}
