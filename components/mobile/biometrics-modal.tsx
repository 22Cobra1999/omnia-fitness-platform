import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, X, Plus, Trash2 } from "lucide-react"

interface BiometricsModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'edit' | 'register'
  onSave: (data: { name: string, value: number, unit: string }) => void
  initialData?: any
  onDelete?: () => void
}

const measurementTypes = [
  { value: "peso", label: "Peso", unit: "kg" },
  { value: "altura", label: "Altura", unit: "cm" },
  { value: "pecho", label: "Pecho", unit: "cm" },
  { value: "cintura", label: "Cintura", unit: "cm" },
  { value: "cadera", label: "Cadera", unit: "cm" },
  { value: "brazo", label: "Brazo", unit: "cm" },
  { value: "muslo", label: "Muslo", unit: "cm" },
  { value: "grasa_corporal", label: "Grasa Corporal", unit: "%" },
  { value: "musculo", label: "Músculo", unit: "kg" },
  { value: "agua", label: "Agua Corporal", unit: "%" },
  { value: "hueso", label: "Masa Ósea", unit: "kg" }
]

export function BiometricsModal({ isOpen, onClose, mode, onSave, initialData, onDelete }: BiometricsModalProps) {
  const [measurementType, setMeasurementType] = useState("")
  const [measurementValue, setMeasurementValue] = useState("")

  // Initialize state when initialData changes or modal opens
  useState(() => {
    if (mode === 'edit' && initialData) {
      // Intentar mapear el tipo basado en el nombre (que viene en español/capitalizado desde la lista)
      // La lista muestra "bio.name", debemos buscar el "value" correspondiente en measurementTypes
      const foundType = measurementTypes.find(t => t.label.toLowerCase() === initialData.name.toLowerCase())
      if (foundType) {
        setMeasurementType(foundType.value)
      }
      setMeasurementValue(initialData.value.toString())
    } else {
      setMeasurementType("")
      setMeasurementValue("")
    }
  })

  // Effect to update state when opening in edit mode
  if (isOpen && mode === 'edit' && initialData && measurementValue === "" && measurementType === "") {
    const foundType = measurementTypes.find(t => t.label.toLowerCase() === initialData.name.toLowerCase())
    if (foundType) {
      setMeasurementType(foundType.value)
    }
    setMeasurementValue(initialData.value.toString())
  }

  // measurementTypes moved to top level scope

  const handleSave = () => {
    const selectedType = measurementTypes.find(t => t.value === measurementType)
    if (selectedType && measurementValue) {
      onSave({
        name: selectedType.label,
        value: parseFloat(measurementValue),
        unit: selectedType.unit
      })
      // Close handled by parent often, but we can reset
    }
  }

  const selectedType = measurementTypes.find(type => type.value === measurementType)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[350px] mx-auto bg-[#1A1C1F] border border-white/10 text-white max-h-[85vh] overflow-y-auto p-0 rounded-3xl shadow-2xl">
        <DialogHeader className="p-4 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Heart className="h-4 w-4 text-[#FF6A00]" />
            {mode === 'edit' ? 'Editar biometría' : 'Registrar'}
          </DialogTitle>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </DialogHeader>

        <div className="p-4 space-y-5">
          {/* Tipo de medición */}
          <div className="space-y-1.5">
            <Label htmlFor="measurement" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Tipo
            </Label>
            <Select value={measurementType} onValueChange={setMeasurementType}>
              <SelectTrigger className="bg-[#0F1012] border-white/10 text-white h-10 rounded-xl text-sm focus:ring-[#FF6A00]/50 focus:border-[#FF6A00]/50">
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1C1F] border-white/10 text-white rounded-xl z-[100]">
                {measurementTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white focus:bg-white/10 focus:text-white cursor-pointer text-sm">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor de la medición */}
          <div className={`space-y-1.5 transition-all duration-300 ${measurementType ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <Label htmlFor="value" className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
              Valor
            </Label>
            <div className="flex gap-2">
              <Input
                id="value"
                type="number"
                placeholder="0"
                value={measurementValue}
                onChange={(e) => setMeasurementValue(e.target.value)}
                className="bg-[#0F1012] border-white/10 text-white h-10 rounded-xl focus-visible:ring-[#FF6A00]/50 focus-visible:border-[#FF6A00]/50 flex-1 text-base font-semibold px-3"
              />
              <div className="bg-white/5 border border-white/10 px-3 rounded-xl text-gray-400 font-medium flex items-center justify-center min-w-[50px] text-sm">
                {selectedType?.unit || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 bg-white/5 flex gap-2">
          {mode === 'edit' && onDelete && (
            <Button
              variant="ghost"
              onClick={onDelete}
              className="h-10 w-10 p-0 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 mr-auto"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={onClose}
            className={`h-10 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 ${mode === 'edit' ? 'flex-1' : 'flex-1'}`}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!measurementType || !measurementValue}
            className={`h-10 rounded-xl bg-[#FF6A00] hover:bg-[#FF6A00]/90 text-white font-semibold shadow-lg shadow-[#FF6A00]/20 disabled:opacity-50 ${mode === 'edit' ? 'flex-[2]' : 'flex-1'}`}
          >
            {mode === 'edit' ? 'Actualizar' : 'Guardar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}



























































































































































































































































