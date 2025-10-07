// Sistema de logging configurable
export const logger = {
  // Configuración
  isDevelopment: process.env.NODE_ENV === 'development',
  isVerbose: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true',
  
  // Logs básicos (siempre en desarrollo)
  log: (message: string, ...args: any[]) => {
    if (logger.isDevelopment) {
      console.log(message, ...args)
    }
  },
  
  // Logs de debugging (solo si verbose está habilitado)
  debug: (message: string, ...args: any[]) => {
    if (logger.isVerbose) {
      // console.log(`🔍 ${message}`, ...args)
    }
  },
  
  // Logs de información importante
  info: (message: string, ...args: any[]) => {
    if (logger.isDevelopment) {
      console.log(`ℹ️ ${message}`, ...args)
    }
  },
  
  // Logs de éxito
  success: (message: string, ...args: any[]) => {
    if (logger.isDevelopment) {
      // console.log(`✅ ${message}`, ...args)
    }
  },
  
  // Logs de advertencia
  warn: (message: string, ...args: any[]) => {
    if (logger.isDevelopment) {
      console.warn(`⚠️ ${message}`, ...args)
    }
  },
  
  // Logs de error (siempre visibles)
  error: (message: string, ...args: any[]) => {
    console.error(`❌ ${message}`, ...args)
  },
  
  // Logs de estado (para debugging de estado)
  state: (component: string, state: any) => {
    if (logger.isVerbose) {
      // console.log(`🔍 Estado de ${component}:`, state)
    }
  },
  
  // Logs de performance
  perf: (operation: string, duration: number) => {
    if (logger.isVerbose) {
      console.log(`⚡ ${operation}: ${duration}ms`)
    }
  },
  
  // Logs de API calls
  api: (method: string, url: string, status?: number) => {
    if (logger.isDevelopment) {
      const statusIcon = status ? (status >= 400 ? '❌' : '✅') : '🔄'
      console.log(`${statusIcon} API ${method} ${url}${status ? ` (${status})` : ''}`)
    }
  }
}

// Hook para usar el logger en componentes
export const useLogger = (componentName: string) => {
  return {
    log: (message: string, ...args: any[]) => logger.log(`[${componentName}] ${message}`, ...args),
    debug: (message: string, ...args: any[]) => logger.debug(`[${componentName}] ${message}`, ...args),
    info: (message: string, ...args: any[]) => logger.info(`[${componentName}] ${message}`, ...args),
    success: (message: string, ...args: any[]) => logger.success(`[${componentName}] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => logger.warn(`[${componentName}] ${message}`, ...args),
    error: (message: string, ...args: any[]) => logger.error(`[${componentName}] ${message}`, ...args),
    state: (state: any) => logger.state(componentName, state),
    perf: (operation: string, duration: number) => logger.perf(`[${componentName}] ${operation}`, duration),
    api: (method: string, url: string, status?: number) => logger.api(method, url, status)
  }
}

