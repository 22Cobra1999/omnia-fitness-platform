"use client"

import CoachProfileModal from "@/components/coach/CoachProfileModal"
import { Coach } from "../../hooks/useActivityScreenLogic"

interface ActivityModalsProps {
    selectedCoach: Coach | null
    isCoachModalOpen: boolean
    onCloseCoachModal: () => void
}

export function ActivityModals({
    selectedCoach,
    isCoachModalOpen,
    onCloseCoachModal
}: ActivityModalsProps) {
    return (
        <>
            <CoachProfileModal
                isOpen={isCoachModalOpen}
                onClose={onCloseCoachModal}
                coach={selectedCoach as any}
            />
            {/* Add other modals here like Purchase or Survey if needed */}
        </>
    )
}
