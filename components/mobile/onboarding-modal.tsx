"use client"

import { motion, AnimatePresence } from "framer-motion"
import { OnboardingHeader } from "./onboarding/OnboardingHeader"
import { OnboardingFooter } from "./onboarding/OnboardingFooter"
import { OnboardingStepRenderer } from "./onboarding/OnboardingStepRenderer"
import { useOnboardingLogic } from "@/hooks/mobile/useOnboardingLogic"

interface OnboardingModalProps {
    isOpen: boolean
    onClose: () => void
    fromRegistration?: boolean
}

export function OnboardingModal({ isOpen, onClose, fromRegistration = false }: OnboardingModalProps) {
    const {
        currentStep,
        answers,
        isSubmitting,
        avatarPreview,
        setAvatarFile,
        setAvatarPreview,
        filteredSteps,
        handleOptionSelect,
        handleMultiSelect,
        handleInputChange,
        handleNext,
        handleBack
    } = useOnboardingLogic({ isOpen, onClose, fromRegistration })

    if (!isOpen) return null

    const step = filteredSteps[currentStep]

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl h-[85vh] flex flex-col"
            >
                <OnboardingHeader
                    currentStep={currentStep}
                    totalSteps={filteredSteps.length}
                    onBack={handleBack}
                    onClose={onClose}
                />

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="space-y-6"
                        >
                            <OnboardingStepRenderer
                                step={step}
                                answers={answers}
                                handleOptionSelect={handleOptionSelect}
                                handleMultiSelect={handleMultiSelect}
                                handleInputChange={handleInputChange}
                                avatarPreview={avatarPreview}
                                setAvatarFile={setAvatarFile}
                                setAvatarPreview={setAvatarPreview}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                <OnboardingFooter
                    isSubmitting={isSubmitting}
                    isLastStep={currentStep === filteredSteps.length - 1}
                    onNext={handleNext}
                />
            </motion.div>
        </div>
    )
}
