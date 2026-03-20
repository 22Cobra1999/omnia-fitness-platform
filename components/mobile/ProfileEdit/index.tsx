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
        handleRemoveImage,
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
                <DialogContent 
                    className="p-0 border-none bg-black/95 backdrop-blur-xl max-w-lg w-full h-[90vh] md:h-[85vh] rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                    style={{
                        position: 'fixed',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 9999
                    }}
                >
                    {/* CUSTOM HEADER SIMÉTRICA - OMNIA STYLE */}
                    <div className="absolute top-0 left-0 right-0 z-20 px-6 py-6 flex items-center bg-gradient-to-b from-black via-black/80 to-transparent">
                        {/* IZQUIERDA: GUARDAR */}
                        <div className="flex-1 flex justify-start">
                            <Button
                                onClick={handleSaveProfile}
                                disabled={loading}
                                className="bg-[#FF7939] hover:bg-[#FF6A00] text-black font-black text-[10px] italic h-9 px-6 rounded-full shadow-[0_4px_25px_rgba(255,121,57,0.4)] transition-all hover:scale-110 active:scale-95 uppercase tracking-widest disabled:opacity-30 border-2 border-black/20"
                            >
                                {loading ? "..." : "GUARDAR"}
                            </Button>
                        </div>

                        {/* CENTRO: TÍTULO RADICAL */}
                        <div className="flex-[2] flex justify-center">
                            <DialogTitle className="text-xl font-black text-white italic uppercase tracking-[0.2em] whitespace-nowrap drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                                Editar Perfil
                            </DialogTitle>
                        </div>

                        {/* DERECHA: CRUZ DE CIERRE */}
                        <div className="flex-1 flex justify-end">
                            <button 
                                type="button"
                                onClick={handleCloseAttempt}
                                className="p-2 text-white/40 hover:text-white transition-all transform hover:scale-125 active:scale-90"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    <DialogDescription className="sr-only">Formulario para editar la información personal y profesional.</DialogDescription>

                    <div className="max-h-[85vh] overflow-y-auto px-6 pt-24 pb-12 space-y-8 scrollbar-hide">
                        <ProfileImageSection 
                            previewImage={previewImage} 
                            onImageChange={handleImageChange} 
                            onRemoveImage={handleRemoveImage}
                        />

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
