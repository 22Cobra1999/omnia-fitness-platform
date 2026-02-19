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
    default: "OMNIA | The All-in-One Fitness, Nutrition & Wellness Platform for Coaches and Clients",
    template: "%s | OMNIA Fitness"
  },
  description: "Transform your life with OMNIA. Access personalized fitness programs, custom nutrition plans, and expert coaching. Join the community and start your wellness journey today with top-tier professionals.",
  keywords: ["fitness platform", "online coaching", "nutrition plans", "workout app", "gym companion", "wellness community", "personal trainer software", "omnia fitness"],
  authors: [{ name: "OMNIA Team" }],
  creator: "OMNIA Fitness",
  publisher: "OMNIA Fitness",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://omnia-app.vercel.app",
    title: "OMNIA | The All-in-One Fitness, Nutrition & Wellness Platform",
    description: "Transform your life with OMNIA. Access personalized fitness programs, custom nutrition plans, and expert coaching. Join the community and start your journey today.",
    siteName: "OMNIA Fitness",
  },
  twitter: {
    card: "summary_large_image",
    title: "OMNIA | The All-in-One Fitness, Nutrition & Wellness Platform",
    description: "Transform your life with OMNIA. Access personalized fitness programs, custom nutrition plans, and expert coaching. Join the community today.",
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
