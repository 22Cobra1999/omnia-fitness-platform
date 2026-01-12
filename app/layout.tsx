import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { AuthProvider } from "@/contexts/auth-context"
import { PopupProvider } from "@/contexts/popup-context"
import { UserProvider } from "@/contexts/user-context"
import { DebugLink } from '@/components/shared/admin/debug-link'
import { AsyncErrorBoundary } from '@/components/shared/misc/error-boundary'
import { LogThrottleIndicator } from '@/components/shared/admin/log-throttle-monitor'
import { ConsoleSilencer } from '@/components/shared/misc/console-silencer'

// Desactivar Service Worker en entornos de desarrollo o previsualización
const isServiceWorkerSupported =
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  window.location.hostname !== "localhost" &&
  !window.location.hostname.includes("vusercontent.net")

// Desregistrar cualquier Service Worker existente en entornos no soportados
if (typeof window !== "undefined" && "serviceWorker" in navigator && !isServiceWorkerSupported) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const registration of registrations) {
        registration.unregister()
      }
    })
    .catch((error) => {
      console.error("Service Worker unregister failed:", error)
    })
}

export const metadata: Metadata = {
  title: "OMNIA",
  description: "OMNIA platform",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Script para prevenir registro automático de Service Workers en entornos no soportados */}
        {!isServiceWorkerSupported && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (let registration of registrations) {
                      registration.unregister();
                    }
                  });
                });
              }
            `,
            }}
          />
        )}
      </head>
      <body>
        {/* Silenciar logs en cliente (excepto errores) */}
        <ConsoleSilencer />
        <AsyncErrorBoundary>
          <PopupProvider>
            <AuthProvider>
              <UserProvider>
                {children}
                <DebugLink />
                <LogThrottleIndicator />
              </UserProvider>
            </AuthProvider>
          </PopupProvider>
        </AsyncErrorBoundary>
      </body>
    </html>
  )
}
