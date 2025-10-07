"use client"

import Link from "next/link"
import { Settings } from "lucide-react"

export function SimpleTopNav() {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 px-4">
      <div className="h-full flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          OMNIA
        </Link>
        <Link href="/settings">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <Settings className="h-6 w-6" />
          </button>
        </Link>
      </div>
    </div>
  )
}
