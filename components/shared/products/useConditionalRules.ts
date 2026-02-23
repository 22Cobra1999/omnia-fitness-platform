import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/supabase-client"
import type { ConditionalRule } from "./conditional-rules-data"

interface UseConditionalRulesProps {
    productId?: number
    coachId?: string
    productCategory: "fitness" | "nutricion"
    onSaveRules: (rules: ConditionalRule[]) => void
    initialRules: ConditionalRule[]
    isOpen: boolean
}

export function useConditionalRules({
    productId,
    coachId,
    productCategory,
    onSaveRules,
    initialRules,
    isOpen,
}: UseConditionalRulesProps) {
    const supabase = createClient()
    const [rules, setRules] = useState<ConditionalRule[]>(initialRules)
    const [isCreating, setIsCreating] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const [searchQuery, setSearchQuery] = useState("")
    const [fetchedItems, setFetchedItems] = useState<any[]>([])
    const [fetchedProducts, setFetchedProducts] = useState<any[]>([])
    const [newRule, setNewRule] = useState<Partial<ConditionalRule>>({
        name: "",
        isActive: true,
        criteria: {
            type: productCategory,
            gender: "all",
            ageRange: [0, 100],
            weightRange: [0, 200],
            activityLevel: [],
            programLevel: [],
            fitnessGoals: [],
        },
        adjustments: {
            weight: 0,
            reps: 0,
            series: 0,
            rest: 0,
            portions: 0,
        },
        affectedItems: "all",
        targetProductIds: productId ? [productId] : [],
    })

    useEffect(() => {
        const fetchRules = async () => {
            if (!coachId) return

            try {
                const { data, error } = await supabase
                    .from("product_conditional_rules")
                    .select("*")
                    .eq("coach_id", coachId)
                    .order("created_at", { ascending: true })

                if (error) {
                    console.error("Error fetching rules:", error)
                    return
                }

                if (data) {
                    const parsedRules: ConditionalRule[] = data.map((r: any) => ({
                        id: r.id,
                        name: r.name,
                        isActive: r.is_active,
                        criteria: r.criteria,
                        adjustments: r.adjustments,
                        affectedItems: r.affected_items,
                        targetProductIds: r.target_product_ids || [],
                    }))
                    setRules(parsedRules)
                    if (data.length > 0) {
                        onSaveRules(parsedRules)
                    }
                }
            } catch (err) {
                console.error("Error loading rules:", err)
            }
        }

        const fetchAlternateItems = async () => {
            const currentType = newRule.criteria?.type || productCategory
            if (currentType === productCategory) return
            if (!coachId) return

            try {
                const dbType = currentType === "fitness" ? "exercise" : "recipe"
                const { data, error } = await supabase
                    .from("activities")
                    .select("id, title, type")
                    .eq("coach_id", coachId)
                    .eq("type", dbType)
                    .eq("is_active", true)

                if (error) throw error

                if (data) {
                    setFetchedItems(
                        data.map((item: any) => ({
                            ...item,
                            nombre: item.title,
                            Nombre: item.title,
                        }))
                    )
                }
            } catch (err) {
                console.error("Error fetching alternate items:", err)
            }
        }

        const fetchProducts = async () => {
            if (!coachId) return
            try {
                const { data, error } = await supabase
                    .from("activities")
                    .select("id, title, type, categoria")
                    .eq("coach_id", coachId)
                    .in("type", ["workshop", "program"])
                    .eq("is_active", true)

                if (data) {
                    setFetchedProducts(data)
                }
            } catch (err) {
                console.error("Error fetching products:", err)
            }
        }

        if (isOpen) {
            fetchRules()
            fetchProducts()
        }

        fetchAlternateItems()
    }, [isOpen, productId, coachId, newRule.criteria?.type])

    useEffect(() => {
        if (initialRules && initialRules.length > 0 && rules.length === 0) {
            setRules(initialRules)
        }
    }, [initialRules])

    const resetForm = () => {
        setIsCreating(false)
        setCurrentStep(1)
        setNewRule({
            name: "",
            isActive: true,
            criteria: {
                type: productCategory,
                gender: "all",
                ageRange: [0, 100],
                weightRange: [0, 200],
                activityLevel: [],
                programLevel: [],
                fitnessGoals: [],
            },
            adjustments: {
                weight: 0,
                reps: 0,
                series: 0,
                rest: 0,
                portions: 0,
            },
            affectedItems: "all",
            targetProductIds: productId ? [productId] : [],
        })
    }

    const handleSaveNewRule = async () => {
        if (!newRule.name) return

        const isEditing = !!newRule.id
        const ruleId = newRule.id || Math.random().toString(36).substr(2, 9)

        const rule: ConditionalRule = {
            ...(newRule as ConditionalRule),
            id: ruleId,
        }

        let updatedRules
        if (isEditing) {
            updatedRules = rules.map((r) => (r.id === ruleId ? rule : r))
        } else {
            updatedRules = [...rules, rule]
        }

        setRules(updatedRules)
        onSaveRules(updatedRules)
        resetForm()

        if (coachId) {
            const rulePayload = {
                coach_id: coachId,
                name: rule.name,
                is_active: rule.isActive,
                criteria: rule.criteria,
                adjustments: rule.adjustments,
                affected_items: rule.affectedItems,
                rule_type: rule.criteria?.type || "fitness",
                target_product_ids: rule.targetProductIds || [],
            }

            try {
                if (isEditing) {
                    const { error } = await supabase.from("product_conditional_rules").update(rulePayload).eq("id", ruleId)
                    if (error) throw error
                } else {
                    const { data, error } = await supabase.from("product_conditional_rules").insert(rulePayload).select().single()
                    if (error) throw error
                    if (data) {
                        const confirmedRules = updatedRules.map((r) => (r.id === ruleId ? { ...r, id: data.id } : r))
                        setRules(confirmedRules)
                        onSaveRules(confirmedRules)
                    }
                }
            } catch (err) {
                console.error("DB Error:", err)
            }
        }
    }

    const handleDeleteRule = async (id: string) => {
        const updatedRules = rules.filter((r) => r.id !== id)
        setRules(updatedRules)
        onSaveRules(updatedRules)

        if (coachId) {
            try {
                const { error } = await supabase.from("product_conditional_rules").delete().eq("id", id)
                if (error) throw error
            } catch (err) {
                console.error("Error deleting rule:", err)
            }
        }
    }

    const handleToggleRule = async (id: string) => {
        const updatedRules = rules.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
        setRules(updatedRules)
        onSaveRules(updatedRules)

        if (coachId) {
            const rule = updatedRules.find((r) => r.id === id)
            if (rule) {
                try {
                    const { error } = await supabase.from("product_conditional_rules").update({ is_active: rule.isActive }).eq("id", id)
                    if (error) throw error
                } catch (err) {
                    console.error("Error updating rule status:", err)
                }
            }
        }
    }

    const findConflicts = (rule: Partial<ConditionalRule>, existingRules: ConditionalRule[]) => {
        const conflicts: { rule: ConditionalRule; reasons: string[]; type: "CRITICAL" | "SPECIFIC" | "INFO" }[] = []

        const getSpecificityScore = (c: any) => {
            if (!c) return 0
            let score = 0
            if (c.gender && c.gender !== "all") score += 1
            if (c.ageRange && (c.ageRange[0] > 0 || c.ageRange[1] < 100)) score += 1
            if (c.weightRange && (c.weightRange[0] > 0 || c.weightRange[1] < 200)) score += 1
            score += (c.fitnessGoals?.length || 0) * 2
            score += (c.activityLevel?.length || 0) * 2
            score += (c.injuries?.length || 0) * 5 // Injuries have highest weight for specificity
            return score
        }

        const newRuleScore = getSpecificityScore(rule.criteria)

        existingRules.forEach((r) => {
            if (r.id === rule.id) return
            if (!r.isActive) return

            // 1. Check Category (Fitness vs Nutrition)
            if (rule.criteria?.type !== r.criteria?.type) return

            // 2. Check Product Overlap
            const shareProducts =
                (!rule.targetProductIds || rule.targetProductIds.length === 0 || !r.targetProductIds || r.targetProductIds.length === 0) ||
                rule.targetProductIds.some((id) => r.targetProductIds?.includes(id))

            if (!shareProducts) return

            // 3. Check Demographic Overlap
            const genderOverlap = rule.criteria?.gender === "all" || r.criteria?.gender === "all" || rule.criteria?.gender === r.criteria?.gender

            const [min1, max1] = rule.criteria?.ageRange || [0, 100]
            const [min2, max2] = r.criteria?.ageRange || [0, 100]
            const ageOverlap = min1 <= max2 && min2 <= max1

            const [wMin1, wMax1] = rule.criteria?.weightRange || [0, 200]
            const [wMin2, wMax2] = r.criteria?.weightRange || [0, 200]
            const weightOverlap = wMin1 <= wMax2 && wMin2 <= wMax1

            if (!genderOverlap || !ageOverlap || !weightOverlap) return

            // 4. Analyze Relationship
            const goals1 = (rule.criteria?.fitnessGoals || []).sort()
            const goals2 = (r.criteria?.fitnessGoals || []).sort()
            const levels1 = (rule.criteria?.activityLevel || []).sort()
            const levels2 = (r.criteria?.activityLevel || []).sort()
            const injuries1 = (rule.criteria?.injuries || []).sort()
            const injuries2 = (r.criteria?.injuries || []).sort()

            const isIdentical =
                JSON.stringify(goals1) === JSON.stringify(goals2) &&
                JSON.stringify(levels1) === JSON.stringify(levels2) &&
                JSON.stringify(injuries1) === JSON.stringify(injuries2)

            const existingRuleScore = getSpecificityScore(r.criteria)

            // A rule is "more specific" if it includes all tags of the other plus more, 
            // or if its score is significantly higher in overlapping domains
            const isMoreSpecific = newRuleScore > existingRuleScore &&
                (goals2.every(g => goals1.includes(g)) && levels2.every(l => levels1.includes(l)) && injuries2.every(i => injuries1.includes(i)))

            const isLessSpecific = existingRuleScore > newRuleScore &&
                (goals1.every(g => goals2.includes(g)) && levels1.every(l => levels2.includes(l)) && injuries1.every(i => injuries2.includes(i)))

            const reasons: string[] = []
            reasons.push("Mismos productos/programas")

            let type: "CRITICAL" | "SPECIFIC" | "INFO" = "INFO"

            if (isIdentical) {
                type = "CRITICAL"
                reasons.push("Perfil idéntico (Conflicto)")
            } else if (isMoreSpecific) {
                type = "SPECIFIC"
                reasons.push("Esta regla es más específica y PRIORIZARÁ sobre la anterior")
            } else if (isLessSpecific) {
                type = "SPECIFIC"
                reasons.push("Esta regla es menos específica y será FILTRADA si la otra aplica")
            } else {
                type = "INFO"
                reasons.push("Perfiles distintos: los ajustes se SUMARÁN")
            }

            conflicts.push({ rule: r, reasons, type })
        })

        return conflicts
    }

    const handleEditRule = (rule: ConditionalRule) => {
        setNewRule({
            ...rule,
            criteria: { ...rule.criteria },
            adjustments: { ...rule.adjustments },
        })
        setIsCreating(true)
    }

    const conflictingRules = isCreating ? findConflicts(newRule, rules) : []

    return {
        state: {
            rules,
            isCreating,
            currentStep,
            searchQuery,
            fetchedItems,
            fetchedProducts,
            newRule,
            conflictingRules,
        },
        actions: {
            setIsCreating,
            setCurrentStep,
            setSearchQuery,
            setNewRule,
            handleSaveNewRule,
            handleDeleteRule,
            handleToggleRule,
            handleEditRule,
            resetForm,
        },
    }
}
