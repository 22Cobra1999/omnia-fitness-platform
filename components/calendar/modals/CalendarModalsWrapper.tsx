
import dynamic from 'next/dynamic'
import { MeetNotificationsModal } from "@/components/shared/meet-notifications-modal"
import { CalendarRescheduleModal } from "../components/CalendarRescheduleModal"
import { CalendarBookingModal } from "../components/CalendarBookingModal"
import { CalendarSuccessModal } from "../components/CalendarSuccessModal"
import { CalendarMoveActivitiesModal } from "../components/CalendarMoveActivitiesModal"
import { OmniaLoader } from "@/components/shared/ui/omnia-loader"

const MeetDetailModal = dynamic(() => import('../MeetDetailModal').then(ctx => ctx.MeetDetailModal), {
    loading: () => <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4"><div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-10 flex items-center justify-center"><OmniaLoader /></div></div>,
    ssr: false
})

export interface CalendarModalsWrapperProps {
    // Shared Props
    supabase: any
    authUserId: string | null

    // Notifications Modal
    showMeetNotifications: boolean
    setShowMeetNotifications: (show: boolean) => void
    openMeetById: (eventId: string) => void

    // Reschedule Modal
    rescheduleContext: any
    setRescheduleContext: (ctx: any) => void
    reschedulePreview: any
    setReschedulePreview: (preview: any) => void
    setMeetViewMode: (mode: 'month' | 'week' | 'day_split') => void
    setSelectedMeetEvent: (event: any) => void

    // Move Activities Modal
    showConfirmModal: boolean
    setShowConfirmModal: (show: boolean) => void
    sourceDate: Date | null
    targetDate: Date | null
    getDayName: (date: Date) => string
    applyToAllSameDays: boolean
    setApplyToAllSameDays: (apply: boolean) => void
    handleConfirmUpdate: () => Promise<void>
    isUpdating: boolean

    // Meet Detail Modal
    selectedMeetEvent: any
    pendingReschedule: any
    setPendingReschedule: React.Dispatch<React.SetStateAction<any>>
    selectedMeetParticipants: any[]
    coachProfiles: any[]
    setSelectedMeetParticipants: (participants: any[]) => void
    meetEventsByDate: any
    setMeetEventsByDate: React.Dispatch<React.SetStateAction<any>>
    selectedMeetRsvpStatus: string
    setSelectedMeetRsvpStatus: (status: string) => void
    selectedMeetRsvpLoading: boolean
    setSelectedMeetRsvpLoading: (loading: boolean) => void
    handlePickCoachForMeet: (coachId: string) => void
    setMeetWeekStart: (date: Date) => void

    // Booking Modal
    selectedMeetRequest: any
    setSelectedMeetRequest: (req: any) => void
    meetCreditsByCoachId: Record<string, number>
    isPaidMeetFlow: boolean
    purchaseContext: any
    meetPurchasePaid: boolean
    onSetScheduleMeetContext: (ctx: any) => void
    selectedCoachId: string | null
    selectedCoachProfile: any
    handleClearCoachForMeet: () => void
    setSuccessModalData: (data: any) => void
    setShowSuccessModal: (show: boolean) => void
    createCheckoutProPreference: any
    redirectToMercadoPagoCheckout: any
    scheduleMeetContext: any

    // Success Modal
    showSuccessModal: boolean
    successModalData: any
}

export function CalendarModalsWrapper(props: CalendarModalsWrapperProps) {
    return (
        <>
            <MeetNotificationsModal
                open={props.showMeetNotifications}
                onClose={() => props.setShowMeetNotifications(false)}
                role="client"
                supabase={props.supabase}
                userId={props.authUserId || ''}
                onOpenMeet={props.openMeetById}
            />

            <CalendarRescheduleModal
                rescheduleContext={props.rescheduleContext}
                reschedulePreview={props.reschedulePreview}
                setReschedulePreview={props.setReschedulePreview}
                setRescheduleContext={props.setRescheduleContext}
                setMeetViewMode={props.setMeetViewMode}
                setSelectedMeetEvent={props.setSelectedMeetEvent}
                supabase={props.supabase}
            />

            <CalendarMoveActivitiesModal
                open={props.showConfirmModal}
                onOpenChange={props.setShowConfirmModal}
                sourceDate={props.sourceDate}
                targetDate={props.targetDate}
                getDayName={props.getDayName}
                applyToAllSameDays={props.applyToAllSameDays}
                setApplyToAllSameDays={props.setApplyToAllSameDays}
                handleConfirmUpdate={props.handleConfirmUpdate}
                isUpdating={props.isUpdating}
                onCancel={() => props.setShowConfirmModal(false)}
            />

            {props.selectedMeetEvent && (
                <MeetDetailModal
                    selectedMeetEvent={props.selectedMeetEvent}
                    setSelectedMeetEvent={props.setSelectedMeetEvent}
                    pendingReschedule={props.pendingReschedule}
                    setPendingReschedule={props.setPendingReschedule}
                    selectedMeetParticipants={props.selectedMeetParticipants}
                    coachProfiles={props.coachProfiles}
                    authUserId={props.authUserId}
                    setSelectedMeetParticipants={props.setSelectedMeetParticipants}
                    meetEventsByDate={props.meetEventsByDate}
                    setMeetEventsByDate={props.setMeetEventsByDate}
                    selectedMeetRsvpStatus={props.selectedMeetRsvpStatus}
                    setSelectedMeetRsvpStatus={props.setSelectedMeetRsvpStatus}
                    selectedMeetRsvpLoading={props.selectedMeetRsvpLoading}
                    setSelectedMeetRsvpLoading={props.setSelectedMeetRsvpLoading}
                    setRescheduleContext={props.setRescheduleContext}
                    handlePickCoachForMeet={props.handlePickCoachForMeet}
                    setMeetViewMode={props.setMeetViewMode}
                    setMeetWeekStart={props.setMeetWeekStart}
                />
            )}

            <CalendarBookingModal
                selectedMeetRequest={props.selectedMeetRequest}
                setSelectedMeetRequest={props.setSelectedMeetRequest}
                meetViewMode={'day_split'} // This prop seems unused in modal but required by type? Checking... Actually used for back button logic sometimes.
                setMeetViewMode={props.setMeetViewMode}
                coachProfiles={props.coachProfiles}
                meetCreditsByCoachId={props.meetCreditsByCoachId}
                isPaidMeetFlow={props.isPaidMeetFlow}
                purchaseContext={props.purchaseContext}
                meetPurchasePaid={props.meetPurchasePaid}
                onSetScheduleMeetContext={props.onSetScheduleMeetContext}
                authUserId={props.authUserId}
                selectedCoachId={props.selectedCoachId}
                selectedCoachProfile={props.selectedCoachProfile}
                rescheduleContext={props.rescheduleContext}
                setRescheduleContext={props.setRescheduleContext}
                setReschedulePreview={props.setReschedulePreview}
                handleClearCoachForMeet={props.handleClearCoachForMeet}
                setSuccessModalData={props.setSuccessModalData}
                setShowSuccessModal={props.setShowSuccessModal}
                supabase={props.supabase}
                createCheckoutProPreference={props.createCheckoutProPreference}
                redirectToMercadoPagoCheckout={props.redirectToMercadoPagoCheckout}
                scheduleMeetContext={props.scheduleMeetContext}
            />

            <CalendarSuccessModal
                show={props.showSuccessModal}
                onClose={() => props.setShowSuccessModal(false)}
                data={props.successModalData}
            />
        </>
    )
}
