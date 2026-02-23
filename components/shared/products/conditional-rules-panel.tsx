"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Zap } from "lucide-react"
import { AdaptiveMotorSimulator } from "./conditional-rules/AdaptiveMotorSimulator"

interface ConditionalRulesPanelProps {
    isOpen: boolean
    onClose: () => void
    productCategory: "fitness" | "nutricion"
    availableItems: any[]
    onSaveRules: (rules: any) => void
    initialRules?: any
    productId?: number
    coachId?: string
    selectedCount?: number
}

export function ConditionalRulesPanel({
    isOpen,
    onClose,
    productCategory,
    onSaveRules,
    selectedCount
}: ConditionalRulesPanelProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay de Fondo */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[40]"
                    />

                    {/* Consola del Motor Adaptativo */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 30 }}
                        className="fixed inset-x-4 md:inset-x-8 top-[30px] bottom-[30px] bg-[#0b0b0b] border border-white/10 z-[45] flex flex-col shadow-[0_32px_64px_rgba(0,0,0,0.8)] rounded-[3rem] overflow-hidden"
                    >
                        {/* Header Dashboard */}
                        <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-white/[0.02] to-transparent">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-2xl bg-[#FF7939]/10 ring-1 ring-[#FF7939]/20">
                                        <Zap className="h-5 w-5 text-[#FF7939]" />
                                    </div>
                                    <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">Motor Adaptativo <span className="text-[#FF7939]">OMNIA</span></h2>
                                </div>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-black mt-1 ml-14">
                                    Consola de Reconstrucción de Prescripción
                                </p>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all bg-white/5 border border-white/10 text-gray-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Área Principal del Simulador */}
                        <div className="flex-1 overflow-y-auto px-0 py-8 scroll-smooth scrollbar-hide bg-white/[0.01]">
                            <AdaptiveMotorSimulator
                                productBase={{
                                    sets: 4,
                                    reps: 12,
                                    load_kg: 50
                                }}
                                onSave={onSaveRules}
                                selectedCount={selectedCount}
                            />
                        </div>

                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
