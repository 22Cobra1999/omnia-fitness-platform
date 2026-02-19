"use client"

import React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PurchaseSuccessModal } from "@/components/shared/payments/purchase-success-modal"
import { usePurchaseActivityLogic } from "./hooks/usePurchaseActivityLogic"

// Refactored Components
import { PurchaseModalHeader } from "./components/purchase-modal/PurchaseModalHeader"
import { PurchaseModalSummary } from "./components/purchase-modal/PurchaseModalSummary"
import { PurchaseModalPayment } from "./components/purchase-modal/PurchaseModalPayment"
import { PurchaseModalStatus } from "./components/purchase-modal/PurchaseModalStatus"
import { PurchaseModalActions } from "./components/purchase-modal/PurchaseModalActions"

interface Activity {
  id: number
  title: string
  price: number
  description?: string
  image_url?: string
  type?: string
  coach?: {
    id: string
    full_name: string
  }
  coach_id?: string
}

interface PurchaseActivityModalProps {
  isOpen: boolean
  onClose: () => void
  activity: Activity | null
  onPurchaseComplete?: (enrollment: any) => void
  onTabChange?: (tab: string) => void
}

export function PurchaseActivityModal({
  isOpen,
  onClose,
  activity,
  onPurchaseComplete,
  onTabChange
}: PurchaseActivityModalProps) {
  const {
    paymentMethod,
    setPaymentMethod,
    isProcessing,
    isComplete,
    isCheckingEnrollment,
    isAlreadyEnrolled,
    setIsAlreadyEnrolled,
    showSuccessModal,
    setShowSuccessModal,
    transactionDetails,
    searchParams,
    handlePurchase,
    handleClose,
    handleGoToActivity,
  } = usePurchaseActivityLogic({
    isOpen,
    onClose,
    activity,
    onPurchaseComplete,
    onTabChange,
  })

  if (!activity) return null

  const showStatus = isCheckingEnrollment || isAlreadyEnrolled || isComplete

  return (
    <>
      {/* Modal de éxito de compra (Return from Mercado Pago) */}
      <PurchaseSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        preferenceId={searchParams?.get('preference_id') || null}
        paymentId={searchParams?.get('payment_id') || null}
        activityId={activity?.id || null}
        onGoToActivity={handleGoToActivity}
      />

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-[#1A1A1A] text-white border-gray-800">
          <PurchaseModalHeader
            title={activity.title}
            handleClose={handleClose}
            isProcessing={isProcessing}
          />

          {showStatus ? (
            <PurchaseModalStatus
              isCheckingEnrollment={isCheckingEnrollment}
              isAlreadyEnrolled={isAlreadyEnrolled}
              isComplete={isComplete}
              activityTitle={activity.title}
              transactionDetails={transactionDetails}
              handleGoToActivity={handleGoToActivity}
              setIsAlreadyEnrolled={setIsAlreadyEnrolled}
            />
          ) : (
            <>
              <div className="space-y-4">
                <PurchaseModalSummary activity={activity} />
                <PurchaseModalPayment
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                />
              </div>

              <PurchaseModalActions
                handleClose={handleClose}
                handlePurchase={handlePurchase}
                isProcessing={isProcessing}
                price={activity.price}
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
