"use client"

import { useProfileScreenLogic } from "@/hooks/mobile/useProfileScreenLogic"
import { CoachProfileView } from "./profile/CoachProfileView"
import { ClientProfileView } from "./profile/ClientProfileView"
import { ProfileEditModal } from "@/components/mobile/profile-edit-modal"
import { ObjectivesModal } from "@/components/mobile/objectives-modal"
import { BiometricsModal } from "@/components/mobile/biometrics-modal"
import { ConfirmationModal } from "@/components/ui/confirmation-modal"
import InjuriesModal from "@/components/mobile/injuries-modal"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function ProfileScreen() {
  const logic = useProfileScreenLogic()

  const {
    isCoach,
    isEditModalOpen,
    setIsEditModalOpen,
    setShowInjuriesModal,
    setEditingSection,
    editingSection,
    isObjectivesModalOpen,
    setIsObjectivesModalOpen,
    isBiometricsModalOpen,
    setIsBiometricsModalOpen,
    biometricsModalMode,
    handleSaveBiometric,
    selectedBiometric,
    handleDeleteBiometricFromModal,
    showBiometricDeleteConfirmation,
    setShowBiometricDeleteConfirmation,
    setBiometricToDelete,
    confirmDeleteBiometric,
    biometricToDelete,
    showInjuriesModal,
    injuries,
    handleSaveInjuries,
    showGoalsSelect,
    setShowGoalsSelect,
    editGoals,
    setEditGoals,
    showSportsSelect,
    setShowSportsSelect,
    editSports,
    setEditSports
  } = logic

  return (
    <div className="min-h-screen bg-[#0F1012] text-white p-4 space-y-6">
      {isCoach ? (
        <CoachProfileView logic={logic} />
      ) : (
        <ClientProfileView logic={logic} />
      )}

      {/* Shared Modals */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setShowInjuriesModal(false)
          setEditingSection(null)
        }}
        editingSection={editingSection}
        isCoach={isCoach}
      />

      <ObjectivesModal
        isOpen={isObjectivesModalOpen}
        onClose={() => setIsObjectivesModalOpen(false)}
      />

      <BiometricsModal
        isOpen={isBiometricsModalOpen}
        onClose={() => setIsBiometricsModalOpen(false)}
        mode={biometricsModalMode}
        onSave={handleSaveBiometric}
        initialData={selectedBiometric}
        onDelete={handleDeleteBiometricFromModal}
      />

      <ConfirmationModal
        isOpen={showBiometricDeleteConfirmation}
        onClose={() => {
          setShowBiometricDeleteConfirmation(false)
          setBiometricToDelete(null)
        }}
        onConfirm={confirmDeleteBiometric}
        title="Eliminar Medición"
        description={
          biometricToDelete
            ? `¿Estás seguro de que quieres eliminar la medición "${biometricToDelete.name}: ${biometricToDelete.value} ${biometricToDelete.unit}"? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />

      <InjuriesModal
        isOpen={showInjuriesModal}
        onClose={() => setShowInjuriesModal(false)}
        injuries={injuries}
        onSave={handleSaveInjuries}
      />

      {/* Goal Selection Dialog */}
      <Dialog open={showGoalsSelect} onOpenChange={setShowGoalsSelect}>
        <DialogContent className="bg-[#1A1C1F] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Meta</DialogTitle>
            <DialogDescription className="text-gray-400">Selecciona una meta de la lista</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {['Quemar Grasas', 'Ganar Masa Muscular', 'Mejorar Condición Física', 'Tonificar', 'Aumentar Fuerza', 'Mejorar Flexibilidad', 'Perder Peso', 'Mantener Forma'].map((goal) => (
              <Button
                key={goal}
                onClick={() => {
                  if (!editGoals.includes(goal)) setEditGoals([...editGoals, goal])
                  setShowGoalsSelect(false)
                }}
                variant="outline"
                className="border-[#FF7939]/30 text-white hover:bg-[#FF7939]/20 hover:border-[#FF7939] justify-start"
              >
                {goal}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sports Selection Dialog */}
      <Dialog open={showSportsSelect} onOpenChange={setShowSportsSelect}>
        <DialogContent className="bg-[#1A1C1F] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Deporte</DialogTitle>
            <DialogDescription className="text-gray-400">Selecciona un deporte de la lista</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4">
            {['Fútbol', 'Basketball', 'Tenis', 'Natación', 'Ciclismo', 'Running', 'Yoga', 'Pilates', 'CrossFit', 'Boxeo', 'Calistenia', 'Padel', 'Voley', 'Rugby'].map((sport) => (
              <Button
                key={sport}
                onClick={() => {
                  if (!editSports.includes(sport)) setEditSports([...editSports, sport])
                  setShowSportsSelect(false)
                }}
                variant="outline"
                className="border-orange-300/30 text-white hover:bg-orange-300/20 hover:border-orange-300 justify-start"
              >
                {sport}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProfileScreen
