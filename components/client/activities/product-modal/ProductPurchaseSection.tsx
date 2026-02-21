"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ShoppingCart, Calendar, ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PaymentMethodsModal } from '@/components/shared/payments/payment-methods-modal'

interface ProductPurchaseSectionProps {
    product: any
    logic: any
}

export function ProductPurchaseSection({ product, logic }: ProductPurchaseSectionProps) {
    const [mounted, setMounted] = useState(false)

    const {
        purchaseCompleted,
        isProcessingPurchase,
        handleGoToActivity,
        handlePurchase,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        executePurchase,
        showRepurchaseConfirm,
        repurchaseMessage,
        handleCancelRepurchase,
        handleConfirmRepurchase
    } = logic

    useEffect(() => {
        setMounted(true)
    }, [])

    if (product.isOwnProduct || !mounted) return null

    // Portal content
    const content = (
        <div className="product-purchase-portal-container" style={{ zIndex: 99999, position: 'relative' }}>
            {!isPaymentModalOpen && (
                <div
                    className="fixed bottom-24 right-4 z-[99999] flex flex-col items-end gap-2 pointer-events-none"
                >
                    {purchaseCompleted && (
                        <div className="bg-green-600/20 border border-green-500/30 rounded-full px-4 py-2 flex items-center space-x-2 pointer-events-auto">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-400 text-xs font-medium">¡Compra exitosa!</span>
                        </div>
                    )}

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            purchaseCompleted ? handleGoToActivity() : handlePurchase();
                        }}
                        disabled={isProcessingPurchase}
                        className="bg-[#FF7939] hover:bg-[#FF6B00] text-white rounded-full px-6 py-4 shadow-2xl transition-all active:scale-95 disabled:bg-gray-700 flex items-center space-x-3 pointer-events-auto"
                    >
                        {purchaseCompleted ? (
                            <><Calendar className="h-5 w-5" /><span className="text-sm font-bold">Ir a Actividad</span></>
                        ) : isProcessingPurchase ? (
                            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span className="text-sm font-bold">Procesando...</span></>
                        ) : (
                            <><ShoppingBag className="h-5 w-5" /><span className="text-sm font-black whitespace-nowrap">{`$${product.price || 0}.00`}</span></>
                        )}
                    </button>
                </div>
            )}

            <PaymentMethodsModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onPaymentMethodSelect={executePurchase}
                productPrice={product.price || 0}
                productTitle={product.title}
            />

            <AnimatePresence>
                {showRepurchaseConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={handleCancelRepurchase}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-16 h-16 bg-[#FF7939]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShoppingCart className="w-8 h-8 text-[#FF7939]" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Actividad ya comprada</h3>
                            <p className="text-gray-400 mb-6">{repurchaseMessage}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={handleCancelRepurchase} className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white transition-colors text-sm font-bold">Cancelar</button>
                                <button onClick={handleConfirmRepurchase} className="px-4 py-2 rounded-lg bg-[#FF7939] text-white hover:bg-[#FF6B00] transition-colors text-sm font-bold">Recomprar</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )

    return createPortal(content, document.body)
}
