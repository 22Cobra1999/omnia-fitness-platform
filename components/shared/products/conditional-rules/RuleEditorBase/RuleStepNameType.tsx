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
                <Label className="text-white text-xs font-bold uppercase tracking-widest opacity-40">
                    Nombre de la regla
                </Label>
                <Input
                    value={newRule.name || ""}
                    onChange={(e) => onChangeName(e.target.value)}
                    placeholder="Ej: Aumento por nivel avanzado"
                    className="bg-transparent border-0 border-b border-white/10 rounded-none px-0 text-lg font-medium text-white placeholder:text-white/20 h-12 focus-visible:ring-0 focus-visible:border-[#FF7939] transition-all"
                />
            </div>

            <div className="space-y-4 pt-4">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em]">Categoría Principal</span>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => onChangeType("fitness")}
                        className={`flex-1 group relative py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${newRule.criteria?.type === "fitness"
                            ? "bg-[#FF7939]/10 ring-1 ring-[#FF7939]"
                            : "bg-white/[0.03] hover:bg-white/[0.08]"
                            }`}
                    >
                        <Dumbbell className={`h-4 w-4 ${newRule.criteria?.type === "fitness" ? "text-[#FF7939]" : "text-white/20"}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${newRule.criteria?.type === "fitness" ? "text-white" : "text-white/40"}`}>
                            Fitness
                        </span>
                        {newRule.criteria?.type === "fitness" && (
                            <motion.div layoutId="activeStep" className="absolute inset-0 rounded-xl border border-[#FF7939]/40" />
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => onChangeType("nutricion")}
                        className={`flex-1 group relative py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${newRule.criteria?.type === "nutricion"
                            ? "bg-[#FF7939]/10 ring-1 ring-[#FF7939]"
                            : "bg-white/[0.03] hover:bg-white/[0.08]"
                            }`}
                    >
                        <UtensilsCrossed className={`h-4 w-4 ${newRule.criteria?.type === "nutricion" ? "text-[#FF7939]" : "text-white/20"}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${newRule.criteria?.type === "nutricion" ? "text-white" : "text-white/40"}`}>
                            Nutrición
                        </span>
                        {newRule.criteria?.type === "nutricion" && (
                            <motion.div layoutId="activeStep" className="absolute inset-0 rounded-xl border border-[#FF7939]/40" />
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    )
}
