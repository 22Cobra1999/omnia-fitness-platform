"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TopNavigation() {
  // This would normally come from your auth context
  const isAuthenticated = true // For testing, set to true to see settings icon

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center">
        <Link href="/" className="text-xl font-bold">
          OMNIA
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" onClick={() => alert("Sign in popup would show here")}>
            Sign In
          </Button>
        )}
      </div>
    </div>
  )
}
