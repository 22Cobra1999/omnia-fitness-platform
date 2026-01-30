import React from "react"
import { Flame } from "lucide-react"

interface OmniaLoaderProps {
    className?: string
    message?: string
}

export function OmniaLoader({
    className = "",
    message = "Cargando"
}: OmniaLoaderProps) {
    return (
        <div className={`flex flex-col items-center justify-center min-h-screen bg-[#0F1012] ${className}`}>
            {/* Fuego difuminado naranja */}
            <div className="relative flex items-center justify-center w-[120px] h-[120px]">
                {/* Fuego con blur/difuminado */}
                <div className="absolute blur-[20px] opacity-60 scale-[1.5]">
                    <Flame
                        size={80}
                        color="#FF7939"
                        fill="#FF7939"
                    />
                </div>
                {/* Fuego principal (más nítido) */}
                <div className="relative z-10">
                    <Flame
                        size={120}
                        color="#FF7939"
                        fill="#FF7939"
                        className="animate-pulse"
                    />
                </div>
            </div>

            {/* Texto "Cargando" */}
            <div className="text-[18px] font-semibold color-[#FF7939] text-center mt-[-10px]" style={{ color: '#FF7939' }}>
                {message}
            </div>
        </div>
    )
}
