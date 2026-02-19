import React from "react"
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface PurchaseModalHeaderProps {
    title: string
    handleClose: () => void
    isProcessing: boolean
}

export const PurchaseModalHeader: React.FC<PurchaseModalHeaderProps> = ({
    title,
    handleClose,
    isProcessing,
}) => {
    return (
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
            <DialogDescription className="text-gray-400">Comprar "{title}"</DialogDescription>
        </DialogHeader>
    )
}
