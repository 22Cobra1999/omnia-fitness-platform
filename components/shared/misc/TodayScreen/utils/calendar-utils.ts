
export const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

    // Adjust for padding (Sunday start)
    const paddingDays = firstDayOfMonth;

    const days = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = paddingDays - 1; i >= 0; i--) {
        const d = new Date(year, month - 1, prevMonthLastDay - i);
        days.push({
            date: d,
            day: d.getDate(),
            isCurrentMonth: false
        });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(year, month, i);
        days.push({
            date: d,
            day: i,
            isCurrentMonth: true
        });
    }

    // Next month padding to complete row
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(year, month + 1, i);
            days.push({
                date: d,
                day: i,
                isCurrentMonth: false
            });
        }
    }

    return days;
};

// Helper for calculating week number based on Monday start
export function getWeekNumber(date: Date, start_date?: string | null) {
    if (!start_date) {
        return 1;
    }

    const startDate = new Date(start_date + 'T00:00:00');
    startDate.setHours(0, 0, 0, 0);

    // Encontrar el lunes de la semana de inicio
    const startMonday = new Date(startDate);
    const startDayOfWeek = startDate.getDay();
    const daysToMonday = startDayOfWeek === 0 ? -6 : 1 - startDayOfWeek;
    startMonday.setDate(startDate.getDate() + daysToMonday);

    // Encontrar el lunes de la semana de la fecha seleccionada
    const selectedMonday = new Date(date);
    const selectedDayOfWeek = date.getDay();
    const daysToSelectedMonday = selectedDayOfWeek === 0 ? -6 : 1 - selectedDayOfWeek;
    selectedMonday.setDate(date.getDate() + daysToSelectedMonday);

    // Calcular diferencia en semanas
    const diffTime = selectedMonday.getTime() - startMonday.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    const weekNumber = Math.max(1, diffWeeks + 1);

    return weekNumber;
}

export function getDayName(date: Date) {
    const buenosAiresDate = new Date(date.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    return dayNames[buenosAiresDate.getDay()];
}

export function calculateExerciseDayForDate(targetDate: Date | string, startDate: Date | string) {
    const {
        createBuenosAiresDate,
        getBuenosAiresDateString,
        getBuenosAiresDayOfWeek
    } = require('@/utils/date-utils');

    const startDateString = typeof startDate === 'string' ? startDate : getBuenosAiresDateString(startDate);
    const targetDateString = typeof targetDate === 'string' ? targetDate : getBuenosAiresDateString(targetDate);

    const startBuenosAires = createBuenosAiresDate(startDateString);
    const targetBuenosAires = createBuenosAiresDate(targetDateString);

    const startDayOfWeek = getBuenosAiresDayOfWeek(startBuenosAires);

    const diffTime = targetBuenosAires.getTime() - startBuenosAires.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return null;
    if (diffDays === 0) return startDayOfWeek === 0 ? 7 : startDayOfWeek;

    const daysIntoWeek = diffDays % 7;
    let exerciseDay = (startDayOfWeek === 0 ? 7 : startDayOfWeek) + daysIntoWeek;
    if (exerciseDay > 7) exerciseDay = exerciseDay - 7;

    return exerciseDay;
}

export async function loadDayStatusesAsMap(userId: string, activityId: string, enrollment: any) {
    const { createClient } = require('@/lib/supabase/supabase-client');
    const supabase = createClient();
    const statuses: Record<string, string> = {};
    const dayMetrics: Record<string, { fit_mins: number, nut_items: number }> = {};
    const counts = { completed: 0, pending: 0, started: 0 };

    try {
        const { id: enrollmentId, start_date } = enrollment;
        
        // 1. Query progress for THIS activity (less restrictive than enrollment)
        const [pdaRes, workshopRes] = await Promise.all([
            supabase
                .from('progreso_diario_actividad')
                .select('fecha, enrollment_id, fit_items_c, fit_items_o, nut_items_c, nut_items_o, fit_mins_o')
                .eq('actividad_id', activityId)
                .eq('cliente_id', userId),
            supabase
                .from('taller_progreso_temas')
                .select('fecha_seleccionada, estado')
                .eq('cliente_id', userId)
                // Filter by activity if linked, or just show all user meetings? 
                // Usually these are linked via enrollment -> ejecucion -> activity.
                // For simplicity, we'll fetch all and filter in JS if needed.
        ]);

        const records = pdaRes.data || [];
        const workshopTemas = workshopRes.data || [];

        console.log(`📊 [loadDayStatusesAsMap] PDA records: ${records.length}, Workshop: ${workshopTemas.length}, ActivityId: ${activityId}`);
        if (records.length > 0) console.log(`📊 [loadDayStatusesAsMap] Sample Record:`, records[0]);

        if (pdaRes.error) {
            console.error('Error fetching progreso_diario_actividad:', pdaRes.error);
        }

        // 2. Fetch activity duration to filter out ghost records after completion
        const { data: activity } = await supabase
            .from('activities')
            .select('semanas_totales, duration_weeks')
            .eq('id', activityId)
            .single();
        
        let limitWeeks = activity?.semanas_totales || activity?.duration_weeks || 0;
        if (limitWeeks === 0 || limitWeeks === 999) {
            const { data: maxPlan } = await supabase
                .from('planificacion_ejercicios')
                .select('numero_semana')
                .eq('actividad_id', activityId)
                .order('numero_semana', { ascending: false })
                .limit(1);
            limitWeeks = maxPlan?.[0]?.numero_semana || 4;
        }

        const start = new Date(start_date + 'T12:00:00');
        const endOfProgram = new Date(start);
        endOfProgram.setDate(start.getDate() + (limitWeeks * 7));
        
        console.log(`📅 [loadDayStatusesAsMap] Range: ${start.toISOString()} to ${endOfProgram.toISOString()} (limitWeeks: ${limitWeeks})`);

        // Group and filter
        const dayMap: Record<string, any[]> = {};
        records.forEach((r: any) => {
            const dateKey = r.fecha.split('T')[0];
            const recordDate = new Date(dateKey + 'T12:00:00');

            // ONLY paint if it's within the program duration
            if (recordDate >= start && recordDate < endOfProgram) {
                // Prioritize current enrollment records if multiple exist for the same day
                if (!dayMap[dateKey]) dayMap[dateKey] = [];
                if (String(r.enrollment_id) === String(enrollmentId)) {
                    dayMap[dateKey].unshift(r); // Current enrollment first
                } else {
                    dayMap[dateKey].push(r);
                }
            }
        });

        // Add Workshop topics to the map
        workshopTemas.forEach((wt: any) => {
            if (wt.fecha_seleccionada) {
                const dateKey = wt.fecha_seleccionada;
                if (!dayMap[dateKey]) dayMap[dateKey] = [];
                dayMap[dateKey].push({ ...wt, area: 'general', tipo: 'taller' });
            }
        });

        Object.keys(dayMap).forEach(dateKey => {
            const dayRecords = dayMap[dateKey];
            let finalStatus = 'completed';
            let totalObj = 0;
            let hasAtLeastOneStarted = false;
            let hasAtLeastOneNotStarted = false;

            let fitMins = 0;
            let nutItems = 0;
            let isWorkshopDay = false;

            dayRecords.forEach(r => {
                if (r.tipo === 'taller') {
                    isWorkshopDay = true;
                    totalObj += 1; // Count as 1 item for status calculation
                    if (r.estado === 'completado') {
                        // All good
                    } else {
                        hasAtLeastOneNotStarted = true;
                    }
                    return;
                }

                const obj = (Number(r.fit_items_o) || 0) + (Number(r.nut_items_o) || 0);
                const comp = (Number(r.fit_items_c) || 0) + (Number(r.nut_items_c) || 0);
                
                fitMins += (Number(r.fit_mins_o) || 0);
                nutItems += (Number(r.nut_items_o) || 0);

                if (obj > 0) {
                    totalObj += obj;
                    if (comp === 0) hasAtLeastOneNotStarted = true;
                    else if (comp < obj) hasAtLeastOneStarted = true;
                }
            });

            if (totalObj === 0) return; // No activity on this day

            if (hasAtLeastOneNotStarted) {
                finalStatus = 'not-started';
                counts.pending++;
            } else if (hasAtLeastOneStarted) {
                finalStatus = 'started';
                counts.started++;
            } else {
                finalStatus = 'completed';
                counts.completed++;
            }

            statuses[dateKey] = finalStatus;
            dayMetrics[dateKey] = { fit_mins: fitMins, nut_items: nutItems, has_workshop: isWorkshopDay } as any;
        });

    } catch (e) {
        console.error("Error loading day statuses", e);
    }

    return { statuses, counts, dayMetrics };
}
