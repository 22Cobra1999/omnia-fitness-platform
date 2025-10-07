"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/utils/formatDate"

interface PurchaseSummaryProps {
  enrollmentId: number
  onClose?: () => void
}

interface Enrollment {
  id: number
  status: string
  progress: number
  amount_paid: number
  payment_status: string
  payment_method: string
  transaction_id: string
  invoice_number: string
  created_at: string
  activities: {
    id: number
    title: string
    description: string
    image_url?: string
    price: number
    coach_id: string
  }
}

export function PurchaseSummary({ enrollmentId, onClose }: PurchaseSummaryProps) {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/enrollments/${enrollmentId}`)
        const data = await response.json()

        if (response.ok && data.success) {
          setEnrollment(data.enrollment)
        } else {
          setError(data.error || "No se pudo cargar la información de la compra")
          toast({
            title: "Error",
            description: data.error || "No se pudo cargar la información de la compra",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error al cargar la inscripción:", error)
        setError("Error al cargar la información de la compra")
        toast({
          title: "Error",
          description: "Error al cargar la información de la compra",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (enrollmentId) {
      fetchEnrollment()
    }
  }, [enrollmentId, toast])

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-2 text-center text-sm text-muted-foreground">Cargando detalles de la compra...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !enrollment) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-destructive/20 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-medium text-center">Error</h3>
            <p className="text-center text-muted-foreground">{error || "No se pudo cargar la información"}</p>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-center mb-4">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <CardTitle className="text-center">¡Compra completada!</CardTitle>
        <CardDescription className="text-center">
          Te has inscrito exitosamente en {enrollment.activities.title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-accent p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Actividad:</span>
              <span className="font-medium">{enrollment.activities.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio:</span>
              <span className="font-medium">${enrollment.amount_paid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estado:</span>
              <span className="font-medium capitalize">{enrollment.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span className="font-medium">{formatDate(enrollment.created_at)}</span>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="text-sm font-medium mb-2">Detalles de la transacción</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Método de pago:</span>
              <span className="font-medium capitalize">{enrollment.payment_method.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estado del pago:</span>
              <span className="font-medium capitalize">{enrollment.payment_status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transacción:</span>
              <span className="font-medium text-xs">{enrollment.transaction_id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Factura:</span>
              <span className="font-medium">{enrollment.invoice_number}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        )}
        <Button className="ml-auto">
          Ver mis actividades
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
