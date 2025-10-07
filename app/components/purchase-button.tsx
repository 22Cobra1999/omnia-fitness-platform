"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { purchaseActivity } from "@/app/actions/purchase-activity"
import { useToast } from "@/hooks/use-toast"

interface PurchaseButtonProps {
  activityId: number
  clientId: string
  price: number
  buttonText?: string
  className?: string
}

export function PurchaseButton({
  activityId,
  clientId,
  price,
  buttonText = "Comprar Actividad",
  className = "",
}: PurchaseButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handlePurchase = async () => {
    setIsLoading(true)

    try {
      const result = await purchaseActivity({
        activityId,
        buyerClientId: clientId,
        price,
        metadata: {
          notes: "Compra desde la página de actividad",
          timestamp: new Date().toISOString(),
        },
      })

      if (result.success) {
        toast({
          title: "¡Compra exitosa!",
          description: "Te has inscrito correctamente en esta actividad.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error en la compra",
          description: result.error || "No se pudo completar la compra",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al procesar tu compra",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handlePurchase} disabled={isLoading} className={className}>
      {isLoading ? "Procesando..." : buttonText}
    </Button>
  )
}
