"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from '@/lib/supabase/supabase-client'
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CreditCard, CheckCircle2 } from "lucide-react"

interface Client {
  id: string
  name: string
  email: string
}

interface Activity {
  id: number
  title: string
  price: number
  coach_id: string
}

interface PurchaseCheckoutProps {
  client?: Client
  activity?: Activity
  onPurchaseComplete: () => void
}

export function PurchaseCheckout({ client, activity, onPurchaseComplete }: PurchaseCheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState("credit_card")
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  const handlePurchase = async () => {
    if (!client || !activity) {
      toast({
        title: "Error",
        description: "Seleccione un cliente y una actividad para continuar",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      // Generar un ID de transacción único
      const transactionId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`

      // Registrar la compra en la base de datos
      const { error } = await supabase.from("activity_enrollments").insert({
        activity_id: activity.id,
        client_id: client.id,
        amount_paid: activity.price,
        payment_method: paymentMethod,
        payment_status: "completed",
        status: "Active",
        transaction_id: transactionId,
        payment_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          notes: notes,
          purchase_type: "immediate",
          purchased_by_coach: true,
        },
      })

      if (error) throw error

      // Registrar la actividad reciente
      await supabase
        .from("recent_activities")
        .insert({
          user_id: client.id,
          activity_type: "purchase",
          description: `Compró "${activity.title}"`,
          metadata: {
            activity_id: activity.id,
            price: activity.price,
            transaction_id: transactionId,
          },
          created_at: new Date().toISOString(),
        })
        .catch((err) => console.error("Error al registrar actividad reciente:", err))

      setIsComplete(true)
      toast({
        title: "Compra exitosa",
        description: `${client.name} ha sido inscrito en "${activity.title}" correctamente.`,
        variant: "default",
      })

      // Esperar 2 segundos antes de llamar a onPurchaseComplete
      setTimeout(() => {
        onPurchaseComplete()
      }, 2000)
    } catch (error) {
      console.error("Error al procesar la compra:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar la compra. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!client || !activity) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          Seleccione un cliente y una actividad para continuar con la compra
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
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
          </>
        )}
      </CardContent>
      {!isComplete && (
        <CardFooter>
          <Button className="w-full" onClick={handlePurchase} disabled={isProcessing}>
            {isProcessing ? (
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
