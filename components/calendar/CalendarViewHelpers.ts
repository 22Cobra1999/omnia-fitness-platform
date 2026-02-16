
import { toMins } from "./utils"

/**
 * Checks if two events overlap based on their start and end times.
 */
export const overlaps = (evA: any, evB: any) => {
    const startA = parseInt(evA.start_time.split('T')[1].replace(':', ''))
    const endA = evA.end_time
        ? parseInt(evA.end_time.split('T')[1].replace(':', ''))
        : startA + 30
    const startB = parseInt(evB.start_time.split('T')[1].replace(':', ''))
    const endB = evB.end_time
        ? parseInt(evB.end_time.split('T')[1].replace(':', ''))
        : startB + 30
    return startA < endB && startB < endA
}

/**
 * Calculates the column layout for a set of events that might overlap.
 */
export const getSmartLayout = (events: any[]) => {
    if (!events.length) return []

    // 1. Sort by start time
    const sorted = [...events].sort((a, b) => {
        const startA = parseInt(a.start_time.split('T')[1].replace(':', ''))
        const startB = parseInt(b.start_time.split('T')[1].replace(':', ''))
        return startA - startB
    })

    // 2. Assign columns
    const columns: any[][] = []
    const eventLayouts = new Map()

    // Packing algorithm: Place in first compatible column
    sorted.forEach((ev) => {
        let placed = false
        for (let i = 0; i < columns.length; i++) {
            const col = columns[i]
            const lastEvInCol = col[col.length - 1]
            if (!overlaps(ev, lastEvInCol)) {
                col.push(ev)
                eventLayouts.set(ev.id, { colIndex: i })
                placed = true
                break
            }
        }
        if (!placed) {
            columns.push([ev])
            eventLayouts.set(ev.id, { colIndex: columns.length - 1 })
        }
    })

    const totalColumns = columns.length

    return sorted.map(ev => {
        const layout = eventLayouts.get(ev.id)
        return {
            ...ev,
            colIndex: layout.colIndex,
            totalCols: totalColumns
        }
    })
}

/**
 * Snaps a clicked position to the nearest 15-minute block.
 */
export const snapTo15Mins = (relativeY: number, height: number, blockStart: string, blockEnd: string) => {
    const startMins = toMins(blockStart)
    const endMins = toMins(blockEnd)
    const blockDuration = endMins - startMins

    const clickRatio = Math.max(0, Math.min(1, relativeY / height))
    const clickedMins = startMins + (clickRatio * blockDuration)

    const snappedMins = Math.round(clickedMins / 15) * 15
    const finalMins = Math.min(Math.max(startMins, snappedMins), endMins - 15)

    const h = Math.floor(finalMins / 60)
    const m = finalMins % 60
    const timeHHMM = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

    return timeHHMM
}
