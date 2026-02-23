import { motion } from "framer-motion"
import { Zap, Dumbbell, ListChecks, UtensilsCrossed, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import type { ConditionalRule } from "../../conditional-rules-data"

interface RuleStepAdjustmentsProps {
    newRule: Partial<ConditionalRule>
    productCategory: "fitness" | "nutricion"
    updateAdjustments: (adjustments: any) => void
}

export const RuleStepAdjustments = ({ newRule, productCategory, updateAdjustments }: RuleStepAdjustmentsProps) => {
    const isFitness = (newRule.criteria?.type || productCategory) === "fitness"

    return (
        <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-6">
                <div className="space-y-1">
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em]">Ajustes de Salida</span>
                    <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                        Personalizá automáticamente la intensidad de los items seleccionados.
                    </p>
                </div>

                {isFitness ? (
                    <div className="grid grid-cols-1 gap-6">
                        {[
                            { key: "weight", label: "Carga de Peso", icon: Dumbbell },
                            { key: "reps", label: "Repeticiones", icon: ListChecks },
                            { key: "series", label: "Series / Sets", icon: Zap },
                            { key: "rest", label: "Descanso entre Series", icon: AlertCircle },
                        ].map((adj) => {
                            const value = (newRule.adjustments as any)?.[adj.key] || 0
                            return (
                                <div key={adj.key} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em]">
                                            {adj.label}
                                        </Label>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-lg font-black ${value > 0 ? "text-[#FF7939]" : value < 0 ? "text-blue-400" : "text-white/10"}`}>
                                                {value > 0 ? `+${value}%` : `${value}%`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="relative pt-1">
                                        <input
                                            type="range"
                                            min="-200"
                                            max="200"
                                            step="5"
                                            value={value}
                                            onChange={(e) => updateAdjustments({ [adj.key]: parseInt(e.target.value) })}
                                            className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#FF7939]"
                                        />
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-2 w-px bg-white/10" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em]">
                                    Porciones / Ingredientes
                                </Label>
                                <span className={`text-lg font-black ${(newRule.adjustments?.portions || 0) > 0 ? "text-[#FF7939]" : (newRule.adjustments?.portions || 0) < 0 ? "text-blue-400" : "text-white/10"}`}>
                                    {(newRule.adjustments?.portions || 0) > 0 ? `+${newRule.adjustments?.portions || 0}%` : `${newRule.adjustments?.portions || 0}%`}
                                </span>
                            </div>
                            <div className="relative pt-1">
                                <input
                                    type="range"
                                    min="-200"
                                    max="200"
                                    step="5"
                                    value={newRule.adjustments?.portions || 0}
                                    onChange={(e) => updateAdjustments({ portions: parseInt(e.target.value) })}
                                    className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-[#FF7939]"
                                />
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-2 w-px bg-white/10" />
                            </div>
                        </div>
                    </div>
                )}

                <div className="py-3 border-t border-white/5 opacity-40">
                    <div className="flex gap-2.5">
                        <AlertCircle className="h-3.5 w-3.5 text-[#FF7939] flex-shrink-0 mt-0.5" />
                        <p className="text-[9px] text-white/50 leading-relaxed font-medium">
                            El motor OMNIA redondea automáticamente los valores para mantener coherencia.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
