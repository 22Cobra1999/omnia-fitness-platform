import { motion } from "framer-motion"
import { Dumbbell, UtensilsCrossed } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { ConditionalRule } from "../../conditional-rules-data"

interface RuleStepNameTypeProps {
    newRule: Partial<ConditionalRule>
    onChangeName: (name: string) => void
    onChangeType: (type: "fitness" | "nutricion") => void
}

export const RuleStepNameType = ({ newRule, onChangeName, onChangeType }: RuleStepNameTypeProps) => {
    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 pb-4"
        >
            <div className="space-y-4">
                <Label className="text-white text-xs font-semibold uppercase tracking-wider opacity-60">
                    Nombre de la regla
                </Label>
                <Input
                    value={newRule.name || ""}
                    onChange={(e) => onChangeName(e.target.value)}
                    placeholder="Ej: Aumento por nivel avanzado"
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 h-11 focus:ring-[#FF7939]/20"
                />
            </div>

            <div className="space-y-3">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Tipo de Regla</span>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => onChangeType("fitness")}
                        className={`p-3 rounded-xl border text-center transition-all duration-300 ${newRule.criteria?.type === "fitness"
                            ? "border-[#FF7939] bg-[#FF7939]/10 text-white"
                            : "border-white/5 bg-black/20 text-gray-500 hover:border-white/20"
                            }`}
                    >
                        <Dumbbell
                            className={`h-4 w-4 mx-auto mb-2 ${newRule.criteria?.type === "fitness" ? "text-[#FF7939]" : "text-gray-500"
                                }`}
                        />
                        <div className="text-xs font-semibold">Entrenamiento</div>
                    </button>
                    <button
                        type="button"
                        onClick={() => onChangeType("nutricion")}
                        className={`p-3 rounded-xl border text-center transition-all duration-300 ${newRule.criteria?.type === "nutricion"
                            ? "border-[#FF7939] bg-[#FF7939]/10 text-white"
                            : "border-white/5 bg-black/20 text-gray-500 hover:border-white/20"
                            }`}
                    >
                        <UtensilsCrossed
                            className={`h-4 w-4 mx-auto mb-2 ${newRule.criteria?.type === "nutricion" ? "text-[#FF7939]" : "text-gray-500"
                                }`}
                        />
                        <div className="text-xs font-semibold">Nutrición</div>
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
