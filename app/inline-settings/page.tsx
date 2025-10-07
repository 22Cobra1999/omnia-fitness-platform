"use client"

import { useState } from "react"

export default function InlineSettingsPage() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="min-h-screen p-8 relative">
      <h1 className="text-3xl font-bold mb-6">Inline Settings Test</h1>
      <p className="mb-4">This page has the settings icon implemented directly in the page itself.</p>

      {/* Inline settings button */}
      <div className="fixed top-4 right-4 z-[9999]">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 border-2 border-white"
          style={{ fontSize: "24px" }}
        >
          ⚙️
        </button>

        {isOpen && (
          <div className="absolute top-14 right-0 w-72 bg-white rounded-lg shadow-xl border-2 border-gray-300">
            <div className="p-4">
              <h2 className="text-lg font-semibold">🔐 Account</h2>
              <h2 className="text-lg font-semibold mt-4">🧾 Subscriptions</h2>
              <h2 className="text-lg font-semibold mt-4">🌗 Personalization</h2>
              <h2 className="text-lg font-semibold mt-4">☎️ Support</h2>
              <h2 className="text-lg font-semibold mt-4">🚪 Session</h2>
              <button className="mt-4 w-full py-2 bg-red-500 text-white rounded" onClick={() => setIsOpen(false)}>
                Close Menu
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 bg-green-100 border-l-4 border-green-500">
        <p>The settings icon should be visible in the top right corner of this page.</p>
      </div>
    </div>
  )
}
