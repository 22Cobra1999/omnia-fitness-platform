"use client"

export default function DirectSettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Direct Settings Icon Test</h1>
      <p className="mb-4">You should see a settings icon (gear) in the top right corner of this page.</p>

      {/* Inline settings icon */}
      <div
        style={{
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
        }}
        onClick={() => alert("Settings clicked!")}
      >
        ⚙️
      </div>
    </div>
  )
}
