// Función para formatear fechas en español usando Intl API
export function formatDate(dateString: string): string {
  if (!dateString) return "Fecha desconocida"

  try {
    const date = new Date(dateString)

    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return "Fecha inválida"
    }

    // Formatear la fecha en español usando Intl API
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  } catch (error) {
    console.error("Error al formatear fecha:", error)
    return "Error de formato"
  }
}

// Función adicional para formato corto
export function formatDateShort(dateString: string): string {
  if (!dateString) return ""

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""

    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date)
  } catch (error) {
    return ""
  }
}

// Función para formatear tiempo
export function formatTime(dateString: string): string {
  if (!dateString) return ""

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ""

    return new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  } catch (error) {
    return ""
  }
}
