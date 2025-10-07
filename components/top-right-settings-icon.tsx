"use client"

import { Settings } from "lucide-react"

export function TopRightSettingsIcon() {
  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        zIndex: 9999,
        backgroundColor: "white",
        borderRadius: "50%",
        padding: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        cursor: "pointer",
      }}
      onClick={() => alert("Settings icon clicked!")}
    >
      <Settings size={32} color="#000000" />
    </div>
  )
}
