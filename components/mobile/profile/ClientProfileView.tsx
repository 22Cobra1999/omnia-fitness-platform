"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    User, Edit3, BookOpen, Plus, X, MapPin,
    AlertTriangle, Minus, Activity, Calendar,
    Trophy, ArrowDown, ArrowUp, Ruler, Target, FileText
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/supabase-client"
import { OnboardingModal } from "@/components/mobile/onboarding-modal"
import { DailyActivityRings } from "@/components/mobile/daily-activity-rings"
import ActivityCalendar from "@/components/mobile/activity-calendar"
import { QuickExerciseAdd } from "@/components/mobile/quick-exercise-add"
import { ExerciseProgressList } from "@/components/mobile/exercise-progress-list"
import { RecentPurchasesList } from "./RecentPurchasesList"

interface ClientProfileViewProps {
    logic: any
}

export function ClientProfileView({ logic }: ClientProfileViewProps) {
    const {
        user,
        managedProfile,
        isEditingProfile,
        handleCancelProfileEdit,
        handleEditSection,
        showOnboardingForm,
        setShowOnboardingForm,
        editName,
        setEditName,
        editLocation,
        setEditLocation,
        editBirthDate,
        setEditBirthDate,
        editGoals,
        setEditGoals,
        editSports,
        setEditSports,
        isUploadingAvatar,
        setIsUploadingAvatar,
        setShowGoalsSelect,
        setShowSportsSelect,
        handleSaveProfile,
        loadProfile,
        calculateAge,
        activityFilter,
        setActivityFilter,
        ringsWeek,
        setRingsWeek,
        selectedDay,
        setSelectedDay,
        showCalendar,
        setShowCalendar,
        metricsLoading,
        activityRings,
        displayBiometrics,
        handleEditBiometric,
        setIsBiometricsModalOpen,
        setBiometricsModalMode,
        isEditingObjectives,
        setIsEditingObjectives,
        objectivesRef,
        isSavingObjectives,
        setIsSavingObjectives,
        showQuickAdd,
        setShowQuickAdd,
        handleQuickAddExercise,
        setShowInjuriesModal,
        injuries
    } = logic

    return (
        <div className="space-y-6">
            {/* Header del perfil Cliente */}
            <div
                className="bg-[#1A1C1F] rounded-2xl p-4 relative overflow-hidden"
                style={{
                    backgroundImage: managedProfile?.avatar_url
                        ? `linear-gradient(rgba(26, 28, 31, 0.7), rgba(26, 28, 31, 0.8)), url(${managedProfile?.avatar_url})`
                        : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <OnboardingModal
                    isOpen={showOnboardingForm}
                    onClose={() => setShowOnboardingForm(false)}
                />
                {managedProfile?.avatar_url && (
                    <div
                        className="absolute inset-0 opacity-25"
                        style={{
                            backgroundImage: `url(${managedProfile?.avatar_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'blur(12px)',
                            transform: 'scale(1.1)'
                        }}
                    />
                )}

                <div className="relative z-10">
                    <div className="absolute top-4 left-4">
                        <div className="relative">
                            <Button
                                onClick={() => setShowOnboardingForm(true)}
                                variant="ghost" size="sm"
                                className="rounded-full w-9 h-9 p-0 bg-white/10 backdrop-blur-md border border-white/20 text-[#FF6A00] hover:bg-white/20 transition-all shadow-lg"
                            >
                                <BookOpen className="h-4 w-4" />
                            </Button>
                            {(!managedProfile?.physical_data?.onboarding_completed_at) && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6A00] flex items-center justify-center border border-black shadow-sm pointer-events-none">
                                    <span className="text-[10px] font-bold text-white">!</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="absolute top-4 right-4">
                        <Button
                            onClick={() => isEditingProfile ? handleCancelProfileEdit() : handleEditSection("profile")}
                            variant="ghost" size="sm"
                            className={isEditingProfile ? "text-red-400 hover:bg-red-400/10 rounded-xl p-2" : "text-[#FF6A00] hover:bg-[#FF6A00]/10 rounded-xl p-2"}
                        >
                            {isEditingProfile ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="flex justify-center mb-2 pt-2">
                        <div className="relative w-20 h-20 bg-gradient-to-br from-[#FF6A00] to-[#FF8C42] rounded-full flex items-center justify-center overflow-hidden">
                            {managedProfile?.avatar_url ? (
                                <img src={managedProfile.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
                            ) : (
                                <User className="h-10 w-10 text-white" />
                            )}
                            {isEditingProfile && (
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer hover:bg-black/60 transition-colors">
                                    <input
                                        type="file" accept="image/*" className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return
                                            setIsUploadingAvatar(true)
                                            try {
                                                const supabase = getSupabaseClient()
                                                if (managedProfile?.avatar_url) {
                                                    const oldPath = managedProfile.avatar_url.split('/').pop()
                                                    if (oldPath) await supabase.storage.from('avatars').remove([oldPath])
                                                }
                                                const fileExt = file.name.split('.').pop()
                                                const fileName = `${user?.id}-${Date.now()}.${fileExt}`
                                                const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file)
                                                if (uploadError) throw uploadError
                                                const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
                                                const { error: updateError } = await supabase.from('user_profiles').update({ avatar_url: publicUrl }).eq('id', user?.id)
                                                if (updateError) throw updateError
                                                await loadProfile()
                                            } catch (error) {
                                                console.error('Error uploading avatar:', error)
                                            } finally {
                                                setIsUploadingAvatar(false)
                                            }
                                        }}
                                    />
                                    {isUploadingAvatar ? (
                                        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Plus className="h-6 w-6 text-white" />
                                    )}
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="text-center mb-2">
                        {isEditingProfile ? (
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="text-center bg-white/5 border-white/10 text-white max-w-[200px] mx-auto"
                                placeholder="Nombre completo"
                            />
                        ) : (
                            <h1 className="text-lg font-semibold">{managedProfile?.full_name || "Usuario"}</h1>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-4">
                            {isEditingProfile ? (
                                <>
                                    <div className="flex items-center space-x-1">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <Input
                                            value={editLocation}
                                            onChange={(e) => setEditLocation(e.target.value)}
                                            className="bg-white/5 border-white/10 text-white h-8 w-32 text-sm" placeholder="Ubicación"
                                        />
                                    </div>
                                    <Input
                                        type="date" value={editBirthDate}
                                        onChange={(e) => setEditBirthDate(e.target.value)}
                                        className="bg-white/5 border-white/10 text-white h-8 w-36 text-sm"
                                    />
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center space-x-1 group px-2 py-1">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-300">{managedProfile?.location || "No especificada"}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 group px-2 py-1">
                                        <span className="text-sm text-gray-300">{calculateAge(managedProfile?.birth_date) || "?"} años</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="w-full flex flex-col gap-2 items-center mt-2">
                            <div className="w-full overflow-x-auto scrollbar-hide flex justify-center">
                                <div className="flex items-center gap-2 px-4 whitespace-nowrap">
                                    {isEditingProfile ? (
                                        <>
                                            {editGoals.map((g: string, i: number) => (
                                                <div key={`g-${i}`} className="relative px-3 py-1 pr-5 rounded-full bg-[#FF7939]/10 border border-[#FF7939]/30 text-[#FF7939] text-[10px] font-bold tracking-wider capitalize group">
                                                    {g}
                                                    <button onClick={() => setEditGoals(editGoals.filter((_: string, idx: number) => idx !== i))} className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Minus className="h-2.5 w-2.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => setShowGoalsSelect(true)} className="w-6 h-6 rounded-full bg-[#FF7939]/20 border border-[#FF7939]/50 text-[#FF7939] flex items-center justify-center hover:bg-[#FF7939]/30 transition-colors">
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </>
                                    ) : (
                                        managedProfile?.fitness_goals?.map((g: string, i: number) => (
                                            <div key={`g-${i}`} className="px-3 py-1 rounded-full bg-[#FF7939]/10 border border-[#FF7939]/30 text-[#FF7939] text-[10px] font-bold tracking-wider capitalize">{g}</div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="w-full overflow-x-auto scrollbar-hide flex justify-center">
                                <div className="flex items-center gap-2 px-4 whitespace-nowrap">
                                    {isEditingProfile ? (
                                        <>
                                            {editSports.map((s: string, i: number) => (
                                                <div key={`s-${i}`} className="relative px-3 py-1 pr-5 rounded-full bg-orange-300/10 border border-orange-300/30 text-orange-300 text-[10px] font-bold tracking-wider capitalize group">
                                                    {s}
                                                    <button onClick={() => setEditSports(editSports.filter((_: string, idx: number) => idx !== i))} className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Minus className="h-2.5 w-2.5" />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => setShowSportsSelect(true)} className="w-6 h-6 rounded-full bg-orange-300/20 border border-orange-300/50 text-orange-300 flex items-center justify-center hover:bg-orange-300/30 transition-colors">
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </>
                                    ) : (
                                        managedProfile?.sports?.map((s: string, i: number) => (
                                            <div key={`s-${i}`} className="px-3 py-1 rounded-full bg-orange-300/10 border border-orange-300/30 text-orange-300 text-[10px] font-bold tracking-wider capitalize">{s}</div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {isEditingProfile && (
                            <div className="flex gap-2 justify-center pt-4">
                                <Button onClick={handleCancelProfileEdit} variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-white/5">Cancelar</Button>
                                <Button onClick={handleSaveProfile} size="sm" className="bg-gradient-to-r from-[#FF7939] to-[#FF6A00] hover:from-[#FF6A00] hover:to-[#FF5500] text-white">Guardar</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

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
                                const radius = 52 - (index * 14) // Increased spacing and radius
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

                        {/* Center Stats Removed */}
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

            <div className="bg-[#1A1C1F] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2"><FileText className="h-5 w-5 text-[#FF6A00]" /><h2 className="text-lg font-semibold">Compras recientes</h2></div>
                </div>
                <RecentPurchasesList userId={user?.id} />
                <div className="mt-4"><Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10"><FileText className="h-4 w-4 mr-3" />Ver facturas</Button></div>
            </div>

            <div className="bg-[#1A1C1F] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Logros & badges</h2><Button onClick={() => handleEditSection("achievements")} variant="ghost" size="sm" className="text-[#FF6A00] rounded-xl"><Edit3 className="h-4 w-4 mr-2" />Editar</Button></div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="aspect-square bg-white/5 rounded-xl flex items-center justify-center">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mx-auto mb-2 flex items-center justify-center"><Trophy className="h-6 w-6 text-white" /></div>
                                <p className="text-xs text-gray-400">Logro {i}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
