// ✅ SISTEMA DE LOGGING SIMPLIFICADO
// - Solo logs esenciales
// - Sin spam de logs
// - Verificación general única

export const simpleLogger = {
  // Log solo para errores críticos
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error)
  },
  
  // Log solo para éxito de operaciones importantes
  success: (message: string) => {
    console.log(`✅ ${message}`)
  },
  
  // Log solo para información crítica del sistema
  info: (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`ℹ️ ${message}`)
    }
  }
}

// Hook simplificado para componentes
export const useSimpleLogger = (componentName: string) => {
  return {
    error: (message: string, error?: any) => simpleLogger.error(`[${componentName}] ${message}`, error),
    success: (message: string) => simpleLogger.success(`[${componentName}] ${message}`),
    info: (message: string) => simpleLogger.info(`[${componentName}] ${message}`)
  }
}

















