
import React from 'react'
import { Plus, Bell, Minus, ChevronLeft, ChevronRight, Video, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CoachCalendarHeaderProps {
    viewMode: 'month' | 'week' | 'day'
    calendarMode: 'events' | 'availability'
    notificationsCount: number
    onShowNotifications: () => void
    onToggleAddMenu: () => void
    onToggleMode: () => void
    showAddMenu: boolean
    onCreateMeet: () => void
    onEditAvailability: () => void
    isCreating?: boolean
    onCancelCreation?: () => void
    currentDateLabel?: string
    onPrevMonth?: () => void
    onNextMonth?: () => void
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
    onEditAvailability,
    isCreating = false,
    onCancelCreation,
    currentDateLabel,
    onPrevMonth,
    onNextMonth
}: CoachCalendarHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-4 relative z-20">
            {/* Left: Notifications (Moved from Right) */}
            <button
                type="button"
                onClick={onShowNotifications}
                className="w-10 h-10 rounded-full border border-white/10 bg-zinc-800 flex items-center justify-center relative hover:bg-zinc-700 transition-colors"
                aria-label="Notificaciones"
            >
                <Bell className="h-5 w-5 text-[#FF7939]" />
                {notificationsCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF7939] text-[10px] font-bold text-black border border-black shadow-lg">
                        {notificationsCount}
                    </span>
                )}
            </button>

            {/* Center: Month Navigation (New) */}
            {currentDateLabel && onPrevMonth && onNextMonth && (
                <div className="flex items-center gap-2 sm:gap-4 bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 shadow-2xl shadow-black/50">
                    <Button
                        variant="ghost"
                        onClick={onPrevMonth}
                        className="h-7 w-7 p-0 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <h3 className="text-white text-sm sm:text-base font-bold capitalize tracking-wide min-w-[100px] text-center select-none truncate">
                        {currentDateLabel}
                    </h3>

                    <Button
                        variant="ghost"
                        onClick={onNextMonth}
                        className="h-7 w-7 p-0 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Right: Actions (Add/Cancel) + Toggle */}
            <div className="flex items-center gap-3">
                {/* Mode Toggle (Hidden if creating to reduce clutter?) -> Keep it but maybe smaller */}
                {!isCreating && (
                    <button
                        onClick={onToggleMode}
                        className="hidden sm:flex px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    >
                        {calendarMode === 'events' ? 'Ver Disponibilidad' : 'Ver Agenda'}
                    </button>
                )}

                <div className="relative">
                    <button
                        type="button"
                        onClick={isCreating ? onCancelCreation : onToggleAddMenu}
                        className={`
                            w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 shadow-lg
                            ${isCreating
                                ? 'bg-transparent border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939]/10'
                                : (showAddMenu
                                    ? 'bg-[#FF7939] border-[#FF7939] text-black shadow-[#FF7939]/20 scale-105'
                                    : 'bg-zinc-800 border-white/10 text-[#FF7939] hover:bg-zinc-700 hover:border-white/20')
                            }
                        `}
                        title={isCreating ? 'Cancelar' : (showAddMenu ? 'Cerrar' : 'Acciones')}
                        aria-label={isCreating ? 'Cancelar' : (showAddMenu ? 'Cerrar' : 'Acciones')}
                    >
                        {isCreating ? (
                            <X className="h-5 w-5" />
                        ) : showAddMenu ? (
                            <Minus className="h-5 w-5" />
                        ) : (
                            <Plus className="h-5 w-5" />
                        )}
                    </button>

                    {/* Dropdown Menu */}
                    {showAddMenu && !isCreating && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 origin-top-right">
                            <div className="p-1.5 space-y-1">
                                <button
                                    onClick={onCreateMeet}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-white/80 hover:bg-white/5 hover:text-white transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[#FF7939]/10 flex items-center justify-center text-[#FF7939] group-hover:bg-[#FF7939] group-hover:text-black transition-all">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold">Nueva Meet</span>
                                </button>
                                <button
                                    onClick={onEditAvailability}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-white/80 hover:bg-white/5 hover:text-white transition-all group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-white/10 group-hover:text-white transition-all">
                                        <Video className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold">Editar Disponibilidad</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
