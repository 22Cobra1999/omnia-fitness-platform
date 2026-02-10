"use client"

import React from 'react'

interface ActivityRingProps {
    progress: number
    color: string
    size?: number
}

export const ActivityRing = ({ progress, color, size = 36 }: ActivityRingProps) => {
    const safeProgress = isNaN(progress) || !isFinite(progress) ? 0 : Math.max(0, Math.min(100, progress))
    const radius = (size - 8) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDasharray = circumference
    const strokeDashoffset = circumference - (safeProgress / 100) * circumference

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(75, 85, 99, 0.3)"
                    strokeWidth="2"
                    fill="none"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 ease-out"
                    style={{
                        filter: `drop-shadow(0 0 3px ${color}40)`
                    }}
                />
            </svg>
        </div>
    )
}
