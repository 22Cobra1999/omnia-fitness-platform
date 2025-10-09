/**
 * Wrapper de fetch que registra automáticamente todas las llamadas a APIs
 */

import { trackAPI } from './usage-tracker'

export const trackedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  // Extraer URL y método
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  const method = init?.method || 'GET'
  
  // Rastrear la llamada
  if (url.includes('/api/')) {
    const apiPath = url.split('/api/')[1].split('?')[0]
    trackAPI(`/api/${apiPath}`, method)
  }
  
  // Ejecutar fetch original
  return fetch(input, init)
}

// Exportar también como default
export default trackedFetch

