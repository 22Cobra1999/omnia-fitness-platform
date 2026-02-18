import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Target, X, Plus } from "lucide-react"
import { useObjectivesLogic } from "./hooks/useObjectivesLogic"
import { ObjectiveAddForm } from "./components/Objectives/ObjectiveAddForm"
import { ObjectiveCard } from "./components/Objectives/ObjectiveCard"

interface ObjectivesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ObjectivesModal({ isOpen, onClose }: ObjectivesModalProps) {
  const {
    exercises,
    isLoading,
    showAddForm,
    setShowAddForm,
    editingRecord,
    setEditingRecord,
    newExercise,
    setNewExercise,
    timeValue,
    setTimeValue,
    newRecord,
    setNewRecord,
    editRecord,
    setEditRecord,
    handleAddExercise,
    handleAddValue,
    handleEditValue,
    handleDeleteExercise,
    formatDate,
    formatValueForDisplay,
    getUnitLabel
  } = useObjectivesLogic(isOpen)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px] mx-auto bg-[#1A1C1F] border border-white/10 text-white max-h-[90vh] overflow-y-auto p-0 rounded-3xl shadow-2xl">
        <DialogHeader className="p-5 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Target className="h-5 w-5 text-[#FF6A00]" />
            Metas de Rendimiento
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white rounded-full h-8 w-8 p-0 hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="p-5 space-y-6">
          {/* Add Form or Button */}
          {!showAddForm ? (
            <Button
              onClick={() => setShowAddForm(true)}
              className="w-full bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white h-12 rounded-xl font-semibold shadow-lg shadow-[#FF6A00]/20 flex items-center justify-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Nueva Meta
            </Button>
          ) : (
            <ObjectiveAddForm
              onClose={() => setShowAddForm(false)}
              newExercise={newExercise}
              setNewExercise={setNewExercise}
              timeValue={timeValue}
              setTimeValue={setTimeValue}
              handleAddExercise={handleAddExercise}
              isLoading={isLoading}
            />
          )}

          {/* Exercises List */}
          {exercises.length > 0 ? (
            <div className="space-y-4">
              {exercises.map((exercise) => (
                <ObjectiveCard
                  key={exercise.id}
                  exercise={exercise}
                  getUnitLabel={getUnitLabel}
                  handleDeleteExercise={handleDeleteExercise}
                  formatValueForDisplay={formatValueForDisplay}
                  formatDate={formatDate}
                  editingRecord={editingRecord}
                  setEditingRecord={setEditingRecord}
                  editRecord={editRecord}
                  setEditRecord={setEditRecord}
                  handleEditValue={handleEditValue}
                  newRecord={newRecord}
                  setNewRecord={setNewRecord}
                  handleAddValue={handleAddValue}
                />
              ))}
            </div>
          ) : (
            !showAddForm && (
              <div className="text-center py-12 px-4 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-white font-medium mb-1">Sin metas de rendimiento activas</p>
                <p className="text-sm text-gray-500">Define tus metas para realizar un seguimiento efectivo.</p>
              </div>
            )
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/5 bg-white/5">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full h-12 rounded-xl border-white/10 bg-transparent text-gray-300 hover:bg-white/5 hover:text-white"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
