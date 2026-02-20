import React from "react"
import { motion } from "framer-motion"
import type { PersonalBest } from "../goals-progress-data"

interface PersonalBestCardProps {
    best: PersonalBest
}

export const PersonalBestCard = ({ best }: PersonalBestCardProps) => {
    return (
        <motion.div
            className="bg-[#141414] rounded-xl p-3 shadow-md border border-white/5"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <div className="flex items-center">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${best.color}20`, color: best.color }}
                >
                    <best.icon className="w-4 h-4" />
                </div>

                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-medium text-white">{best.name}</h3>
                        <div className="flex items-baseline">
                            <span className="text-[1.3rem] font-bold text-white">{best.value}</span>
                            <span className="text-[10px] text-gray-400 ml-1">{best.unit}</span>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <span className="text-[10px] font-medium text-gray-400">{best.date}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
