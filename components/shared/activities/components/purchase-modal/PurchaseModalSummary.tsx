import React from "react"
import Image from "next/image"

interface Activity {
    title: string
    price: number
    image_url?: string
    type?: string
    coach?: {
        full_name: string
    }
}

interface PurchaseModalSummaryProps {
    activity: Activity
}

export const PurchaseModalSummary: React.FC<PurchaseModalSummaryProps> = ({
    activity,
}) => {
    return (
        <div className="space-y-4">
            {activity.image_url && (
                <div className="rounded-md overflow-hidden h-40 w-full relative">
                    <Image
                        src={activity.image_url || "/placeholder.svg"}
                        alt={activity.title}
                        fill
                        className="object-cover"
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
                    {activity.coach?.full_name && (
                        <div className="flex justify-between">
                            <span className="text-gray-400">Coach:</span>
                            <span className="font-medium">{activity.coach.full_name}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
