import React from "react"
import { Flame } from "lucide-react"

interface OmniaLoaderProps {
    className?: string
    message?: string
}

export function OmniaLoader({
    className = ""
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
                        className="animate-soft-pulse"
                    />
                </div>
            </div>

            <style jsx global>{`
                @keyframes soft-pulse {
                    0%, 100% { opacity: 0.8; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(0.98); }
                }
                .animate-soft-pulse {
                    animation: soft-pulse 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}
