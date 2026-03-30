import React from "react"
import { Calendar, X, ArrowDown, ArrowUp } from "lucide-react"
import { DailyActivityRings } from "@/components/mobile/daily-activity-rings"
import ActivityCalendar from "@/components/mobile/activity-calendar"

interface ClientProfileActivityProps {
    user: any
    selectedDay: any
    setSelectedDay: (day: any) => void
    activityFilter: 'fitness' | 'nutricion'
    setActivityFilter: (filter: 'fitness' | 'nutricion') => void
    ringsWeek: any
    setRingsWeek: (week: any) => void
    showCalendar: boolean
    setShowCalendar: (show: boolean) => void
    metricsLoading: boolean
    activityRings: any[]
}

export const ClientProfileActivity: React.FC<ClientProfileActivityProps> = ({
    user,
    selectedDay,
    setSelectedDay,
    activityFilter,
    setActivityFilter,
    ringsWeek,
    setRingsWeek,
    showCalendar,
    setShowCalendar,
    metricsLoading,
    activityRings,
}) => {
    return (
        <div className="bg-black w-full py-6">
            <div className="mb-6 px-4">
                <DailyActivityRings
                    userId={user?.id} selectedDate={selectedDay?.date} category={activityFilter} currentWeek={ringsWeek}
                    onWeekChange={setRingsWeek}
                    headerRight={
                        <div className="flex items-center space-x-2">
                            <button onClick={() => setShowCalendar(!showCalendar)} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700">
                                <Calendar className="w-5 h-5 text-gray-400" />
                            </button>
                            {metricsLoading && <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>}
                        </div>
                    }
                    onSelectDay={setSelectedDay}
                />
            </div>

            <div className="flex items-center justify-between mt-4 px-4">
                <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <defs>
                            {activityRings.map((ring: any, index: number) => (
                                <linearGradient key={`grad-big-${index}`} id={`grad-big-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={ring.color} />
                                    <stop offset="100%" stopColor={ring.color} stopOpacity={0.6} />
                                </linearGradient>
                            ))}
                        </defs>
                        {activityRings.map((ring: any, index: number) => {
                            const rawPercentage = ring.target > 0 ? (ring.current / ring.target) * 100 : 0
                            const percentage = isNaN(rawPercentage) || !isFinite(rawPercentage) ? 0 : Math.max(0, Math.min(rawPercentage, 100))
                            const radius = 54 - (index * 12)
                            const circumference = 2 * Math.PI * radius
                            const strokeDashoffset = circumference - (percentage / 100) * circumference
                            return (
                                <g key={index}>
                                    <circle cx="60" cy="60" r={radius} stroke="rgba(255,255,255,0.02)" strokeWidth="9" fill="none" />
                                    <circle
                                        cx="60" cy="60" r={radius}
                                        stroke={ring.color}
                                        strokeWidth="9" fill="none"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                        style={{ filter: `drop-shadow(0 0 8px ${ring.color}40)` }}
                                    />
                                </g>
                            )
                        })}
                    </svg>
                </div>

                <div className="flex flex-col space-y-3 items-end">
                    {selectedDay ? (
                        <button
                            onClick={() => setSelectedDay(null)}
                            className="text-[10px] font-black uppercase italic text-[#FF7939] hover:text-[#FF7939]/80 transition-colors bg-[#FF7939]/5 px-2 py-0.5 rounded-full border border-[#FF7939]/20"
                        >
                            Volver a Semanal
                        </button>
                    ) : (
                        <span className="text-[10px] font-black uppercase italic text-zinc-500 tracking-widest">Semanal</span>
                    )}

                    {activityRings.map((ring: any) => (
                        <div key={ring.type} className="flex flex-col items-end" style={{ minWidth: '120px' }}>
                            <div className="flex items-center gap-1 text-[9px] font-black uppercase italic justify-end opacity-60" style={{ color: ring.color }}>
                                {ring.type === 'Kcal' && (
                                    <ArrowDown className="h-2.5 w-2.5" strokeWidth={4} />
                                )}
                                <span>{ring.type}</span>
                            </div>
                            <div className="text-[18px] font-black italic tracking-tighter" style={{ color: ring.color }}>
                                {ring.current.toLocaleString()}/{ring.target.toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => setActivityFilter('fitness')} className={`text-xs px-3 py-1.5 rounded-full font-medium ${activityFilter === 'fitness' ? 'bg-black text-[#FF7939]' : 'bg-gray-800 text-gray-400'}`}>Fitness</button>
                <button onClick={() => setActivityFilter('nutricion')} className={`text-xs px-3 py-1.5 rounded-full font-medium ${activityFilter === 'nutricion' ? 'bg-white text-[#FF7939]' : 'bg-gray-800 text-gray-400'}`}>Nutrición</button>
            </div>

            {showCalendar && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1A1C1F] rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Historial de Actividad</h3>
                            <button onClick={() => setShowCalendar(false)} className="p-2 rounded-lg hover:bg-gray-700"><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[60vh]"><ActivityCalendar userId={user?.id} /></div>
                    </div>
                </div>
            )}
        </div>
    )
}
