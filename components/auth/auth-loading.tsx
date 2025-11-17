"use client"

import { Loader2 } from "lucide-react"

export function AuthLoading() {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Cambiando de sesión...
      </div>
      <p className="max-w-sm text-center text-xs text-muted-foreground/80">
        Estamos verificando tus credenciales y preparando tu espacio personal.
        Este proceso sólo toma unos segundos.
      </p>
    </div>
  )
}













