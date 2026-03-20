'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Handshake, ArrowRight, DollarSign, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface MercadoPagoOnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnect: string | undefined;
}

export function MercadoPagoOnboardingModal({ isOpen, onClose, onConnect }: MercadoPagoOnboardingModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent 
                className="p-0 border-none bg-black/95 backdrop-blur-xl max-w-sm w-[90vw] rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                style={{
                    position: 'fixed',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 9999
                }}
            >
                <div className="p-8 space-y-8">
                    {/* Icon Header */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-20 h-20 bg-[#FF7939]/10 rounded-full flex items-center justify-center border border-[#FF7939]/20"
                            >
                                <Handshake className="w-10 h-10 text-[#FF7939]" />
                            </motion.div>
                            <motion.div 
                                initial={{ x: 20, y: 20, opacity: 0 }}
                                animate={{ x: 0, y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#FF7939] rounded-full flex items-center justify-center text-black shadow-lg"
                            >
                                <DollarSign className="w-5 h-5 font-black" />
                            </motion.div>
                        </div>
                    </div>

                    {/* Text Content */}
                    <div className="text-center space-y-3">
                        <DialogTitle className="text-2xl font-black text-white italic uppercase tracking-tight leading-none">
                            VINCULÁ TU CUENTA
                        </DialogTitle>
                        <DialogDescription className="text-gray-400 text-sm font-medium leading-relaxed px-4">
                            Para poder crear productos y recibir pagos de tus clientes, necesitás conectar tu cuenta de <span className="text-[#00B1EA] font-bold">Mercado Pago</span>.
                        </DialogDescription>
                    </div>

                    {/* Features List */}
                    <div className="space-y-4 px-2">
                        {[
                            { icon: <ShieldCheck className="w-5 h-5 text-[#FF7939]" />, text: "Cobros directos a tu cuenta" },
                            { icon: <Zap className="w-5 h-5 text-[#FF7939]" />, text: "Activación inmediata de ventas" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                                {item.icon}
                                <span className="text-xs font-bold text-white/70 uppercase tracking-widest">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Action Button */}
                    <div className="space-y-4">
                        <a
                            href={`/api/mercadopago/oauth/authorize?coach_id=${onConnect}`}
                            className="w-full h-14 bg-[#FF7939] hover:bg-[#FF6A00] text-black font-black text-xs italic rounded-full shadow-[0_4px_25px_rgba(255,121,57,0.4)] transition-all flex items-center justify-between px-8 group uppercase tracking-[0.1em]"
                        >
                            <span>CONECTAR AHORA</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>

                        <button 
                            onClick={onClose}
                            className="w-full text-center text-[10px] font-black text-white/20 hover:text-white/40 uppercase tracking-[0.2em] transition-colors"
                        >
                            LO HARÉ MÁS TARDE
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
