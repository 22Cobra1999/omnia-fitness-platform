export type ExerciseActivityEntry = {
  activo?: boolean
  [key: string]: unknown
}

export type ExerciseActivityMap = Record<string, ExerciseActivityEntry>

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Normaliza el payload almacenado en ejercicios_detalles.activity_id
 * a un objeto indexado por id de actividad en formato string.
 */
export function normalizeActivityMap(
  value: unknown
): ExerciseActivityMap {
  // Manejo de valores escalares para compatibilidad
  if (typeof value === 'number') {
    return { [String(value)]: { activo: true } }
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const num = parseInt(value, 10)
    if (!Number.isNaN(num) && String(num) === value.trim()) {
      return { [value.trim()]: { activo: true } }
    }
  }

  if (!isObject(value)) {
    return {}
  }

  const entries: ExerciseActivityMap = {}

  Object.entries(value).forEach(([key, rawValue]) => {
    if (isObject(rawValue)) {
      entries[key] = { ...rawValue }
    } else if (typeof rawValue === 'boolean') {
      entries[key] = { activo: rawValue }
    } else if (rawValue === null || rawValue === undefined) {
      entries[key] = {}
    }
  })

  return entries
}

export const activityKey = (activityId: number | string): string =>
  typeof activityId === 'number'
    ? String(activityId)
    : activityId.trim()

export function hasActivity(
  value: unknown,
  activityId: number | string
): boolean {
  const map = normalizeActivityMap(value)
  const key = activityKey(activityId)
  return key in map || '0' in map // '0' representa global
}

export function getActivityEntry(
  value: unknown,
  activityId: number | string
): ExerciseActivityEntry | null {
  const map = normalizeActivityMap(value)
  const key = activityKey(activityId)
  return map[key] ?? map['0'] ?? null // Priorizar id específico, fallback a global '0'
}

export function getActiveFlagForActivity(
  value: unknown,
  activityId: number | string,
  fallback: boolean
): boolean {
  const entry = getActivityEntry(value, activityId)
  if (entry && typeof entry.activo === 'boolean') {
    return entry.activo
  }
  return fallback
}

export function setActiveFlagForActivity(
  value: unknown,
  activityId: number | string,
  activo: boolean
): ExerciseActivityMap {
  const map = normalizeActivityMap(value)
  const key = activityKey(activityId)
  map[key] = {
    ...(map[key] || {}),
    activo
  }
  return map
}

export function removeActivity(
  value: unknown,
  activityId: number | string
): ExerciseActivityMap {
  const map = normalizeActivityMap(value)
  const key = activityKey(activityId)
  if (key in map) {
    delete map[key]
  }
  return map
}

