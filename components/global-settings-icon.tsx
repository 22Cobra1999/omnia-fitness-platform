"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"

export function GlobalSettingsIcon() {
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

  // Inline styles to ensure consistent positioning
  const iconStyles: React.CSSProperties = {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 9999,
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    backgroundColor: "#000",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    cursor: "pointer",
    border: "2px solid white",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  }

  const menuStyles: React.CSSProperties = {
    position: "fixed",
    top: "80px",
    right: "20px",
    width: "300px",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    zIndex: 9999,
    border: "2px solid #ddd",
    maxHeight: "80vh",
    overflowY: "auto",
  }

  return (
    <div ref={menuRef}>
      {/* Settings Icon Button */}
      <button onClick={() => setIsOpen(!isOpen)} style={iconStyles} aria-label="Settings">
        ⚙️
      </button>

      {/* Settings Menu */}
      {isOpen && (
        <div style={menuStyles}>
          <div style={{ padding: "16px" }}>
            <section style={{ marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>🔐 Account</h2>
              <ul>
                <li
                  style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Change email or password
                </li>
                <li
                  style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Connected accounts
                </li>
                <li
                  style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Notification preferences
                </li>
              </ul>
            </section>

            <hr style={{ margin: "16px 0", borderTop: "1px solid #eee" }} />

            <section style={{ marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>🧾 Subscriptions</h2>
              <ul>
                <li
                  style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  View & manage subscriptions
                </li>
                <li
                  style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Payment history
                </li>
                <li
                  style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Payment method
                </li>
              </ul>
            </section>

            <hr style={{ margin: "16px 0", borderTop: "1px solid #eee" }} />

            <section style={{ marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>🌗 Personalization</h2>
              <ul>
                <li
                  style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Dark / Light mode
                </li>
                <li
                  style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Language preferences
                </li>
                <li
                  style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Default content filters
                </li>
              </ul>
            </section>

            <hr style={{ margin: "16px 0", borderTop: "1px solid #eee" }} />

            <section style={{ marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>☎️ Support</h2>
              <ul>
                <li
                  style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Send feedback
                </li>
                <li
                  style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Report a bug
                </li>
                <li
                  style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f0f0f0")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  Help Center / FAQ
                </li>
              </ul>
            </section>

            <hr style={{ margin: "16px 0", borderTop: "1px solid #eee" }} />

            <section>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "8px" }}>🚪 Session</h2>
              <button
                style={{
                  width: "100%",
                  padding: "8px",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#d32f2f")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f44336")}
              >
                Log out
              </button>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
