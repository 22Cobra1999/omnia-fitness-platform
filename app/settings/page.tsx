"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronLeft, User, Lock, CreditCard, Moon, Globe, HelpCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { SettingsLogoutSection } from "@/components/settings-logout-section"

export default function SettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { user, isAuthenticated, signOut } = useAuth()

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Link href="/" className="mr-4">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
        </Link>
        <h1 className="text-3xl font-bold">Configuración</h1>
      </div>

      <div className="grid gap-6">
        {/* Account Information */}
        {isAuthenticated && user && (
          <div className="mb-8 bg-white rounded-lg shadow p-4">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#FF7939] flex items-center justify-center mr-4">
                <span className="text-white text-2xl font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user.name || "Usuario"}</h2>
                <p className="text-gray-500">{user.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-md bg-[#FF7939] text-white">
                  {user.role || "Cliente"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Account Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-[#FF7939]" />
            Cuenta
          </h2>
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center">
                <Lock className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">Contraseña</p>
                  <p className="text-sm text-gray-500">Cambiar contraseña</p>
                </div>
              </div>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cambiar</button>
            </div>
          </div>
        </div>

        {/* Subscriptions Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-[#FF7939]" />
            Suscripciones
          </h2>
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">Plan Actual</p>
                  <p className="text-sm text-gray-500">Plan Gratuito</p>
                </div>
              </div>
              <button className="px-3 py-1 text-sm bg-[#FF7939] text-white rounded-md hover:bg-[#E86A2D]">
                Mejorar
              </button>
            </div>
          </div>
        </div>

        {/* Personalization Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Moon className="h-5 w-5 mr-2 text-[#FF7939]" />
            Personalización
          </h2>
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center">
                {isDarkMode ? (
                  <Moon className="h-5 w-5 mr-3 text-gray-500" />
                ) : (
                  <Moon className="h-5 w-5 mr-3 text-gray-500" />
                )}
                <div>
                  <p className="font-medium">Tema</p>
                  <p className="text-sm text-gray-500">{isDarkMode ? "Modo Oscuro" : "Modo Claro"}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={isDarkMode} onChange={toggleDarkMode} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF7939]"></div>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center">
                <Globe className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">Idioma</p>
                  <p className="text-sm text-gray-500">Español</p>
                </div>
              </div>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Cambiar</button>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <HelpCircle className="h-5 w-5 mr-2 text-[#FF7939]" />
            Ayuda
          </h2>
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-3 text-gray-500" />
                <div>
                  <p className="font-medium">Centro de Ayuda</p>
                  <p className="text-sm text-gray-500">Preguntas frecuentes y guías</p>
                </div>
              </div>
              <button className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Visitar</button>
            </div>
          </div>
        </div>

        {/* Session Section - Only show when logged in */}
        {/* Otras secciones de configuración */}
        <SettingsLogoutSection />
      </div>
    </div>
  )
}
