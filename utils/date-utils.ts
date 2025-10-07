/**
 * Utilidades para manejo de fechas en zona horaria de Buenos Aires
 * Buenos Aires: UTC-3 (en horario estándar) / UTC-2 (en horario de verano)
 */

// Zona horaria de Buenos Aires
const BUENOS_AIRES_TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Crea una fecha en zona horaria de Buenos Aires
 * @param dateString - String de fecha en formato YYYY-MM-DD
 * @returns Date object en zona horaria de Buenos Aires
 */
export function createBuenosAiresDate(dateString: string): Date {
  // Crear fecha en zona horaria de Buenos Aires
  return new Date(`${dateString}T00:00:00`);
}

/**
 * Obtiene la fecha actual en Buenos Aires
 * @returns Date object con la fecha actual en Buenos Aires
 */
export function getCurrentBuenosAiresDate(): Date {
  const now = new Date();
  // Convertir a zona horaria de Buenos Aires
  return new Date(now.toLocaleString("en-US", {timeZone: BUENOS_AIRES_TIMEZONE}));
}

/**
 * Formatea una fecha para mostrar en Buenos Aires
 * @param date - Date object
 * @param options - Opciones de formato
 * @returns String formateado
 */
export function formatBuenosAiresDate(
  date: Date, 
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: BUENOS_AIRES_TIMEZONE
  }
): string {
  return date.toLocaleDateString('es-AR', options);
}

/**
 * Obtiene solo la parte de fecha (YYYY-MM-DD) en Buenos Aires
 * @param date - Date object
 * @returns String en formato YYYY-MM-DD
 */
export function getBuenosAiresDateString(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: BUENOS_AIRES_TIMEZONE });
}

/**
 * Calcula el día de la semana en Buenos Aires
 * @param date - Date object
 * @returns Número del día de la semana (0 = domingo, 1 = lunes, etc.)
 */
export function getBuenosAiresDayOfWeek(date: Date): number {
  const buenosAiresDate = new Date(date.toLocaleString("en-US", {timeZone: BUENOS_AIRES_TIMEZONE}));
  return buenosAiresDate.getDay();
}

/**
 * Obtiene el nombre del día de la semana en Buenos Aires
 * @param date - Date object
 * @returns Nombre del día en español (lunes, martes, etc.)
 */
export function getBuenosAiresDayName(date: Date): string {
  const dayNumber = getBuenosAiresDayOfWeek(date);
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return days[dayNumber];
}

/**
 * Calcula la fecha de ejercicio basándose en start_date, semana y día de ejercicio
 * Considera que Día 1 es siempre lunes en Buenos Aires
 * @param semana - Semana del ejercicio (1, 2, 3, 4, etc.)
 * @param dia - Día de ejercicio (1 = lunes, 2 = martes, etc.)
 * @param startDate - Fecha de inicio del programa
 * @returns Fecha del ejercicio en formato YYYY-MM-DD
 */
export function calculateExerciseDateBuenosAires(semana: number, dia: number, startDate: Date | string): string {
  // Normalizar start_date
  const startDateString = typeof startDate === 'string' ? startDate : getBuenosAiresDateString(startDate);
  const startBuenosAires = createBuenosAiresDate(startDateString);
  
  // Obtener día de la semana en Buenos Aires
  const startDayOfWeek = getBuenosAiresDayOfWeek(startBuenosAires);
  
  // Si start_date es lunes (1), el primer lunes es hoy
  // Si no, encontrar el primer lunes
  let firstMonday: Date;
  if (startDayOfWeek === 1) {
    firstMonday = new Date(startBuenosAires);
  } else {
    let daysToMonday;
    if (startDayOfWeek === 0) { // Domingo
      daysToMonday = 1;
    } else { // Martes a Sábado
      daysToMonday = 8 - startDayOfWeek;
    }
    firstMonday = new Date(startBuenosAires);
    firstMonday.setDate(startBuenosAires.getDate() + daysToMonday);
  }
  
  // Calcular la fecha del ejercicio considerando la semana y el día
  const exerciseDate = new Date(firstMonday);
  const daysToAdd = (semana - 1) * 7 + (dia - 1); // (semana-1) * 7 días + (dia-1) días
  exerciseDate.setDate(firstMonday.getDate() + daysToAdd);
  
  return getBuenosAiresDateString(exerciseDate);
}

/**
 * Verifica si una fecha está en el pasado en Buenos Aires
 * @param date - Date object
 * @returns true si la fecha está en el pasado
 */
export function isDateInPastBuenosAires(date: Date): boolean {
  const now = getCurrentBuenosAiresDate();
  const dateBuenosAires = new Date(date.toLocaleString("en-US", {timeZone: BUENOS_AIRES_TIMEZONE}));
  
  return dateBuenosAires < now;
}

/**
 * Obtiene la fecha de hoy en Buenos Aires como string
 * @returns String en formato YYYY-MM-DD
 */
export function getTodayBuenosAiresString(): string {
  return getBuenosAiresDateString(getCurrentBuenosAiresDate());
}

/**
 * Convierte una fecha de UTC a Buenos Aires
 * @param utcDate - Fecha en UTC
 * @returns Date object en zona horaria de Buenos Aires
 */
export function convertUTCToBuenosAires(utcDate: Date): Date {
  return new Date(utcDate.toLocaleString("en-US", {timeZone: BUENOS_AIRES_TIMEZONE}));
}

/**
 * Convierte una fecha de Buenos Aires a UTC
 * @param buenosAiresDate - Fecha en Buenos Aires
 * @returns Date object en UTC
 */
export function convertBuenosAiresToUTC(buenosAiresDate: Date): Date {
  // Crear fecha en UTC basándose en la fecha de Buenos Aires
  const year = buenosAiresDate.getFullYear();
  const month = buenosAiresDate.getMonth();
  const day = buenosAiresDate.getDate();
  
  return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Calcula la fecha de un ejercicio considerando el período
 * Cada período comienza desde el start_date del enrollment
 * Patrón: 3 períodos × 2 semanas = 6 semanas totales
 * @param startDate - Fecha de inicio del enrollment (Date o string)
 * @param semana - Número de semana (1, 2, 3, ...)
 * @param dia - Día de la semana (1=Lunes, 7=Domingo)
 * @param periodo - Número de período (1, 2, 3, ...)
 * @returns Fecha calculada en formato YYYY-MM-DD
 */
export function calculateExerciseDateWithPeriod(startDate: Date | string, semana: number, dia: number, periodo: number): string {
  const startDateString = typeof startDate === 'string' ? startDate : getBuenosAiresDateString(startDate);
  const startBuenosAires = createBuenosAiresDate(startDateString);
  
  // Encontrar el primer lunes del start_date
  const startDayOfWeek = getBuenosAiresDayOfWeek(startBuenosAires);
  let firstMonday: Date;
  
  if (startDayOfWeek === 1) {
    firstMonday = new Date(startBuenosAires);
  } else {
    let daysToMonday;
    if (startDayOfWeek === 0) { // Domingo
      daysToMonday = 1;
    } else { // Martes a Sábado
      daysToMonday = 8 - startDayOfWeek;
    }
    firstMonday = new Date(startBuenosAires);
    firstMonday.setDate(startBuenosAires.getDate() + daysToMonday);
  }
  
  // Calcular la semana global (secuencial) basándose en período y semana
  // Cada período tiene 2 semanas, entonces:
  // Período 1: semanas 1-2
  // Período 2: semanas 3-4  
  // Período 3: semanas 5-6
  const weeksPerPeriod = 2; // 2 semanas por período
  const globalSemana = (periodo - 1) * weeksPerPeriod + semana;
  
  // Calcular la fecha del ejercicio usando la semana global
  const exerciseDate = new Date(firstMonday);
  const daysToAdd = (globalSemana - 1) * 7 + (dia - 1);
  exerciseDate.setDate(firstMonday.getDate() + daysToAdd);
  
  return getBuenosAiresDateString(exerciseDate);
}



