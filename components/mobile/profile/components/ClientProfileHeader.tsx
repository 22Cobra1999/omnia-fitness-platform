import React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Edit3, BookOpen, Plus, X, MapPin, Minus } from "lucide-react"
import { OnboardingModal } from "@/components/mobile/onboarding-modal"
import { getSupabaseClient } from "@/lib/supabase/supabase-client"

interface ClientProfileHeaderProps {
    user: any
    managedProfile: any
    isEditingProfile: boolean
    handleCancelProfileEdit: () => void
    handleEditSection: (section: string) => void
    showOnboardingForm: boolean
    setShowOnboardingForm: (show: boolean) => void
    editName: string
    setEditName: (name: string) => void
    editLocation: string
    setEditLocation: (location: string) => void
    editBirthDate: string
    setEditBirthDate: (date: string) => void
    editGoals: string[]
    setEditGoals: (goals: string[]) => void
    editSports: string[]
    setEditSports: (sports: string[]) => void
    isUploadingAvatar: boolean
    setIsUploadingAvatar: (uploading: boolean) => void
    setShowGoalsSelect: (show: boolean) => void
    setShowSportsSelect: (show: boolean) => void
    handleSaveProfile: () => void
    loadProfile: () => Promise<void>
    calculateAge: (date: string) => number | string
}

export const ClientProfileHeader: React.FC<ClientProfileHeaderProps> = ({
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
}) => {
    return (
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
    )
}
