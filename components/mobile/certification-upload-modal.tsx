"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  X, 
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Trash2,
  Eye
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { motion, AnimatePresence } from "framer-motion"

interface CertificationUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (certification: any) => void
  editingCertification?: any | null
}

export function CertificationUploadModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  editingCertification 
}: CertificationUploadModalProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [certificationName, setCertificationName] = useState("")
  const [issuer, setIssuer] = useState("")
  const [year, setYear] = useState(new Date().getFullYear().toString())
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Cargar datos de edición cuando se abre el modal
  useEffect(() => {
    if (editingCertification && isOpen) {
      setCertificationName(editingCertification.name || "")
      setIssuer(editingCertification.issuer || "")
      setYear(editingCertification.year || new Date().getFullYear().toString())
      setPreviewUrl(editingCertification.file_url || null)
      setSelectedFile(null) // No hay archivo seleccionado en edición
    } else if (!editingCertification && isOpen) {
      // Resetear formulario para nueva certificación
      setCertificationName("")
      setIssuer("")
      setYear(new Date().getFullYear().toString())
      setSelectedFile(null)
      setPreviewUrl(null)
    }
  }, [editingCertification, isOpen])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (file.type !== 'application/pdf') {
      toast({
        title: "Error",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      })
      return
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "El archivo es demasiado grande. Máximo 10MB",
        variant: "destructive",
      })
      return
    }

    setSelectedFile(file)
    
    // Crear preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleSubmit = async () => {
    if (!certificationName.trim() || !issuer.trim() || !year.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    // Para nueva certificación, se requiere archivo
    if (!editingCertification && !selectedFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo PDF",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      if (editingCertification) {
        // Actualizar certificación existente
        const response = await fetch(`/api/coach/upload-certification`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            certification_id: editingCertification.id,
            certification_name: certificationName,
            issuer,
            year,
            file: selectedFile ? await fileToBase64(selectedFile) : null
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al actualizar la certificación')
        }

        onSuccess(data.certification)
        toast({
          title: "¡Actualizado exitosamente!",
          description: "Tu certificación ha sido actualizada",
        })
      } else {
        // Subir nueva certificación
        const formData = new FormData()
        formData.append('file', selectedFile!)
        formData.append('certification_name', certificationName)
        formData.append('issuer', issuer)
        formData.append('year', year)

        const response = await fetch('/api/coach/upload-certification', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Error al subir la certificación')
        }

        onSuccess(data.certification)
        toast({
          title: "¡Subido exitosamente!",
          description: "Tu certificación ha sido subida y está pendiente de verificación",
        })
      }
      
      handleClose()

    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al procesar la certificación",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Función auxiliar para convertir archivo a base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleClose = () => {
    setCertificationName("")
    setIssuer("")
    setYear(new Date().getFullYear().toString())
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#1A1A1A] rounded-2xl w-full max-w-md border border-gray-800 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileText className="h-6 w-6 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {editingCertification ? 'Editar Certificación' : 'Subir Certificación'}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Nombre de la certificación */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nombre de la certificación
                </label>
                <Input
                  value={certificationName}
                  onChange={(e) => setCertificationName(e.target.value)}
                  placeholder="Ej: Certificado en Entrenamiento Personal"
                  className="bg-[#2A2A2A] border-gray-600 text-white"
                />
              </div>

              {/* Emisor */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Institución emisora
                </label>
                <Input
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="Ej: NSCA, ISSN, Yoga Alliance"
                  className="bg-[#2A2A2A] border-gray-600 text-white"
                />
              </div>

              {/* Año */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Año de obtención
                </label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="bg-[#2A2A2A] border-gray-600 text-white"
                />
              </div>

              {/* Subida de archivo */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Archivo PDF
                </label>
                
                {!selectedFile ? (
                  <div
                    className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-gray-500 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-400 mb-1">Haz clic para seleccionar un archivo PDF</p>
                    <p className="text-sm text-gray-500">Máximo 10MB</p>
                  </div>
                ) : (
                  <div className="bg-[#2A2A2A] rounded-lg p-4 border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-white font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (previewUrl) {
                              window.open(previewUrl, '_blank')
                            }
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedFile(null)
                            if (previewUrl) {
                              URL.revokeObjectURL(previewUrl)
                              setPreviewUrl(null)
                            }
                            if (fileInputRef.current) {
                              fileInputRef.current.value = ""
                            }
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Información adicional */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-1">Información importante:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Solo se aceptan archivos PDF</li>
                      <li>• Tamaño máximo: 10MB</li>
                      <li>• Tu certificación será revisada por nuestro equipo</li>
                      <li>• Una vez verificada, aparecerá en tu perfil</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botones */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || (!editingCertification && !selectedFile) || !certificationName.trim() || !issuer.trim()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingCertification ? 'Actualizando...' : 'Subiendo...'}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {editingCertification ? 'Actualizar Certificación' : 'Subir Certificación'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
