import { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from 'next/navigation'
import {
    Calendar as CalendarIcon,
    MessageCircle,
    X,
    Bell,
    Flame,
    Ruler,
    Check,
    CheckCircle2,
    Edit2,
    Target,
    AlertTriangle,
    ChevronRight,
    Search,
    Plus,
    Activity,
    ArrowUp,
    ArrowDown,
    Phone,
    UserPlus,
    FileText,
    ClipboardList
} from 'lucide-react'
import { PurchasedActivityCard } from "@/components/activities/purchased-activity-card"
import { ExerciseProgressList } from '@/components/mobile/exercise-progress-list'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ClientCalendar } from "@/components/coach/client-calendar"
import { useClientDetailLogic } from "../hooks/useClientDetailLogic"
import { Client } from "../types"
import { BiometricsModal } from "@/components/mobile/biometrics-modal"
import InjuriesModal from "@/components/mobile/injuries-modal"
import { QuickExerciseAdd } from "@/components/mobile/quick-exercise-add"

interface ClientDetailModalProps {
    client: Client
    onClose: () => void
}

export function ClientDetailModal({ client, onClose }: ClientDetailModalProps) {
    const router = useRouter()

    const {
        clientDetail,
        loadingDetail,
        activeModalTab,
        setActiveModalTab,
        activitySubTab,
        setActivitySubTab,
        showTodoSection,
        setShowTodoSection,
        todoTasks,
        newTask,
        setNewTask,
        loadingTodo,
        showTodoInput,
        setShowTodoInput,
        loadTodoTasks,
        addNewTask,
        completeTask,
        isEditingBio,
        setIsEditingBio,
        tempBioData,
        setTempBioData,
        savingBio,
        handleSaveBio,
        isEditingObjectives,
        setIsEditingObjectives,
        objectivesListRef,
        hiddenActivities,
        showSurveyModal,
        setShowSurveyModal,
        showInjuries,
        setShowInjuries,
        showBiometrics,
        setShowBiometrics,
        showObjectives,
        setShowObjectives,
        selectedBiometric,
        setSelectedBiometric,
        biometricsModalMode,
        setBiometricsModalMode,
        handleSaveBiometricInternal,
        handleDeleteBiometricInternal,
        handleSaveInjuriesInternal,
        calendarScrollRef,
        preserveModalScrollPosition,
        calculateAge: logicCalculateAge
    } = useClientDetailLogic(client)

    const navigateToTab = (tab: string, section?: string) => {
        window.dispatchEvent(new CustomEvent('navigateToTab', { detail: { tab, section } }))
    }

    const processedBiometrics = useMemo(() => {
        const biometrics = clientDetail?.client?.biometrics || []
        if (!Array.isArray(biometrics)) return []

        const groups: { [key: string]: any[] } = {}
        const profileMetrics = [
            { name: 'Peso', value: clientDetail?.client?.physicalData?.weight, unit: 'kg', id: 'profile-weight', created_at: new Date().toISOString() },
            { name: 'Altura', value: clientDetail?.client?.physicalData?.height, unit: 'cm', id: 'profile-height', created_at: new Date().toISOString() }
        ]

        const allBios = [...profileMetrics.filter(m => m.value), ...biometrics]

        allBios.forEach(b => {
            if (!groups[b.name]) groups[b.name] = []
            groups[b.name].push(b)
        })

        return Object.keys(groups).map(name => {
            const sorted = groups[name].sort((a, b) =>
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )

            const current = sorted[0]
            const previous = sorted[1]

            let trend = 'neutral'
            let diff = 0

            if (previous) {
                diff = current.value - previous.value
                if (diff > 0) trend = 'up'
                else if (diff < 0) trend = 'down'
            }

            return {
                ...current,
                trend,
                previousValue: previous?.value,
                diff: Math.abs(diff)
            }
        })
    }, [clientDetail])

    return (
        <div className="fixed inset-0 bg-black z-30 flex flex-col">
            <div className="absolute top-20 left-2 z-[100]">
                <div className="relative">
                    <button
                        type="button"
                        className="p-2 rounded-full transition-colors border border-zinc-800 bg-[#1c1c1c] hover:bg-zinc-800 group"
                        onClick={() => {
                            setShowTodoSection(prev => !prev)
                            if (!showTodoSection && client) {
                                loadTodoTasks(client.id)
                            }
                        }}
                        title="Notificaciones / To Do"
                    >
                        <Bell className="h-4 w-4 text-[#FF7939] group-hover:text-white transition-colors" />
                        {client?.todoCount && client.todoCount > 0 ? (
                            <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-[#FF7939] rounded-full border border-black flex items-center justify-center">
                                <span className="text-[9px] font-bold text-black leading-none">
                                    {client.todoCount > 9 ? '9+' : client.todoCount}
                                </span>
                            </div>
                        ) : null}
                    </button>

                    {showTodoSection && (
                        <div className="absolute top-12 left-0 w-80 bg-[#1c1c1c] border border-zinc-800 rounded-2xl shadow-2xl z-50 p-4 overflow-hidden">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-bold text-white font-[var(--font-anton)] tracking-wide">PENDIENTES</span>
                                <button
                                    className="w-6 h-6 rounded-full bg-[#FF7939] text-black font-bold flex items-center justify-center text-sm hover:bg-[#ff8f5a] transition-colors"
                                    onClick={() => setShowTodoInput(v => !v)}
                                >
                                    +
                                </button>
                            </div>

                            {showTodoInput && (
                                <div className="flex gap-2 mb-3">
                                    <input
                                        value={newTask}
                                        onChange={(e) => setNewTask(e.target.value)}
                                        className="flex-1 bg-black/40 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#FF7939]"
                                        placeholder="Nueva tarea..."
                                        onKeyDown={(e) => e.key === 'Enter' && addNewTask()}
                                        autoFocus
                                    />
                                </div>
                            )}
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {loadingTodo ? (
                                    <div className="text-xs text-gray-400 text-center py-4">Cargando...</div>
                                ) : todoTasks.length === 0 ? (
                                    <div className="text-xs text-zinc-500 text-center py-4 italic">No hay tareas pendientes</div>
                                ) : (
                                    todoTasks.map((t, idx) => (
                                        <div key={idx} className="flex items-start justify-between bg-zinc-900/50 rounded-lg p-3 hover:bg-zinc-800 transition-colors group">
                                            <span className="text-sm text-gray-300 leading-snug">{t}</span>
                                            <button
                                                onClick={() => completeTask(idx)}
                                                className="w-4 h-4 mt-0.5 rounded-full border border-zinc-600 hover:border-[#FF7939] hover:bg-[#FF7939]/20 flex-shrink-0 ml-3 transition-all"
                                                title="Marcar como completado"
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute top-20 right-2 z-[100]">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="h-5 w-5 text-zinc-400 hover:text-white" />
                </button>
            </div>

            <div className="flex-1 overflow-x-hidden overflow-y-auto" ref={calendarScrollRef}>
                <div className="relative bg-black pt-12 pb-4 px-4 mt-0">
                    <div className="relative z-10 w-full">
                        <div className="flex flex-col items-center w-full mt-12 sm:mt-16">
                            <h3 className="font-bold text-xl sm:text-2xl text-zinc-300 mb-1 text-center font-[var(--font-anton)] tracking-wide">{client.name}</h3>

                            <div className="flex items-center justify-center gap-5 sm:gap-6 mb-2">
                                <button
                                    type="button"
                                    className="w-10 h-10 rounded-full bg-zinc-900/80 backdrop-blur-md border border-zinc-800 flex items-center justify-center shadow-sm hover:bg-zinc-800 transition-colors"
                                    title="Crear Meet"
                                    onClick={() => {
                                        try {
                                            const url = `/?tab=calendar&clientId=${encodeURIComponent(client.id)}`
                                            router.push(url)
                                            navigateToTab('calendar')
                                        } catch {
                                            navigateToTab('calendar')
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
                                            navigateToTab('messages')
                                        } catch {
                                            navigateToTab('messages')
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
                                            ? `${logicCalculateAge(clientDetail.client.physicalData.birth_date)} años`
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

                    <div className="bg-transparent px-4 pt-2">
                        <div className="flex relative border-b border-zinc-800 pb-0">
                            {['calendar', 'activities', 'info'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => {
                                        setActiveModalTab(tab as any)
                                        if (calendarScrollRef.current) {
                                            calendarScrollRef.current.scrollTo({ top: 450, behavior: 'smooth' })
                                        }
                                    }}
                                    className={`flex-1 pb-3 text-sm font-medium transition-colors relative ${activeModalTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    {tab === 'calendar' && 'Calendario'}
                                    {tab === 'info' && 'Información'}
                                    {tab === 'activities' && (
                                        <span>
                                            {clientDetail?.client?.activitiesCount || client.activitiesCount} Actividades
                                        </span>
                                    )}
                                </button>
                            ))}

                            <div
                                className="absolute bottom-0 h-[3px] bg-[#FF7939] transition-all duration-300 ease-out rounded-t-full"
                                style={{
                                    left: activeModalTab === 'calendar' ? '12%' : activeModalTab === 'activities' ? '45%' : '78%',
                                    width: '10%',
                                    transform: 'translateX(-50%)'
                                }}
                            />
                        </div>
                    </div>

                    <div className="bg-transparent px-0 pt-3 pb-40 min-h-[300px]">
                        {loadingDetail ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7939]"></div>
                            </div>
                        ) : (
                            <>
                                {activeModalTab === 'calendar' && (
                                    <div className="pt-2">
                                        <ClientCalendar
                                            clientId={client.id}
                                            clientName={client.name}
                                            onClose={onClose}
                                            enableScrollLookAhead={true}
                                        />
                                    </div>
                                )}

                                {activeModalTab === 'activities' && (
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
                                                    if (activitySubTab === 'en-curso') {
                                                        const isCompleted = (act.progressPercent || 0) >= 100 ||
                                                            ['finalizada', 'finished', 'expirada', 'expired', 'completed'].includes(status)
                                                        return !isCompleted && !!act.start_date
                                                    }
                                                    if (activitySubTab === 'por-empezar') {
                                                        return !act.start_date && !['finalizada', 'finished', 'expirada', 'expired', 'completed'].includes(status)
                                                    }
                                                    if (activitySubTab === 'finalizadas') {
                                                        return (act.progressPercent || 0) >= 100 ||
                                                            ['finalizada', 'finished', 'expirada', 'expired', 'completed'].includes(status)
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
                                )}

                                {activeModalTab === 'info' && (
                                    <div className="px-4 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-32">
                                        <div className="flex flex-col space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <Ruler className="h-4 w-4 text-[#FF6A00]" />
                                                    <h2 className="text-sm font-semibold text-gray-200">Biometría</h2>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => setIsEditingBio(!isEditingBio)}
                                                        className={`h-6 px-2 py-0 text-[10px] font-bold rounded-full transition-all ${isEditingBio ? 'bg-orange-500/20 text-[#FF6A00]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                                    >
                                                        {isEditingBio ? 'Terminar' : 'Editar'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setBiometricsModalMode('register')
                                                            setSelectedBiometric(null)
                                                            setShowBiometrics(true)
                                                        }}
                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-[#FF6A00] hover:bg-[#FF6A00]/10 transition-colors"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar scroll-smooth">
                                                <div className="flex gap-3 min-w-max">
                                                    {processedBiometrics.length > 0 ? (
                                                        processedBiometrics.map((bio) => (
                                                            <div
                                                                key={bio.id}
                                                                onClick={() => {
                                                                    if (isEditingBio) return
                                                                    setSelectedBiometric(bio)
                                                                    setBiometricsModalMode('edit')
                                                                    setShowBiometrics(true)
                                                                }}
                                                                className={`bg-white/5 rounded-2xl p-3 border-l-2 border-transparent w-[130px] h-[90px] flex flex-col justify-between group transition-all shadow-lg relative ${isEditingBio ? 'cursor-default' : 'hover:border-l-[#FF6A00] hover:bg-white/10 cursor-pointer'}`}
                                                            >
                                                                {isEditingBio && bio.id !== 'profile-weight' && bio.id !== 'profile-height' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            handleDeleteBiometricInternal(bio.id)
                                                                        }}
                                                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                                                                    >
                                                                        <span className="text-lg leading-none font-bold mt-[-2px]">-</span>
                                                                    </button>
                                                                )}
                                                                <div className="flex justify-between items-start">
                                                                    <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider leading-tight max-w-[70%]">{bio.name}</span>
                                                                    {bio.trend !== 'neutral' && (
                                                                        <div className={`flex items-center gap-0.5 text-[9px] font-bold ${bio.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                                                            {bio.trend === 'up' ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                                                                            <span>{Number(bio.diff).toFixed(1)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-baseline gap-1 mt-auto">
                                                                    <span className="text-2xl font-bold text-white tracking-tighter">{bio.value}</span>
                                                                    <span className="text-[10px] text-gray-500 font-medium">{bio.unit}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="bg-white/5 rounded-2xl p-4 border border-dashed border-white/10 w-full text-center py-8">
                                                            <span className="text-sm text-gray-500 italic">Sin datos registrados</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <Target className="h-4 w-4 text-[#FF6A00]" />
                                                    <h2 className="text-sm font-semibold text-gray-200">Metas de Rendimiento</h2>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={async () => {
                                                            if (isEditingObjectives) {
                                                                await objectivesListRef.current?.saveChanges()
                                                            }
                                                            setIsEditingObjectives(!isEditingObjectives)
                                                        }}
                                                        className={`h-6 px-2 py-0 text-[10px] font-bold rounded-full transition-all ${isEditingObjectives ? 'bg-orange-500/20 text-[#FF6A00]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                                    >
                                                        {isEditingObjectives ? 'Terminar' : 'Editar'}
                                                    </button>
                                                    <button
                                                        onClick={() => setShowObjectives(!showObjectives)}
                                                        className="w-6 h-6 rounded-full flex items-center justify-center text-[#FF6A00] hover:bg-[#FF6A00]/10 transition-colors"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="bg-transparent min-h-[120px] w-full">
                                                {showObjectives && (
                                                    <div className="mb-4">
                                                        <QuickExerciseAdd
                                                            onCancel={() => setShowObjectives(false)}
                                                            onAdd={async (data) => {
                                                                try {
                                                                    const resp = await fetch(`/api/coach/clients/${client.id}/objectives`, {
                                                                        method: 'POST',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify(data)
                                                                    })
                                                                    if (resp.ok) {
                                                                        setShowObjectives(false)
                                                                        // @ts-ignore
                                                                        if (window.refreshExercises) window.refreshExercises()
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error adding objective:', error)
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                                <ExerciseProgressList
                                                    ref={objectivesListRef}
                                                    userId={client.id}
                                                    isEditing={isEditingObjectives}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-[#FF6A00]" />
                                                    <h2 className="text-sm font-semibold text-gray-200">Lesiones</h2>
                                                </div>
                                            </div>

                                            <div className="overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar scroll-smooth">
                                                <div className="flex gap-3 min-w-max">
                                                    {clientDetail?.client?.injuries && clientDetail.client.injuries.length > 0 ? (
                                                        clientDetail.client.injuries.map((injury: any, idx: number) => (
                                                            <div
                                                                key={idx}
                                                                className="bg-white/5 rounded-2xl p-4 border-l-2 border-transparent w-[150px] h-[100px] flex flex-col justify-between group shadow-lg"
                                                            >
                                                                <div className="flex justify-between items-start">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] uppercase text-gray-400 font-bold leading-tight max-w-[85%]">{injury.muscleName || injury.name || "Lesión"}</span>
                                                                        <span className="text-sm font-bold text-white mt-1 line-clamp-1">{injury.title || injury.name || "Lesión"}</span>
                                                                    </div>
                                                                    <div className={`h-2.5 w-2.5 rounded-full shadow-[0_0_8px] ${(injury.severity === 'high' || injury.painLevel >= 7) ? 'bg-red-500 shadow-red-500/50' : (injury.severity === 'medium' || injury.painLevel >= 4) ? 'bg-yellow-500 shadow-yellow-500/50' : 'bg-green-500 shadow-green-500/50'}`} />
                                                                </div>
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${(injury.severity === 'high' || injury.painLevel >= 7) ? 'text-red-400' : (injury.severity === 'medium' || injury.painLevel >= 4) ? 'text-yellow-400' : 'text-green-400'}`}>
                                                                    {injury.severity === 'high' ? 'Grave' : injury.severity === 'medium' ? 'Moderada' : 'Leve'}
                                                                </span>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="bg-white/5 rounded-2xl p-4 border border-dashed border-white/10 w-full text-center py-8">
                                                            <span className="text-sm text-gray-500 italic">Sin lesiones registradas</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col space-y-6 pt-6 border-t border-white/5">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 hover:bg-white/10 transition-all">
                                                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                                                        <Phone className="h-3 w-3" />
                                                        <span className="text-[10px] uppercase font-bold tracking-widest">Teléfono</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-white">
                                                        {clientDetail?.client?.physicalData?.phone || 'Sin registrar'}
                                                    </p>
                                                </div>
                                                <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 hover:bg-white/10 transition-all">
                                                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                                                        <UserPlus className="h-3.5 w-3.5 text-red-400/70" />
                                                        <span className="text-[10px] uppercase font-bold tracking-widest">Emergencia</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-white">
                                                        {clientDetail?.client?.physicalData?.emergency_contact || 'Sin registrar'}
                                                    </p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setShowSurveyModal(true)}
                                                className="w-full bg-gradient-to-r from-zinc-900 to-[#121212] border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:from-zinc-800 hover:to-zinc-900 transition-all group active:scale-[0.98]"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-[#FF6A00]/10 rounded-xl flex items-center justify-center group-hover:bg-[#FF6A00]/20 transition-colors">
                                                        <ClipboardList className="h-5 w-5 text-[#FF6A00]" />
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-white">Respuestas de la Encuesta</p>
                                                        <p className="text-[10px] text-gray-500 font-medium">Ver detalles del Onboarding</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-gray-400 transition-all group-hover:translate-x-0.5" />
                                            </button>
                                        </div>

                                        <Dialog open={showSurveyModal} onOpenChange={setShowSurveyModal}>
                                            <DialogContent className="max-w-md bg-[#0F0F0F] border-zinc-800 text-white rounded-3xl overflow-hidden p-0 max-h-[85vh] flex flex-col shadow-2xl">
                                                <DialogHeader className="p-6 border-b border-zinc-900 flex flex-row items-center justify-between">
                                                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                                                        <ClipboardList className="h-5 w-5 text-[#FF7939]" />
                                                        Onboarding del Cliente
                                                    </DialogTitle>
                                                    <DialogDescription className="sr-only">
                                                        Detalles de las respuestas a la encuesta de onboarding del cliente.
                                                    </DialogDescription>
                                                    <button onClick={() => setShowSurveyModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                                                        <X className="h-5 w-5 text-zinc-500" />
                                                    </button>
                                                </DialogHeader>
                                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                                    {clientDetail?.client?.onboarding ? (
                                                        <>
                                                            <div className="space-y-4">
                                                                <h4 className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em]">Contexto y Objetivos</h4>
                                                                <div className="grid gap-3">
                                                                    {[
                                                                        { label: 'Nivel de Exigencia', value: clientDetail.client.onboarding.intensity_level, color: 'text-orange-400' },
                                                                        { label: 'Deseo de Cambio', value: clientDetail.client.onboarding.change_goal, color: 'text-blue-400' },
                                                                        { label: 'Horizonte Temporal', value: clientDetail.client.onboarding.progress_horizon, color: 'text-purple-400' },
                                                                        { label: 'Constancia', value: clientDetail.client.onboarding.consistency_level, color: 'text-green-400' },
                                                                        { label: 'Modalidad', value: clientDetail.client.onboarding.training_modality, color: 'text-white' }
                                                                    ].map((item, i) => (
                                                                        <div key={i} className="flex flex-col gap-1 p-3 bg-white/5 rounded-xl border border-zinc-800/50">
                                                                            <span className="text-[9px] uppercase text-zinc-500 font-bold tracking-wider">{item.label}</span>
                                                                            <span className={`text-sm font-bold capitalize ${item.color}`}>{item.value?.replace(/_/g, ' ') || 'No especificado'}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <h4 className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em]">Intereses</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {clientDetail.client.onboarding.interests?.map((interest: string, i: number) => (
                                                                        <span key={i} className="px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg text-xs font-bold capitalize border border-orange-500/20">
                                                                            {interest}
                                                                        </span>
                                                                    )) || <span className="text-zinc-600 text-xs italic">Sin intereses declarados</span>}
                                                                </div>
                                                            </div>

                                                            <div className="space-y-4">
                                                                <h4 className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em]">Comentarios Adicionales</h4>
                                                                <div className="p-4 bg-white/5 rounded-2xl border border-zinc-800/50 italic text-sm text-zinc-300 leading-relaxed">
                                                                    {clientDetail.client.onboarding.additional_notes || 'El cliente no dejó comentarios adicionales.'}
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                                                            <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
                                                                <Search className="h-8 w-8 text-zinc-700" />
                                                            </div>
                                                            <p className="text-zinc-400 text-sm font-medium">No se encontraron respuestas de onboarding para este cliente.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Management Modals */}
            <BiometricsModal
                isOpen={showBiometrics}
                onClose={() => setShowBiometrics(false)}
                onSave={handleSaveBiometricInternal}
                onDelete={handleDeleteBiometricInternal}
                mode={biometricsModalMode}
                initialData={selectedBiometric}
            />

            <InjuriesModal
                isOpen={showInjuries}
                onClose={() => setShowInjuries(false)}
                onSave={handleSaveInjuriesInternal}
                injuries={clientDetail?.client?.injuries || []}
            />
        </div>
    )
}
