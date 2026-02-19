import React from "react"
import { DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, CreditCard } from "lucide-react"

interface PurchaseModalActionsProps {
    handleClose: () => void
    handlePurchase: () => void
    isProcessing: boolean
    price: number
}

export const PurchaseModalActions: React.FC<PurchaseModalActionsProps> = ({
    handleClose,
    handlePurchase,
    isProcessing,
    price,
}) => {
    return (
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
                        Comprar ahora (${price})
                    </>
                )}
            </Button>
        </DialogFooter>
    )
}
