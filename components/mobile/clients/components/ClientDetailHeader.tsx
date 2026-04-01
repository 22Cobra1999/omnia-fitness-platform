import React from "react"
import { Calendar as CalendarIcon, MessageCircle, Flame, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils/utils"
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
    const [isCollapsed, setIsCollapsed] = React.useState(false)

    return (
        <div className="relative bg-black pt-2 pb-2 px-4 mt-12 transition-all duration-300">
            <div className="relative z-10 w-full flex flex-col items-center">
                <div className="w-full max-w-[500px] relative mt-4 flex items-center justify-center">
                    {/* Action Buttons (Aligned with avatar row) */}
                    <button
                        type="button"
                        className="absolute left-[5%] sm:left-[15%] md:left-[20%] w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 flex items-center justify-center shadow-sm hover:bg-zinc-800 transition-colors z-20"
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

                    {/* Avatar with centered Flame */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black rounded-[20%] overflow-hidden relative z-10 shadow-xl border border-white/5">
                            <img
                                src={client.avatar_url || "/placeholder.svg"}
                                alt={client.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20">
                            <div className="relative flex items-center justify-center scale-125">
                                <Flame className="h-6 w-6 text-[#FF7939] drop-shadow-lg" fill="#FF7939" />
                                <span className="absolute text-black font-black text-[9px] font-[var(--font-anton)] pt-0.5">
                                    {clientDetail?.client?.streak || client.streak || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="absolute right-[5%] sm:right-[15%] md:right-[20%] w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 flex items-center justify-center shadow-sm hover:bg-zinc-800 transition-colors z-20"
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

                <div className="flex flex-col items-center w-full mt-3">
                    <h3 className="font-bold text-lg text-zinc-300 font-[var(--font-anton)] tracking-wide mb-1">
                        {client.name}
                    </h3>

                    {!isCollapsed && (
                        <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-top-2 duration-300 relative pt-1">
                            {/* Center Identity Section */}
                            <div className="flex flex-col items-center w-full max-w-[320px] mb-2 px-10">
                                {(clientDetail?.client?.physicalData?.description || client.description) && (
                                    <p className="text-[10px] text-gray-500 text-center mb-2 line-clamp-2 italic leading-relaxed opacity-60">
                                        {clientDetail?.client?.physicalData?.description || client.description}
                                    </p>
                                )}

                                <div className="flex items-center justify-center gap-2 mt-0 px-2 py-0.5 scale-[0.95]">
                                    <span className="text-[10px] text-[#FF7939] font-black uppercase tracking-[0.2em]">
                                        {clientDetail?.client?.physicalData?.activityLevel || 'Avanzado'}
                                    </span>
                                    <span className="text-zinc-700 font-bold opacity-30">•</span>
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                        {(() => {
                                            const birthDate = clientDetail?.client?.physicalData?.birth_date || client.birth_date
                                            if (birthDate) return `${calculateAge(birthDate)} años`
                                            const age = clientDetail?.client?.physicalData?.age || (client as any).age
                                            if (age) return `${age} años`
                                            return 'Edad -'
                                        })()}
                                    </span>
                                </div>
                            </div>

                            {/* stats Adaptation */}
                            <div className="w-full flex items-center justify-center relative mt-4 md:mt-2">
                                {/* Web Only stats on sides of the name/advanced section */}
                                <div className="hidden md:flex absolute left-[5%] md:left-[10%] flex-col items-center -translate-y-8">
                                    <span className="text-[#FF7939] text-3xl leading-none font-black drop-shadow-lg tracking-tighter">
                                        {clientDetail?.client?.progress || client.progress}%
                                    </span>
                                    <span className="text-[8px] text-gray-500 uppercase tracking-[0.2em] font-black mt-1.5">Progreso</span>
                                </div>

                                <div className="hidden md:flex absolute right-[5%] md:right-[10%] flex-col items-center -translate-y-8">
                                    <span className="text-zinc-400 text-3xl leading-none font-black drop-shadow-lg tracking-tighter">
                                        $ {(() => {
                                            const val = Math.round(clientDetail?.client?.totalRevenue || client.totalRevenue || 0);
                                            return val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val;
                                        })()}
                                    </span>
                                    <span className="text-[8px] text-zinc-600 uppercase tracking-[0.2em] font-black mt-1.5">Ingresos</span>
                                </div>

                                {/* Mobile Only stats below */}
                                <div className="md:hidden flex flex-row items-center justify-center gap-12 w-full">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[#FF7939] text-2xl leading-none font-black drop-shadow-lg tracking-tighter">
                                            {clientDetail?.client?.progress || client.progress}%
                                        </span>
                                        <span className="text-[8px] text-gray-500 uppercase tracking-[0.2em] font-black mt-1.5">Progreso</span>
                                    </div>

                                    <div className="flex flex-col items-center">
                                        <span className="text-zinc-400 text-2xl leading-none font-black drop-shadow-lg tracking-tighter">
                                            $ {(() => {
                                                const val = Math.round(clientDetail?.client?.totalRevenue || client.totalRevenue || 0);
                                                return val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val;
                                            })()}
                                        </span>
                                        <span className="text-[8px] text-zinc-600 uppercase tracking-[0.2em] font-black mt-1.5">Ingresos</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Toggle button */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="mt-2 p-1 text-[#FF7939] hover:bg-white/5 rounded-full transition-all active:scale-95"
                    >
                        <ChevronDown className={cn("h-5 w-5 transition-transform duration-300", isCollapsed ? "" : "rotate-180")} />
                    </button>
                </div>
            </div>
        </div>
    )
}
