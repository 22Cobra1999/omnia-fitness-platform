"use client"

import { useState, useEffect, useRef } from "react"
import { Settings, User, CreditCard, Palette, HelpCircle, LogIn, ChevronRight } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { LogoutButton } from "./logout-button"

export function GlobalSettingsButton() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated, user, showAuthPopup } = useAuth()

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

  // Handle login
  const handleLogin = () => {
    showAuthPopup("login")
    setIsOpen(false)
  }

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
    width: "280px",
    backgroundColor: "#1e1e1e",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    zIndex: 9999,
    border: "1px solid #333",
    overflow: "hidden",
    color: "#ffffff",
  } as const

  const sectionStyles = {
    padding: "12px 16px",
    borderBottom: "1px solid #333",
    cursor: "pointer",
    transition: "background-color 0.2s",
  } as const

  const accountInfoStyles = {
    padding: "16px",
    borderBottom: "1px solid #333",
    backgroundColor: "#252525",
  } as const

  const roleStyles = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
    backgroundColor: "#FF7939",
    color: "white",
    marginTop: "4px",
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
          {/* Account Info Section - Only show when logged in */}
          {isAuthenticated && user && (
            <div style={accountInfoStyles}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: "#FF7939",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                  }}
                >
                  <span style={{ color: "white", fontWeight: "bold" }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div style={{ fontWeight: "500" }}>{user.name || "Usuario"}</div>
                  <div style={{ fontSize: "12px", color: "#aaa" }}>{user.email}</div>
                </div>
              </div>
              <div style={roleStyles}>{user.level || "Cliente"}</div>
            </div>
          )}

          {/* Simplified Menu Sections */}
          <div
            style={sectionStyles}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <User size={18} style={{ marginRight: "12px", color: "#FF7939" }} />
                <span>Cuenta</span>
              </div>
              <ChevronRight size={16} color="#666" />
            </div>
          </div>

          <div
            style={sectionStyles}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <CreditCard size={18} style={{ marginRight: "12px", color: "#FF7939" }} />
                <span>Suscripciones</span>
              </div>
              <ChevronRight size={16} color="#666" />
            </div>
          </div>

          <div
            style={sectionStyles}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <Palette size={18} style={{ marginRight: "12px", color: "#FF7939" }} />
                <span>Personalización</span>
              </div>
              <ChevronRight size={16} color="#666" />
            </div>
          </div>

          <div
            style={sectionStyles}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#333")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <HelpCircle size={18} style={{ marginRight: "12px", color: "#FF7939" }} />
                <span>Ayuda</span>
              </div>
              <ChevronRight size={16} color="#666" />
            </div>
          </div>

          {/* Login/Logout Button */}
          <div style={{ padding: "16px" }}>
            {isAuthenticated ? (
              <LogoutButton
                variant="destructive"
                onSuccess={() => setIsOpen(false)}
                className="w-full flex items-center justify-center"
              />
            ) : (
              <button
                onClick={handleLogin}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#FF7939",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "500",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#E65B25")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#FF7939")}
              >
                <LogIn size={16} style={{ marginRight: "8px" }} />
                <span>Iniciar sesión</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
