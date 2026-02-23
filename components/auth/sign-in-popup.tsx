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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-[#0a0a0a]/80 p-8 shadow-2xl border border-white/10 text-white scrollbar-hide">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-gray-400 hover:text-white transition-colors bg-white/5 p-1 rounded-full"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-center mb-2">Welcome to OMNIA</h2>
          <p className="text-gray-400 text-center">
            {activeTab === "login"
              ? "Sign in to continue your fitness journey"
              : "Create an account to start your fitness journey"}
          </p>
        </div>

        <div className="mb-8 flex p-1 bg-white/5 rounded-xl border border-white/5">
          <button
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${activeTab === "login"
              ? "bg-[#FF7939] text-white shadow-lg shadow-[#FF7939]/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${activeTab === "register"
              ? "bg-[#FF7939] text-white shadow-lg shadow-[#FF7939]/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
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
