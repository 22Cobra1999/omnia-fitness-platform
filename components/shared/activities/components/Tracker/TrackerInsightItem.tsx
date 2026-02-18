import React from "react"
import { LucideIcon } from "lucide-react"

interface TrackerInsightItemProps {
    title: string
    description: string
    icon: LucideIcon
    color: string
}

export function TrackerInsightItem({
    title,
    description,
    icon: Icon,
    color
}: TrackerInsightItemProps) {
    return (
        <div className="p-4 rounded-lg" style={{ backgroundColor: `${color}10` }}>
            <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <div>
                    <h4 className="font-medium text-sm mb-1">{title}</h4>
                    <p className="text-sm text-gray-400">{description}</p>
                </div>
            </div>
        </div>
    )
}
