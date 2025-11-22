"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, X, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/supabase-client"

interface PurchaseSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  preferenceId?: string | null
  paymentId?: string | null
  activityId?: number | null
  onGoToActivity?: () => void
}

export function PurchaseSuccessModal({
  isOpen,
  onClose,
  preferenceId,
  paymentId,
  activityId,
  onGoToActivity
}: PurchaseSuccessModalProps) {
  const router = useRouter()
  const [activityTitle, setActivityTitle] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && activityId) {
      fetchActivityDetails()
    } else {
      setLoading(false)
    }
  }, [isOpen, activityId])

  const fetchActivityDetails = async () => {
    if (!activityId) {
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('activities')
        .select('title')
        .eq('id', activityId)
        .single()

      if (!error && data) {
        setActivityTitle(data.title)
      }
    } catch (error) {
      console.error('Error obteniendo detalles de actividad:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGoToActivity = () => {
    if (onGoToActivity) {
      onGoToActivity()
    } else if (activityId) {
      // Limpiar sessionStorage si existe
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pending_payment')
      }
      router.push(`/activities/${activityId}`)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#1A1A1A] text-white border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold">Compra exitosa</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6 space-y-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-gray-300 text-sm">
              Tu compra se ha procesado correctamente
            </p>
            {activityTitle && (
              <p className="text-white font-medium">
                {activityTitle}
              </p>
            )}
            <p className="text-gray-400 text-xs mt-2">
              Ver detalles en facturas de tu perfil
            </p>
          </div>

          <Button
            onClick={handleGoToActivity}
            className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white mt-4"
            size="lg"
          >
            Ir a actividad
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

