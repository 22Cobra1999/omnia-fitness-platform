import React from "react"
import { PurchasedActivityCard } from "@/components/activities/purchased-activity-card"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ClientActivitiesTabProps {
    activitySubTab: 'en-curso' | 'por-empezar' | 'finalizadas'
    setActivitySubTab: (tab: 'en-curso' | 'por-empezar' | 'finalizadas') => void
    clientDetail: any
    hiddenActivities: Set<number>
}

export function ClientActivitiesTab({
    activitySubTab,
    setActivitySubTab,
    clientDetail,
    hiddenActivities
}: ClientActivitiesTabProps) {
    return (
        <div className="px-4">
            <div className="flex gap-4 mb-4 border-b border-zinc-800/50 pb-2">
                <button
                    onClick={() => setActivitySubTab('en-curso')}
                    className={`text-xs font-bold uppercase tracking-wide transition-colors ${activitySubTab === 'en-curso' ? 'text-[#FF7939]' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    En Curso
                </button>
                <button
                    onClick={() => setActivitySubTab('por-empezar')}
                    className={`text-xs font-bold uppercase tracking-wide transition-colors ${activitySubTab === 'por-empezar' ? 'text-[#FF7939]' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Por Empezar
                </button>
                <button
                    onClick={() => setActivitySubTab('finalizadas')}
                    className={`text-xs font-bold uppercase tracking-wide transition-colors ${activitySubTab === 'finalizadas' ? 'text-[#FF7939]' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Finalizadas
                </button>
            </div>

            <div className="flex flex-row overflow-x-auto gap-4 pb-6 px-1 no-scrollbar snap-x">
                {(() => {
                    const filtered = clientDetail?.client?.activities?.filter((act: any) => {
                        if (hiddenActivities.has(act.id)) return false
                        const status = act.status?.toLowerCase() || ''
                        const today = new Date()
                        today.setHours(0, 0, 0, 0) // Compare strictly by day

                        const endDate = act.end_date ? new Date(act.end_date) : null
                        if (endDate) endDate.setHours(0, 0, 0, 0)

                        const isPast = endDate && endDate < today
                        const isFinishedByStatus = ['finalizada', 'finished', 'expirada', 'expired', 'completed'].includes(status)
                        const is100Percent = (act.progressPercent || 0) >= 100

                        if (activitySubTab === 'en-curso') {
                            // Exclude if past, or finished status, or 100% completed
                            return !!act.start_date && !isPast && !isFinishedByStatus && !is100Percent
                        }
                        if (activitySubTab === 'por-empezar') {
                            return !act.start_date && !isPast && !isFinishedByStatus && !is100Percent
                        }
                        if (activitySubTab === 'finalizadas') {
                            return isPast || isFinishedByStatus || is100Percent
                        }
                        return true
                    }) || []

                    if (filtered.length === 0) {
                        return (
                            <div className="w-full text-center py-10 flex-shrink-0">
                                <p className="text-zinc-500 text-sm italic">No hay actividades en esta sección</p>
                            </div>
                        )
                    }

                    return filtered.map((activity: any) => (
                        <div key={activity.enrollment_id || activity.id} className="flex-shrink-0 snap-start">
                            <PurchasedActivityCard
                                enrollment={{
                                    ...activity,
                                    activity: activity
                                }}
                                size="small"
                                isCoachView={true}
                                daysCompleted={activity.daysCompleted}
                                daysPassed={activity.daysPassed}
                                daysMissed={activity.daysMissed}
                                daysRemainingFuture={activity.daysRemainingFuture}
                                itemsCompletedTotal={activity.itemsCompletedTotal}
                                itemsDebtPast={activity.itemsDebtPast}
                                itemsPendingToday={activity.itemsPendingToday}
                                amountPaid={activity.amount_paid}
                                realProgress={activity.progressPercent}
                            />
                        </div>
                    ))
                })()}
            </div>

            {clientDetail?.program_end_date && (
                <div className="mt-8 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800 text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Fin del programa</p>
                    <p className="text-white font-bold">{format(new Date(clientDetail.program_end_date), "d 'de' MMMM", { locale: es })}</p>
                </div>
            )}
        </div>
    )
}
