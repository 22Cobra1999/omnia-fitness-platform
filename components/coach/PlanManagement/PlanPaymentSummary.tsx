
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { PLAN_NAMES, PLAN_PRICES } from './data/plan-data'
import { type PlanType } from '../hooks/usePlanManagementLogic'

interface PlanPaymentSummaryProps {
    showPaymentSummary: boolean
    setShowPaymentSummary: (show: boolean) => void
    paymentPlanType: PlanType | null
    changing: PlanType | null
    setConfirmingPlan: (plan: PlanType | null) => void
    confirmPlanChange: (plan: PlanType) => Promise<void>
    formatPrice: (price: number) => string
}

export const PlanPaymentSummary = ({
    showPaymentSummary,
    setShowPaymentSummary,
    paymentPlanType,
    changing,
    setConfirmingPlan,
    confirmPlanChange,
    formatPrice
}: PlanPaymentSummaryProps) => {

    const closePaymentSummary = () => setShowPaymentSummary(false)

    return (
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
    )
}
