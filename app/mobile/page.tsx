"use client"

import { useState } from "react"
import { BottomNavigation } from "@/components/mobile/bottom-navigation"
import { ProfileScreen } from "@/components/mobile/profile-screen"
// import { CoachProfileScreen } from "@/components/mobile/coach-profile-screen"
import { CommunityScreen } from "@/components/mobile/community-screen"
import { CalendarScreen } from "@/components/calendar/CalendarScreen"
import { ClientsScreen } from "@/components/mobile/clients-screen"
import { SearchScreen } from "@/components/mobile/search-screen"
import { ActivityScreen } from "@/components/mobile/activity-screen"
import { MobileHeader } from "@/components/mobile-header"
import ProductsManagementScreen from "@/components/mobile/products-management-screen"

export default function MobilePage() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "coach-profile" | "community" | "calendar" | "clients" | "search" | "activity" | "products-management"
  >(() => {
    // Leer el tab guardado en localStorage, por defecto "profile"
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('activeTab')
      if (savedTab && ['profile', 'coach-profile', 'community', 'calendar', 'clients', 'search', 'activity', 'products-management'].includes(savedTab)) {
        // Limpiar el localStorage después de leerlo
        localStorage.removeItem('activeTab')
        return savedTab as any
      }
    }
    return "profile"
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader />

      <div className="pt-20">
        {" "}
        {/* Agregar padding-top para compensar el header fijo */}
        {activeTab === "profile" && <ProfileScreen />}
        {activeTab === "coach-profile" && <CoachProfileScreen />}
        {activeTab === "community" && <CommunityScreen />}
        {activeTab === "calendar" && <CalendarScreen />}
        {activeTab === "clients" && <ClientsScreen />}
        {activeTab === "search" && <SearchScreen />}
        {activeTab === "activity" && <ActivityScreen />}
        {activeTab === "products-management" && <ProductsManagementScreen onTabChange={setActiveTab} />}
      </div>

      <BottomNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}
