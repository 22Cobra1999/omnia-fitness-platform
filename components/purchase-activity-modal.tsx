"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CreditCard, CheckCircle2, AlertCircle, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface Activity {
  id: number
  title: string
  price: number
  description?: string
  image_url?: string
  type?: string
  coach?: {
    id: string
    full_name: string
  }
  coach_id?: string
}

interface PurchaseActivityModalProps {
  isOpen: boolean
  onClose: () => void
  activity: Activity | null
  onPurchaseComplete?: (enrollment: any) => void
}

export function PurchaseActivityModal({ isOpen, onClose, activity, onPurchaseComplete }: PurchaseActivityModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("credit_card")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(false)
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false)
  const [transactionDetails, setTransactionDetails] = useState<{
    transactionId: string
    invoiceNumber: string
  } | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (isOpen && activity) {
      console.log("Modal abierto para actividad:", activity)
      // Resetear estado cuando se abre el modal
      setIsComplete(false)
      setIsAlreadyEnrolled(false)
      setTransactionDetails(null)
      setNotes("")
      setPaymentMethod("credit_card")
      setIsProcessing(false)

      // Verificar si el usuario ya está inscrito
      checkEnrollment()
    }
  }, [isOpen, activity])

  const checkEnrollment = async () => {
    if (!activity) return

    setIsCheckingEnrollment(true)
    try {
      console.log("Verificando inscripción para actividad:", activity.id)

      const response = await fetch(`/api/check-enrollment?activityId=${activity.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log("Resultado verificación:", data)

        if (data.isEnrolled) {
          setIsAlreadyEnrolled(true)
          toast({
            title: "Ya tienes este producto",
            description: "Ya has comprado esta actividad anteriormente.",
            variant: "default",
          })
        }
      }
    } catch (error) {
      console.error("Error al verificar inscripción:", error)
    } finally {
      setIsCheckingEnrollment(false)
    }
  }

  const handlePurchase = async () => {
    if (!activity) {
      console.error("No hay actividad seleccionada")
      return
    }

    setIsProcessing(true)
    console.log("Iniciando proceso de compra:", {
      activityId: activity.id,
      paymentMethod,
      notes,
    })

    try {
      // Mostrar toast de inicio
      toast({
        title: "Procesando compra",
        description: "Estamos procesando tu compra...",
      })

      const response = await fetch("/api/enrollments/direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activityId: activity.id,
          paymentMethod,
          notes: notes || "Compra desde la aplicación móvil",
        }),
      })

      console.log("Respuesta del servidor:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en respuesta:", errorText)

        let errorMessage = "No se pudo procesar la compra"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // Si no es JSON válido, usar el texto como está
          errorMessage = errorText.substring(0, 100)
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("Datos de respuesta:", result)

      if (result.success) {
        setIsComplete(true)
        setTransactionDetails({
          transactionId: result.transactionId || `TRX-${Date.now()}`,
          invoiceNumber: result.invoiceNumber || `INV-${Date.now()}`,
        })

        toast({
          title: "¡Compra exitosa!",
          description: `Has adquirido "${activity.title}" correctamente.`,
          variant: "default",
        })

        // Llamar al callback si existe
        if (onPurchaseComplete && result.enrollment) {
          onPurchaseComplete(result.enrollment)
        }

        // Esperar un poco antes de redirigir para mostrar el mensaje de éxito
        setTimeout(() => {
          // Guardar información para navegación
          try {
            localStorage.setItem("return_to_activities", "true")
            localStorage.setItem("purchased_activity_id", activity.id.toString())
          } catch (e) {
            console.error("Error al guardar en localStorage:", e)
          }

          // Cerrar modal y redirigir
          onClose()
          router.push(`/activities/${activity.id}`)
        }, 2000)
      } else {
        throw new Error(result.error || "Error desconocido en la compra")
      }
    } catch (error) {
      console.error("Error al procesar la compra:", error)

      const errorMessage = error instanceof Error ? error.message : "Error desconocido"

      if (errorMessage.includes("Ya estás inscrito") || errorMessage.includes("already enrolled")) {
        setIsAlreadyEnrolled(true)
        toast({
          title: "Ya tienes este producto",
          description: "Ya has comprado esta actividad anteriormente.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error en la compra",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    if (!isProcessing) {
      onClose()
    }
  }

  const handleGoToActivity = () => {
    if (activity) {
      // Guardar información para navegación
      try {
        localStorage.setItem("return_to_activities", "true")
      } catch (e) {
        console.error("Error al guardar en localStorage:", e)
      }

      onClose()
      router.push(`/activities/${activity.id}`)
    }
  }

  if (!activity) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#1A1A1A] text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Finalizar compra</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full text-gray-400 hover:text-white"
              onClick={handleClose}
              disabled={isProcessing}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-gray-400">Comprar "{activity.title}"</DialogDescription>
        </DialogHeader>

        {isCheckingEnrollment ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[#FF7939]" />
            <p className="mt-2 text-center text-sm text-gray-400">Verificando estado...</p>
          </div>
        ) : isAlreadyEnrolled ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-blue-500/20 p-3">
              <AlertCircle className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-xl font-medium text-center">Ya tienes este producto</h3>
            <p className="text-center text-gray-400">Ya has comprado esta actividad anteriormente.</p>
            <Button onClick={handleGoToActivity} className="bg-[#FF7939] hover:bg-[#E66829]">
              Ver actividad
            </Button>
          </div>
        ) : isComplete ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-500/20 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-xl font-medium text-center">¡Compra completada!</h3>
            <p className="text-center text-gray-400">Has adquirido "{activity.title}" correctamente.</p>
            {transactionDetails && (
              <div className="bg-[#2A2A2A] p-4 rounded-lg w-full mt-4 text-sm">
                <p className="flex justify-between py-1">
                  <span className="text-gray-400">Transacción:</span>
                  <span className="font-medium">{transactionDetails.transactionId}</span>
                </p>
                <p className="flex justify-between py-1">
                  <span className="text-gray-400">Factura:</span>
                  <span className="font-medium">{transactionDetails.invoiceNumber}</span>
                </p>
              </div>
            )}
            <p className="text-sm text-gray-500 text-center">Redirigiendo a tu nueva actividad...</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {activity.image_url && (
                <div className="rounded-md overflow-hidden h-40 w-full">
                  <Image
                    src={activity.image_url || "/placeholder.svg"}
                    alt={activity.title}
                    width={400}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-medium">Resumen de la compra</h3>
                <div className="bg-[#2A2A2A] p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Producto:</span>
                    <span className="font-medium">{activity.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Precio:</span>
                    <span className="font-medium text-[#FF7939]">${activity.price}</span>
                  </div>
                  {activity.type && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tipo:</span>
                      <span className="font-medium">{activity.type}</span>
                    </div>
                  )}
                  {(activity.coach?.full_name || activity.coach_id) && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Coach:</span>
                      <span className="font-medium">{activity.coach?.full_name || "Coach"}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-method">Método de pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment-method" className="bg-[#2A2A2A] border-gray-700">
                    <SelectValue placeholder="Seleccionar método de pago" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A2A2A] border-gray-700 text-white">
                    <SelectItem value="credit_card">Tarjeta de crédito</SelectItem>
                    <SelectItem value="debit_card">Tarjeta de débito</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia bancaria</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isProcessing}
                className="border-gray-700 text-gray-300 hover:bg-[#2A2A2A] bg-transparent"
              >
                Cancelar
              </Button>
              <Button onClick={handlePurchase} disabled={isProcessing} className="bg-[#FF7939] hover:bg-[#E66829]">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Comprar ahora (${activity.price})
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
