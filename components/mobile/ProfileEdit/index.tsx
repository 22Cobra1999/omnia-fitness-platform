"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { X } from "lucide-react"
import { ProfileImageSection } from './components/ProfileImageSection'
import { BasicInfoSection } from './components/BasicInfoSection'
import { PhysicalDataSection } from './components/PhysicalDataSection'
import { GoalsSportsSection } from './components/GoalsSportsSection'
import { CoachDataSection } from './components/CoachDataSection'
import { useProfileEditLogic } from './hooks/useProfileEditLogic'
import { ProfileEditModalProps } from './types'

export function ProfileEditModal({ isOpen, onClose, editingSection, isCoach }: ProfileEditModalProps) {
    const {
        loading,
        profileData,
        setProfileData,
        goals,
        sports,
        handleToggleGoal,
        handleToggleSport,
        previewImage,
        handleImageChange,
        handleCloseAttempt,
        handleSaveProfile,
        errors,
        showDiscardConfirmation,
        setShowDiscardConfirmation,
        isGoalsPopoverOpen,
        setIsGoalsPopoverOpen,
        isSportsPopoverOpen,
        setIsSportsPopoverOpen
    } = useProfileEditLogic(isOpen, onClose)

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleCloseAttempt}>
                <DialogContent className="w-[95vw] max-w-[480px] p-0 overflow-hidden bg-[#0F1012] border-white/10 text-white shadow-2xl rounded-3xl">
                    <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                        <DialogTitle className="text-lg font-black text-white italic uppercase tracking-tighter">Editar Perfil</DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleSaveProfile}
                                disabled={loading}
                                className="bg-[#FF7939] hover:bg-[#FF7939]/90 text-white font-black text-xs rounded-full px-6 h-10 transition-all shadow-[0_10px_20px_rgba(255,121,57,0.2)]"
                            >
                                {loading ? "..." : "GUARDAR"}
                            </Button>
                            <button onClick={handleCloseAttempt} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <DialogDescription className="sr-only">Formulario para editar la información personal y profesional.</DialogDescription>

                    <div className="max-h-[85vh] overflow-y-auto px-6 pt-24 pb-12 space-y-8 scrollbar-hide">
                        <ProfileImageSection previewImage={previewImage} onImageChange={handleImageChange} />

                        <BasicInfoSection
                            data={profileData}
                            onChange={(updates) => setProfileData(prev => ({ ...prev, ...updates }))}
                        />

                        {isCoach ? (
                            <CoachDataSection
                                data={profileData}
                                onChange={(updates) => setProfileData(prev => ({ ...prev, ...updates }))}
                            />
                        ) : (
                            <>
                                <PhysicalDataSection
                                    data={profileData}
                                    errors={errors}
                                    onChange={(updates) => setProfileData(prev => ({ ...prev, ...updates }))}
                                />

                                <GoalsSportsSection
                                    goals={goals}
                                    sports={sports}
                                    onToggleGoal={handleToggleGoal}
                                    onToggleSport={handleToggleSport}
                                    isGoalsPopoverOpen={isGoalsPopoverOpen}
                                    setIsGoalsPopoverOpen={setIsGoalsPopoverOpen}
                                    isSportsPopoverOpen={isSportsPopoverOpen}
                                    setIsSportsPopoverOpen={setIsSportsPopoverOpen}
                                />
                            </>
                        )}

                        <div className="h-4" />
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showDiscardConfirmation} onOpenChange={setShowDiscardConfirmation}>
                <DialogContent className="bg-[#1A1C1F] border-white/10 text-white rounded-2xl w-[90vw] max-w-sm">
                    <DialogHeader>
                        <DialogTitle>¿Perder cambios?</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Tienes cambios sin guardar. Si cierras ahora, se perderán.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-row gap-3 mt-4">
                        <Button variant="ghost" className="flex-1 text-gray-400" onClick={() => setShowDiscardConfirmation(false)}>
                            Continuar editando
                        </Button>
                        <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={() => { setShowDiscardConfirmation(false); onClose(); }}>
                            Perder cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
