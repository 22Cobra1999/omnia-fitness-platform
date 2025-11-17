"use client"

// Utilidad ligera para registrar uso de componentes/eventos en cliente
// Persiste en localStorage y mantiene contadores y últimos timestamps

export type UsageEvent =
  | "mount"
  | "unmount"
  | "click"
  | "open"
  | "close"
  | "view"
  | "submit"
  | "navigate"

export type UsageRecord = {
  component: string
  event: UsageEvent
  count: number
  lastAt: number
  extra?: Record<string, any>
}

export type UsageSnapshot = {
  version: number
  updatedAt: number
  records: Record<string, UsageRecord>
}

const STORAGE_KEY = "usage_stats_v1"

function safeGet(): UsageSnapshot {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, updatedAt: Date.now(), records: {} }
    const parsed = JSON.parse(raw) as UsageSnapshot
    if (!parsed || typeof parsed !== "object") throw new Error("invalid usage snapshot")
    return parsed
  } catch {
    return { version: 1, updatedAt: Date.now(), records: {} }
  }
}

function safeSet(snapshot: UsageSnapshot): void {
  try {
    snapshot.updatedAt = Date.now()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    // ignore
  }
}

function keyFor(component: string, event: UsageEvent): string {
  return `${component}::${event}`
}

export function logUsage(component: string, event: UsageEvent, extra?: Record<string, any>): void {
  if (typeof window === "undefined") return
  try {
    const snap = safeGet()
    const k = keyFor(component, event)
    const current = snap.records[k]
    if (!current) {
      snap.records[k] = { component, event, count: 1, lastAt: Date.now(), extra }
    } else {
      current.count += 1
      current.lastAt = Date.now()
      if (extra) current.extra = { ...(current.extra || {}), ...extra }
      snap.records[k] = current
    }
    safeSet(snap)
  } catch {
    // ignore
  }
}

export function getUsage(): UsageSnapshot {
  return safeGet()
}

export function resetUsage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function exportUsageAsCSV(): string {
  const snap = safeGet()
  const lines = ["component,event,count,lastAt,extra"]
  Object.values(snap.records).forEach((r) => {
    const extraStr = r.extra ? JSON.stringify(r.extra).replace(/"/g, '""') : ""
    lines.push(`${r.component},${r.event},${r.count},${new Date(r.lastAt).toISOString()},"${extraStr}"`)
  })
  return lines.join("\n")
}

export function mergeUsage(snapshot: UsageSnapshot): void {
  const current = safeGet()
  const merged: UsageSnapshot = { version: 1, updatedAt: Date.now(), records: { ...current.records } }
  Object.entries(snapshot.records).forEach(([k, rec]) => {
    const existing = merged.records[k]
    if (!existing) {
      merged.records[k] = rec
    } else {
      merged.records[k] = {
        component: rec.component,
        event: rec.event,
        count: (existing.count || 0) + (rec.count || 0),
        lastAt: Math.max(existing.lastAt || 0, rec.lastAt || 0),
        extra: { ...(existing.extra || {}), ...(rec.extra || {}) },
      }
    }
  })
  safeSet(merged)
}
