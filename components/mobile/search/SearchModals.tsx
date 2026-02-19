import React from "react"
import ClientProductModal from '@/components/client/activities/client-product-modal'
import CoachProfileModal from "@/components/coach/CoachProfileModal"

interface SearchModalsProps {
    selectedActivity: any
    isPreviewModalOpen: boolean
    handleModalClose: () => void
    navigationContext: any
    handleCoachClick: (id: string) => void
    selectedCoachForProfile: any
    isCoachProfileModalOpen: boolean
    handleActivityClick: (activity: any) => void
    allActivities: any[]
}

export const SearchModals: React.FC<SearchModalsProps> = ({
    selectedActivity,
    isPreviewModalOpen,
    handleModalClose,
    navigationContext,
    handleCoachClick,
    selectedCoachForProfile,
    isCoachProfileModalOpen,
    handleActivityClick,
    allActivities,
}) => {
    return (
        <>
            {selectedActivity && (
                <ClientProductModal
                    product={selectedActivity}
                    isOpen={isPreviewModalOpen}
                    onClose={handleModalClose}
                    navigationContext={navigationContext}
                    onCoachClick={handleCoachClick}
                />
            )}

            {selectedCoachForProfile && (
                <CoachProfileModal
                    coach={selectedCoachForProfile}
                    isOpen={isCoachProfileModalOpen}
                    onClose={handleModalClose}
                    onActivityClick={handleActivityClick}
                    preloadedActivities={allActivities}
                />
            )}
        </>
    )
}
