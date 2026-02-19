
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

        const objCount = Number(row.items_objetivo) || 0
        const complCount = Number(row.items_completados) || 0
        const pendingCount = objCount - complCount
        const mins_obj = Number(row.minutos_objetivo) || 0

        if (row.actividad_id) discoveredIds.add(String(row.actividad_id))

        const remainingRatio = objCount > 0 ? (Math.max(0, pendingCount) / objCount) : 1
        const pendingMins = Math.round(mins_obj * remainingRatio)

        if (row.tipo === 'taller') {
            agg[dayKey].workshopMinutesTotal += mins_obj
            agg[dayKey].hasWorkshop = true
        } else if (row.tipo === 'programa') {
            if (row.area === 'fitness') {
                agg[dayKey].fitnessMinutesTotal += mins_obj
                agg[dayKey].pendingExercises += Math.max(0, pendingCount)
                agg[dayKey].totalExercises += objCount
                agg[dayKey].completedExercises += complCount
                if (pendingCount > 0) agg[dayKey].fitnessMinutesPending += pendingMins
            } else if (row.area === 'nutricion') {
                agg[dayKey].nutritionMinutesTotal += mins_obj
                agg[dayKey].pendingPlates += Math.max(0, pendingCount)
                agg[dayKey].totalPlates += objCount
                agg[dayKey].completedPlates += complCount
                if (pendingCount > 0) agg[dayKey].nutritionMinutesPending += pendingMins
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

        const pending = (row.items_objetivo || 0) - (row.items_completados || 0)
        const targetMins = row.minutos_objetivo || 0
        const remainingRatio = (row.items_objetivo || 0) > 0
            ? (Math.max(0, pending) / row.items_objetivo)
            : 1
        const minsRemaining = Math.round(targetMins * remainingRatio)

        itemsMap[aid].totalCount += (row.items_objetivo || 0)
        itemsMap[aid].pendingCount += Math.max(0, pending)
        itemsMap[aid].pendingMinutes += minsRemaining
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
