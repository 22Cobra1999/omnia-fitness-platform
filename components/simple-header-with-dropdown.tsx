"use client"

import { useState } from "react"
import { Settings } from "lucide-react"

export function SimpleHeaderWithDropdown() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed top-0 right-0 p-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-white rounded-full shadow hover:bg-gray-100"
        aria-label="Settings"
      >
        <Settings size={24} />
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-64 bg-white rounded-lg shadow-lg p-4 border border-gray-200">
          <div className="space-y-4">
            <section>
              <h2 className="text-lg font-semibold">🔐 Account</h2>
              <ul className="mt-2 space-y-1">
                <li>Change email or password</li>
                <li>Connected accounts</li>
                <li>Notification preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">🧾 Subscriptions</h2>
              <ul className="mt-2 space-y-1">
                <li>View & manage subscriptions</li>
                <li>Payment history</li>
                <li>Payment method</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">🌗 Personalization</h2>
              <ul className="mt-2 space-y-1">
                <li>Dark / Light mode</li>
                <li>Language preferences</li>
                <li>Default content filters</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">☎️ Support</h2>
              <ul className="mt-2 space-y-1">
                <li>Send feedback</li>
                <li>Report a bug</li>
                <li>Help Center / FAQ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold">🚪 Session</h2>
              <button className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 w-full text-left">
                Log out
              </button>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
