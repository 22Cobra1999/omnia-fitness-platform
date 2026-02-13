
import React from 'react'
import { Bell, Plus, Minus } from "lucide-react"

interface CalendarHeaderActionsProps {
    meetNotificationsCount: number
    setShowMeetNotifications: (show: boolean) => void
    rescheduleContext: any
    setReschedulePreview: (p: any) => void
    setRescheduleContext: (c: any) => void
    setMeetViewMode: (m: 'month' | 'week' | 'day_split') => void
    handleClearCoachForMeet: () => void
    showAddMenu: boolean
    setShowAddMenu: React.Dispatch<React.SetStateAction<boolean>>
    setShowCoachRow: (show: boolean) => void
    showCoachRow: boolean
}

export function CalendarHeaderActions({
    meetNotificationsCount,
    setShowMeetNotifications,
    rescheduleContext,
    setReschedulePreview,
    setRescheduleContext,
    setMeetViewMode,
    handleClearCoachForMeet,
    showAddMenu,
    setShowAddMenu,
    setShowCoachRow,
    showCoachRow
}: CalendarHeaderActionsProps) {
    return (
        <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3 pointer-events-none">
            {/* Notifications Button */}
            <button
                type="button"
                onClick={() => setShowMeetNotifications(true)}
                className={
                    `relative w-8 h-8 rounded-full border flex items-center justify-center pointer-events-auto ` +
                    `backdrop-blur-md bg-white/10 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
                    `hover:bg-white/15 transition-colors`
                }
                title="Notificaciones"
                aria-label="Notificaciones"
            >
                <Bell className="h-4 w-4 text-[#FF7939]" />
                {meetNotificationsCount > 0 && (
                    <span
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                        style={{ background: '#FF7939', color: '#000' }}
                    >
                        {meetNotificationsCount}
                    </span>
                )}
            </button>

            {/* Cancelar modificación button - only show when in reschedule mode */}
            {rescheduleContext && (
                <button
                    type="button"
                    onClick={() => {
                        setReschedulePreview(null)
                        setRescheduleContext(null)
                        setMeetViewMode('month')
                        handleClearCoachForMeet()
                    }}
                    className={
                        `px-4 py-1.5 rounded-full border text-sm font-medium pointer-events-auto ` +
                        `backdrop-blur-md bg-red-500/10 border-red-500/30 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
                        `text-red-400 hover:bg-red-500/20 transition-colors whitespace-nowrap`
                    }
                    title="Cancelar modificación"
                    aria-label="Cancelar modificación"
                >
                    Cancelar modificación
                </button>
            )}

            <div className="flex items-center gap-2">
                <div
                    className={
                        `flex items-center gap-2 transition-all duration-200 ease-out ` +
                        (showAddMenu ? 'opacity-100 translate-x-0 max-w-[220px]' : 'opacity-0 translate-x-2 max-w-0 pointer-events-none')
                    }
                >
                    <button
                        type="button"
                        onClick={() => {
                            if (showCoachRow) {
                                setShowCoachRow(false)
                                handleClearCoachForMeet()
                            } else {
                                setShowCoachRow(true)
                            }
                        }}
                        className={
                            `px-4 py-1.5 rounded-full border text-sm pointer-events-auto ` +
                            `backdrop-blur-md bg-white/10 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
                            `text-[#FF7939] hover:bg-white/15 transition-colors whitespace-nowrap`
                        }
                    >
                        Meet
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setShowAddMenu((v) => {
                            const next = !v
                            if (!next) setShowCoachRow(false)
                            return next
                        })
                    }}
                    className={
                        `w-8 h-8 rounded-full border flex items-center justify-center pointer-events-auto ` +
                        `backdrop-blur-md bg-white/10 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
                        `hover:bg-white/15 transition-colors`
                    }
                    title={showAddMenu ? 'Cerrar' : 'Acciones'}
                    aria-label={showAddMenu ? 'Cerrar' : 'Acciones'}
                >
                    {showAddMenu ? (
                        <Minus className="h-4 w-4 text-[#FF7939]" />
                    ) : (
                        <Plus className="h-4 w-4 text-[#FF7939]" />
                    )}
                </button>
            </div>
        </div>
    )
}
