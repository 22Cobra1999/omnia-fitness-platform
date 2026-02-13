import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ActivityTag } from "../goals-progress-data"

interface ActivityTagCardProps {
    tag: ActivityTag
    isSelected: boolean
    onToggle: (id: string) => void
    onLog: (id: string) => void
}

export const ActivityTagCard = ({ tag, isSelected, onToggle, onLog }: ActivityTagCardProps) => {
    const formatPercentage = (value: number) => `${Math.round(value)}%`

    return (
        <div key={tag.id}>
            <motion.div
                className="bg-[#141414] rounded-xl p-3 shadow-md border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                onClick={() => onToggle(tag.id)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
            >
                <div className="flex items-center">
                    <div className="relative mr-3">
                        <svg className="w-10 h-10" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="15.5" fill="none" stroke={`${tag.color}20`} strokeWidth="3" />
                            <circle
                                cx="18"
                                cy="18"
                                r="15.5"
                                fill="none"
                                stroke={tag.color}
                                strokeWidth="3"
                                strokeDasharray="97.5"
                                strokeDashoffset={97.5 - (97.5 * tag.progress) / 100}
                                strokeLinecap="round"
                                transform="rotate(-90 18 18)"
                            />
                            <text
                                x="18"
                                y="18"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="white"
                                fontSize="8"
                                fontWeight="bold"
                            >
                                {formatPercentage(tag.progress)}
                            </text>
                        </svg>
                        <div
                            className="absolute top-0 left-0 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: tag.color }}
                        >
                            <tag.icon className="w-2.5 h-2.5 text-white" />
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-sm font-medium text-white">{tag.name}</h3>
                        <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-400">
                                {tag.current}/{tag.target} {tag.unit}
                            </span>
                            <button
                                className="ml-auto text-xs text-[#FF7939]"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onLog(tag.id)
                                }}
                            >
                                Log
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isSelected && tag.coachNotes && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-1 ml-4 pl-3 border-l-2 space-y-2"
                        style={{ borderColor: tag.color }}
                    >
                        {tag.coachNotes.map((note) => (
                            <div key={note.id} className="bg-[#1A1A1A] rounded-lg p-3 mt-2">
                                <div className="flex items-center mb-1">
                                    <Avatar className="h-5 w-5 mr-2">
                                        <AvatarImage src={note.coachAvatar || "/placeholder.svg"} alt={note.coachName} />
                                        <AvatarFallback className="text-[10px]">{note.coachName[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs font-medium text-white">C.{note.coachName}:</span>
                                    <span className="text-[10px] text-gray-400 ml-auto">{note.date}</span>
                                </div>
                                <p className="text-xs text-gray-300">{note.note}</p>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
