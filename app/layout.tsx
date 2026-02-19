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



import { Inter, Anton } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const anton = Anton({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-anton',
})

export const metadata: Metadata = {
  title: {
    default: "OMNIA | Fitness & Wellness Platform",
    template: "%s | OMNIA"
  },
  description: "Transform your life with OMNIA. Personalized fitness programs, nutrition plans, and expert coaching access.",
  keywords: ["fitness", "wellness", "nutrition", "coaching", "gym", "workout", "health", "omnia"],
  authors: [{ name: "OMNIA Team" }],
  creator: "OMNIA",
  publisher: "OMNIA",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://omnia-fitness.vercel.app",
    title: "OMNIA | Fitness & Wellness Platform",
    description: "Transform your life with OMNIA. Personalized fitness programs, nutrition plans, and expert coaching access.",
    siteName: "OMNIA",
  },
  twitter: {
    card: "summary_large_image",
    title: "OMNIA | Fitness & Wellness Platform",
    description: "Transform your life with OMNIA. Personalized fitness programs, nutrition plans, and expert coaching access.",
    creator: "@omniafitness"
  },
  appleWebApp: {
    capable: true,
    title: "OMNIA",
    statusBarStyle: "black-translucent",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.className} ${anton.variable}`}>
      <head>
        {/* Script para prevenir registro automático de Service Workers en entornos no soportados */}

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
