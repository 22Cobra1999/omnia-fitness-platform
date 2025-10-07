"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { OmniaLogoText } from "./omnia-logo"

export function BasicHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <OmniaLogoText size="text-lg" />
        <Link href="/basic-settings" className="p-2 hover:bg-gray-100 rounded-full">
          <Settings size={24} />
        </Link>
      </div>
    </header>
  )
}
