import React from "react"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PurchaseModalStatusProps {
    isCheckingEnrollment: boolean
    isAlreadyEnrolled: boolean
    isComplete: boolean
    activityTitle: string
    transactionDetails: {
        transactionId: string
        invoiceNumber: string
    } | null
    handleGoToActivity: () => void
    setIsAlreadyEnrolled: (enrolled: boolean) => void
}

export const PurchaseModalStatus: React.FC<PurchaseModalStatusProps> = ({
    isCheckingEnrollment,
    isAlreadyEnrolled,
    isComplete,
    activityTitle,
    transactionDetails,
    handleGoToActivity,
    setIsAlreadyEnrolled,
}) => {
    if (isCheckingEnrollment) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF7939]" />
                <p className="mt-2 text-center text-sm text-gray-400">Verificando estado...</p>
            </div>
        )
    }

    if (isAlreadyEnrolled) {
        return (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="rounded-full bg-blue-500/20 p-3">
                    <AlertCircle className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-xl font-medium text-center">Ya tienes este producto</h3>
                <p className="text-center text-gray-400">
                    Ya has comprado esta actividad anteriormente. Puedes comprarla nuevamente si lo deseas.
                </p>
                <div className="flex gap-2">
                    <Button onClick={handleGoToActivity} variant="outline" className="border-gray-700">
                        Ver actividad actual
                    </Button>
                    <Button onClick={() => setIsAlreadyEnrolled(false)} className="bg-[#FF7939] hover:bg-[#E66829]">
                        Comprar de nuevo
                    </Button>
                </div>
            </div>
        )
    }

    if (isComplete) {
        return (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="rounded-full bg-green-500/20 p-3">
                    <CheckCircle2 className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-xl font-medium text-center">¡Compra completada!</h3>
                <p className="text-center text-gray-400">Has adquirido "{activityTitle}" correctamente.</p>
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
        )
    }

    return null
}
