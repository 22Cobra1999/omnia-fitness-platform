import React from "react"
import { Calendar as CalendarIcon, MessageCircle, Flame } from "lucide-react"
import { Client } from "../types"

interface ClientDetailHeaderProps {
    client: Client
    clientDetail: any
    calculateAge: (birthDate: string | null) => number | null
    onNavigateToTab: (tab: string, section?: string) => void
    router: any
    onClose: () => void
}

export function ClientDetailHeader({
    client,
    clientDetail,
    calculateAge,
    onNavigateToTab,
    router,
    onClose
}: ClientDetailHeaderProps) {
    return (
        <div className="relative bg-black pt-12 pb-4 px-4 mt-0">
            <div className="relative z-10 w-full">
                <div className="flex flex-col items-center w-full mt-12 sm:mt-16">
                    <h3 className="font-bold text-xl sm:text-2xl text-zinc-300 mb-1 text-center font-[var(--font-anton)] tracking-wide">
                        {client.name}
                    </h3>

                    <div className="flex items-center justify-center gap-5 sm:gap-6 mb-2">
                        <button
                            type="button"
                            className="w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 flex items-center justify-center shadow-sm hover:bg-zinc-800 transition-colors"
                            title="Crear Meet"
                            onClick={() => {
                                try {
                                    const url = `/?tab=calendar&clientId=${encodeURIComponent(client.id)}`
                                    router.push(url)
                                    onNavigateToTab('calendar')
                                } catch {
                                    onNavigateToTab('calendar')
                                }
                            }}
                        >
                            <CalendarIcon className="h-5 w-5 text-white/70" />
                        </button>

                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
                            <div className="absolute -bottom-2 sm:-bottom-3 z-20 flex flex-col items-center justify-center">
                                <div className="relative flex items-center justify-center">
                                    <Flame className="h-8 w-8 sm:h-10 sm:w-10 text-[#FF7939] drop-shadow-lg" fill="#FF7939" strokeWidth={1.5} />
                                    <span className="absolute text-black font-bold text-[10px] sm:text-xs font-[var(--font-anton)] pt-1">
                                        {(client.itemsPending ?? 0) + (client.todoCount ?? 0)}
                                    </span>
                                </div>
                            </div>

                            <div className="w-full h-full bg-black rounded-[20%] overflow-hidden relative z-10 shadow-2xl">
                                <img
                                    src={client.avatar_url || "/placeholder.svg"}
                                    alt={client.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            className="w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 flex items-center justify-center shadow-sm hover:bg-zinc-800 transition-colors"
                            title="Mensajes"
                            onClick={() => {
                                try {
                                    const url = `/?tab=messages&clientId=${encodeURIComponent(client.id)}`
                                    router.push(url)
                                    onNavigateToTab('messages')
                                } catch {
                                    onNavigateToTab('messages')
                                }
                                onClose()
                            }}
                        >
                            <MessageCircle className="h-5 w-5 text-white/70" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center w-full max-w-[300px]">
                        {(clientDetail?.client?.physicalData?.description || client.description) && (
                            <p className="text-sm text-gray-400 text-center mb-2 line-clamp-2 px-4 italic leading-relaxed">
                                {clientDetail?.client?.physicalData?.description || client.description}
                            </p>
                        )}

                        <div className="flex items-center justify-center gap-3 mt-1 mb-4">
                            <span className="text-sm text-gray-400 font-medium">
                                {clientDetail?.client?.physicalData?.birth_date
                                    ? `${calculateAge(clientDetail.client.physicalData.birth_date)} años`
                                    : (clientDetail?.client?.physicalData?.age ? `${clientDetail.client.physicalData.age} años` : '-')}
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-sm text-[#FF7939] font-bold capitalize tracking-wide">
                                {clientDetail?.client?.physicalData?.activityLevel || 'Avanzado'}
                            </span>
                        </div>

                        <div className="w-full flex justify-between items-center px-2 mb-8">
                            <div className="flex flex-col items-center">
                                <span className="text-[#FF7939] text-4xl leading-none font-black drop-shadow-lg tracking-tighter">
                                    {clientDetail?.client?.progress || client.progress}%
                                </span>
                                <span className="text-[8px] text-gray-400 uppercase tracking-[0.2em] font-medium mt-2">Progreso</span>
                            </div>

                            <div className="w-16"></div>

                            <div className="flex flex-col items-center">
                                <span className="text-zinc-400 text-4xl leading-none font-black drop-shadow-lg tracking-tighter">
                                    $ {(() => {
                                        const val = Math.round(clientDetail?.client?.totalRevenue || client.totalRevenue || 0);
                                        return val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val;
                                    })()}
                                </span>
                                <span className="text-[8px] text-zinc-500 uppercase tracking-[0.2em] font-medium mt-2">Ingresos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
