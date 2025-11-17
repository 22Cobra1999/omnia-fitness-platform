// Límites por plan
export const PLAN_LIMITS = {
  // Productos activos
  activeProducts: {
    free: 3,        // 3 productos activos máximo
    basico: 8,      // 8 productos activos máximo
    black: 15,      // 15 productos activos máximo
    premium: 30     // 30 productos activos máximo
  },
  
  // Actividades por producto (ejercicios para fitness, platos para nutrición)
  activitiesPerProduct: {
    free: 20,
    basico: 40,
    black: 60,
    premium: 100
  },
  
  // Stock máximo por producto (capacidad máxima / cupos)
  stockPerProduct: {
    free: 5,        // 5 cupos/clientes máximo por producto (3 productos × 5 = 15 ventas/mes)
    basico: 8,      // 8 cupos/clientes máximo por producto (8 productos × 8 = 64 ventas/mes)
    black: 15,      // 15 cupos/clientes máximo por producto (15 productos × 15 = 225 ventas/mes)
    premium: 25     // 25 cupos/clientes máximo por producto (30 productos × 25 = 750 ventas/mes)
  },
  
  // Clientes totales por plan (suma de cupos de todos los productos, excluyendo documentos)
  totalClients: {
    free: 10,       // 10 clientes totales máximo
    basico: 30,     // 30 clientes totales máximo
    black: 70,      // 70 clientes totales máximo
    premium: 150    // 150 clientes totales máximo
  },
  
  // Alias legado para compatibilidad con código existente.
  // TODO: eliminar cuando todo haga referencia a totalClients directamente.
  clientsPerProduct: {
    free: 10,
    basico: 30,
    black: 70,
    premium: 150
  },
  
  // Semanas por producto
  weeksPerProduct: {
    free: 4,
    basico: 10,
    black: 20,
    premium: 30
  }
}

export type PlanType = 'free' | 'basico' | 'black' | 'premium'

export function getPlanLimit(planType: PlanType | null | undefined, limitType: keyof typeof PLAN_LIMITS) {
  const plan = planType || 'free'
  return PLAN_LIMITS[limitType][plan] || PLAN_LIMITS[limitType].free
}

