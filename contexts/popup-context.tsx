"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

type PopupContextType = {
  isAuthPopupOpen: boolean
  authPopupDefaultTab: "login" | "register"
  showAuthPopup: (tab?: "login" | "register") => void
  hideAuthPopup: () => void
  isWelcomePopupOpen: boolean
  showWelcomePopup: () => void
  hideWelcomePopup: () => void
  isAccountCreatedPopupOpen: boolean
  showAccountCreatedPopup: () => void
  hideAccountCreatedPopup: () => void
}

const PopupContext = createContext<PopupContextType | undefined>(undefined)

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [isAuthPopupOpen, setIsAuthPopupOpen] = useState(false)
  const [authPopupDefaultTab, setAuthPopupDefaultTab] = useState<"login" | "register">("login")
  const [isWelcomePopupOpen, setIsWelcomePopupOpen] = useState(false)
  const [isAccountCreatedPopupOpen, setIsAccountCreatedPopupOpen] = useState(false)

  const showAuthPopup = (tab: "login" | "register" = "login") => {
    setAuthPopupDefaultTab(tab)
    setIsAuthPopupOpen(true)
  }

  const hideAuthPopup = () => {
    setIsAuthPopupOpen(false)
  }

  const showWelcomePopup = () => {
    setIsWelcomePopupOpen(true)
  }

  const hideWelcomePopup = () => {
    setIsWelcomePopupOpen(false)
  }

  const showAccountCreatedPopup = () => {
    setIsAccountCreatedPopupOpen(true)
  }

  const hideAccountCreatedPopup = () => {
    setIsAccountCreatedPopupOpen(false)
  }

  return (
    <PopupContext.Provider
      value={{
        isAuthPopupOpen,
        authPopupDefaultTab,
        showAuthPopup,
        hideAuthPopup,
        isWelcomePopupOpen,
        showWelcomePopup,
        hideWelcomePopup,
        isAccountCreatedPopupOpen,
        showAccountCreatedPopup,
        hideAccountCreatedPopup,
      }}
    >
      {children}
    </PopupContext.Provider>
  )
}

export const usePopup = () => {
  const context = useContext(PopupContext)
  if (context === undefined) {
    throw new Error("usePopup must be used within a PopupProvider")
  }
  return context
}
