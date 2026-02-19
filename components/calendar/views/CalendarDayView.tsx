
import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { CalendarDaySplitView as OriginalCalendarDaySplitView } from "../components/CalendarDaySplitView"

interface CalendarDayViewProps {
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

export function CalendarDayView(props: CalendarDayViewProps) {
    return (
        <Card className="bg-zinc-900 border-zinc-800 w-full sm:max-w-none mt-4">
            <CardContent className="p-4">
                <div className="mt-4">
                    <OriginalCalendarDaySplitView {...props} />
                </div>
            </CardContent>
        </Card>
    )
}
