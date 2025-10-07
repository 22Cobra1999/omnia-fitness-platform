"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Flame, Dumbbell, Calendar, MessageCircle, User, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"

export function MainNavigation() {
  const pathname = usePathname()

  // This would normally come from your auth context
  const isAuthenticated = true // For testing

  const navItems = [
    {
      name: "Community",
      href: "/community",
      icon: Flame,
      requiresAuth: false,
    },
    {
      name: "Workouts",
      href: "/workouts",
      icon: Dumbbell,
      requiresAuth: true,
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: Calendar,
      requiresAuth: true,
    },
    {
      name: "Messages",
      href: "/messages",
      icon: MessageCircle,
      requiresAuth: true,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      requiresAuth: true,
    },
    {
      name: "My Products",
      href: "/my-products",
      icon: ShoppingBag,
      requiresAuth: true,
    },
  ]

  const handleNavClick = (requiresAuth: boolean, href: string) => {
    if (requiresAuth && !isAuthenticated) {
      // This would normally show your auth popup
      alert("Please sign in to access this feature")
      return false
    }
    return true
  }

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full border-t bg-background md:bottom-auto md:top-16 md:h-12 md:border-b md:border-t-0">
      <div className="flex h-16 items-center justify-around md:h-full md:justify-center md:gap-8">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={(e) => {
              if (!handleNavClick(item.requiresAuth, item.href)) {
                e.preventDefault()
              }
            }}
            className={cn(
              "flex h-12 w-12 flex-col items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground md:flex-row md:w-auto md:gap-2",
              pathname === item.href && "text-foreground",
            )}
          >
            <item.icon className="h-6 w-6 md:h-5 md:w-5" />
            <span className="sr-only md:not-sr-only md:text-sm">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
