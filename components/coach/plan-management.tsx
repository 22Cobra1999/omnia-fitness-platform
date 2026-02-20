
"use client"

import React, { useState } from 'react'
import {
  ChevronRight,
  HardDrive,
  Package,
  Users,
  Check,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { usePlanManagementLogic, type PlanType } from './hooks/usePlanManagementLogic'
import { PlanHeader } from './PlanManagementBase/PlanHeader'
import { PlanCard } from './PlanManagementBase/PlanCard'
import { PlanFeaturesTable } from './PlanManagementBase/PlanFeaturesTable'
import { PlanPaymentSummary } from './PlanManagementBase/PlanPaymentSummary'
import { PLAN_NAMES } from './PlanManagementBase/data/plan-data'

function PlanManagement() {
  const {
    loading,
    changing,
    error,
    currentPlan,
    pendingPlan,
    showPlansDialog,
    setShowPlansDialog,
    confirmingPlan,
    setConfirmingPlan,
    showPaymentSummary,
    setShowPaymentSummary,
    openPaymentSummary,
    closePaymentSummary,
    paymentPlanType,
    showSuccessMessage,
    successMessage,
    planSectionRef,
    loadCurrentPlan,
    confirmPlanChange,
    getPlanLevel,
    formatDate,
    formatPrice,
    handleContinue
  } = usePlanManagementLogic()

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
          <div className={`rounded-full p-4 ${successMessage.type === 'upgrade'
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
            <h3 className={`text-xl font-bold mb-2 ${successMessage.type === 'upgrade'
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

  const currentPlanType: PlanType = currentPlan?.plan_type || 'free'
  const pendingPlanType: PlanType | null = pendingPlan?.plan_type || null
  const pendingHasSubscription = !!pendingPlan?.mercadopago_subscription_id
  const pendingStartedInPastOrNow = pendingPlan?.started_at
    ? new Date(pendingPlan.started_at).getTime() <= Date.now()
    : false
  const pendingStartsInFuture = pendingPlan?.started_at
    ? new Date(pendingPlan.started_at).getTime() > Date.now()
    : false
  const currentPlanExpiresAt = currentPlan?.expires_at || null
  const pendingPlanStartedAt = pendingPlan?.started_at || pendingPlan?.created_at || null

  return (
    <>
      <div ref={planSectionRef} className="space-y-4">
        {pendingPlanType && pendingPlan?.status === 'trial' && (
          <div className="rounded-xl border border-[#FF7939]/30 bg-[#FF7939]/10 p-4">
            <p className="text-sm font-semibold text-white">
              {pendingStartsInFuture ? 'Cambio de plan programado' : (pendingHasSubscription ? 'Upgrade pendiente de pago' : 'Cambio de plan programado')}
            </p>
            <p className="text-xs text-gray-300 mt-1">
              {pendingStartsInFuture ? (
                <>
                  Tenés tiempo de seguir usando <span className="font-semibold">{PLAN_NAMES[currentPlanType]}</span>
                  {currentPlanExpiresAt ? ` hasta el ${formatDate(currentPlanExpiresAt)}.` : '.'}
                  {' '}Luego cambiará a <span className="font-semibold">{PLAN_NAMES[pendingPlanType]}</span>. El cobro mensual se ajustará automáticamente.
                </>
              ) : pendingHasSubscription ? (
                <>
                  Tenés un cambio al plan <span className="font-semibold">{PLAN_NAMES[pendingPlanType]}</span> pendiente de confirmación.
                  {pendingPlanStartedAt ? ` Se inició el ${formatDate(pendingPlanStartedAt)}.` : ''}
                </>
              ) : (
                <>
                  Tu plan cambiará a <span className="font-semibold">{PLAN_NAMES[pendingPlanType]}</span>
                  {pendingPlanStartedAt ? ` el ${formatDate(pendingPlanStartedAt)}.` : '.'}
                  {pendingStartedInPastOrNow ? ' En breve se reflejará en tu cuenta.' : ''}
                </>
              )}
            </p>
          </div>
        )}

        <PlanHeader
          currentPlan={currentPlan}
          formatDate={formatDate}
          formatPrice={formatPrice}
          setShowPlansDialog={setShowPlansDialog}
          error={error}
        />
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
                .map((planType) => (
                  <PlanCard
                    key={planType}
                    planType={planType}
                    currentPlanType={currentPlanType}
                    confirmingPlan={confirmingPlan as PlanType | null}
                    changing={changing as PlanType | null}
                    setConfirmingPlan={setConfirmingPlan}
                    openPaymentSummary={openPaymentSummary}
                    currentPlan={currentPlan}
                    getPlanLevel={getPlanLevel}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                  />
                ))}
            </div>

            <PlanFeaturesTable />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de resumen previo al pago */}
      <PlanPaymentSummary
        showPaymentSummary={showPaymentSummary}
        setShowPaymentSummary={setShowPaymentSummary}
        paymentPlanType={paymentPlanType}
        changing={changing as PlanType | null}
        setConfirmingPlan={setConfirmingPlan}
        confirmPlanChange={confirmPlanChange}
        formatPrice={formatPrice}
      />
    </>
  )
}

export { PlanManagement }
export default PlanManagement
