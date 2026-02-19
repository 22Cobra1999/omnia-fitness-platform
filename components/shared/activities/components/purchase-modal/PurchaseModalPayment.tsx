import React from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PurchaseModalPaymentProps {
    paymentMethod: string
    setPaymentMethod: (method: string) => void
}

export const PurchaseModalPayment: React.FC<PurchaseModalPaymentProps> = ({
    paymentMethod,
    setPaymentMethod,
}) => {
    return (
        <div className="space-y-2">
            <Label htmlFor="payment-method">Método de pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment-method" className="bg-[#2A2A2A] border-gray-700">
                    <SelectValue placeholder="Seleccionar método de pago" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A2A2A] border-gray-700 text-white">
                    <SelectItem value="mercadopago" className="font-semibold">
                        💳 Mercado Pago (Recomendado)
                    </SelectItem>
                    <SelectItem value="credit_card">Tarjeta de crédito</SelectItem>
                    <SelectItem value="debit_card">Tarjeta de débito</SelectItem>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia bancaria</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
            </Select>
            {paymentMethod === 'mercadopago' && (
                <p className="text-xs text-gray-400 mt-1">
                    Serás redirigido a Mercado Pago para completar el pago de forma segura
                </p>
            )}
        </div>
    )
}
