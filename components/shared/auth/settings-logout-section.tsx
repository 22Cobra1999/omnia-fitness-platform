"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogoutButton } from "./logout-button"
import { DirectLogoutButton } from "./direct-logout-button"
import { Separator } from "@/components/ui/separator"

export function SettingsLogoutSection() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cerrar sesión</CardTitle>
        <CardDescription>Opciones para cerrar sesión en la aplicación</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Cierre de sesión normal</h3>
          <LogoutButton className="w-full" variant="outline" />
        </div>

        <Separator className="my-4" />

        <div>
          <h3 className="text-sm font-medium mb-2">¿Problemas para cerrar sesión?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Si tienes problemas para cerrar sesión, utiliza este botón para forzar el cierre de sesión.
          </p>
          <DirectLogoutButton />
        </div>
      </CardContent>
    </Card>
  )
}
