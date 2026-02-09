"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import OmniaBubbleWordmark from '@/components/shared/ui/OmniaBubbleWordmark'

export function Header() {
  const pathname = usePathname()
  const { user, logout } = useUser()
  const isLoggedIn = !!user
  const userType = user?.type

  const navItems = isLoggedIn
    ? userType === "client"
      ? [
        { name: "Trackers", href: "/web" },
        { name: "Community", href: "/feed" },
      ]
      : [
        { name: "Community", href: "/feed" },
        { name: "Coach", href: "/coach" },
      ]
    : [{ name: "Community", href: "/feed" }]

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-black border-b border-white/5">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between relative z-10">
        {/* Settings icon on the left */}
        <div>
          <Button variant="ghost" className="text-white p-2 hover:bg-[#FF7939]/10 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-settings"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Button>
        </div>

        {/* Centered OMNIA logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link href="/">
            <motion.div
              className="relative z-10 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <OmniaBubbleWordmark
                text="OMNIA"
                size={80}
                darkBg={true}
                inflate={1.6}
              />
            </motion.div>
          </Link>
        </div>

        {/* Notifications icon on the right */}
        <div>
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-white p-2 hover:bg-[#FF7939]/10 rounded-full relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-bell"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <Avatar className="h-8 w-8 border border-[#FF7939]">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/about" className="px-4 py-2 text-white hover:text-[#FF6B35] transition">
                About Us
              </Link>
              <Link href="/auth/login">
                <Button className="bg-gradient-to-r from-[#FF7939] to-[#FFB56B] text-white border-none hover:opacity-90">
                  Log in
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
