"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Check, User, PlusCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

interface AccountCreatedPopupProps {
    isOpen: boolean
    onClose: () => void
    onAction: (action: "profile" | "products" | "close") => void
}

export function AccountCreatedPopup({ isOpen, onClose, onAction }: AccountCreatedPopupProps) {
    const { user } = useAuth()
    const isCoach = user?.level === "coach"

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-sm rounded-[32px] bg-[#0A0A0A] border border-white/10 p-8 shadow-2xl text-center"
                    >
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                                <Check className="h-10 w-10 text-green-500" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-black text-white mb-2">¡Cuenta creada!</h2>
                        <p className="text-white/40 mb-8 px-4">
                            Bienvenido a OMNIA. Tu perfil está listo para despegar. ¿Qué quieres hacer ahora?
                        </p>

                        <div className="space-y-4">
                            <Button
                                onClick={() => onAction("profile")}
                                className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl flex items-center justify-between px-6 group transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <User className="w-5 h-5 text-[#FF7939]" />
                                    <span className="font-bold">Completar mi perfil</span>
                                </div>
                                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </Button>

                            {isCoach && (
                                <Button
                                    onClick={() => onAction("products")}
                                    className="w-full h-14 bg-[#FF7939] hover:bg-[#E66829] text-white rounded-2xl flex items-center justify-between px-6 group shadow-lg shadow-[#FF7939]/20 transition-all font-black"
                                >
                                    <div className="flex items-center gap-3">
                                        <PlusCircle className="w-5 h-5" />
                                        <span>Crear mi primer producto</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-white/50 group-hover:translate-x-1 transition-all" />
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                onClick={() => onAction("close")}
                                className="w-full h-12 text-white/30 hover:text-white/60 font-bold uppercase tracking-widest text-[10px]"
                            >
                                Quizás más tarde
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
