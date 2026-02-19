import React from "react"
import { Calendar, X, ArrowDown, ArrowUp } from "lucide-react"
import { DailyActivityRings } from "@/components/mobile/daily-activity-rings"
import ActivityCalendar from "@/components/mobile/activity-calendar"

interface ClientProfileActivityProps {
    user: any
    selectedDay: any
    setSelectedDay: (day: any) => void
    activityFilter: string
    setActivityFilter: (filter: string) => void
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
        <div className="bg-[#1A1C1F] rounded-2xl p-6">
            <div className="mb-6">
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

            <div className="flex items-center justify-between mt-8">
                <div className="relative w-52 h-52 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <defs>
                            {activityRings.map((ring: any) => (
                                <linearGradient key={`grad-big-${ring.type}`} id={`grad-big-${ring.type}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={ring.color} />
                                    <stop offset="100%" stopColor={ring.color} stopOpacity={0.6} />
                                </linearGradient>
                            ))}
                        </defs>
                        {activityRings.map((ring: any, index: number) => {
                            const rawPercentage = ring.target > 0 ? (ring.current / ring.target) * 100 : 0
                            const percentage = isNaN(rawPercentage) || !isFinite(rawPercentage) ? 0 : Math.max(0, Math.min(rawPercentage, 100))
                            const radius = 52 - (index * 14)
                            const circumference = 2 * Math.PI * radius
                            const strokeDashoffset = circumference - (percentage / 100) * circumference
                            return (
                                <g key={ring.type}>
                                    <circle cx="60" cy="60" r={radius} stroke="rgba(255,255,255,0.03)" strokeWidth="10" fill="none" />
                                    <circle
                                        cx="60" cy="60" r={radius}
                                        stroke={`url(#grad-big-${ring.type})`}
                                        strokeWidth="10" fill="none"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={strokeDashoffset}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                        style={{ filter: `drop-shadow(0 0 4px ${ring.color}40)` }}
                                    />
                                </g>
                            )
                        })}
                    </svg>
                </div>

                <div className="flex flex-col space-y-3 items-end">
                    <span className="text-xs text-zinc-500">{selectedDay ? 'Volver a Semanal' : 'Semanal'}</span>
                    {activityRings.map((ring: any) => (
                        <div key={ring.type} className="flex flex-col items-end" style={{ minWidth: '120px' }}>
                            <div className="flex items-center gap-1.5 text-sm font-medium justify-end" style={{ color: ring.color }}>
                                {ring.type === 'Kcal' ? (
                                    activityFilter === 'fitness' ? <ArrowDown className="h-4 w-4" style={{ color: "#FF6A00" }} /> : <ArrowUp className="h-4 w-4" style={{ color: "#FFFFFF" }} />
                                ) : null}
                                <span>{ring.type}</span>
                            </div>
                            <div className="text-lg font-bold" style={{ color: ring.color }}>{ring.current}/{ring.target}</div>
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
