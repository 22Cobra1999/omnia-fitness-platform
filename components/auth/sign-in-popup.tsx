"use client"

import { useState } from "react"
import { X, Flame } from "lucide-react"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"
import { usePopup } from "@/contexts/popup-context"
import { createCheckoutProPreference, redirectToMercadoPagoCheckout, getCheckoutProErrorMessage } from '@/lib/mercadopago/checkout-pro'

interface SignInPopupProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: "login" | "register"
}

export function SignInPopup({ isOpen, onClose, defaultTab = "login" }: SignInPopupProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab)
  const { showWelcomePopup, showAccountCreatedPopup } = usePopup()

  if (!isOpen) return null

  const handleLoginSuccess = () => {
    onClose()
    // Show welcome message after successful login
    showWelcomePopup()
  }

  const handleRegisterSuccess = () => {
    onClose()
    // Show account created popup after successful registration
    showAccountCreatedPopup()
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop with Blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-all duration-500"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-[390px] max-h-[90vh] overflow-y-auto rounded-[32px] bg-[#0A0A0A]/95 backdrop-blur-3xl p-8 shadow-[0_32px_100px_rgba(0,0,0,0.95)] border border-white/20 text-white scrollbar-hide">
        {/* Subtle Inner Glow */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#FF7939]/10 to-transparent rounded-t-[32px] pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute right-8 top-8 text-white/40 hover:text-white transition-all duration-300 bg-white/5 hover:bg-white/10 p-2 rounded-full z-10"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 relative">
          <div className="flex justify-center mb-3">
            <div className="bg-[#FF7939]/10 rounded-xl p-2 flex items-center justify-center border border-[#FF7939]/20">
              <Flame className="h-5 w-5 text-[#FF7939]" strokeWidth={2} />
            </div>
          </div>
          <h2 className="text-xl font-black text-center mb-1 tracking-tight uppercase">Bienvenido</h2>
          <p className="text-white/40 text-center text-[10px] font-bold uppercase tracking-widest px-4">
            {activeTab === "login"
              ? "Inicia sesión"
              : "Crea tu cuenta"}
          </p>
        </div>

        <div className="mb-3 flex p-1 bg-[#000000] rounded-xl border border-white/5 backdrop-blur-lg">
          <button
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-500 ease-out ${activeTab === "login"
              ? "bg-[#FF7939] text-white shadow-[0_8px_20px_rgba(255,121,57,0.3)] scale-[1.02]"
              : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            onClick={() => setActiveTab("login")}
          >
            Login
          </button>
          <button
            className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-500 ease-out ${activeTab === "register"
              ? "bg-[#FF7939] text-white shadow-[0_8px_20px_rgba(255,121,57,0.3)] scale-[1.02]"
              : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            onClick={() => setActiveTab("register")}
          >
            Register
          </button>
        </div>

        <div className="relative">
          {activeTab === "login" ? (
            <LoginForm onSuccess={handleLoginSuccess} onRegisterClick={() => setActiveTab("register")} />
          ) : (
            <RegisterForm onSuccess={handleRegisterSuccess} onLoginClick={() => setActiveTab("login")} />
          )}
        </div>
      </div>
    </div>
  )
}
