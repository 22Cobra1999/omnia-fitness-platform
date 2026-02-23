import { motion } from "framer-motion"
import { Target } from "lucide-react"
import { Label } from "@/components/ui/label"
import type { ConditionalRule } from "../../conditional-rules-data"

interface RuleStepScopeProps {
    newRule: Partial<ConditionalRule>
    fetchedProducts: any[]
    onChangeTargetProducts: (productIds: number[]) => void
}

export const RuleStepScope = ({ newRule, fetchedProducts, onChangeTargetProducts }: RuleStepScopeProps) => {
    return (
        <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="space-y-6">
                <div className="space-y-2">
                    <span className="text-[10px] text-white/40 uppercase font-bold tracking-[0.2em]">Alcance del Motor</span>
                    <p className="text-sm text-white/60 leading-relaxed font-medium">
                        Seleccioná a qué productos se aplicará esta regla de personalización.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => onChangeTargetProducts([])}
                            className={`py-2 px-4 text-xs font-bold rounded-xl transition-all duration-300 ${!newRule.targetProductIds || newRule.targetProductIds.length === 0
                                ? "bg-[#FF7939] text-white shadow-lg shadow-[#FF7939]/20"
                                : "bg-white/[0.03] text-white/30 hover:bg-white/[0.08]"
                                }`}
                        >
                            Todos los Productos
                        </button>
                        {fetchedProducts
                            .filter((prod) => {
                                // Filter strictly by 'program' type
                                if (prod.type !== "program") return false;

                                // Filter by category if selected in Step 1
                                if (!newRule.criteria?.type) return true;

                                const ruleType = newRule.criteria.type; // 'fitness' | 'nutricion'
                                const prodCategory = (prod.categoria || "").toLowerCase();

                                if (ruleType === "fitness") {
                                    return prodCategory === "fitness" || prodCategory === "entrenamiento";
                                }
                                if (ruleType === "nutricion") {
                                    return prodCategory === "nutricion" || prodCategory === "nutrición" || prodCategory === "nutrition" || prodCategory === "meal-plan";
                                }
                                return true;
                            })
                            .map((prod) => {
                                const isSelected = newRule.targetProductIds?.some((id) => String(id) === String(prod.id))
                                return (
                                    <button
                                        key={prod.id}
                                        type="button"
                                        onClick={() => {
                                            const current = newRule.targetProductIds || []
                                            const prodIdStr = String(prod.id)
                                            const next = isSelected
                                                ? current.filter((id) => String(id) !== prodIdStr)
                                                : [...current, prod.id]
                                            onChangeTargetProducts(next)
                                        }}
                                        className={`py-2 px-4 text-xs font-bold rounded-xl transition-all duration-300 ${isSelected
                                            ? "bg-[#FF7939] text-white shadow-lg shadow-[#FF7939]/20"
                                            : "bg-white/[0.03] text-white/30 hover:bg-white/[0.08]"
                                            }`}
                                    >
                                        {prod.title}
                                    </button>
                                )
                            })}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
