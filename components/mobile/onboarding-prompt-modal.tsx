"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Target, Sparkles, X } from "lucide-react"
import { motion } from "framer-motion"

interface OnboardingPromptModalProps {
    isOpen: boolean
    onComplete: () => void
    onSkip: () => void
}

export function OnboardingPromptModal({ isOpen, onComplete, onSkip }: OnboardingPromptModalProps) {
    const [isClosing, setIsClosing] = useState(false)

    const handleSkip = () => {
        setIsClosing(true)
        setTimeout(() => {
            onSkip()
            setIsClosing(false)
        }, 300)
    }

    const handleComplete = () => {
        setIsClosing(true)
        setTimeout(() => {
            onComplete()
            setIsClosing(false)
        }, 300)
    }

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent
                className="w-[90vw] max-w-[400px] mx-auto bg-gradient-to-br from-[#1A1C1F] to-[#0F1012] border border-white/10 text-white p-0 rounded-3xl shadow-2xl overflow-hidden"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: isClosing ? 0 : 1, scale: isClosing ? 0.95 : 1 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                >
                    {/* Decorative gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF7939]/10 via-transparent to-transparent pointer-events-none" />

                    {/* Content */}
                    <div className="relative p-8 space-y-6">
                        {/* Icon */}
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[#FF7939]/20 blur-2xl rounded-full" />
                                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#FF7939] to-[#FF6A00] flex items-center justify-center">
                                    <Sparkles className="w-10 h-10 text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                                ¡Bienvenido a Omnia!
                            </h2>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Completá el cuestionario para que los programas sean <span className="text-[#FF7939] font-semibold">100% hechos a tu medida</span>
                            </p>
                        </div>

                        {/* Benefits */}
                        <div className="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/10">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-[#FF7939]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Target className="w-3.5 h-3.5 text-[#FF7939]" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">Programas personalizados</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Adaptados a tus objetivos y nivel</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-[#FF7939]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Sparkles className="w-3.5 h-3.5 text-[#FF7939]" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">Tu coach te conoce mejor</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Lesiones y condiciones consideradas</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3 pt-2">
                            <Button
                                onClick={handleComplete}
                                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#FF7939] to-[#FF6A00] hover:from-[#FF6A00] hover:to-[#FF5500] text-white font-semibold shadow-lg shadow-[#FF7939]/30 transition-all"
                            >
                                Completar ahora
                            </Button>

                            <Button
                                onClick={handleSkip}
                                variant="ghost"
                                className="w-full h-10 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-sm"
                            >
                                Lo haré después
                            </Button>
                        </div>

                        {/* Small note */}
                        <p className="text-center text-xs text-gray-500">
                            Solo te tomará 2 minutos ⏱️
                        </p>
                    </div>
                </motion.div>
            </DialogContent>
        </Dialog>
    )
}
