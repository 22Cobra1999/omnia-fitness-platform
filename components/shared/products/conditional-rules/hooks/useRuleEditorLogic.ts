import { useState } from "react"
import type { ConditionalRule } from "../../conditional-rules-data"


interface UseRuleEditorLogicProps {
    initialStep?: number
    defaultRule?: Partial<ConditionalRule>
}

export const useRuleEditorLogic = ({
    initialStep = 1,
    defaultRule = {},
}: UseRuleEditorLogicProps = {}) => {
    const [currentStep, setCurrentStep] = useState(initialStep)
    const [newRule, setNewRule] = useState<Partial<ConditionalRule>>(defaultRule)
    const [searchQuery, setSearchQuery] = useState("")

    const handleNextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4))
    const handlePrevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))
    const goToStep = (step: number) => setCurrentStep(step)

    const updateRule = (updatedFields: Partial<ConditionalRule>) => {
        setNewRule((prev) => ({ ...prev, ...updatedFields }))
    }

    const updateCriteria = (criteriaUpdates: Partial<ConditionalRule['criteria']>) => {
        setNewRule((prev) => ({
            ...prev,
            criteria: { ...(prev.criteria || {}), ...criteriaUpdates } as any
        }))
    }

    const updateAdjustments = (adjustmentsUpdates: any) => {
        setNewRule((prev) => ({
            ...prev,
            adjustments: { ...(prev.adjustments || {}), ...adjustmentsUpdates }
        }))
    }

    return {
        currentStep,
        newRule,
        searchQuery,
        setSearchQuery,
        handleNextStep,
        handlePrevStep,
        goToStep,
        updateRule,
        updateCriteria,
        updateAdjustments,
        setNewRule
    }
}
