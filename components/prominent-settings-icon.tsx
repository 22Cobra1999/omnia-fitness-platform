"use client"

import { useState, useRef, useEffect } from "react"

export function ProminentSettingsIcon() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-[9999]" ref={menuRef}>
      {/* Large, prominent settings button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-black text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 border-2 border-white"
        aria-label="Settings"
        style={{ fontSize: "24px" }}
      >
        ⚙️
      </button>

      {/* Settings dropdown menu */}
      {isOpen && (
        <div className="absolute top-14 right-0 w-72 bg-white rounded-lg shadow-xl border-2 border-gray-300 overflow-hidden">
          <div className="p-4 space-y-4">
            <section>
              <h2 className="text-lg font-semibold">🔐 Account</h2>
              <ul className="mt-2 space-y-2">
                <li className="hover:bg-gray-100 p-2 rounded cursor-pointer">Change email or password</li>
                <li className="hover:bg-gray-100 p-2 rounded cursor-pointer">Connected accounts</li>
                <li className="hover:bg-gray-100 p-2 rounded cursor-pointer">Notification preferences</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 my-2"></div>

            <section>
              <h2 className="text-lg font-semibold">🧾 Subscriptions</h2>
              <ul className="mt-2 space-y-2">
                <li className="hover:bg-gray-100 p-2 rounded cursor-pointer">View & manage subscriptions</li>
                <li className="hover:bg-gray-100 p-2 rounded cursor-pointer">Payment history</li>
                <li className="hover:bg-gray-100 p-2 rounded cursor-pointer">Payment method</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 my-2"></div>

            <section>
              <h2 className="text-lg font-semibold">🌗 Personalization</h2>
              <ul className="mt-2 space-y-2">
                <li className="hover:bg-gray-100 p-2 rounded cursor-pointer">Dark / Light mode</li>
                <li className="hover:bg-gray-100 p-2 rounded cursor-pointer">Language preferences</li>
                <li className="hover:bg-gray-100 p-2 rounded cursor-pointer">Default content filters</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 my-2"></div>

            <section>
              <h2 className="text-lg font-semibold">☎️ Support</h2>
              <ul className="mt-2 space-y-2">
                <li className="hover:bg-gray-100 p-2 rounded cursor-pointer">Send feedback</li>
                <li className="hover:bg-gray-100 p-2 rounded cursor-pointer">Report a bug</li>
                <li className="hover:bg-gray-100 p-2 rounded cursor-pointer">Help Center / FAQ</li>
              </ul>
            </section>

            <div className="border-t border-gray-200 my-2"></div>

            <section>
              <h2 className="text-lg font-semibold">🚪 Session</h2>
              <button className="mt-2 w-full py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                Log out
              </button>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
