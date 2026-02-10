import React from 'react'
import { Plus, Bell, Minus } from 'lucide-react'

interface CoachCalendarHeaderProps {
    viewMode: 'month' | 'today'
    calendarMode: 'events' | 'availability'
    notificationsCount: number
    onShowNotifications: () => void
    onToggleAddMenu: () => void
    onToggleMode: () => void
    showAddMenu: boolean
    onCreateMeet?: () => void
    onEditAvailability?: () => void
}

export function CoachCalendarHeader({
    viewMode,
    calendarMode,
    notificationsCount,
    onShowNotifications,
    onToggleAddMenu,
    onToggleMode,
    showAddMenu,
    onCreateMeet,
    onEditAvailability
}: CoachCalendarHeaderProps) {
    return (
        <div className="mb-3 relative flex items-center justify-between">
            {/* Notificaciones a la izquierda - IDÉNTICO AL CLIENTE */}
            <button
                type="button"
                onClick={onShowNotifications}
                className={
                    `relative w-8 h-8 rounded-full border flex items-center justify-center ` +
                    `backdrop-blur-md bg-white/10 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
                    `hover:bg-white/15 transition-colors`
                }
                title="Notificaciones"
                aria-label="Notificaciones"
            >
                <Bell className="h-4 w-4 text-[#FF7939]" />
                {notificationsCount > 0 && (
                    <span
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                        style={{ background: '#FF7939', color: '#000' }}
                    >
                        {notificationsCount}
                    </span>
                )}
            </button>

            {/* Botón + a la derecha con menú desplegable - IDÉNTICO AL CLIENTE */}
            <div className="flex items-center gap-2">
                <div
                    className={
                        `flex items-center gap-2 transition-all duration-200 ease-out ` +
                        (showAddMenu ? 'opacity-100 translate-x-0 max-w-[320px]' : 'opacity-0 translate-x-2 max-w-0 pointer-events-none')
                    }
                >
                    <button
                        type="button"
                        onClick={() => {
                            onToggleAddMenu()
                            if (onEditAvailability) onEditAvailability()
                        }}
                        className={
                            `px-4 py-1.5 rounded-full border text-sm ` +
                            `backdrop-blur-md bg-white/10 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
                            `text-[#FF7939] hover:bg-white/15 transition-colors whitespace-nowrap`
                        }
                    >
                        Disponibilidad
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            onToggleAddMenu()
                            if (onCreateMeet) onCreateMeet()
                        }}
                        className={
                            `px-4 py-1.5 rounded-full border text-sm ` +
                            `backdrop-blur-md bg-white/10 border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.35)] ` +
                            `text-[#FF7939] hover:bg-white/15 transition-colors whitespace-nowrap`
                        }
                    >
                        Meet
                    </button>
                </div>

                <button
                    type="button"
                    onClick={onToggleAddMenu}
                    className={
                        `w-8 h-8 rounded-full border flex items-center justify-center ` +
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
