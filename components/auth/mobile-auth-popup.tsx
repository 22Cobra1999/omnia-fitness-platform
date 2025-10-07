"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"

type AuthMode = "login" | "register"

export function MobileAuthPopup({
  isOpen,
  onClose,
  initialMode = "login",
}: {
  isOpen: boolean
  onClose: () => void
  initialMode?: AuthMode
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode)

  const handleSuccess = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0">
        {mode === "login" ? (
          <LoginForm onSuccess={handleSuccess} onRegisterClick={() => setMode("register")} />
        ) : (
          <RegisterForm onSuccess={handleSuccess} onLoginClick={() => setMode("login")} />
        )}
      </DialogContent>
    </Dialog>
  )
}
