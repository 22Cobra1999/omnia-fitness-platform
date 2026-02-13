
import { Button } from "@/components/ui/button"
import { CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Bell, Plus, Minus, Video } from "lucide-react"

interface CalendarHeaderProps {
    title: string
    onPrev: () => void
    onNext: () => void
    onToday?: () => void
    meetViewMode: 'month' | 'week' | 'day_split'
    meetNotificationsCount?: number
    onNotificationsClick?: () => void
    onAddClick?: () => void
    isAddSectionOpen?: boolean
}

export function CalendarHeader({
    title,
    onPrev,
    onNext,
    onToday,
    meetViewMode,
    meetNotificationsCount = 0,
    onNotificationsClick,
    onAddClick,
    isAddSectionOpen = false
}: CalendarHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6 px-1">
            {/* Esquina Izquierda: Notificaciones */}
            <div className="flex-1 flex justify-start">
                <button
                    className="h-10 w-10 relative bg-zinc-800 border border-[#FF7939]/30 rounded-full flex items-center justify-center hover:bg-zinc-700 transition-colors"
                    onClick={onNotificationsClick}
                >
                    <Bell className="h-5 w-5 text-[#FF7939]" />
                    {meetNotificationsCount > 0 && (
                        <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-[#FF7939] text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border border-zinc-900 shadow-lg z-10">
                            {meetNotificationsCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Centro: Navegación de Mes */}
            <div className="flex items-center gap-3 sm:gap-6 bg-zinc-900/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5">
                <Button
                    variant="ghost"
                    onClick={onPrev}
                    className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>

                <h3 className="text-white text-base sm:text-xl font-semibold capitalize tracking-tight min-w-[120px] text-center select-none">
                    {title}
                </h3>

                <Button
                    variant="ghost"
                    onClick={onNext}
                    className="h-8 w-8 p-0 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                    <ChevronRight className="h-5 w-5" />
                </Button>
            </div>

            {/* Esquina Derecha: Botón de añadir y hoy */}
            <div className="flex-1 flex justify-end gap-2 items-center">
                {onToday && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onToday}
                        className="hidden sm:flex text-xs font-medium text-white/30 hover:text-white hover:bg-white/5 px-3 rounded-full h-8"
                    >
                        Hoy
                    </Button>
                )}
                {onAddClick && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onAddClick}
                        className={`h-10 px-3 flex items-center gap-2 rounded-full border transition-all hover:scale-105 shadow-lg
                            ${isAddSectionOpen
                                ? 'bg-[#FF7939] border-white/20 text-black shadow-[#FF7939]/20'
                                : 'bg-zinc-900 border-[#FF7939]/40 text-[#FF7939] hover:bg-zinc-800 shadow-black/40'}`}
                    >
                        {isAddSectionOpen ? (
                            <Minus className="h-5 w-5" />
                        ) : (
                            <>
                                <Video className="h-4 w-4 text-[#FF7939]" />
                                <Plus className="h-5 w-5" />
                            </>
                        )}
                    </Button>
                )}
            </div>
        </div>
    )
}
