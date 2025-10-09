/**
 * Sistema de throttling de logs para evitar spam cuando hay errores
 */

interface LogEntry {
  count: number
  lastLogTime: number
  firstLogTime: number
}

class LogThrottler {
  private logs = new Map<string, LogEntry>()
  private readonly THROTTLE_WINDOW = 10000 // 10 segundos
  private readonly MAX_LOGS_PER_WINDOW = 5 // Máximo 5 logs por ventana
  private readonly SILENCE_DURATION = 30000 // 30 segundos de silencio después del límite

  /**
   * Log con throttling - evita spam de logs repetitivos
   */
  log(key: string, message: string, data?: any, level: 'log' | 'warn' | 'error' = 'log') {
    const now = Date.now()
    const entry = this.logs.get(key)

    if (!entry) {
      // Primera vez que se ve este log
      this.logs.set(key, {
        count: 1,
        lastLogTime: now,
        firstLogTime: now
      })
      this.outputLog(message, data, level)
      return
    }

    const timeSinceFirst = now - entry.firstLogTime
    const timeSinceLast = now - entry.lastLogTime

    // Si han pasado más de 30 segundos desde el último log, resetear contador
    if (timeSinceLast > this.SILENCE_DURATION) {
      this.logs.set(key, {
        count: 1,
        lastLogTime: now,
        firstLogTime: now
      })
      this.outputLog(message, data, level)
      return
    }

    // Si estamos dentro de la ventana de tiempo
    if (timeSinceFirst < this.THROTTLE_WINDOW) {
      if (entry.count < this.MAX_LOGS_PER_WINDOW) {
        // Permitir log
        entry.count++
        entry.lastLogTime = now
        this.outputLog(message, data, level)
      } else {
        // Solo mostrar el primer log que excede el límite
        if (entry.count === this.MAX_LOGS_PER_WINDOW) {
          entry.count++
          entry.lastLogTime = now
          this.outputLog(`${message} [THROTTLED - Too many logs, suppressing for 30s]`, { 
            originalData: data, 
            totalLogs: entry.count,
            timeWindow: `${this.THROTTLE_WINDOW/1000}s`
          }, 'warn')
        }
      }
    } else {
      // Nueva ventana de tiempo, resetear
      this.logs.set(key, {
        count: 1,
        lastLogTime: now,
        firstLogTime: now
      })
      this.outputLog(message, data, level)
    }
  }

  /**
   * Log de error con throttling especial
   */
  error(key: string, message: string, error?: any) {
    this.log(key, message, error, 'error')
  }

  /**
   * Log de warning con throttling especial
   */
  warn(key: string, message: string, data?: any) {
    this.log(key, message, data, 'warn')
  }

  /**
   * Limpiar logs antiguos (llamar periódicamente)
   */
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.logs.entries()) {
      if (now - entry.lastLogTime > this.SILENCE_DURATION * 2) {
        this.logs.delete(key)
      }
    }
  }

  /**
   * Obtener estadísticas de throttling
   */
  getStats() {
    return {
      activeThrottles: this.logs.size,
      throttledKeys: Array.from(this.logs.keys()),
      entries: Array.from(this.logs.entries()).map(([key, entry]) => ({
        key,
        count: entry.count,
        lastLog: new Date(entry.lastLogTime).toISOString(),
        isThrottled: entry.count >= this.MAX_LOGS_PER_WINDOW
      }))
    }
  }

  private outputLog(message: string, data?: any, level: 'log' | 'warn' | 'error' = 'log') {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}]`
    
    switch (level) {
      case 'error':
        if (data) {
          console.error(prefix, message, data)
        } else {
          console.error(prefix, message)
        }
        break
      case 'warn':
        if (data) {
          console.warn(prefix, message, data)
        } else {
          console.warn(prefix, message)
        }
        break
      default:
        if (data) {
          console.log(prefix, message, data)
        } else {
          console.log(prefix, message)
        }
    }
  }
}

// Instancia global del throttler
export const logThrottler = new LogThrottler()

// Limpiar logs antiguos cada 2 minutos
setInterval(() => {
  logThrottler.cleanup()
}, 2 * 60 * 1000)

// Función helper para logs throttled
export const throttledLog = {
  log: (key: string, message: string, data?: any) => logThrottler.log(key, message, data, 'log'),
  warn: (key: string, message: string, data?: any) => logThrottler.warn(key, message, data),
  error: (key: string, message: string, error?: any) => logThrottler.error(key, message, error)
}


































