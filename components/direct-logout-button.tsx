"use client"

import { LogoutButton } from "./logout-button"

export function DirectLogoutButton() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <LogoutButton variant="destructive" size="lg" className="shadow-lg" />
    </div>
  )
}
