import React from "react"
import { Ruler, Plus, Target, AlertTriangle, Phone, UserPlus, ClipboardList, ChevronRight, ArrowUp, ArrowDown } from "lucide-react"
import { ExerciseProgressList } from '@/components/mobile/exercise-progress-list'
import { QuickExerciseAdd } from "@/components/mobile/quick-exercise-add"

interface ClientInfoTabProps {
    client: any
    clientDetail: any
    processedBiometrics: any[]
    isEditingBio: boolean
    setIsEditingBio: (val: boolean) => void
    setSelectedBiometric: (val: any) => void
    setBiometricsModalMode: (val: 'register' | 'edit') => void
    setShowBiometrics: (val: boolean) => void
    handleDeleteBiometricInternal: (id: string) => void
    isEditingObjectives: boolean
    setIsEditingObjectives: (val: boolean) => void
    objectivesListRef: any
    showObjectives: boolean
    setShowObjectives: (val: boolean) => void
    setShowInjuries: (val: boolean) => void
    setShowSurveyModal: (val: boolean) => void
}

export function ClientInfoTab({
    client,
    clientDetail,
    processedBiometrics,
    isEditingBio,
    setIsEditingBio,
    setSelectedBiometric,
    setBiometricsModalMode,
    setShowBiometrics,
    handleDeleteBiometricInternal,
    isEditingObjectives,
    setIsEditingObjectives,
    objectivesListRef,
    showObjectives,
    setShowObjectives,
    setShowInjuries,
    setShowSurveyModal
}: ClientInfoTabProps) {
    return (
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
        </div>
    )
}
