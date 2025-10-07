"use client"

import React from 'react'
import Image from 'next/image'
import { CheckCircle } from 'lucide-react'

interface Coach {
  id: string
  name?: string
  full_name?: string
  avatar?: string
  avatar_url?: string
  specialization?: string
  specialty?: string
  rating?: number
  experience_years?: number
  experienceYears?: number
  certifications_count?: number
  certifications?: any[]
  products_count?: number
  activities?: number | any[]
  verified?: boolean
  [key: string]: any // Para flexibilidad con diferentes tipos de coach
}

interface CoachCardProps {
  coach: Coach
  size?: 'horizontal' | 'vertical'
  onClick?: (coach: Coach) => void
}

export default function CoachCard({ coach, size = 'horizontal', onClick }: CoachCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(coach)
    }
  }

  const getCoachName = () => coach.full_name || coach.name || 'Coach'
  const getCoachAvatar = () => coach.avatar_url || coach.avatar || "/placeholder.svg?height=48&width=48&query=coach"
  const getCoachSpecialization = () => coach.specialization || coach.specialty || ''
  const getCoachRating = () => coach.rating || 0
  const getCoachExperience = () => coach.experience_years || coach.experienceYears || 0
  const getCoachCertifications = () => coach.certifications_count || (coach.certifications ? coach.certifications.length : 0)
  const getCoachProducts = () => {
    if (coach.products_count) return coach.products_count
    if (Array.isArray(coach.activities)) return coach.activities.length
    return coach.activities || 0
  }

  const cardClasses = size === 'horizontal' 
    ? "w-80 flex-shrink-0 cursor-pointer group"
    : "w-full cursor-pointer group"

  return (
    <div className={cardClasses} onClick={handleClick}>
      <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-800/50 hover:border-orange-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-orange-500/10 h-[140px] flex flex-col">
        {/* Background Image - Blurred */}
        {getCoachAvatar() && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${getCoachAvatar()})`,
              filter: 'blur(4px)',
              transform: 'scale(1.1)'
            }}
          />
        )}
        
        {/* Dark Overlay - Más transparente para mostrar el fondo difuminado */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 to-black/70" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Row 1 - Profile Picture, Name (orange), @username (white), Specialization */}
          <div className="flex items-start p-3 pb-2">
            {/* Profile Picture */}
            <div className="relative mr-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-r from-orange-400 to-orange-600 p-0.5">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-900">
                  <Image
                    src={getCoachAvatar()}
                    alt={getCoachName()}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-600 rounded-full p-0.5">
                <CheckCircle className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            
            {/* Name (orange), Handle (white), and Specialization */}
            <div className="flex-1">
              <h3 className="text-orange-500 font-bold text-base leading-tight mb-1">
                {getCoachName()}
              </h3>
              <p className="text-white text-xs mb-2">
                @{getCoachName().toLowerCase().replace(/\s+/g, '')}
              </p>
              {/* Specialization below name - separated by commas */}
              {getCoachSpecialization() && (
                <div className="flex flex-wrap gap-1">
                  {getCoachSpecialization().split(',').map((spec: string, index: number) => (
                    <div key={index} className="bg-orange-500/20 text-orange-400 text-xs font-medium px-2 py-1 rounded-full border border-orange-500/30">
                      {spec.trim()}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>

          {/* Row 2 - Rating, Experience, Certifications, Products (gray/black frame, orange icons, white text) */}
          <div className="flex flex-wrap gap-1.5 px-3 pb-3">
            {/* Rating */}
            <div className="bg-gray-800/50 text-white text-xs font-medium px-2 py-1 rounded-full border border-gray-700/50 flex items-center space-x-1">
              <svg className="w-2.5 h-2.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>{getCoachRating().toFixed(1)}</span>
            </div>

            {/* Experience */}
            <div className="bg-gray-800/50 text-white text-xs font-medium px-2 py-1 rounded-full border border-gray-700/50 flex items-center space-x-1">
              <svg className="w-2.5 h-2.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{getCoachExperience()} años</span>
            </div>

            {/* Certifications */}
            <div className="bg-gray-800/50 text-white text-xs font-medium px-2 py-1 rounded-full border border-gray-700/50 flex items-center space-x-1">
              <svg className="w-2.5 h-2.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              <span>{getCoachCertifications()} cert.</span>
            </div>

            {/* Products */}
            <div className="bg-gray-800/50 text-white text-xs font-medium px-2 py-1 rounded-full border border-gray-700/50 flex items-center space-x-1">
              <svg className="w-2.5 h-2.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>{getCoachProducts()} prod.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
