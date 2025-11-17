/**
 * Utilidades para cálculos de calendario y días por mes
 */

export interface CalendarMonth {
  month: number
  year: number
  daysInMonth: number
  weeksInMonth: number
  startDate: Date
  endDate: Date
}

/**
 * Calcula los días reales en un mes basado en el calendario
 */
export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * Calcula las semanas en un mes basado en el calendario
 */
export function getWeeksInMonth(month: number, year: number): number {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  
  // Calcular cuántas semanas completas hay
  const firstWeekStart = new Date(firstDay)
  firstWeekStart.setDate(firstDay.getDate() - firstDay.getDay())
  
  const lastWeekEnd = new Date(lastDay)
  lastWeekEnd.setDate(lastDay.getDate() + (6 - lastDay.getDay()))
  
  const diffTime = lastWeekEnd.getTime() - firstWeekStart.getTime()
  const diffWeeks = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000))
  
  return diffWeeks
}

/**
 * Obtiene información completa de un mes
 */
export function getMonthInfo(month: number, year: number): CalendarMonth {
  const daysInMonth = getDaysInMonth(month, year)
  const weeksInMonth = getWeeksInMonth(month, year)
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)
  
  return {
    month,
    year,
    daysInMonth,
    weeksInMonth,
    startDate,
    endDate
  }
}

/**
 * Calcula el mes objetivo basado en el calendario real
 */
export function calculateTargetMonthWithCalendar(
  sourceMonth: number,
  sourceYear: number,
  repetition: number
): { month: number; year: number; daysInMonth: number; weeksInMonth: number } {
  // Calcular el mes objetivo
  let targetMonth = sourceMonth + repetition
  let targetYear = sourceYear
  
  // Ajustar año si el mes excede 12
  while (targetMonth > 12) {
    targetMonth -= 12
    targetYear += 1
  }
  
  const monthInfo = getMonthInfo(targetMonth, targetYear)
  
  return {
    month: targetMonth,
    year: targetYear,
    daysInMonth: monthInfo.daysInMonth,
    weeksInMonth: monthInfo.weeksInMonth
  }
}

/**
 * Calcula la semana objetivo basada en el calendario real
 */
export function calculateTargetWeekWithCalendar(
  sourceWeek: number,
  sourceMonth: number,
  sourceYear: number,
  repetition: number
): { month: number; year: number; week: number; daysInMonth: number; weeksInMonth: number } {
  // Calcular la semana objetivo
  let targetWeek = sourceWeek + repetition
  let targetMonth = sourceMonth
  let targetYear = sourceYear
  
  // Obtener información del mes fuente
  const sourceMonthInfo = getMonthInfo(sourceMonth, sourceYear)
  
  // Si la semana objetivo excede las semanas del mes, mover al siguiente mes
  while (targetWeek > sourceMonthInfo.weeksInMonth) {
    targetWeek -= sourceMonthInfo.weeksInMonth
    targetMonth += 1
    
    // Ajustar año si el mes excede 12
    if (targetMonth > 12) {
      targetMonth = 1
      targetYear += 1
    }
    
    // Obtener información del nuevo mes
    const newMonthInfo = getMonthInfo(targetMonth, targetYear)
    // Si aún excede, continuar con el siguiente mes
    if (targetWeek > newMonthInfo.weeksInMonth) {
      continue
    }
  }
  
  const targetMonthInfo = getMonthInfo(targetMonth, targetYear)
  
  return {
    month: targetMonth,
    year: targetYear,
    week: targetWeek,
    daysInMonth: targetMonthInfo.daysInMonth,
    weeksInMonth: targetMonthInfo.weeksInMonth
  }
}

/**
 * Calcula días totales para replicación basado en calendario real
 */
export function calculateReplicationDays(
  sourcePeriods: number[],
  type: 'weeks' | 'months',
  repetitions: number,
  totalOriginalDays: number,
  sourceYear: number = new Date().getFullYear()
): {
  originalDays: number
  replicatedDays: number
  totalDays: number
  targetPeriods: Array<{
    period: string
    month: number
    year: number
    days: number
  }>
} {
  let replicatedDays = 0
  const targetPeriods: Array<{
    period: string
    month: number
    year: number
    days: number
  }> = []
  
  // Usar el total de días originales proporcionado
  const originalDays = totalOriginalDays
  
  // Calcular días replicados basándose en períodos seleccionados
  for (let rep = 1; rep <= repetitions; rep++) {
    sourcePeriods.forEach(period => {
      if (type === 'months') {
        const target = calculateTargetMonthWithCalendar(period, sourceYear, rep)
        // Para meses, contar solo los días únicos de ejercicios (no todos los días del mes)
        const daysInSelectedPeriod = 7 // Asumir 7 días por semana, 4 semanas = 28 días
        replicatedDays += daysInSelectedPeriod
        targetPeriods.push({
          period: `M${target.month}`,
          month: target.month,
          year: target.year,
          days: daysInSelectedPeriod
        })
      } else {
        // Para semanas, cada semana replicada agrega 1 día (ya que solo hay lunes)
        replicatedDays += 1 // Solo 1 día por semana (lunes)
        targetPeriods.push({
          period: `S${period}`,
          month: 1,
          year: sourceYear,
          days: 1
        })
      }
    })
  }
  
  return {
    originalDays,
    replicatedDays,
    totalDays: originalDays + replicatedDays,
    targetPeriods
  }
}
