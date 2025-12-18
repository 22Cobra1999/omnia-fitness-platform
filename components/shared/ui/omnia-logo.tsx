"use client"

import React from 'react'

interface OmniaLogoProps {
  width?: number
  height?: number
  className?: string
  variant?: 'default' | 'bubbly' | 'simple' | 'original'
}

export function OmniaLogo({ 
  width = 200, 
  height = 80, 
  className = "",
  variant = 'default' 
}: OmniaLogoProps) {
  const getLogoSrc = () => {
    switch (variant) {
      case 'bubbly':
        return '/omnia-logo-3d-bubbly.svg'
      case 'simple':
        return '/omnia-logo-3d.svg'
      case 'original':
        return '/omnia-logo-original.svg'
      default:
        return '/omnia-logo-original.svg'
    }
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={getLogoSrc()} 
        alt="Omnia" 
        width={width} 
        height={height}
        className="drop-shadow-lg"
      />
    </div>
  )
}

// Componente de texto para usar en CSS - Nuevo diseño tipográfico
export function OmniaLogoText({ 
  className = "",
  size = 'text-2xl'
}: { 
  className?: string
  size?: string 
}) {
  return (
    <span 
      className={`font-bold ${size} ${className}`}
      style={{
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        letterSpacing: '0.02em',
        fontWeight: '700',
        color: '#FF6A1A',
        textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        lineHeight: '1.1'
      }}
    >
      omnia
    </span>
  )
}

// Componente con efecto CSS 3D
export function OmniaLogo3D({ 
  className = "",
  size = 'text-3xl'
}: { 
  className?: string
  size?: string 
}) {
  return (
    <div className={`${className}`}>
      <span 
        className={`${size} font-black font-sans relative inline-block`}
        style={{
          textShadow: `
            0 1px 0 #ff6b35,
            0 2px 0 #ff5722,
            0 3px 0 #ff5722,
            0 4px 0 #ff5722,
            0 5px 10px rgba(0,0,0,0.3),
            0 6px 20px rgba(0,0,0,0.2)
          `,
          background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 50%, #ff6b35 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
        }}
      >
        OMNIA
      </span>
    </div>
  )
}
