"use client"

export function FallbackSettingsButton() {
  return (
    <button
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        zIndex: 9999,
        backgroundColor: "black",
        color: "white",
        padding: "10px 15px",
        borderRadius: "5px",
        fontWeight: "bold",
        cursor: "pointer",
      }}
      onClick={() => alert("Settings button clicked!")}
    >
      ⚙️ SETTINGS
    </button>
  )
}
