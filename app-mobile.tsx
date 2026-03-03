"use client"

import dynamic from "next/dynamic"
import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion"

// Componentes estables/ligeros
import ErrorBoundary from '@/components/shared/misc/ErrorBoundary'
import { useErrorHandler } from '@/components/shared/misc/error-boundary'
import { BottomNavigation } from "@/components/mobile/bottom-navigation"
import { useAuth } from "@/contexts/auth-context"
import { usePopup } from "@/contexts/popup-context"
import { SignInPopup } from "@/components/auth/sign-in-popup"
import { AccountCreatedPopup } from "@/components/auth/account-created-popup"
// Eliminado WelcomePopup
import { SettingsIcon } from '@/components/shared/ui/settings-icon'
import { MessagesIcon } from '@/components/shared/ui/messages-icon'
import { OmniaLogoText } from '@/components/shared/ui/omnia-logo'
import { trackComponent } from '@/lib/logging/usage-tracker'
import { logUsage } from '@/lib/logging/usage-logger'
import { useCoachStorageInitialization } from '@/hooks/coach/use-coach-storage-initialization'

// Pantallas cargadas dinámicamente para optimizar el bundle inicial
const ProfileScreen = dynamic(() => import("@/components/mobile/profile-screen"), { ssr: false })
const CommunityScreen = dynamic(() => import("@/components/mobile/community-screen").then(m => m.CommunityScreen), { ssr: false })
const CalendarScreen = dynamic(() => import("@/components/calendar/CalendarScreen").then(m => m.CalendarScreen), { ssr: false })
const CoachCalendarScreen = dynamic(() => import("@/components/coach/coach-calendar-screen"), { ssr: false })
const ClientsScreen = dynamic(() => import("@/components/mobile/clients-screen").then(m => m.ClientsScreen), { ssr: false })
const SearchScreen = dynamic(() => import("@/components/mobile/search-screen").then(m => m.SearchScreen), { ssr: false })
const ActivityScreen = dynamic(() => import("@/components/mobile/ActivityScreen"), { ssr: false })
const MessagesScreen = dynamic(() => import("@/components/mobile/messages-screen").then(m => m.MessagesScreen), { ssr: false })
const ProductsManagement = dynamic(() => import("@/components/mobile/ProductsManagement"), { ssr: false })
const UsageReportButton = dynamic(() => import('@/components/shared/admin/usage-report-button').then(m => m.UsageReportButton), { ssr: false })
const AutoUsageTracker = dynamic(() => import('@/components/shared/admin/auto-usage-tracker').then(m => m.AutoUsageTracker), { ssr: false })


interface MobileAppProps {
  initialTab?: string
  initialCategoryId?: string
  initialActivityId?: string
  initialActivityData?: any
}

function MobileAppContent({ initialTab, initialCategoryId, initialActivityId, initialActivityData }: MobileAppProps) {
  // Rastrear componente principal
  useEffect(() => {
    console.log('🧩 [MobileApp] Initial props:', { initialTab, initialCategoryId, initialActivityId })
    trackComponent('MobileApp')
  }, [initialTab, initialCategoryId, initialActivityId])
  const { isAuthenticated, user, loading, showWelcomeMessage, setShowWelcomeMessage } = useAuth()
  const { isAuthPopupOpen, authPopupDefaultTab, hideAuthPopup, showAuthPopup, isAccountCreatedPopupOpen, hideAccountCreatedPopup } = usePopup()
  const [activeTab, setActiveTab] = useState(initialTab || "community")

  const handleAccountAction = (action: "profile" | "products" | "close") => {
    hideAccountCreatedPopup()
    if (action === "profile") {
      setActiveTab("profile")
    } else if (action === "products") {
      setActiveTab("products-management")
    }
  }
  const userRole = user?.level || "client"
  const searchParams = useSearchParams()

  const urlTabs = ['community', 'search', 'calendar', 'activity', 'profile', 'messages', 'clients', 'products-management']

  // Manejo de errores globales
  useErrorHandler()

  // ✅ Inicialización automática de storage para coaches
  const { initialized: storageInitialized, loading: storageLoading } = useCoachStorageInitialization()

  // Manejar parámetro tab de la URL (solo si no se proveyó initialTab)
  useEffect(() => {
    if (initialTab) return
    const tabParam = searchParams.get('tab')
    if (tabParam && urlTabs.includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams, initialTab])

  const [forcedId, setForcedId] = useState<string | undefined>(initialActivityId)

  // Listen to Tab Reset from BottomNavigation to clear forced ID
  useEffect(() => {
    const handleTabReset = (event: Event) => {
      const customEvent = event as CustomEvent<{ tab: string }>
      if (customEvent.detail.tab === activeTab) {
        console.log(`🔗 [MobileApp] Reset detected for ${activeTab}. Clearing forced ID.`)
        setForcedId(undefined)
      }
    }

    // Al cambiar de pestaña (no solo reset), también queremos limpiar el forcedId
    // para que no arrastre el ID de la actividad inicial a otras pestañas
    if (forcedId) {
      console.log(`🔗 [MobileApp] Tab changed to ${activeTab}. Clearing initial forced ID.`)
      setForcedId(undefined)
    }

    window.addEventListener('reset-tab-to-origin', handleTabReset as EventListener)
    return () => {
      window.removeEventListener('reset-tab-to-origin', handleTabReset as EventListener)
    }
  }, [activeTab])

  // ==========================================
  // ESTABLE: Sincronización de URL (Deep Linking)
  // ==========================================
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Obtenemos estado actual directo de window para evitar bucle con searchParams
    const url = new URL(window.location.href)
    const currentTabInUrl = url.searchParams.get('tab')
    const currentIdInUrl = url.searchParams.get('id')

    // El ID objetivo es el que tenemos forzado o el que ya está en la URL
    const targetId = forcedId || currentIdInUrl

    let needsUpdate = false

    // 1. Sincronizar Tab
    if (urlTabs.includes(activeTab) && currentTabInUrl !== activeTab) {
      url.searchParams.set('tab', activeTab)
      needsUpdate = true
    }

    // 2. Sincronizar ID (Preservar si estamos en Search o Activity)
    // Si targetId es null/undefined pero currentIdInUrl existe, significa que debemos limpiar el URL
    if (activeTab === 'search' || activeTab === 'activity') {
      if (targetId) {
        if (currentIdInUrl !== String(targetId)) {
          console.log('🔗 [MobileApp] Sync logic - Setting ID:', targetId)
          url.searchParams.set('id', String(targetId))
          needsUpdate = true
        }
      } else if (currentIdInUrl) {
        console.log('🔗 [MobileApp] Sync logic - Clearing ID from URL')
        url.searchParams.delete('id')
        needsUpdate = true
      }
    }

    // 3. Normalizar path si es necesario (ej: de /activity/48 a /)
    // Esto asegura que el SPA mantenga un estado limpio
    if (url.pathname !== '/') {
      console.log('🔗 [MobileApp] Normalizing path from', url.pathname, 'to /')
      url.pathname = '/'
      needsUpdate = true
    }

    if (needsUpdate) {
      console.log('🔗 [MobileApp] URL Sync - New URL:', url.toString())
      window.history.replaceState({}, '', url.toString())
    }
  }, [activeTab, forcedId])

  // Manejar parámetro mp_auth para mostrar notificaciones
  useEffect(() => {
    if (typeof window === 'undefined') return
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

  // Detectar si el usuario volvió de Mercado Pago sin completar el pago
  useEffect(() => {
    // Solo verificar si no estamos en una página de resultado de pago
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/payment/')) {
      const pendingPayment = sessionStorage.getItem('pending_payment')

      if (pendingPayment) {
        try {
          const paymentData = JSON.parse(pendingPayment)
          const timeElapsed = Date.now() - paymentData.timestamp

          // Si pasaron más de 30 segundos y no estamos en una página de resultado, asumir cancelación
          if (timeElapsed > 30000) {
            // Verificar si realmente no se completó el pago
            const checkPaymentStatus = async () => {
              try {
                const response = await fetch(`/api/payments/check-status?preference_id=${paymentData.preferenceId}`)
                const result = await response.json()

                if (!result.completed) {
                  // El pago no se completó, mostrar mensaje y reiniciar
                  sessionStorage.removeItem('pending_payment')
                  alert('⚠️ La transacción no se confirmó. No se realizó ningún cargo.\n\nLa página se reiniciará.')
                  window.location.href = '/'
                } else {
                  // El pago se completó, limpiar sessionStorage
                  sessionStorage.removeItem('pending_payment')
                }
              } catch (error) {
                console.error('Error verificando estado del pago:', error)
                // En caso de error, limpiar y reiniciar
                sessionStorage.removeItem('pending_payment')
                alert('⚠️ No se pudo verificar el estado de la transacción. La página se reiniciará.')
                window.location.href = '/'
              }
            }

            checkPaymentStatus()
          }
        } catch (error) {
          console.error('Error procesando pending_payment:', error)
          sessionStorage.removeItem('pending_payment')
        }
      }
    }
  }, [])

  // Debug logging optimizado
  useEffect(() => {
    // Seguimiento de navegación del usuario y pestaña activa
    try {
      const path = typeof window !== 'undefined' ? window.location.pathname : ''
      const userId = user?.id

      logUsage('navigation', 'navigate', {
        path,
        tab: activeTab,
        userId,
        role: userRole,
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('🧭 NAVIGATE', {
          path,
          tab: activeTab,
          userId,
          role: userRole,
        })
      }
    } catch (error) {
      console.error('Error registrando navegación del usuario', error)
    }
  }, [activeTab, isAuthenticated, loading, isAuthPopupOpen, showWelcomeMessage, user, userRole])

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
      console.log('🧭 [MobileApp] Recibido evento navigateToTab:', tab)
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

  const scrollRef = useRef<HTMLDivElement>(null)

  // Smooth scroll tracking via framer-motion manually avoiding SSR hydration errors
  const scrollY = useMotionValue(0)

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    scrollY.set(e.currentTarget.scrollTop)
  }

  // Create transforms directly from scrollY
  const bgOpacity = useTransform(scrollY, [50, 120], [0, 1])

  // Decrease scale from 2.5 to 1 smoothly over 160px of scroll, then shrink slightly when moving into mockups
  const logoScale = useTransform(scrollY, [0, 160, 2600, 3000], [2.5, 1, 1, 0.8])

  // Move Y from 120 to 0 smoothly over 160px of scroll, then translate down into the device mockups
  const logoY = useTransform(scrollY, [0, 160, 2600, 3000], [120, 0, 0, 80])

  // Fade out when entering the mockup sections
  const logoOpacity = useTransform(scrollY, [0, 160, 2600, 3000], [1, 1, 1, 0])

  // Use motion values that fallback to defaults if not in community tab
  const actualBgOpacity = useTransform(bgOpacity, v => activeTab === 'community' ? v : 1)
  const headerBgColor = useTransform(actualBgOpacity, o => `rgba(0, 0, 0, ${o})`)

  const actualLogoScale = useTransform(logoScale, v => activeTab === 'community' ? v : 1)
  const actualLogoY = useTransform(logoY, v => activeTab === 'community' ? v : 0)
  const actualLogoOpacity = useTransform(logoOpacity, v => activeTab === 'community' ? v : 1)

  // Use a spring or derived state for the drop shadow to avoid re-rendering
  const [isLogoLarge, setIsLogoLarge] = useState(false)
  useEffect(() => {
    // Check initial state gracefully (helps hydration mismatch)
    setIsLogoLarge(activeTab === 'community' && logoScale.get() > 1.5)

    return logoScale.on("change", (latest) => {
      setIsLogoLarge(activeTab === 'community' && latest > 1.5)
    })
  }, [logoScale, activeTab])

  const renderScreen = () => {
    switch (activeTab) {
      // Coach screens
      case "clients":
        return <ClientsScreen />
      case "products-management":
        return <ProductsManagement />

      // Client screens
      case "search":
        return <SearchScreen onTabChange={setActiveTab} initialActivityData={initialActivityData} />
      case "activity":
        return <ActivityScreen />

      // Common screens
      case "community":
        return <CommunityScreen scrollY={scrollY} />
      case "calendar":
        // Calendario diferente según el rol
        return userRole === "coach"
          ? <CoachCalendarScreen />
          : <CalendarScreen onTabChange={setActiveTab} />
      case "profile":
        // Perfil universal para coaches y clientes
        return <ProfileScreen />
      case "messages":
        // Mensajes para coaches y clientes
        return <MessagesScreen />
      default:
        return <CommunityScreen />
    }
  }

  const hideWelcomeMessage = () => {
    setShowWelcomeMessage(false)
  }

  // Timeout de seguridad: si loading tarda mucho, renderizar de todos modos
  const [forceRender, setForceRender] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceRender(true)
    }, 2000) // Reducido a 2 segundos
    return () => clearTimeout(timer)
  }, [])

  // Si está cargando pero ya pasó el timeout, renderizar de todos modos
  // Esto evita que la página se quede bloqueada indefinidamente
  const shouldShowLoading = loading && !forceRender

  // Mostrar loading solo si no ha pasado el timeout
  if (shouldShowLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <p className="text-white">Cargando...</p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      {/* Auto Usage Tracker - Solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && <AutoUsageTracker />}

      <div className="flex flex-col h-screen bg-black">
        {/* Header fijo */}
        <motion.div
          className="fixed top-0 left-0 right-0 z-[1000] rounded-b-[32px] px-5 py-3 flex justify-between items-center bg-black"
          style={{
            backgroundColor: headerBgColor
          }}
        >
          {/* Settings Icon */}
          <div className="flex items-center">
            <SettingsIcon />
          </div>

          {/* OMNIA Logo - Morphing from Hero */}
          <motion.div
            className="absolute left-1/2"
            style={{
              x: "-50%",
              scale: actualLogoScale,
              y: actualLogoY,
              opacity: actualLogoOpacity
            }}
          >
            <OmniaLogoText size="text-3xl" className={isLogoLarge ? "drop-shadow-[0_20px_25px_rgba(255,121,57,0.15)] filter" : ""} />
          </motion.div>

          {/* Messages Icon */}
          <div className="flex items-center">
            <MessagesIcon />
          </div>
        </motion.div>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden pt-14 pb-16"
        >
          {renderScreen()}
        </div>
        <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Auth Popup */}
        <SignInPopup isOpen={isAuthPopupOpen} onClose={hideAuthPopup} defaultTab={authPopupDefaultTab} />

        {/* Account Created Popup */}
        <AccountCreatedPopup
          isOpen={isAccountCreatedPopupOpen}
          onClose={hideAccountCreatedPopup}
          onAction={handleAccountAction}
        />

        {/* Welcome Popup */}
        {/* Welcome Popup Eliminado */}

        {/* Usage Report Button - Solo en desarrollo */}
        {false && process.env.NODE_ENV === 'development' && <UsageReportButton />}
      </div>
    </ErrorBoundary>
  )
}

export default function MobileApp(props: MobileAppProps) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black">
      <p className="text-white">Cargando...</p>
    </div>}>
      <MobileAppContent {...props} />
    </Suspense>
  )
}
