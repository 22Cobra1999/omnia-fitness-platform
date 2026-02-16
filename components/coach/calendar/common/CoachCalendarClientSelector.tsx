
import React from 'react'
import { Video, Zap, Utensils, GraduationCap, X } from "lucide-react"

interface CoachCalendarClientSelectorProps {
    clients: any[]
    selectedClientId: string | null
    onSelectClient: (client: any) => void
    onClear: () => void
    isSelecting: boolean
}

export function CoachCalendarClientSelector({
    clients,
    selectedClientId,
    onSelectClient,
    onClear,
    isSelecting
}: CoachCalendarClientSelectorProps) {
    // If not selecting and no client selected, show nothing? 
    // Or if isSelecting is true, show list. 
    // If client selected (and not isSelecting? or isSelecting becomes false?), show selected.

    // The pattern in CalendarCoachSelector is: Always show list if `showCoachRow` is true.
    // Here we want to show it when `isSelectingClient` is true OR when a client is selected (maybe just the selected one or the list with one selected?)

    // User wants "Above the +".

    if (!isSelecting && !selectedClientId) return null

    return (
        <div className="mb-2 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* If we have no clients */}
            {clients.length === 0 ? (
                <div className="text-sm text-gray-400 text-right px-4">
                    No tienes clientes activos.
                </div>
            ) : (
                <div className="flex items-center justify-end gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
                    {clients.map((client) => {
                        const isSelected = selectedClientId === client.id
                        // If a client is selected, should we hide others? 
                        // The CoachSelector dims them. Let's dim them.
                        // But if we have MANY clients, maybe we want to filter?
                        // For now, mirroring CoachSelector:
                        const isDimmed = !!selectedClientId && !isSelected
                        const availableCredits = client.meet_credits_available || 0
                        console.log('CLIENT DATA:', client.id, client.full_name, availableCredits)

                        if (isDimmed && !isSelecting) return null // Optional: hide unselected if selection is done? 
                        // User said "sigue apareciendo abajo...". 
                        // Let's try to keep the "Carousel" feel. 

                        // Actually, if we selected one, maybe we just show THAT one to save space?
                        // Let's stick to the CoachSelector behavior: It shows the row.

                        return (
                            <button
                                key={client.id}
                                type="button"
                                onClick={() => {
                                    if (isSelected) {
                                        onClear()
                                    } else {
                                        onSelectClient(client)
                                    }
                                }}
                                className={
                                    `relative py-2 px-2 rounded-[20px] border backdrop-blur-md transition-all duration-300 flex flex-col items-center gap-1.5 active:scale-95 flex-shrink-0 ` +
                                    (isSelected
                                        ? 'bg-[#FF7939]/10 border-[#FF7939]/30 shadow-lg ring-1 ring-[#FF7939]/20'
                                        : 'bg-zinc-900/80 border-white/10 hover:bg-white/10 hover:border-white/20') +
                                    (isDimmed ? ' opacity-40 grayscale blur-[0.5px]' : '')
                                }
                            >
                                <div className={
                                    `relative w-10 h-10 rounded-full transition-all duration-300 ` +
                                    (isSelected
                                        ? 'ring-2 ring-[#FF7939] scale-105'
                                        : '')
                                }>
                                    {client.avatar_url ? (
                                        <img src={client.avatar_url} alt={client.full_name || client.name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/50 bg-zinc-800 rounded-full">
                                            {(client.full_name || client.name || 'C').charAt(0)}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-center gap-0.5 leading-none">
                                    <div className="relative">
                                        {/* Credits Badge used to be here */}
                                    </div>

                                    <div className={
                                        `text-[9px] font-medium leading-[1.1] text-center max-w-[60px] truncate transition-colors ` +
                                        (isSelected ? 'text-white' : 'text-white/40')
                                    }>
                                        {(client.full_name || client.name || 'Cliente').split(' ')[0]}
                                    </div>
                                    {(client.full_name || client.name || '').split(' ')[1] && (
                                        <div className={
                                            `text-[9px] font-medium leading-[1.1] text-center max-w-[60px] truncate transition-colors ` +
                                            (isSelected ? 'text-white' : 'text-white/40')
                                        }>
                                            {(client.full_name || client.name || '').split(' ')[1]}
                                        </div>
                                    )}

                                    {/* New Credits Display Below Name */}
                                    {availableCredits > 0 && (
                                        <div className={`flex items-center gap-1 mt-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-50'}`}>
                                            <Video className="w-2.5 h-2.5 text-[#FF7939]" />
                                            <span className="text-[9px] font-bold text-[#FF7939]">{availableCredits}</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                </div>
            )
            }
        </div >
    )
}
