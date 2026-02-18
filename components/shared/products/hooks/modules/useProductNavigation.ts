import { useState, useCallback } from "react"
import { ProductType } from "../../product-constants"

interface UseProductNavigationProps {
    selectedType: ProductType | null
    initialStep?: string
    editingProduct?: any
}

export function useProductNavigation({
    selectedType,
    initialStep,
    editingProduct
}: UseProductNavigationProps) {
    const getInitialStep = () => {
        if (initialStep) return initialStep
        if (editingProduct) return 'general'
        return 'type'
    }

    const [currentStep, setCurrentStep] = useState<string>(getInitialStep())

    const getStepNumber = useCallback((step: string) => {
        if (selectedType === 'workshop') {
            const workshopStepMap: { [key: string]: number } = {
                'type': 1, 'programType': 2, 'general': 3, 'workshopSchedule': 4, 'workshopMaterial': 5, 'preview': 6
            }
            return workshopStepMap[step] || 1
        } else if (selectedType === 'document') {
            const documentStepMap: { [key: string]: number } = {
                'type': 1, 'programType': 2, 'general': 3, 'documentMaterial': 4, 'preview': 5
            }
            return documentStepMap[step] || 1
        } else {
            const programStepMap: { [key: string]: number } = {
                'type': 1, 'programType': 2, 'general': 3, 'weeklyPlan': 4, 'preview': 5
            }
            return programStepMap[step] || 1
        }
    }, [selectedType])

    const goToStep = useCallback((stepNumber: number) => {
        let stepMap: { [key: number]: string }
        if (selectedType === 'workshop') {
            stepMap = { 1: 'type', 2: 'programType', 3: 'general', 4: 'workshopSchedule', 5: 'workshopMaterial', 6: 'preview' }
        } else if (selectedType === 'document') {
            stepMap = { 1: 'type', 2: 'programType', 3: 'general', 4: 'documentMaterial', 5: 'preview' }
        } else {
            stepMap = { 1: 'type', 2: 'programType', 3: 'general', 4: 'weeklyPlan', 5: 'preview' }
        }
        const targetStep = stepMap[stepNumber]
        if (targetStep) {
            const currentStepNumber = getStepNumber(currentStep)
            if (stepNumber <= currentStepNumber || stepNumber === currentStepNumber + 1) {
                setCurrentStep(targetStep)
            }
        }
    }, [selectedType, currentStep, getStepNumber])

    return {
        currentStep,
        setCurrentStep,
        getStepNumber,
        goToStep
    }
}
