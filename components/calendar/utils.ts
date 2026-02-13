
export const formatMinutes = (minsRaw: number) => {
    const mins = Number.isFinite(minsRaw) ? Math.max(0, Math.round(minsRaw)) : 0
    if (mins <= 0) return ''
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h > 0 && m > 0) return `${h}:${String(m).padStart(2, '0')}`
    if (h > 0) return `${h}h`
    return `${m}m`
}

export const START_HOUR = 6
export const END_HOUR = 23
export const TOTAL_MINS = (END_HOUR - START_HOUR) * 60

export const toMins = (h: string) => {
    const [hh, mm] = h.split(':').map(Number)
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0
    return hh * 60 + mm
}

export const add30 = (hhmm: string) => {
    if (!hhmm) return ''
    const t = toMins(hhmm) + 30
    const hh = Math.floor(t / 60)
    const mm = t % 60
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export const getTop = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number)
    const val = h * 60 + m
    const startVal = START_HOUR * 60
    return ((val - startVal) / TOTAL_MINS) * 100
}

export const getHeight = (durationMins: number) => {
    return (durationMins / TOTAL_MINS) * 100
}

export const coalesceSlots = (slots: string[]) => {
    if (!slots.length) return []
    const sorted = [...slots].sort()
    const ranges: { start: string; end: string }[] = []

    let currentStart = sorted[0]
    let currentEnd = sorted[0]
    let expectedNext = add30(currentStart)

    for (let i = 1; i < sorted.length; i++) {
        const t = sorted[i]
        if (t === expectedNext) {
            currentEnd = t
            expectedNext = add30(t)
        } else {
            ranges.push({ start: currentStart, end: add30(currentEnd) })
            currentStart = t
            currentEnd = t
            expectedNext = add30(t)
        }
    }
    ranges.push({ start: currentStart, end: add30(currentEnd) })
    return ranges
}
