import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/contexts/auth-context"
import { PopupProvider } from "@/contexts/popup-context"
import { UserProvider } from "@/contexts/user-context"
import { DebugLink } from "@/components/debug-link"
import { AsyncErrorBoundary } from "@/components/error-boundary"
import { LogThrottleIndicator } from "@/components/log-throttle-monitor"

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

const inter = Inter({ subsets: ["latin"] })

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
    <html lang="en">
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
      <body className={inter.className}>
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
