import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, X, Plus } from "lucide-react"

interface BiometricsModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'edit' | 'register' // 'edit' para editar, 'register' para registrar nueva medición
}

export function BiometricsModal({ isOpen, onClose, mode }: BiometricsModalProps) {
  const [measurementType, setMeasurementType] = useState("")
  const [measurementValue, setMeasurementValue] = useState("")
  const [measurementUnit, setMeasurementUnit] = useState("")

  const measurementTypes = [
    { value: "pecho", label: "Pecho", unit: "cm" },
    { value: "cintura", label: "Cintura", unit: "cm" },
    { value: "cadera", label: "Cadera", unit: "cm" },
    { value: "brazo", label: "Brazo", unit: "cm" },
    { value: "muslo", label: "Muslo", unit: "cm" },
    { value: "peso", label: "Peso", unit: "kg" },
    { value: "grasa_corporal", label: "Grasa Corporal", unit: "%" },
    { value: "musculo", label: "Músculo", unit: "kg" },
    { value: "agua", label: "Agua Corporal", unit: "%" },
    { value: "hueso", label: "Masa Ósea", unit: "kg" }
  ]

  const handleSave = () => {
    // Aquí guardarías la medición
    console.log("Medición guardada:", { measurementType, measurementValue, measurementUnit })
    onClose()
  }

  const selectedType = measurementTypes.find(type => type.value === measurementType)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[400px] mx-auto bg-[#1A1C1F] border-gray-700 text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
            <Heart className="h-5 w-5 text-[#FF6A00]" />
            {mode === 'edit' ? 'Editar Mediciones' : 'Registrar Medición'}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo de medición */}
          <div className="space-y-2">
            <Label htmlFor="measurement" className="text-white font-medium">
              Tipo de medición
            </Label>
            <Select value={measurementType} onValueChange={setMeasurementType}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Selecciona una medición" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {measurementTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="text-white">
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor de la medición */}
          {measurementType && (
            <div className="space-y-2">
              <Label htmlFor="value" className="text-white font-medium">
                Valor
              </Label>
              <div className="flex gap-2">
                <Input
                  id="value"
                  type="number"
                  placeholder="0"
                  value={measurementValue}
                  onChange={(e) => setMeasurementValue(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white flex-1"
                />
                <div className="bg-gray-700 px-3 py-2 rounded-md text-gray-300 text-sm flex items-center">
                  {selectedType?.unit}
                </div>
              </div>
            </div>
          )}

          {/* Información adicional según el tipo */}
          {measurementType && (
            <div className="bg-gray-800 p-3 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">Información:</p>
              {measurementType === "pecho" && (
                <p className="text-xs text-gray-400">• Mide alrededor del pecho, a la altura de los pezones</p>
              )}
              {measurementType === "cintura" && (
                <p className="text-xs text-gray-400">• Mide alrededor de la cintura, a la altura del ombligo</p>
              )}
              {measurementType === "cadera" && (
                <p className="text-xs text-gray-400">• Mide alrededor de la cadera, en la parte más ancha</p>
              )}
              {measurementType === "brazo" && (
                <p className="text-xs text-gray-400">• Mide alrededor del brazo, en la parte más ancha</p>
              )}
              {measurementType === "muslo" && (
                <p className="text-xs text-gray-400">• Mide alrededor del muslo, en la parte más ancha</p>
              )}
              {measurementType === "peso" && (
                <p className="text-xs text-gray-400">• Pésate en ayunas, sin ropa, a la misma hora</p>
              )}
              {measurementType === "grasa_corporal" && (
                <p className="text-xs text-gray-400">• Usa una báscula de bioimpedancia o calibrador</p>
              )}
              {measurementType === "musculo" && (
                <p className="text-xs text-gray-400">• Masa muscular total del cuerpo</p>
              )}
              {measurementType === "agua" && (
                <p className="text-xs text-gray-400">• Porcentaje de agua corporal total</p>
              )}
              {measurementType === "hueso" && (
                <p className="text-xs text-gray-400">• Masa ósea total del cuerpo</p>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              Estos datos no reemplazan consejo médico. Consulta siempre con un profesional de la salud.
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!measurementType || !measurementValue}
            className="flex-1 bg-[#FF6A00] hover:bg-[#FF8C42] text-white"
          >
            {mode === 'edit' ? 'Actualizar' : 'Registrar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}



























































































































































































































































