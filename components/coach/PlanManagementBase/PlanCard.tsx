
import { Check, ChevronRight, HardDrive, Package, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLAN_NAMES, PLAN_ICONS, PLAN_COLORS, PLAN_PRICES, PLAN_FEATURES } from './data/plan-data'
import { type Plan, type PlanType } from '../hooks/usePlanManagementLogic'

interface PlanCardProps {
    planType: PlanType
    currentPlanType: PlanType
    confirmingPlan: PlanType | null
    changing: PlanType | null
    setConfirmingPlan: (plan: PlanType | null) => void
    openPaymentSummary: (plan: PlanType) => void
    currentPlan: Plan | null
    getPlanLevel: (plan: PlanType) => number
    formatPrice: (price: number) => string
    formatDate: (date: string | Date | null) => string
}

export const PlanCard = ({
    planType,
    currentPlanType,
    confirmingPlan,
    changing,
    setConfirmingPlan,
    openPaymentSummary,
    currentPlan,
    getPlanLevel,
    formatPrice,
    formatDate
}: PlanCardProps) => {

    const isCurrent = planType === currentPlanType
    const isConfirming = confirmingPlan === planType
    const Icon = PLAN_ICONS[planType]
    const color = PLAN_COLORS[planType]
    const planInfo = PLAN_PRICES[planType]
    const isChanging = changing === planType

    // Helper para features específicas del card
    const getFeatureValue = (featureIndex: number) => {
        // Seguridad: accedemos por índice sabiendo la estructura de PLAN_FEATURES en plan-data.ts
        // 0: Almacenamiento, 1: Productos, 2: Clientes
        if (!PLAN_FEATURES[featureIndex]) return ''
        return PLAN_FEATURES[featureIndex][planType]
    }

    return (
        <div
            className={`rounded-xl transition-all ${isConfirming
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
                        <span className={`text-base font-bold ${isConfirming || isCurrent ? 'text-black' : 'text-white'} ml-2`}>{getFeatureValue(0)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Package className={`w-5 h-5 ${isConfirming || isCurrent ? 'text-black' : 'text-[#FF7939]'}`} />
                    <div className="flex-1">
                        <span className={`text-base font-bold ${isConfirming || isCurrent ? 'text-black/80' : 'text-gray-300'}`}>Productos</span>
                        <span className={`text-base font-bold ${isConfirming || isCurrent ? 'text-black' : 'text-white'} ml-2`}>{getFeatureValue(1)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Users className={`w-5 h-5 ${isConfirming || isCurrent ? 'text-black' : 'text-[#FF7939]'}`} />
                    <div className="flex-1">
                        <span className={`text-base font-bold ${isConfirming || isCurrent ? 'text-black/80' : 'text-gray-300'}`}>Clientes totales</span>
                        <span className={`text-base font-bold ${isConfirming || isCurrent ? 'text-black' : 'text-white'} ml-2`}>{getFeatureValue(2)}</span>
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
}
