"use client"

import React, { useState, useEffect, useRef } from 'react'
import { 
  Check, 
  ChevronRight, 
  Zap,
  Shield,
  Crown,
  Gift,
  Loader2,
  HardDrive,
  Package,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface Plan {
  id: string
  plan_type: 'free' | 'basico' | 'black' | 'premium'
  storage_limit_gb: number
  storage_used_gb: number
  storage_available_gb: number
  status: string
  started_at?: string
  expires_at?: string
}

interface PlanFeature {
  name: string
  free: string | boolean
  basico: string | boolean
  black: string | boolean
  premium: string | boolean
}

const PLAN_PRICES = {
  free: { price: 0, currency: 'ARS', period: '3 meses o hasta 3 ventas' },
  basico: { price: 12000, currency: 'ARS', period: 'mensual' },
  black: { price: 22000, currency: 'ARS', period: 'mensual' },
  premium: { price: 35000, currency: 'ARS', period: 'mensual' }
}

const PLAN_NAMES = {
  free: 'Free / Inicial',
  basico: 'Básico',
  black: 'Black',
  premium: 'Premium'
}

const PLAN_ICONS = {
  free: Gift,
  basico: Zap,
  black: Shield,
  premium: Crown
}

const PLAN_COLORS = {
  free: 'bg-[#FF7939]/20 text-[#CC5C2E] border-[#CC5C2E]/30',
  basico: 'bg-[#FF7939]/20 text-[#FF7939] border-[#FF7939]/30',
  black: 'bg-[#FF7939]/20 text-[#FFA570] border-[#FFA570]/30',
  premium: 'bg-[#FF7939]/20 text-[#FFB894] border-[#FFB894]/30'
}

const PLAN_FEATURES: PlanFeature[] = [
  {
    name: 'Almacenamiento',
    free: '1 GB',
    basico: '5 GB',
    black: '25 GB',
    premium: '100 GB'
  },
  {
    name: 'Productos activos',
    free: '3',
    basico: '5',
    black: '10',
    premium: '20'
  },
  {
    name: 'Clientes totales',
    free: '10',
    basico: '30',
    black: '70',
    premium: '150'
  },
  {
    name: 'Actividades por producto',
    free: '20',
    basico: '40',
    black: '60',
    premium: '100'
  },
  {
    name: 'Stock por producto (cupos)',
    free: '10',
    basico: '30',
    black: '75',
    premium: '150'
  },
  {
    name: 'Semanas por producto',
    free: '2',
    basico: '4',
    black: '9',
    premium: '17'
  },
  {
    name: 'Comisión por venta',
    free: '5%',
    basico: '5%',
    black: '4%',
    premium: '3%'
  },
  {
    name: 'Duración de video (máx)',
    free: '—',
    basico: '30 s',
    black: '60 s',
    premium: '120 s'
  },
  {
    name: 'Video de portada',
    free: false,
    basico: true,
    black: true,
    premium: true
  },
  {
    name: 'Analítica',
    free: '—',
    basico: 'Básica',
    black: 'Avanzada',
    premium: 'Completa'
  },
  {
    name: 'Soporte',
    free: 'E-mail',
    basico: 'E-mail prioritario',
    black: 'Chat directo',
    premium: 'Soporte técnico directo'
  }
]

type PlanType = 'free' | 'basico' | 'black' | 'premium'

function PlanManagement() {
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState<any>(null)
  const [showPlansDialog, setShowPlansDialog] = useState(false)
  const [confirmingPlan, setConfirmingPlan] = useState<string | null>(null)
  const [showPaymentSummary, setShowPaymentSummary] = useState(false)
  const [paymentPlanType, setPaymentPlanType] = useState<PlanType | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState<any>(null)
  const planSectionRef = useRef<HTMLDivElement>(null)

  const openPaymentSummary = (planType: PlanType) => {
    setPaymentPlanType(planType)
    setShowPaymentSummary(true)
  }

  const closePaymentSummary = () => {
    setShowPaymentSummary(false)
    setPaymentPlanType(null)
  }

  useEffect(() => {
    loadCurrentPlan()
    
    // Verificar si hay un mensaje de éxito guardado después de recargar
    const successMessage = localStorage.getItem('plan_change_success')
    if (successMessage) {
      toast.success('¡Plan actualizado!', {
        description: successMessage,
        duration: 5000,
      })
      localStorage.removeItem('plan_change_success')
    }
  }, [])

  // Listener para navegación desde otros componentes
  useEffect(() => {
    const handleNavigateToSection = (event: CustomEvent) => {
      const { section } = event.detail
      if (section === 'plans') {
        // Abrir el diálogo de planes directamente
        setTimeout(() => {
          setShowPlansDialog(true)
          // Hacer scroll hasta la sección de planes
          if (planSectionRef.current) {
            planSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 500)
      }
    }

    window.addEventListener('navigateToSection', handleNavigateToSection as EventListener)
    return () => {
      window.removeEventListener('navigateToSection', handleNavigateToSection as EventListener)
    }
  }, [])

  const loadCurrentPlan = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/coach/plan', {
        credentials: 'include'
      })
      
      if (!response.ok) {
        console.error(`Error HTTP: ${response.status} ${response.statusText}`)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        setError(`Error al cargar plan: ${response.status}`)
        setLoading(false)
        return
      }
      
      const result = await response.json()
      
      if (result.success) {
        setCurrentPlan(result.plan)
      } else {
        setError(result.error || 'Error al cargar plan')
      }
    } catch (err) {
      console.error('Error cargando plan:', err)
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const confirmPlanChange = async (planType: string) => {
    if (changing) return
    
    setChanging(planType)
    setError(null)
    
    try {
      const response = await fetch('/api/coach/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan_type: planType })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Si hay un init_point de Mercado Pago, redirigir para el pago
        if (result.subscription_init_point) {
          console.log('🚀 Redirigiendo a Mercado Pago:', result.subscription_init_point)
          window.location.href = result.subscription_init_point
          return
        }
        
        setCurrentPlan(result.plan)
        setConfirmingPlan(null)
        setShowPlansDialog(false)
        
        // Determinar si es upgrade o downgrade
        const isUpgrade = result.is_upgrade
        const isDowngrade = result.is_downgrade
        
        if (isUpgrade) {
          // UPGRADE: Mostrar mensaje de éxito con botón continuar
          const expiresAt = currentPlan?.expires_at 
            ? new Date(currentPlan.expires_at)
            : null
          
          const expiresDate = expiresAt 
            ? expiresAt.toLocaleDateString('es-AR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })
            : null
          
          setSuccessMessage({
            title: '¡Disfruta tu nuevo plan!',
            description: result.message || `Plan actualizado a ${planType} exitosamente`,
            type: 'upgrade'
          })
          setShowSuccessMessage(true)
          
          // También mostrar toast
          toast.success('¡Disfruta tu nuevo plan!', {
            description: result.message || `Plan actualizado a ${planType} exitosamente`,
            duration: 5000,
          })
        } else if (isDowngrade) {
          // DOWNGRADE: Mostrar información sobre cuándo empezará el nuevo plan
          const expiresAt = currentPlan?.expires_at 
            ? new Date(currentPlan.expires_at)
            : null
          
          const expiresDate = expiresAt 
            ? expiresAt.toLocaleDateString('es-AR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })
            : 'la fecha de expiración de tu plan actual'
          
          setSuccessMessage({
            title: 'Cambio de plan programado',
            description: `Aún podrás usar tu plan actual hasta el ${expiresDate}. El nuevo plan comenzará automáticamente después de esa fecha.`,
            type: 'downgrade'
          })
          setShowSuccessMessage(true)
          
          // También mostrar toast
          toast.info('Cambio de plan programado', {
            description: `Aún podrás usar tu plan actual hasta el ${expiresDate}. El nuevo plan comenzará automáticamente después.`,
            duration: 6000,
          })
        } else {
          // Cambio normal (mismo nivel)
          setSuccessMessage({
            title: '¡Plan actualizado!',
            description: result.message || `Plan cambiado a ${planType} exitosamente`,
            type: 'normal'
          })
          setShowSuccessMessage(true)
          
          toast.success('¡Plan actualizado!', {
            description: result.message || `Plan cambiado a ${planType} exitosamente`,
            duration: 3000,
          })
        }
      } else {
        // Mostrar detalles si existen (para debuggear el 500 de MercadoPago/BD)
        const detailMsg = result.details ? `: ${typeof result.details === 'object' ? JSON.stringify(result.details) : result.details}` : ''
        const fullError = (result.error || 'Error al cambiar plan') + detailMsg
        
        setError(fullError)
        setConfirmingPlan(null)
        toast.error('Error al cambiar plan', {
          description: result.error ? (result.error + (result.details ? ` (${result.details})` : '')) : 'No se pudo cambiar el plan',
          duration: 8000,
        })
      }
    } catch (err) {
      console.error('Error cambiando plan:', err)
      setError('Error de conexión')
      setConfirmingPlan(null)
      toast.error('Error de conexión', {
        description: 'No se pudo conectar con el servidor',
      })
    } finally {
      setChanging(null)
    }
  }
  
  // Función para determinar si es upgrade o downgrade
  const getPlanLevel = (planType: string): number => {
    const levels: Record<string, number> = {
      free: 0,
      basico: 1,
      black: 2,
      premium: 3
    }
    return levels[planType] || 0
  }
  
  // Función para formatear fecha
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price)
  }

  const formatGB = (gb: number) => {
    if (gb < 0.001) return '0 GB'
    return `${gb.toFixed(2)} GB`
  }
  
  const handleContinue = () => {
    setShowSuccessMessage(false)
    setSuccessMessage(null)
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="bg-black rounded-2xl p-4">
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#FF7939]" />
        </div>
      </div>
    )
  }

  if (error && !currentPlan) {
    return (
      <div className="bg-black rounded-2xl p-4">
        <div className="text-red-500 text-sm text-center py-4">{error}</div>
        <Button onClick={loadCurrentPlan} className="w-full" variant="outline">
          Reintentar
        </Button>
      </div>
    )
  }

  // Mostrar mensaje de éxito con botón continuar
  if (showSuccessMessage && successMessage) {
    return (
      <div className="bg-black rounded-2xl p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`rounded-full p-4 ${
            successMessage.type === 'upgrade' 
              ? 'bg-green-500/20' 
              : successMessage.type === 'downgrade'
              ? 'bg-blue-500/20'
              : 'bg-[#FF7939]/20'
          }`}>
            {successMessage.type === 'upgrade' ? (
              <Check className="w-8 h-8 text-green-500" />
            ) : successMessage.type === 'downgrade' ? (
              <Check className="w-8 h-8 text-blue-500" />
            ) : (
              <Check className="w-8 h-8 text-[#FF7939]" />
            )}
          </div>
          
          <div>
            <h3 className={`text-xl font-bold mb-2 ${
              successMessage.type === 'upgrade'
                ? 'text-green-500'
                : successMessage.type === 'downgrade'
                ? 'text-blue-500'
                : 'text-[#FF7939]'
            }`}>
              {successMessage.title}
            </h3>
            <p className="text-sm text-gray-300 max-w-md">
              {successMessage.description}
            </p>
          </div>
          
          <Button
            onClick={handleContinue}
            className="w-full bg-[#FF7939] hover:bg-[#FF7939]/80 text-white border-0"
            size="lg"
          >
            Continuar
          </Button>
        </div>
      </div>
    )
  }

  const currentPlanType: PlanType = (currentPlan?.plan_type as PlanType) || 'free'
  const currentPlanInfo = PLAN_PRICES[currentPlanType]
  const CurrentIcon = PLAN_ICONS[currentPlanType]
  const currentColor = PLAN_COLORS[currentPlanType]

  return (
    <>
      <div ref={planSectionRef} className="bg-black rounded-2xl p-3 space-y-3">
        <h3 className="text-base font-semibold text-white">Mi Suscripción</h3>
        
        {/* Plan Actual - Diseño simplificado */}
        <div className="p-3 rounded-xl bg-[#0A0A0A] border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${currentColor}`}>
                <CurrentIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">{PLAN_NAMES[currentPlanType]}</p>
                <p className="text-xs text-gray-400">
                  {currentPlanInfo.price === 0 
                    ? currentPlanInfo.period 
                    : `Activo • ${currentPlanInfo.period}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              {currentPlanInfo.price > 0 ? (
                <>
                  <p className="text-lg font-bold text-[#FF7939]">
                    {formatPrice(currentPlanInfo.price)}
                  </p>
                  <p className="text-xs text-gray-400">/mes</p>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Botón Ver Planes */}
        <Button
          onClick={() => setShowPlansDialog(true)}
          variant="outline"
          className="w-full text-sm border-white/10 hover:bg-white/5 hover:border-[#FF7939]/30"
        >
          Ver Planes
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>

        {/* Mensaje de error */}
        {error && (
          <div className="text-red-500 text-sm text-center py-2">{error}</div>
        )}
      </div>

      {/* Dialog de Planes */}
      <Dialog open={showPlansDialog} onOpenChange={setShowPlansDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Planes Disponibles</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Lista de planes */}
            <div className="space-y-3">
              {(['free', 'basico', 'black', 'premium'] as const)
                .filter(planType => !confirmingPlan || planType === confirmingPlan)
                .map((planType) => {
                const isCurrent = planType === currentPlanType
                const isConfirming = confirmingPlan === planType
                const Icon = PLAN_ICONS[planType]
                const color = PLAN_COLORS[planType]
                const planInfo = PLAN_PRICES[planType]
                const isChanging = changing === planType

                return (
                  <div
                    key={planType}
                    className={`rounded-xl transition-all ${
                      isConfirming 
                        ? 'p-6 bg-[#CC5C2E] border border-[#CC5C2E]' 
                        : isCurrent 
                        ? 'p-4 bg-[#CC5C2E] border border-[#CC5C2E]' 
                        : 'p-4 bg-[#0A0A0A] border-0'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isConfirming || isCurrent ? 'bg-black text-gray-400' : color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`${isConfirming || isCurrent ? 'font-bold' : 'font-semibold'} ${isConfirming || isCurrent ? 'text-black' : 'text-white'}`}>{PLAN_NAMES[planType]}</span>
                            {isCurrent && (
                              <span className="text-xs px-2 py-0.5 bg-black/20 rounded-full text-black font-medium">
                                Actual
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${isConfirming || isCurrent ? 'font-bold text-black/80' : 'text-gray-400'}`}>
                            {planInfo.price === 0 ? planInfo.period : `Plan ${planInfo.period}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {planInfo.price > 0 ? (
                          <>
                            <p className={`text-lg font-bold ${isConfirming || isCurrent ? 'text-black' : 'text-[#FF7939]'}`}>
                              {formatPrice(planInfo.price)}
                            </p>
                            <p className={`text-xs ${isConfirming || isCurrent ? 'font-bold text-black/70' : 'text-gray-400'}`}>/mes</p>
                          </>
                        ) : null}
                      </div>
                    </div>

                    {/* Características principales - Diseño vertical sin frames */}
                    <div className="mb-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <HardDrive className={`w-5 h-5 ${isConfirming || isCurrent ? 'text-black' : 'text-[#FF7939]'}`} />
                        <div className="flex-1">
                          <span className={`text-base font-bold ${isConfirming || isCurrent ? 'text-black/80' : 'text-gray-300'}`}>Almacenamiento</span>
                          <span className={`text-base font-bold ${isConfirming || isCurrent ? 'text-black' : 'text-white'} ml-2`}>{PLAN_FEATURES[0][planType]}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className={`w-5 h-5 ${isConfirming || isCurrent ? 'text-black' : 'text-[#FF7939]'}`} />
                        <div className="flex-1">
                          <span className={`text-base font-bold ${isConfirming || isCurrent ? 'text-black/80' : 'text-gray-300'}`}>Productos</span>
                          <span className={`text-base font-bold ${isConfirming || isCurrent ? 'text-black' : 'text-white'} ml-2`}>{PLAN_FEATURES[1][planType]}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className={`w-5 h-5 ${isConfirming || isCurrent ? 'text-black' : 'text-[#FF7939]'}`} />
                        <div className="flex-1">
                        <span className={`text-base font-bold ${isConfirming || isCurrent ? 'text-black/80' : 'text-gray-300'}`}>Clientes totales</span>
                          <span className={`text-base font-bold ${isConfirming || isCurrent ? 'text-black' : 'text-white'} ml-2`}>{PLAN_FEATURES[2][planType]}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botón cambiar o confirmación */}
                    {!isCurrent && !isConfirming && (
                      <Button
                        onClick={() => setConfirmingPlan(planType)}
                        disabled={isChanging || !!changing || !!confirmingPlan}
                        className="w-full text-xs bg-[#FF7939]/10 hover:bg-[#FF7939]/20 text-[#FF7939] border border-[#FF7939]/30 backdrop-blur-sm transition-all"
                        variant="outline"
                        size="sm"
                      >
                        Cambiar a este plan
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}

                    {/* Mensaje de confirmación */}
                    {isConfirming && (
                      <div className="mt-4">
                        <p className="text-sm font-bold text-black mb-4">
                          ¿Confirmas el cambio al plan <span className="font-bold">{PLAN_NAMES[planType]}</span>?
                        </p>
                        
                        {/* Información adicional para downgrade */}
                        {currentPlan && getPlanLevel(planType) < getPlanLevel(currentPlanType) && currentPlan.expires_at && (
                          <div className="mb-4 p-3 bg-black/20 rounded-lg border border-black/30">
                            <p className="text-xs font-semibold text-black/90 mb-1">
                              📅 Información importante:
                            </p>
                            <p className="text-xs text-black/80">
                              Aún podrás usar tu plan actual hasta el <span className="font-bold">{formatDate(currentPlan.expires_at)}</span>. 
                              El nuevo plan comenzará automáticamente después de esa fecha.
                            </p>
                          </div>
                        )}
                        
                        
                        <div className="flex gap-2">
                          <Button
                            onClick={() => openPaymentSummary(planType)}
                            disabled={isChanging}
                            className="flex-1 text-xs bg-black hover:bg-black/80 text-white border-0"
                            variant="default"
                            size="sm"
                          >
                            Confirmar
                          </Button>
                          <Button
                            onClick={() => setConfirmingPlan(null)}
                            disabled={isChanging}
                            className="flex-1 text-xs bg-black/20 hover:bg-black/30 text-black border border-black/30"
                            variant="outline"
                            size="sm"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Tabla comparativa completa */}
            <div className={`pt-6 border-t border-white/10 transition-all ${confirmingPlan ? 'mt-4' : 'mt-6'}`}>
              <h4 className="text-sm font-medium text-white mb-4">Comparativa Completa</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 text-gray-400 font-medium">Característica</th>
                      <th className="text-center py-3 text-gray-400 font-medium">Free</th>
                      <th className="text-center py-3 text-gray-400 font-medium">Básico</th>
                      <th className="text-center py-3 text-gray-400 font-medium">Black</th>
                      <th className="text-center py-3 text-gray-400 font-medium">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PLAN_FEATURES.map((feature, idx) => (
                      <tr key={idx} className="border-b border-white/5">
                        <td className="py-3 text-gray-300 font-bold">{feature.name === 'Clientes recomendados' ? 'Clientes totales' : feature.name}</td>
                        <td className="text-center py-3">
                          {typeof feature.free === 'boolean' ? (
                            feature.free ? <Check className="w-4 h-4 text-[#FF7939] mx-auto" /> : <span className="text-gray-600 font-bold">—</span>
                          ) : (
                            <span className="text-gray-400 font-bold">{feature.free}</span>
                          )}
                        </td>
                        <td className="text-center py-3">
                          {typeof feature.basico === 'boolean' ? (
                            feature.basico ? <Check className="w-4 h-4 text-[#FF7939] mx-auto" /> : <span className="text-gray-600 font-bold">—</span>
                          ) : (
                            <span className="text-gray-400 font-bold">{feature.basico}</span>
                          )}
                        </td>
                        <td className="text-center py-3">
                          {typeof feature.black === 'boolean' ? (
                            feature.black ? <Check className="w-4 h-4 text-[#FF7939] mx-auto" /> : <span className="text-gray-600 font-bold">—</span>
                          ) : (
                            <span className="text-gray-400 font-bold">{feature.black}</span>
                          )}
                        </td>
                        <td className="text-center py-3">
                          {typeof feature.premium === 'boolean' ? (
                            feature.premium ? <Check className="w-4 h-4 text-[#FF7939] mx-auto" /> : <span className="text-gray-600 font-bold">—</span>
                          ) : (
                            <span className="text-gray-400 font-bold">{feature.premium}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de resumen previo al pago */}
      <Dialog open={showPaymentSummary} onOpenChange={setShowPaymentSummary}>
        <DialogContent className="max-w-md bg-black border-white/10">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-white">Resumen del cambio de plan</DialogTitle>
          </DialogHeader>

          {paymentPlanType ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#0A0A0A] border border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Plan seleccionado</p>
                    <p className="text-base font-semibold text-white">{PLAN_NAMES[paymentPlanType]}</p>
                  </div>
                  {PLAN_PRICES[paymentPlanType]?.price > 0 ? (
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#FF7939]">
                        {formatPrice(PLAN_PRICES[paymentPlanType].price)}
                      </p>
                      <p className="text-xs text-gray-400">/mes</p>
                    </div>
                  ) : null}
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Al continuar vas a ser redirigido a Mercado Pago para completar el pago.
              </p>

              <div className="flex gap-2">
                <Button
                  onClick={closePaymentSummary}
                  disabled={!!changing}
                  className="flex-1"
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    if (!paymentPlanType) return
                    closePaymentSummary()
                    setConfirmingPlan(null)
                    await confirmPlanChange(paymentPlanType)
                  }}
                  disabled={!!changing}
                  className="flex-1 bg-[#FF7939] hover:bg-[#FF7939]/80 text-white border-0"
                >
                  Ir a Mercado Pago
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

export { PlanManagement }
export default PlanManagement

