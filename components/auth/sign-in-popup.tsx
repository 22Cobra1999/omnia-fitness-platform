"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { usePopup } from "@/contexts/popup-context"

interface SignInPopupProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: "login" | "register"
}

export function SignInPopup({ isOpen, onClose, defaultTab = "login" }: SignInPopupProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab)
  const { showWelcomePopup } = usePopup()

  if (!isOpen) return null

  const handleLoginSuccess = () => {
    onClose()
    // Show welcome message after successful login
    showWelcomePopup()
  }

  const handleRegisterSuccess = () => {
    onClose()
    // Show welcome message after successful registration
    showWelcomePopup()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-[#1E1E1E] p-6 shadow-xl border border-[#333333] text-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-center mb-2">Welcome to OMNIA</h2>
          <p className="text-gray-400 text-center">
            {activeTab === "login"
              ? "Sign in to continue your fitness journey"
              : "Create an account to start your fitness journey"}
          </p>
        </div>

        <div className="mb-6 flex">
          <button
            className={`flex-1 border-b-2 pb-2 text-center font-medium transition-colors ${
              activeTab === "login" ? "border-[#FF7939] text-[#FF7939]" : "border-transparent text-gray-400"
            }`}
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
          <button
            className={`flex-1 border-b-2 pb-2 text-center font-medium transition-colors ${
              activeTab === "register" ? "border-[#FF7939] text-[#FF7939]" : "border-transparent text-gray-400"
            }`}
            onClick={() => setActiveTab("register")}
          >
            Register
          </button>
        </div>

        {activeTab === "login" ? (
          <LoginForm onSuccess={handleLoginSuccess} onRegisterClick={() => setActiveTab("register")} />
        ) : (
          <RegisterForm onSuccess={handleRegisterSuccess} onLoginClick={() => setActiveTab("login")} />
        )}
      </div>
    </div>
  )
}
