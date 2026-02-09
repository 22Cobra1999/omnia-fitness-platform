"use client"

import { cn } from "@/lib/utils/utils"
import { Search, X } from "lucide-react"

interface StatusFilterBarProps {
    activeTab: "en-curso" | "por-empezar" | "finalizadas"
    onTabChange: (tab: "en-curso" | "por-empezar" | "finalizadas") => void
    countMap?: {
        "en-curso"?: number
        "por-empezar"?: number
        "finalizadas"?: number
    }
    isSearchOpen: boolean
    onToggleSearch: () => void
}

export function StatusFilterBar({ activeTab, onTabChange, countMap, isSearchOpen, onToggleSearch }: StatusFilterBarProps) {
    const tabs = [
        { id: "en-curso", label: "En curso" },
        { id: "por-empezar", label: "Por empezar" },
        { id: "finalizadas", label: "Finalizadas" }
    ] as const

    return (
        <div className="flex items-center justify-between px-6 pt-2 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mask-linear-fade flex-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id
                    const count = countMap?.[tab.id] || 0

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                                isActive
                                    ? "border-[#FF6A1A] text-[#FF6A1A] bg-[#FF6A1A]/10 shadow-[0_0_10px_rgba(255,106,26,0.2)]"
                                    : "bg-black/40 text-gray-400 border-white/10 hover:bg-white/5 hover:border-white/20"
                            )}
                        >
                            <span>{tab.label}</span>
                            {count > 0 && (
                                <span className={cn(
                                    "flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px]",
                                    isActive ? "bg-[#FF6A1A] text-white" : "bg-white/10 text-gray-300"
                                )}>
                                    {count}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            <button
                onClick={onToggleSearch}
                className={cn(
                    "ml-3 p-2.5 rounded-full border transition-all shrink-0",
                    isSearchOpen
                        ? "bg-[#FF6A1A] text-white border-[#FF6A1A]"
                        : "bg-black/40 text-gray-400 border-white/10 hover:bg-white/5"
                )}
            >
                {isSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
        </div>
    )
}
