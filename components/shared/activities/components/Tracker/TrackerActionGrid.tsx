import React from "react"
import { motion } from "framer-motion"
import { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface TrackerAction {
    icon: LucideIcon
    label: string
    color: string
}

interface TrackerActionGridProps {
    actions: TrackerAction[]
    onActionClick: (label: string) => void
}

export function TrackerActionGrid({ actions, onActionClick }: TrackerActionGridProps) {
    return (
        <Card className="bg-[#1E1E1E] border-none">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-3 gap-4">
                    {actions.map((action, index) => (
                        <motion.button
                            key={index}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-4 rounded-lg flex flex-col items-center justify-center space-y-2"
                            style={{ backgroundColor: `${action.color}20` }}
                            onClick={() => onActionClick(action.label)}
                        >
                            <action.icon className="w-6 h-6" style={{ color: action.color }} />
                            <span className="text-sm font-medium">{action.label}</span>
                        </motion.button>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
