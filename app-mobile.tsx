"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import ErrorBoundary from '@/components/shared/misc/ErrorBoundary'
import { useErrorHandler } from '@/components/shared/misc/error-boundary'
import { BottomNavigation } from "@/components/mobile/bottom-navigation"
import ProfileScreen from "@/components/mobile/profile-screen"
import { CommunityScreen } from "@/components/mobile/community-screen"
import { CalendarScreen } from "@/components/calendar/CalendarScreen"
import CoachCalendarScreen from "@/components/coach/coach-calendar-screen"
import { ClientsScreen } from "@/components/mobile/clients-screen"
import { SearchScreen } from "@/components/mobile/search-screen"
import { ActivityScreen } from "@/components/mobile/activity-screen"
import { useAuth } from "@/contexts/auth-context"
import { usePopup } from "@/contexts/popup-context"
import { SignInPopup } from "@/components/auth/sign-in-popup"
import { WelcomePopup } from '@/components/shared/misc/welcome-popup'
import { SettingsIcon } from '@/components/shared/ui/settings-icon'
import { MessagesIcon } from '@/components/shared/ui/messages-icon'
import ProductsManagementScreen from "@/components/mobile/products-management-screen"
import { OmniaLogoText } from '@/components/shared/ui/omnia-logo'
import { useCoachStorageInitialization } from '@/hooks/coach/use-coach-storage-initialization'
import { UsageReportButton } from '@/components/shared/admin/usage-report-button'
import { AutoUsageTracker } from '@/components/shared/admin/auto-usage-tracker'
import { trackComponent } from '@/lib/logging/usage-tracker'


export default function MobileApp() {
  // Rastrear componente principal
  useEffect(() => {
    trackComponent('MobileApp')
  }, [])
  const { isAuthenticated, user, loading, showWelcomeMessage, setShowWelcomeMessage } = useAuth()
  const { isAuthPopupOpen, authPopupDefaultTab, hideAuthPopup, showAuthPopup } = usePopup()
  const [activeTab, setActiveTab] = useState("community")
  const userRole = user?.level || "client"
  const searchParams = useSearchParams()
  
  // Manejo de errores globales
  useErrorHandler()
  
  // ✅ Inicialización automática de storage para coaches
  const { initialized: storageInitialized, loading: storageLoading } = useCoachStorageInitialization()

  // Manejar parámetro tab de la URL
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['community', 'search', 'calendar', 'profile'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  // Manejar parámetro mp_auth para mostrar notificaciones
  useEffect(() => {
    const mpAuth = searchParams.get('mp_auth')
    if (mpAuth === 'success' || mpAuth === 'error') {
      // Limpiar el parámetro de la URL después de procesarlo
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('mp_auth')
      if (mpAuth === 'error') {
        newUrl.searchParams.delete('error')
      }
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams])

  // Debug logging optimizado
  useEffect(() => {
    // Log optimizado - solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      // console.log("MobileApp render:", {
      //   isAuthenticated,
      //   loading,
      //   activeTab,
      //   isAuthPopupOpen,
      //   showWelcomeMessage,
      //   userRole,
      // })
    }
  }, [isAuthenticated, loading, activeTab, isAuthPopupOpen, showWelcomeMessage, userRole])

  // Manejar parámetros de logout
  useEffect(() => {
    const logoutParam = searchParams.get('logout')
    const forceLogoutParam = searchParams.get('forceLogout')
    
    if (logoutParam === 'success') {
      // console.log("Logout exitoso detectado en URL")
      // Limpiar la URL sin recargar la página
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    } else if (logoutParam === 'error') {
      // console.log("Error en logout detectado en URL")
      // Limpiar la URL sin recargar la página
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    } else if (forceLogoutParam === 'true') {
      // console.log("Forzar logout detectado en URL")
      // Limpiar todo y recargar
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        window.history.replaceState({}, document.title, window.location.pathname)
        window.location.reload()
      }
    }
  }, [searchParams])

  // Close auth popup when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && isAuthPopupOpen) {
      // console.log("User is authenticated, hiding auth popup")
      hideAuthPopup()
    }
  }, [isAuthenticated, isAuthPopupOpen, hideAuthPopup])

  // Note: Removed automatic auth popup to prevent conflicts with authenticated users

  // Scroll hacia arriba cuando cambia el tab activo
  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }, [activeTab])

  // Listener para navegación desde otros componentes
  useEffect(() => {
    const handleNavigateToTab = (event: CustomEvent) => {
      const { tab, section } = event.detail
      if (tab) {
        setActiveTab(tab)
        // Si hay una sección específica, disparar evento para que el componente la maneje
        if (section) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('navigateToSection', { detail: { section } }))
          }, 500)
        }
      }
    }

    window.addEventListener('navigateToTab', handleNavigateToTab as EventListener)
    return () => {
      window.removeEventListener('navigateToTab', handleNavigateToTab as EventListener)
    }
  }, [])

  const renderScreen = () => {
    switch (activeTab) {
      // Coach screens
      case "clients":
        return <ClientsScreen onTabChange={setActiveTab} />
      case "products-management":
        return <ProductsManagementScreen />

      // Client screens
      case "search":
        return <SearchScreen onTabChange={setActiveTab} />
      case "activity":
        return <ActivityScreen />

      // Common screens
      case "community":
        return <CommunityScreen />
      case "calendar":
        // Calendario diferente según el rol
        return userRole === "coach" 
          ? <CoachCalendarScreen onTabChange={setActiveTab} />
          : <CalendarScreen onTabChange={setActiveTab} />
      case "profile":
        // Perfil universal para coaches y clientes
        return <ProfileScreen />
      default:
        return <CommunityScreen />
    }
  }

  const hideWelcomeMessage = () => {
    setShowWelcomeMessage(false)
  }

  return (
    <ErrorBoundary>
      {/* Auto Usage Tracker - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && <AutoUsageTracker />}
      
      <div className="flex flex-col h-screen bg-black">
      {/* Header fijo */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black rounded-b-[32px] px-5 py-3 flex justify-between items-center">
        {/* Settings Icon */}
        <div className="flex items-center">
          <SettingsIcon />
        </div>

                {/* OMNIA Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <OmniaLogoText size="text-3xl" />
        </div>

        {/* Messages Icon */}
        <div className="flex items-center">
          <MessagesIcon />
        </div>
      </div>

      <div className="flex-1 overflow-auto pt-14 pb-16">{renderScreen()}</div>
      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Auth Popup */}
      <SignInPopup isOpen={isAuthPopupOpen} onClose={hideAuthPopup} defaultTab={authPopupDefaultTab} />

      {/* Welcome Popup */}
      <WelcomePopup isOpen={showWelcomeMessage} onClose={hideWelcomeMessage} />
      
      {/* Usage Report Button - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && <UsageReportButton />}
      </div>
    </ErrorBoundary>
  )
}
