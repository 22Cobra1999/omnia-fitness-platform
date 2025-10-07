"use client"

import { useAuth } from "@/contexts/auth-context"
import { SignInPopup } from "./sign-in-popup"

export function AuthPopupWrapper() {
  const { isAuthPopupOpen, hideAuthPopup, authPopupDefaultTab } = useAuth()

  return <SignInPopup isOpen={isAuthPopupOpen} onClose={hideAuthPopup} defaultTab={authPopupDefaultTab} />
}
