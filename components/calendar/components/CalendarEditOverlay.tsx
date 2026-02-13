
import React from 'react'

interface CalendarEditOverlayProps {
    isEditing: boolean
    sourceDate: Date | null
}

export function CalendarEditOverlay({ isEditing, sourceDate }: CalendarEditOverlayProps) {
    if (!isEditing) return null
    return (
        <div className="mb-4 bg-[#FF7939]/10 border border-[#FF7939]/20 rounded-lg p-2 text-center text-xs text-[#FF7939] animate-in fade-in slide-in-from-top-2">
            {!sourceDate
                ? "Selecciona el día que quieres mover"
                : "Ahora selecciona el día destino"}
        </div>
    )
}
