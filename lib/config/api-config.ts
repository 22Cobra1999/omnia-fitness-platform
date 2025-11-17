// Configuración de API para evitar problemas de puerto
const getApiBaseUrl = () => {
  // En desarrollo, usar el puerto actual
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  
  // En servidor, usar localhost con puerto por defecto
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
}

export const API_BASE_URL = getApiBaseUrl()

export const API_ENDPOINTS = {
  PRODUCTS: `${API_BASE_URL}/api/products`,
  COACH_CONSULTATIONS: `${API_BASE_URL}/api/coach/consultations`,
  COACH_STATS: `${API_BASE_URL}/api/coach/stats-simple`,
} as const
