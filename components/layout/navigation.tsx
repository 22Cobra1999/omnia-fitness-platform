"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Flame, Dumbbell, Calendar, MessageCircle, User, Settings, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Navigation() {
  const pathname = usePathname()
  const { user, isAuthenticated, showAuthPopup } = useAuth()

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
  ]

  const handleNavClick = (requiresAuth: boolean, href: string) => {
    if (requiresAuth && !isAuthenticated) {
      showAuthPopup("login")
      return false
    }
    return true
  }

  return (
    <div className="fixed bottom-0 left-0 z-40 w-full border-t bg-background md:top-0 md:w-16 md:h-screen md:border-r md:border-t-0">
      <div className="flex h-16 items-center justify-around md:h-full md:flex-col md:justify-start md:py-8">
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
              "flex h-12 w-12 flex-col items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground",
              pathname === item.href && "text-foreground",
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="sr-only">{item.name}</span>
          </Link>
        ))}

        {isAuthenticated && user?.role === "coach" && (
          <Link
            href="/coach/sales"
            className={cn(
              "flex h-12 w-12 flex-col items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground",
              pathname === "/coach/sales" && "text-foreground",
            )}
          >
            <ShoppingCart className="h-6 w-6" />
            <span className="sr-only">Ventas</span>
          </Link>
        )}

        {isAuthenticated && (
          <Link
            href="/settings"
            className={cn(
              "mt-auto flex h-12 w-12 flex-col items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground",
              pathname === "/settings" && "text-foreground",
            )}
          >
            <Settings className="h-6 w-6" />
            <span className="sr-only">Settings</span>
          </Link>
        )}

        {isAuthenticated ? (
          <div className="mt-4 flex flex-col items-center">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar || ""} alt={user?.name || ""} />
              <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => showAuthPopup("login")}>
            Sign In
          </Button>
        )}
      </div>
    </div>
  )
}
