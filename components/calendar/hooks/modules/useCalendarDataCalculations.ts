
const calculateAggregates = (rows: any[]) => {
    const agg: Record<string, any> = {}
    const discoveredIds = new Set<string>()
    const activitiesByDate: Record<string, any[]> = {}

    rows.forEach((row: any) => {
        const dayKey = String(row.fecha).split('T')[0]
        if (!agg[dayKey]) {
            agg[dayKey] = {
                fitnessMinutesTotal: 0,
                fitnessMinutesPending: 0,
                nutritionMinutesTotal: 0,
                nutritionMinutesPending: 0,
                workshopMinutesTotal: 0,
                hasWorkshop: false,
                meetsMinutes: 0,
                pendingExercises: 0,
                totalExercises: 0,
                completedExercises: 0,
                pendingPlates: 0,
                totalPlates: 0,
                completedPlates: 0,
            }
        }

        const fitObj = Number(row.fit_items_o) || 0
        const fitComp = Number(row.fit_items_c) || 0
        const fitMins = Number(row.fit_mins_o) || 0
        
        const nutObj = Number(row.nut_items_o) || 0
        const nutComp = Number(row.nut_items_c) || 0

        if (row.actividad_id) discoveredIds.add(String(row.actividad_id))

        if (row.tipo === 'taller') {
            agg[dayKey].workshopMinutesTotal += fitMins
            agg[dayKey].hasWorkshop = true
        } else if (row.tipo === 'programa') {
            // Addition: sum both if present
            if (fitObj > 0 || fitMins > 0) {
                agg[dayKey].fitnessMinutesTotal += fitMins
                agg[dayKey].totalExercises += fitObj
                agg[dayKey].completedExercises += fitComp
                agg[dayKey].pendingExercises += Math.max(0, fitObj - fitComp)
                const ratio = fitObj > 0 ? (Math.max(0, fitObj - fitComp) / fitObj) : 1
                agg[dayKey].fitnessMinutesPending += Math.round(fitMins * ratio)
            }
            if (nutObj > 0) {
                agg[dayKey].pendingPlates += Math.max(0, nutObj - nutComp)
                agg[dayKey].totalPlates += nutObj
                agg[dayKey].completedPlates += nutComp
            }
        }

        if (row.actividad_id) {
            const aid = String(row.actividad_id)
            if (!activitiesByDate[dayKey]) activitiesByDate[dayKey] = []
            if (!activitiesByDate[dayKey].find(a => a.id === aid)) {
                activitiesByDate[dayKey].push({
                    id: aid,
                    fecha: dayKey,
                    type: 'activity',
                })
            }
        }
    })

    return { agg, discoveredIds: Array.from(discoveredIds), activitiesByDate }
}

const calculateBreakdown = (progData: any[], activitiesInfo: Record<string, any>) => {
    const itemsMap: Record<string, any> = {}

    progData.forEach((row: any) => {
        const aid = row.actividad_id ? String(row.actividad_id) : `general-${row.area}`
        const act = activitiesInfo[aid] || {
            title: row.area === 'fitness' ? 'Fitness' : row.area === 'nutricion' ? 'Nutrición' : 'Actividad',
            categoria: row.area,
            color_theme: row.tipo === 'taller' ? 'blue' : (row.area === 'fitness' ? 'orange' : row.area === 'nutricion' ? 'green' : 'blue')
        }

        let borderClass = 'border-white/10'
        let bgClass = 'bg-white/5'
        if (act.color_theme === 'orange') { borderClass = 'border-orange-500/20'; bgClass = 'bg-orange-500/5' }
        else if (act.color_theme === 'blue') { borderClass = 'border-blue-500/20'; bgClass = 'bg-blue-500/5' }
        else if (act.color_theme === 'green') { borderClass = 'border-green-500/20'; bgClass = 'bg-green-500/5' }

        if (!itemsMap[aid]) {
            itemsMap[aid] = {
                activityId: aid,
                activityTitle: act.title || '',
                activityTypeLabel: act.categoria || row.area || 'Actividad',
                area: row.area,
                tipo: row.tipo,
                borderClass,
                bgClass,
                pendingCountLabel: '',
                pendingMinutes: 0,
                totalCount: 0,
                pendingCount: 0
            }
        }

        const fitObj = Number(row.fit_items_o) || 0
        const fitComp = Number(row.fit_items_c) || 0
        const fitMins = Number(row.fit_mins_o) || 0
        
        const nutObj = Number(row.nut_items_o) || 0
        const nutComp = Number(row.nut_items_c) || 0

        itemsMap[aid].totalCount += (fitObj + nutObj)
        itemsMap[aid].pendingCount += (Math.max(0, fitObj - fitComp) + Math.max(0, nutObj - nutComp))
        
        const fitRatio = fitObj > 0 ? (Math.max(0, fitObj - fitComp) / fitObj) : 1
        itemsMap[aid].pendingMinutes += Math.round(fitMins * fitRatio)
    })

    return Object.values(itemsMap).map((i: any) => {
        i.pendingCountLabel = `${i.totalCount - i.pendingCount}/${i.totalCount}`
        return i
    })
}

export const useCalendarDataCalculations = () => {
    return {
        calculateAggregates,
        calculateBreakdown
    }
}
