"use client"

import { useState } from "react"
import { setupDatabase } from "@/app/actions/setup-db"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function SetupDatabase() {
  const [isSetup, setIsSetup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const runSetup = async () => {
    setLoading(true)
    try {
      const result = await setupDatabase()
      if (result.success) {
        setIsSetup(true)
      } else {
        setError(result.error || "Setup failed")
      }
    } catch (error) {
      setError("An unexpected error occurred during setup")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <h1 className="text-2xl font-bold">Database Setup</h1>

      {isSetup ? (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription>Database setup completed successfully!</AlertDescription>
        </Alert>
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button onClick={runSetup} disabled={isSetup || loading} className="w-full max-w-xs">
        {loading ? "Setting up..." : isSetup ? "Setup Complete" : "Initialize Database"}
      </Button>

      {!isSetup && !error && (
        <p className="text-sm text-muted-foreground text-center max-w-md">
          This will create necessary tables and security policies in your Supabase project. You only need to run this
          once.
        </p>
      )}
    </div>
  )
}
