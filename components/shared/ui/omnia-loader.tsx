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
            {/* Fuego (logo animado) */}
            <div className="relative flex items-center justify-center w-[120px] h-[120px]">
                {/* Fuego principal (más nítido) */}
                <div className="relative z-10 transition-all duration-700">
                    <Flame
                        size={100}
                        color="#FF7939"
                        fill="#FF7939"
                        className="animate-soft-pulse drop-shadow-[0_0_15px_rgba(255,121,57,0.4)]"
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
