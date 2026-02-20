
import { Check, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PLAN_NAMES, PLAN_ICONS, PLAN_COLORS, PLAN_PRICES, PLAN_COMMISSION_PERCENT } from './data/plan-data'
import { type Plan, type PlanType } from '../hooks/usePlanManagementLogic'

interface PlanHeaderProps {
    currentPlan: Plan | null
    formatDate: (date: string | Date | null) => string
    formatPrice: (price: number) => string
    setShowPlansDialog: (show: boolean) => void
    error?: string | null
}

export const PlanHeader = ({
    currentPlan,
    formatDate,
    formatPrice,
    setShowPlansDialog,
    error
}: PlanHeaderProps) => {

    const currentPlanType: PlanType = currentPlan?.plan_type || 'free'
    const currentPlanInfo = PLAN_PRICES[currentPlanType]
    const CurrentIcon = PLAN_ICONS[currentPlanType]
    const currentColor = PLAN_COLORS[currentPlanType]
    const currentNextPaymentDate = currentPlan?.mercadopago_subscription_next_payment_date || null
    const currentExpiresAt = currentPlan?.expires_at || null

    return (
        <div className="bg-black rounded-2xl p-4 space-y-4">
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
                            {currentPlanInfo.price > 0 && (
                                <p className="text-xs text-gray-300 mt-1">
                                    {(currentNextPaymentDate || currentExpiresAt) ? (
                                        <>Próximo cobro: {formatDate(currentNextPaymentDate || currentExpiresAt)}</>
                                    ) : null}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        {currentPlanInfo.price > 0 ? (
                            <>
                                <p className="text-lg font-bold text-[#FF7939]">
                                    {formatPrice(currentPlanInfo.price)}
                                </p>
                                <div className="flex items-baseline justify-end gap-2">
                                    <p className="text-xs font-bold text-[#FFB0C8]">
                                        {PLAN_COMMISSION_PERCENT[currentPlanType]}%
                                    </p>
                                    <p className="text-xs text-gray-400">/mes</p>
                                </div>
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
    )
}
