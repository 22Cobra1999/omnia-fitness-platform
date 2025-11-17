"use client"

import { useState, useEffect, useRef } from "react"
import {
  Settings,
  User,
  CreditCard,
  Palette,
  LogOut,
  Mail,
  Lock,
  Bell,
  Instagram,
  History,
  CreditCardIcon as PaymentCard,
  Moon,
  Globe,
  Filter,
  MessageSquareText,
  Bug,
  HelpCircle,
  HandHelpingIcon,
} from "lucide-react"

export function DarkSettingsIcon() {
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

  // Styles
  const iconStyles = {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 9999,
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "#1e1e1e",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    border: "none",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  } as const

  const menuStyles = {
    position: "fixed",
    top: "80px",
    right: "20px",
    width: "320px",
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    zIndex: 9999,
    border: "1px solid #333",
    maxHeight: "80vh",
    overflowY: "auto",
    color: "#ffffff",
  } as const

  const sectionStyles = {
    marginBottom: "16px",
    padding: "0 16px",
  } as const

  const headingStyles = {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "12px",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  } as const

  const itemStyles = {
    padding: "10px 12px",
    cursor: "pointer",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "4px 0",
    transition: "background-color 0.2s",
  } as const

  const dividerStyles = {
    margin: "16px 0",
    borderTop: "1px solid #333",
  } as const

  const logoutButtonStyles = {
    width: "100%",
    padding: "12px",
    backgroundColor: "#e53935",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    fontWeight: "500",
    margin: "8px 0",
  } as const

  return (
    <div ref={menuRef}>
      {/* Settings Icon Button */}
      <button onClick={() => setIsOpen(!isOpen)} style={iconStyles} aria-label="Settings">
        <Settings size={24} />
      </button>

      {/* Settings Menu */}
      {isOpen && (
        <div style={menuStyles}>
          <div style={{ padding: "20px 0" }}>
            {/* Account Section */}
            <div style={sectionStyles}>
              <h2 style={headingStyles}>
                <User size={18} />
                Account
              </h2>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li
                  style={itemStyles}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Mail size={16} />
                  <span>Change email</span>
                </li>
                <li
                  style={itemStyles}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Lock size={16} />
                  <span>Change password</span>
                </li>
                <li
                  style={itemStyles}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Instagram size={16} />
                  <span>Connected accounts</span>
                </li>
                <li
                  style={itemStyles}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Bell size={16} />
                  <span>Notification preferences</span>
                </li>
              </ul>
            </div>

            <hr style={dividerStyles} />

            {/* Subscriptions Section */}
            <div style={sectionStyles}>
              <h2 style={headingStyles}>
                <CreditCard size={18} />
                Subscriptions
              </h2>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li
                  style={itemStyles}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <CreditCard size={16} />
                  <span>Manage subscriptions</span>
                </li>
                <li
                  style={itemStyles}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <History size={16} />
                  <span>Payment history</span>
                </li>
                <li
                  style={itemStyles}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <PaymentCard size={16} />
                  <span>Payment method</span>
                </li>
              </ul>
            </div>

            <hr style={dividerStyles} />

            {/* Personalization Section */}
            <div style={sectionStyles}>
              <h2 style={headingStyles}>
                <Palette size={18} />
                Personalization
              </h2>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li
                  style={itemStyles}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Moon size={16} />
                  <span>Dark / Light mode</span>
                </li>
                <li
                  style={itemStyles}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Globe size={16} />
                  <span>Language preferences</span>
                </li>
                <li
                  style={itemStyles}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Filter size={16} />
                  <span>Default content filters</span>
                </li>
              </ul>
            </div>

            <hr style={dividerStyles} />

            {/* Support Section */}
            <div style={sectionStyles}>
              <h2 style={headingStyles}>
                <HelpCircle size={18} />
                Support
              </h2>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li
                  style={itemStyles}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <MessageSquareText size={16} />
                  <span>Send feedback</span>
                </li>
                <li
                  style={itemStyles}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Bug size={16} />
                  <span>Report a bug</span>
                </li>
                <li
                  style={itemStyles}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <HandHelpingIcon size={16} />
                  <span>Help Center / FAQ</span>
                </li>
              </ul>
            </div>

            <hr style={dividerStyles} />

            {/* Session Section */}
            <div style={{ padding: "0 16px 8px" }}>
              <button
                style={logoutButtonStyles}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#d32f2f")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#e53935")}
              >
                <LogOut size={16} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
