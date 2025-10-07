"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface GlobalLoadingProps {
  message?: string
  fullScreen?: boolean
}

export function GlobalLoading({ message = "Cargando...", fullScreen = true }: GlobalLoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="relative"
      >
        <Loader2 className="h-8 w-8 text-[#FF7939]" />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <p className="text-white font-medium">{message}</p>
        <div className="flex space-x-1 mt-2 justify-center">
          <motion.div
            className="w-2 h-2 bg-[#FF7939] rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-[#FF7939] rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-[#FF7939] rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </motion.div>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  )
}

// Componente de skeleton para cargas específicas
export function SkeletonLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-700 rounded ${className}`} />
  )
}

// Skeleton específico para cards de coach
export function CoachCardSkeleton() {
  return (
    <div className="w-80 flex-shrink-0 bg-[#1E1E1E] border border-gray-700 rounded-lg p-4">
      <div className="flex items-center space-x-3 mb-3">
        <SkeletonLoader className="w-12 h-12 rounded-full" />
        <div className="flex-1">
          <SkeletonLoader className="h-4 w-24 mb-2" />
          <SkeletonLoader className="h-3 w-16" />
        </div>
      </div>
      <SkeletonLoader className="h-20 w-full mb-3" />
      <div className="flex justify-between">
        <SkeletonLoader className="h-6 w-16" />
        <SkeletonLoader className="h-6 w-20" />
      </div>
    </div>
  )
}

// Skeleton específico para cards de actividad
export function ActivityCardSkeleton() {
  return (
    <div className="bg-[#1E1E1E] border border-gray-700 rounded-lg overflow-hidden">
      <SkeletonLoader className="h-48 w-full" />
      <div className="p-3 space-y-3">
        <SkeletonLoader className="h-4 w-3/4" />
        <SkeletonLoader className="h-3 w-full" />
        <SkeletonLoader className="h-3 w-2/3" />
        <div className="flex items-center space-x-2">
          <SkeletonLoader className="w-6 h-6 rounded-full" />
          <SkeletonLoader className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

// Hook para manejar estados de carga
export function useLoadingState() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [loadingMessage, setLoadingMessage] = React.useState("Cargando...")

  const startLoading = (message?: string) => {
    setIsLoading(true)
    if (message) setLoadingMessage(message)
  }

  const stopLoading = () => {
    setIsLoading(false)
  }

  const updateLoadingMessage = (message: string) => {
    setLoadingMessage(message)
  }

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    setLoadingMessage: updateLoadingMessage
  }
}
