"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CreditCard, Smartphone, Building2, Wallet, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PaymentMethodsModalProps {
  isOpen: boolean
  onClose: () => void
  onPaymentMethodSelect: (method: string) => void
  productPrice: number
  productTitle: string
}

interface PaymentMethod {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  available: boolean
  processingFee?: number
}

export function PaymentMethodsModal({
  isOpen,
  onClose,
  onPaymentMethodSelect,
  productPrice,
  productTitle
}: PaymentMethodsModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'mercadopago',
      name: 'MercadoPago',
      description: 'Pago rápido y seguro',
      icon: <Wallet className="w-6 h-6" />,
      available: true,
      processingFee: 0
    },
  ]

  // Auto-seleccionar Mercado Pago al abrir el modal
  React.useEffect(() => {
    if (isOpen && paymentMethods.length > 0) {
      setSelectedMethod('mercadopago')
    }
  }, [isOpen])

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId)
  }

  const handleConfirmPayment = async () => {
    if (!selectedMethod) return

    setIsProcessing(true)

    // Simular procesamiento
    setTimeout(() => {
      setIsProcessing(false)
      onPaymentMethodSelect(selectedMethod)
    }, 1000)
  }

  const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedMethod)
  const totalWithFee = selectedPaymentMethod
    ? productPrice + (productPrice * (selectedPaymentMethod.processingFee || 0))
    : productPrice

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[calc(100%-2rem)] sm:max-w-[420px] bg-[#1A1A1A] border border-[#3A3A3A] text-white rounded-3xl shadow-2xl overflow-hidden p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#FF7939]" />
            Métodos de Pago
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Product Info */}
          <div className="bg-[#2A2A2A] rounded-2xl p-3 border border-[#3A3A3A]">
            <h3 className="font-semibold text-white mb-1">{productTitle}</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Precio base</span>
              <span className="text-white font-bold">${productPrice.toFixed(2)}</span>
            </div>
            {selectedPaymentMethod && (selectedPaymentMethod.processingFee || 0) > 0 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-400 text-sm">Comisión ({(selectedPaymentMethod.processingFee || 0) * 100}%)</span>
                <span className="text-gray-400">${(productPrice * (selectedPaymentMethod.processingFee || 0)).toFixed(2)}</span>
              </div>
            )}
            {selectedPaymentMethod && (
              <div className="border-t border-[#3A3A3A] mt-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#FF7939] font-bold">Total</span>
                  <span className="text-[#FF7939] font-bold text-lg">${totalWithFee.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold mb-3">Selecciona tu método de pago</h4>
            {paymentMethods.map((method) => (
              <motion.div
                key={method.id}
              >
                <div
                  className={`w-full p-3 rounded-2xl border transition-all duration-200 ${selectedMethod === method.id
                    ? 'border-[#FF7939] bg-[#FF7939]/10'
                    : method.available
                      ? 'border-[#3A3A3A] bg-[#2A2A2A]'
                      : 'border-[#3A3A3A] bg-[#1A1A1A] opacity-50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${selectedMethod === method.id ? 'bg-[#FF7939] text-white' : 'bg-[#3A3A3A] text-gray-400'
                        }`}>
                        {method.icon}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{method.name}</span>
                          {!method.available && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                              Próximamente
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{method.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {selectedMethod === method.id ? (
                        <div className="w-6 h-6 bg-[#FF7939] rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 border-2 border-[#3A3A3A] rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3">
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 bg-[#2A2A2A] hover:bg-[#3A3A3A] text-white border border-[#3A3A3A] rounded-2xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={!selectedMethod || isProcessing}
              className="flex-1 bg-[#FF7939] hover:bg-[#E66829] text-white disabled:bg-gray-600 disabled:cursor-not-allowed rounded-2xl"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Procesando...</span>
                </div>
              ) : (
                `Pagar $${totalWithFee.toFixed(2)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
