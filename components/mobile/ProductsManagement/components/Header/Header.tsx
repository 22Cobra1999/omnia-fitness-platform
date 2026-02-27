import React from 'react'
import { motion } from 'framer-motion'

interface HeaderProps {
    activeMainTab: 'products' | 'exercises' | 'storage'
    onTabChange: (tab: 'products' | 'exercises' | 'storage') => void
}

export const Header: React.FC<HeaderProps> = ({ activeMainTab, onTabChange }) => {
    const tabs = [
        { id: 'products', label: 'Productos' },
        { id: 'exercises', label: 'Ejercicios/Platos' },
        { id: 'storage', label: 'Almacenamiento' },
    ] as const

    return (
        <div className="mt-8 mb-10 w-full flex justify-center px-4">
            <div className="relative bg-[#1A1A1A]/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl flex items-center gap-1 shadow-2xl">
                {tabs.map((tab) => {
                    const isActive = activeMainTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id as any)}
                            className={`relative px-4 py-2 text-xs md:text-sm transition-all duration-300 rounded-xl z-20 ${isActive ? 'text-white font-bold' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabSelector"
                                    className="absolute inset-0 bg-[#FF7939] rounded-xl z-[-1]"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
