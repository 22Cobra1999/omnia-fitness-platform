import React from 'react'
import { useCalendarDaySplitLogic } from "../hooks/useCalendarDaySplitLogic"

// Sub-components
import { DaySplitHeader } from "./day-split/DaySplitHeader"
import { DaySplitTimeline } from "./day-split/DaySplitTimeline"
import { DaySplitBookingForm } from "./day-split/DaySplitBookingForm"

interface CalendarDaySplitViewProps {
    selectedDate: Date
    setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>
    setMeetViewMode: (mode: 'month' | 'week' | 'day_split') => void
    rescheduleContext: any
    setRescheduleContext: (ctx: any) => void
    setSelectedMeetRequest: (req: any) => void
    setSelectedMeetEvent: (evt: any) => void
    activitiesByDate: Record<string, any[]>
    dayMinutesByDate: Record<string, any>
    renderClientEvents: (dayKey: string) => React.ReactNode
    getSlotsForDate: (d: Date, durationMinutes?: number) => string[]
    handleTimelineClick: (e: any, start: string, end: string, dayKey: string) => void
    selectedMeetRequest: any
    selectedConsultationType: 'express' | 'puntual' | 'profunda'
    setSelectedConsultationType: (t: 'express' | 'puntual' | 'profunda') => void
    coachConsultations: any
    isPaidMeetFlow: boolean
    meetCreditsByCoachId: Record<string, number>
    meetPurchasePaid: boolean
    scheduleMeetContext: any
    coachProfiles: any[]
    selectedCoachId: string | null
    authUserId: string | null
    supabase: any
    setSuccessModalData: (data: any) => void
    setShowSuccessModal: (show: boolean) => void
    setSelectedMeetRsvpLoading: (loading: boolean) => void
    handleClearCoachForMeet: () => void
    createCheckoutProPreference: any
    redirectToMercadoPagoCheckout: any
    onSetScheduleMeetContext?: (ctx: any) => void
    selectedMeetRsvpLoading: boolean
    setMeetEventsByDate: React.Dispatch<React.SetStateAction<any>>
    onEventUpdated?: () => Promise<void>
}

export function CalendarDaySplitView(props: CalendarDaySplitViewProps) {
    const {
        selectedDate,
        setSelectedDate,
        setMeetViewMode,
        rescheduleContext,
        setRescheduleContext,
        setSelectedMeetRequest,
        setSelectedMeetEvent,
        activitiesByDate,
        dayMinutesByDate,
        renderClientEvents,
        getSlotsForDate,
        handleTimelineClick,
        selectedMeetRequest,
        selectedConsultationType,
        setSelectedConsultationType,
        coachConsultations,
        isPaidMeetFlow,
        selectedMeetRsvpLoading,
    } = props

    const {
        isDurationValid,
        handleConfirm
    } = useCalendarDaySplitLogic(props)

    return (
        <div>
            <DaySplitHeader
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setMeetViewMode={setMeetViewMode}
                rescheduleContext={rescheduleContext}
                setRescheduleContext={setRescheduleContext}
                setSelectedMeetRequest={setSelectedMeetRequest}
                setSelectedMeetEvent={setSelectedMeetEvent}
            />

            <div className="flex flex-col md:flex-row gap-6">
                <DaySplitTimeline
                    selectedDate={selectedDate}
                    activitiesByDate={activitiesByDate}
                    dayMinutesByDate={dayMinutesByDate}
                    renderClientEvents={renderClientEvents}
                    getSlotsForDate={getSlotsForDate}
                    handleTimelineClick={handleTimelineClick}
                />

                <DaySplitBookingForm
                    selectedMeetRequest={selectedMeetRequest}
                    setSelectedMeetRequest={setSelectedMeetRequest}
                    rescheduleContext={rescheduleContext}
                    selectedConsultationType={selectedConsultationType}
                    setSelectedConsultationType={setSelectedConsultationType}
                    coachConsultations={coachConsultations}
                    isDurationValid={isDurationValid}
                    selectedMeetRsvpLoading={selectedMeetRsvpLoading}
                    handleConfirm={handleConfirm}
                    isPaidMeetFlow={isPaidMeetFlow}
                />
            </div>
        </div>
    )
}
