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
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-4">
                    <Target className="h-4 w-4 text-[#FF7939]" />
                    <Label className="text-white font-semibold">Alcance de la Regla</Label>
                </div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Define a qué productos o talleres se aplicará esta regla. Puedes hacerla global o específica para ciertos
                    programas.
                </p>
                <div className="space-y-3">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                        Aplica a (Productos)
                    </span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => onChangeTargetProducts([])}
                            className={`py-1.5 px-3 text-[10px] rounded-full border transition-all duration-300 ${!newRule.targetProductIds || newRule.targetProductIds.length === 0
                                ? "border-[#FF7939] bg-[#FF7939]/10 text-white shadow-[0_0_10px_rgba(255,121,57,0.2)]"
                                : "border-white/5 bg-black/20 text-gray-500 hover:border-white/20"
                                }`}
                        >
                            Todos (Global)
                        </button>
                        {fetchedProducts.map((prod) => {
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
                                    className={`py-1.5 px-3 text-[10px] rounded-full border transition-all duration-300 ${isSelected
                                        ? "border-[#FF7939] bg-[#FF7939]/10 text-white shadow-[0_0_10px_rgba(255,121,57,0.2)]"
                                        : "border-white/5 bg-black/20 text-gray-500 hover:border-white/20"
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
