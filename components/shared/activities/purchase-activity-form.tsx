"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CreditCard, CheckCircle2 } from "lucide-react"
import { purchaseActivity } from "@/app/actions/purchase-activity"

interface Activity {
  id: number
  title: string
  price: number
  description: string
  image_url?: string
}

interface Client {
  id: string
  name: string
  email: string
}

interface PurchaseActivityFormProps {
  activity: Activity
  client: Client
  onSuccess?: (enrollmentId: number) => void
  onCancel?: () => void
}

export function PurchaseActivityForm({ activity, client, onSuccess, onCancel }: PurchaseActivityFormProps) {
  const [paymentMethod, setPaymentMethod] = useState("credit_card")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [transactionDetails, setTransactionDetails] = useState<{
    transactionId: string
    invoiceNumber: string
  } | null>(null)
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const activityId = activity.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      setError(null)

      // Usar el Server Action directamente
      const result = await purchaseActivity({
        activityId,
        paymentMethod,
        notes,
      })

      console.log("Resultado de la compra:", result)

      if (result.success) {
        // Compra exitosa
        setIsComplete(true)
        setTransactionDetails({
          transactionId: result.transactionId,
          invoiceNumber: result.invoiceNumber,
        })

        toast({
          title: "Compra exitosa",
          description: `${client.name} ha sido inscrito en "${activity.title}" correctamente.`,
          variant: "default",
        })

        // Esperar 2 segundos antes de llamar a onSuccess
        setTimeout(() => {
          if (onSuccess) onSuccess(result.enrollmentId)
        }, 2000)
      } else {
        setError(result.error || "Error al procesar la compra")
        toast({
          title: "Error",
          description: result.error || "No se pudo procesar la compra",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error al realizar la compra:", error)
      setError("Error de conexión al procesar la compra")
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Finalizar compra</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isComplete ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-medium text-center">¡Compra completada!</h3>
            <p className="text-center text-muted-foreground">
              {client.name} ha sido inscrito en "{activity.title}" correctamente.
            </p>
            {transactionDetails && (
              <div className="bg-accent p-4 rounded-lg w-full mt-4 text-sm">
                <p className="flex justify-between py-1">
                  <span className="text-muted-foreground">Transacción:</span>
                  <span className="font-medium">{transactionDetails.transactionId}</span>
                </p>
                <p className="flex justify-between py-1">
                  <span className="text-muted-foreground">Factura:</span>
                  <span className="font-medium">{transactionDetails.invoiceNumber}</span>
                </p>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h3 className="font-medium">Resumen de la compra</h3>
              <div className="bg-accent p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{client.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actividad:</span>
                  <span className="font-medium">{activity.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Precio:</span>
                  <span className="font-medium">${activity.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">Compra inmediata</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Método de pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="Seleccionar método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Tarjeta de crédito</SelectItem>
                  <SelectItem value="debit_card">Tarjeta de débito</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="transfer">Transferencia bancaria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Agregar notas sobre la compra..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            {error && <div className="p-4 rounded-md bg-red-100 text-red-500">{error}</div>}
          </>
        )}
      </CardContent>
      {!isComplete && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Completar compra (${activity.price})
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
