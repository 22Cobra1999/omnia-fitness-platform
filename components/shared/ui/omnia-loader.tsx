"use client"

import React from "react"
import { FlameIcon } from "./flame-icon"
import { OmniaLogoText } from "./omnia-logo"

interface OmniaLoaderProps {
    className?: string
    message?: string
    showText?: boolean
    size?: "sm" | "md" | "lg"
}

export function OmniaLoader({
    className = "",
    message = "Cargando...",
    showText = true,
    size = "md"
}: OmniaLoaderProps) {
    const flameSize = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-16 h-16" : "w-12 h-12"
    const textSize = size === "sm" ? "text-lg" : size === "lg" ? "text-4xl" : "text-2xl"

    return (
        <div className={`flex flex-col items-center justify-center space-y-4 p-8 animate-in fade-in duration-500 ${className}`}>
            <div className="relative">
                <div className="absolute inset-0 bg-[#FF7939]/20 blur-xl rounded-full scale-150 animate-pulse" />
                <FlameIcon
                    primaryColor="#FF7939"
                    secondaryColor="#FF6A1A"
                    centerColor="#FFFFFF"
                    className={`${flameSize} relative animate-bounce`}
                />
            </div>

            <div className="flex flex-col items-center space-y-1">
                <OmniaLogoText size={textSize} />
                {showText && message && (
                    <p className="text-gray-400 text-sm font-medium animate-pulse">
                        {message}
                    </p>
                )}
            </div>
        </div>
    )
}
