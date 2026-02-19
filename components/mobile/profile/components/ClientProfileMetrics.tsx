import React from "react"
import { Button } from "@/components/ui/button"
import { Ruler, Plus, ArrowUp, ArrowDown, Target, AlertTriangle } from "lucide-react"
import { ExerciseProgressList } from "@/components/mobile/exercise-progress-list"
import { QuickExerciseAdd } from "@/components/mobile/quick-exercise-add"

interface ClientProfileMetricsProps {
    displayBiometrics: any[]
    handleEditBiometric: (bio: any) => void
    setBiometricsModalMode: (mode: string) => void
    setIsBiometricsModalOpen: (open: boolean) => void
    isEditingObjectives: boolean
    setIsEditingObjectives: (editing: boolean) => void
    objectivesRef: any
    isSavingObjectives: boolean
    setIsSavingObjectives: (saving: boolean) => void
    showQuickAdd: boolean
    setShowQuickAdd: (show: boolean) => void
    handleQuickAddExercise: (exercise: any) => void
    injuries: any[]
    setShowInjuriesModal: (show: boolean) => void
}

export const ClientProfileMetrics: React.FC<ClientProfileMetricsProps> = ({
    displayBiometrics,
    handleEditBiometric,
    setBiometricsModalMode,
    setIsBiometricsModalOpen,
    isEditingObjectives,
    setIsEditingObjectives,
    objectivesRef,
    isSavingObjectives,
    setIsSavingObjectives,
    showQuickAdd,
    setShowQuickAdd,
    handleQuickAddExercise,
    injuries,
    setShowInjuriesModal,
}) => {
    return (
        <div className="space-y-6">
            <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2"><Ruler className="h-4 w-4 text-[#FF6A00]" /><h2 className="text-sm font-semibold text-gray-200">Biometría</h2></div>
                    <Button onClick={() => { setBiometricsModalMode('register'); setIsBiometricsModalOpen(true); }} variant="ghost" size="sm" className="text-[#FF6A00] h-6 w-6 p-0 rounded-full"><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="bg-transparent h-[120px] w-full overflow-x-auto hide-scrollbar-mobile">
                    <div className="flex gap-3 min-w-max px-2">
                        {displayBiometrics.map((bio: any) => (
                            <div key={bio.id} onClick={() => handleEditBiometric(bio)} className="bg-white/5 rounded-2xl p-3 cursor-pointer hover:bg-white/10 transition-all border-l-2 border-transparent hover:border-l-[#FF6A00] w-[130px] h-[90px] flex flex-col justify-between group">
                                <div className="flex justify-between items-start">
                                    <span className="text-[10px] uppercase text-gray-400 font-bold max-w-[70%] leading-tight tracking-wider">{bio.name}</span>
                                    {bio.trend !== 'neutral' && (
                                        <div className={`flex items-center gap-0.5 text-[9px] font-bold ${bio.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                                            {bio.trend === 'up' ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                                            <span>{Number(bio.diff).toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-baseline gap-1 mt-auto">
                                    <span className="text-2xl font-bold text-white">{bio.value}</span>
                                    <span className="text-[10px] text-gray-500 font-medium">{bio.unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2"><Target className="h-4 w-4 text-[#FF6A00]" /><h2 className="text-sm font-semibold text-gray-200">Metas de Rendimiento</h2></div>
                    <div className="flex gap-1 items-center">
                        {isEditingObjectives && (
                            <div className="flex gap-1 mr-2">
                                <Button onClick={() => { setIsEditingObjectives(false); objectivesRef.current?.cancelEditing(); }} variant="ghost" size="sm" className="text-gray-500 h-6 px-2 py-0 text-[10px] font-bold">Cancelar</Button>
                                <Button onClick={async () => { setIsSavingObjectives(true); await objectivesRef.current?.saveChanges(); setIsSavingObjectives(false); setIsEditingObjectives(false); }} variant="ghost" size="sm" className="bg-orange-500/10 text-[#FF6A00] h-6 px-2 py-0 text-[10px] font-bold">{isSavingObjectives ? '...' : 'Guardar'}</Button>
                            </div>
                        )}
                        <Button onClick={() => setIsEditingObjectives(!isEditingObjectives)} variant="ghost" size="sm" className={`h-6 px-2 py-0 text-[10px] font-bold rounded-full ${isEditingObjectives ? 'bg-orange-500/20 text-[#FF6A00]' : 'text-gray-400'}`}>{isEditingObjectives ? 'Terminar' : 'Editar'}</Button>
                        <Button onClick={() => setShowQuickAdd(true)} variant="ghost" size="sm" className="text-[#FF6A00] h-6 w-6 p-0 rounded-full"><Plus className="h-4 w-4" /></Button>
                    </div>
                </div>
                {showQuickAdd && <div className="mb-2"><QuickExerciseAdd onAdd={handleQuickAddExercise} onCancel={() => setShowQuickAdd(false)} /></div>}
                <div className={`h-[120px] w-full ${!isEditingObjectives ? 'cursor-pointer' : ''}`} onClick={() => !isEditingObjectives && setIsEditingObjectives(true)}><ExerciseProgressList ref={objectivesRef} isEditing={isEditingObjectives} /></div>
            </div>

            <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[#FF6A00]" /><h2 className="text-sm font-semibold text-gray-200">Lesiones</h2></div>
                    <Button onClick={() => setShowInjuriesModal(true)} variant="ghost" size="sm" className="text-[#FF6A00] h-6 w-6 p-0 rounded-full"><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="bg-transparent h-[120px] w-full overflow-x-auto hide-scrollbar-mobile">
                    <div className="flex gap-3 min-w-max px-2">
                        {injuries.length > 0 ? (
                            injuries.map((injury: any) => (
                                <div key={injury.id} onClick={() => setShowInjuriesModal(true)} className="bg-white/5 rounded-2xl p-4 cursor-pointer hover:bg-white/10 transition-all border-l-2 border-transparent hover:border-l-[#FF6A00] w-[140px] h-[100px] flex flex-col justify-between group">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] uppercase text-gray-400 font-bold leading-tight max-w-[85%]">{injury.muscleName || injury.name}</span>
                                        <div className={`h-2 w-2 rounded-full ${(injury.painLevel === 3 || injury.severity === 'high' || (injury.painLevel || 0) >= 7) ? 'bg-red-500' : (injury.painLevel === 2 || injury.severity === 'medium' || (injury.painLevel || 0) >= 4) ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                    </div>
                                    <div className="mt-auto">
                                        <span className="text-white text-sm font-bold block truncate">{injury.name}</span>
                                        <span className={`text-[10px] font-medium ${(injury.painLevel === 3 || injury.severity === 'high' || (injury.painLevel || 0) >= 7) ? 'text-red-400' : (injury.painLevel === 2 || injury.severity === 'medium' || (injury.painLevel || 0) >= 4) ? 'text-yellow-400' : 'text-green-400'}`}>{(injury.painLevel === 3 || injury.severity === 'high' || (injury.painLevel || 0) >= 7) ? 'Fuerte' : (injury.painLevel === 2 || injury.severity === 'medium' || (injury.painLevel || 0) >= 4) ? 'Moderado' : 'Leve'}</span>
                                    </div>
                                </div>
                            ))
                        ) : <div className="flex items-center justify-center w-full h-[100px] text-xs text-gray-500 border border-dashed border-white/10 rounded-2xl">Sin lesiones activas</div>}
                    </div>
                </div>
            </div>
        </div>
    )
}
