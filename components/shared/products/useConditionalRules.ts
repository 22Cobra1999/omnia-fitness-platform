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
                    .select("id, title, type")
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

    const handleEditRule = (rule: ConditionalRule) => {
        setNewRule({
            ...rule,
            criteria: { ...rule.criteria },
            adjustments: { ...rule.adjustments },
        })
        setIsCreating(true)
    }

    return {
        state: {
            rules,
            isCreating,
            currentStep,
            searchQuery,
            fetchedItems,
            fetchedProducts,
            newRule,
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
