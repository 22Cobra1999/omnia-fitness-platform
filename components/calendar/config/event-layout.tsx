
import { getSmartLayout, snapTo15Mins } from "../CalendarViewHelpers"
import { START_HOUR, TOTAL_MINS } from "../utils"

export interface RenderClientEventsProps {
    dayKey: string
    meetEventsByDate: Record<string, any[]>
    selectedMeetRequest: any
    coachConsultations: any
    selectedConsultationType: 'express' | 'puntual' | 'profunda'
    openMeetById: (id: string) => void
}

export const renderClientEvents = ({
    dayKey,
    meetEventsByDate,
    selectedMeetRequest,
    coachConsultations,
    selectedConsultationType,
    openMeetById
}: RenderClientEventsProps) => {
    const rawEvents = [...(meetEventsByDate[dayKey] || [])]
    if (selectedMeetRequest && selectedMeetRequest.dayKey === dayKey) {
        const duration = coachConsultations[selectedConsultationType]?.time || 30
        const startIso = `${dayKey}T${selectedMeetRequest.timeHHMM}:00`
        const [h, m] = selectedMeetRequest.timeHHMM.split(':').map(Number)
        const totalMins = h * 60 + m + duration
        const endH = Math.floor(totalMins / 60)
        const endM = totalMins % 60
        const endIso = `${dayKey}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`

        rawEvents.push({
            id: 'ghost-block',
            title: selectedMeetRequest.title || 'Nuevo Meet',
            start_time: startIso,
            end_time: endIso,
            isGhost: true
        } as any)
    }

    const sorted = [...rawEvents].sort((a, b) => a.start_time.localeCompare(b.start_time))
    const clusters: any[][] = []
    let currentCluster: any[] = []
    let clusterEnd = 0

    sorted.forEach(ev => {
        const startVal = parseInt(ev.start_time.split('T')[1].replace(':', ''))
        const endVal = ev.end_time
            ? parseInt(ev.end_time.split('T')[1].replace(':', ''))
            : startVal + 30

        if (currentCluster.length === 0) {
            currentCluster.push(ev)
            clusterEnd = endVal
        } else if (startVal < clusterEnd) {
            currentCluster.push(ev)
            clusterEnd = Math.max(clusterEnd, endVal)
        } else {
            clusters.push(currentCluster)
            currentCluster = [ev]
            clusterEnd = endVal
        }
    })
    if (currentCluster.length > 0) clusters.push(currentCluster)

    return clusters.flatMap(cluster => {
        const layoutEvents = getSmartLayout(cluster)
        return layoutEvents.map((ev) => {
            const startMins = Number(ev.start_time.split('T')[1].substring(0, 5).split(':')[0]) * 60 + Number(ev.start_time.split('T')[1].substring(0, 5).split(':')[1])
            const endMins = ev.end_time
                ? Number(ev.end_time.split('T')[1].substring(0, 5).split(':')[0]) * 60 + Number(ev.end_time.split('T')[1].substring(0, 5).split(':')[1])
                : startMins + 30

            const duration = endMins - startMins
            const top = ((startMins - START_HOUR * 60) / TOTAL_MINS) * 100
            const height = (duration / TOTAL_MINS) * 100
            if (top < 0) return null

            const width = 100 / ev.totalCols
            const style = {
                top: `${top}%`,
                height: `${height}%`,
                width: `calc(${width}% - 3px)`,
                left: `calc(${(ev.colIndex || 0) * width}% + 1.5px)`,
            }
            const isSmall = duration <= 30
            const isGhost = ev.isGhost === true

            return (
                <div
                    key={ev.id}
                    className={`absolute rounded-md border z-[30] overflow-hidden flex 
                    ${isSmall ? 'flex-row items-center px-1 gap-2' : 'flex-col justify-center px-2'} 
                    shadow-md pointer-events-auto hover:z-[50] transition-all 
                    ${isGhost ? 'bg-[#FF7939] border-white/20 select-none' : 'bg-zinc-900 border-[#FF7939] hover:bg-zinc-800'}`}
                    style={style}
                    onClick={(e) => {
                        e.stopPropagation()
                        if (!isGhost) openMeetById(ev.id)
                    }}
                >
                    <div className={`font-bold transition-colors truncate ${isGhost ? 'text-black text-[10px]' : 'text-white text-[10px]'}`}>
                        {ev.title || 'Meet'}
                    </div>
                </div>
            )
        })
    })
}
