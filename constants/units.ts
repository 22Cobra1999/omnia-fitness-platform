// Unidades de medida para la aplicación OMNIA
// Organizadas por categorías para facilitar su uso

export const UNITS = {
  // Unidades de frecuencia
  FREQUENCY: {
    TIMES_PER_WEEK: "times/week",
    TIMES_PER_DAY: "times/day",
    DAYS_PER_WEEK: "days/week",
    SESSIONS_PER_WEEK: "sessions/week",
    WEEKLY: "weekly",
    DAILY: "daily",
    MONTHLY: "monthly",
  },

  // Unidades de distancia
  DISTANCE: {
    KILOMETERS: "km",
    METERS: "m",
    MILES: "mi",
    FEET: "ft",
    STEPS: "steps",
  },

  // Unidades de tiempo
  TIME: {
    MINUTES: "min",
    HOURS: "h",
    SECONDS: "sec",
    MILLISECONDS: "ms",
    DAYS: "days",
    WEEKS: "weeks",
  },

  // Unidades de duración específicas para ejercicio
  DURATION: {
    MINUTES_PER_SESSION: "min/session",
    HOURS_PER_SESSION: "h/session",
    MINUTES_PER_KILOMETER: "min/km",
    MINUTES_PER_MILE: "min/mi",
    SECONDS_PER_REP: "sec/rep",
  },

  // Unidades de peso/masa
  WEIGHT: {
    KILOGRAMS: "kg",
    GRAMS: "g",
    POUNDS: "lb",
    OUNCES: "oz",
  },

  // Unidades para ejercicios
  EXERCISE: {
    REPETITIONS: "reps",
    SETS: "sets",
    ROUNDS: "rounds",
    REPETITIONS_PER_SET: "reps/set",
    WEIGHT_LIFTED: "kg lifted",
    TOTAL_VOLUME: "volume (kg)",
  },

  // Unidades de energía
  ENERGY: {
    CALORIES: "cal",
    KILOCALORIES: "kcal",
    JOULES: "J",
    KILOJOULES: "kJ",
  },

  // Unidades de velocidad
  SPEED: {
    KILOMETERS_PER_HOUR: "km/h",
    MILES_PER_HOUR: "mph",
    METERS_PER_SECOND: "m/s",
  },

  // Unidades de nutrición
  NUTRITION: {
    GRAMS_PROTEIN: "g protein",
    GRAMS_CARBS: "g carbs",
    GRAMS_FAT: "g fat",
    GRAMS_FIBER: "g fiber",
    GRAMS_SUGAR: "g sugar",
    MILLIGRAMS_SODIUM: "mg sodium",
    MILLILITERS: "ml",
    LITERS: "L",
    OUNCES_FLUID: "fl oz",
    SERVINGS: "servings",
    PORTIONS: "portions",
    PLATES: "plates",
  },

  // Unidades de medidas corporales
  BODY_MEASUREMENTS: {
    CENTIMETERS: "cm",
    INCHES: "in",
    BODY_FAT_PERCENTAGE: "% body fat",
    BMI: "BMI",
    WAIST_TO_HIP_RATIO: "WHR",
  },

  // Unidades de intensidad
  INTENSITY: {
    PERCENTAGE_MAX_HEART_RATE: "% MHR",
    HEART_RATE: "bpm",
    RPE: "RPE",
    PERCENTAGE_1RM: "% 1RM",
    METS: "METs",
    WATTS: "W",
  },

  // Unidades de progreso
  PROGRESS: {
    PERCENTAGE: "%",
    POINTS: "pts",
    LEVEL: "level",
    SCORE: "score",
    STREAK_DAYS: "day streak",
  },

  // Unidades de sueño
  SLEEP: {
    HOURS_SLEPT: "hours slept",
    SLEEP_QUALITY: "sleep quality",
    SLEEP_SCORE: "sleep score",
  },

  // Unidades de hidratación
  HYDRATION: {
    GLASSES: "glasses",
    BOTTLES: "bottles",
  },

  // Unidades de bienestar
  WELLNESS: {
    STRESS_LEVEL: "stress level",
    MOOD_SCORE: "mood score",
    ENERGY_LEVEL: "energy level",
    RECOVERY_SCORE: "recovery score",
  },

  // Unidades para adicciones y hábitos
  HABITS: {
    DAYS_FREE: "days free",
    WEEKS_FREE: "weeks free",
    MONTHS_FREE: "months free",
    YEARS_FREE: "years free",
    CIGARETTES: "cigarettes",
    DRINKS: "drinks",
  },

  // Unidades para medicación
  MEDICATION: {
    PILLS: "pills",
    DOSES: "doses",
    INJECTIONS: "injections",
    MILLIGRAMS: "mg",
    MICROGRAMS: "μg",
  },

  // Unidades para actividades sociales
  SOCIAL: {
    EVENTS: "events",
    MEETUPS: "meetups",
    CLASSES: "classes",
    SESSIONS: "sessions",
  },

  // Unidades para finanzas relacionadas con salud
  FINANCE: {
    CURRENCY: "$",
    EUROS: "€",
    POINTS: "points",
    CREDITS: "credits",
    COINS: "coins",
  },
}

// Lista plana de todas las unidades para búsquedas y selección
export const ALL_UNITS = Object.values(UNITS).flatMap((category) => Object.values(category))

// Unidades comunes para sugerencias rápidas
export const COMMON_UNITS = [
  UNITS.FREQUENCY.TIMES_PER_WEEK,
  UNITS.DISTANCE.KILOMETERS,
  UNITS.TIME.MINUTES,
  UNITS.WEIGHT.KILOGRAMS,
  UNITS.EXERCISE.REPETITIONS,
  UNITS.EXERCISE.SETS,
  UNITS.ENERGY.KILOCALORIES,
  UNITS.SPEED.KILOMETERS_PER_HOUR,
  UNITS.NUTRITION.GRAMS_PROTEIN,
  UNITS.PROGRESS.PERCENTAGE,
  UNITS.BODY_MEASUREMENTS.CENTIMETERS,
  UNITS.INTENSITY.HEART_RATE,
  UNITS.HABITS.DAYS_FREE,
]

// Función para obtener la unidad por nombre
export function getUnitByName(unitName: string): string | undefined {
  return ALL_UNITS.find((unit) => unit === unitName)
}

// Función para obtener unidades por categoría
export function getUnitsByCategory(category: keyof typeof UNITS): string[] {
  return Object.values(UNITS[category])
}

// Función para sugerir unidades basadas en un tipo de actividad
export function suggestUnitsForActivity(activityType: string): string[] {
  switch (activityType.toLowerCase()) {
    case "running":
    case "walking":
    case "cycling":
      return [
        UNITS.DISTANCE.KILOMETERS,
        UNITS.TIME.MINUTES,
        UNITS.SPEED.KILOMETERS_PER_HOUR,
        UNITS.DURATION.MINUTES_PER_KILOMETER,
        UNITS.ENERGY.KILOCALORIES,
      ]
    case "weightlifting":
    case "strength":
    case "gym":
      return [
        UNITS.EXERCISE.SETS,
        UNITS.EXERCISE.REPETITIONS,
        UNITS.WEIGHT.KILOGRAMS,
        UNITS.EXERCISE.WEIGHT_LIFTED,
        UNITS.TIME.MINUTES,
      ]
    case "yoga":
    case "pilates":
    case "stretching":
      return [UNITS.TIME.MINUTES, UNITS.FREQUENCY.TIMES_PER_WEEK, UNITS.INTENSITY.RPE, UNITS.WELLNESS.STRESS_LEVEL]
    case "meal":
    case "nutrition":
    case "food":
      return [
        UNITS.ENERGY.KILOCALORIES,
        UNITS.NUTRITION.GRAMS_PROTEIN,
        UNITS.NUTRITION.GRAMS_CARBS,
        UNITS.NUTRITION.GRAMS_FAT,
        UNITS.NUTRITION.SERVINGS,
      ]
    case "sleep":
      return [UNITS.TIME.HOURS, UNITS.SLEEP.SLEEP_QUALITY, UNITS.SLEEP.SLEEP_SCORE]
    case "habit":
    case "addiction":
      return [UNITS.HABITS.DAYS_FREE, UNITS.HABITS.WEEKS_FREE, UNITS.FREQUENCY.TIMES_PER_WEEK]
    default:
      return COMMON_UNITS
  }
}
