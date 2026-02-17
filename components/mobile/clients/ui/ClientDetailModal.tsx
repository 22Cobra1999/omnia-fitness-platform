import { useRef } from "react"
import { useRouter } from 'next/navigation'
import { X, Bell, CheckCircle2 } from 'lucide-react'
import { ClientCalendar } from "@/components/coach/client-calendar"
import { useClientDetailLogic } from "../hooks/useClientDetailLogic"
import { Client } from "../types"
import { BiometricsModal } from "@/components/mobile/biometrics-modal"
import InjuriesModal from "@/components/mobile/injuries-modal"

// Sub-components
import { ClientDetailHeader } from "../components/ClientDetailHeader"
import { ClientActivitiesTab } from "../components/ClientActivitiesTab"
import { ClientInfoTab } from "../components/ClientInfoTab"
import { ClientSurveyDialog } from "../components/ClientSurveyDialog"

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
        processedBiometrics,
        handleSaveBiometricInternal,
        handleDeleteBiometricInternal,
        handleSaveInjuriesInternal,
        calendarScrollRef,
        calculateAge,
        handleNavigateToTab
    } = useClientDetailLogic(client)

    return (
        <div className="fixed inset-0 bg-black z-30 flex flex-col">
            {/* Context Actions (Todo/Notifications) */}
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

            {/* Close Button */}
            <div className="absolute top-20 right-2 z-[100]">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="h-5 w-5 text-zinc-400 hover:text-white" />
                </button>
            </div>

            <div className="flex-1 overflow-x-hidden overflow-y-auto" ref={calendarScrollRef}>
                {/* Header Section */}
                <ClientDetailHeader
                    client={client}
                    clientDetail={clientDetail}
                    calculateAge={calculateAge}
                    onNavigateToTab={handleNavigateToTab}
                    router={router}
                    onClose={onClose}
                />

                {/* Tabs Navigation */}
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

                {/* Content Area */}
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
                                <ClientActivitiesTab
                                    activitySubTab={activitySubTab}
                                    setActivitySubTab={setActivitySubTab}
                                    clientDetail={clientDetail}
                                    hiddenActivities={hiddenActivities}
                                />
                            )}

                            {activeModalTab === 'info' && (
                                <ClientInfoTab
                                    client={client}
                                    clientDetail={clientDetail}
                                    processedBiometrics={processedBiometrics}
                                    isEditingBio={isEditingBio}
                                    setIsEditingBio={setIsEditingBio}
                                    setSelectedBiometric={setSelectedBiometric}
                                    setBiometricsModalMode={setBiometricsModalMode}
                                    setShowBiometrics={setShowBiometrics}
                                    handleDeleteBiometricInternal={handleDeleteBiometricInternal}
                                    isEditingObjectives={isEditingObjectives}
                                    setIsEditingObjectives={setIsEditingObjectives}
                                    objectivesListRef={objectivesListRef}
                                    showObjectives={showObjectives}
                                    setShowObjectives={setShowObjectives}
                                    setShowInjuries={setShowInjuries}
                                    setShowSurveyModal={setShowSurveyModal}
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Global Modals */}
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

            <ClientSurveyDialog
                isOpen={showSurveyModal}
                setIsOpen={setShowSurveyModal}
                clientDetail={clientDetail}
            />
        </div>
    )
}
