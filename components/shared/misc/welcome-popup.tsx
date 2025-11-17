"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface WelcomePopupProps {
  isOpen: boolean
  onClose: () => void
}

export function WelcomePopup({ isOpen, onClose }: WelcomePopupProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    } else {
      setIsVisible(false)
    }
  }, [isOpen, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-gradient-to-br from-orange-500 to-red-600 p-6 text-white shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-white hover:text-gray-200" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="rounded-full bg-white bg-opacity-20 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold">Your fitness journey starts here!</h2>
          <p className="text-white text-opacity-90">
            Welcome to OMNIA. We're excited to help you achieve your fitness goals and transform your life.
          </p>
          <button
            onClick={onClose}
            className="mt-4 rounded-full bg-white bg-opacity-20 px-6 py-2 font-medium text-white hover:bg-opacity-30"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  )
}
