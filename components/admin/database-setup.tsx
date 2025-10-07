"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Database, RefreshCw } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

export function DatabaseSetup() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const supabase = getSupabaseClient()

  const runMigration = async () => {
    setIsLoading(true)
    setStatus("loading")
    setMessage("Setting up database schema...")

    try {
      // Fetch the migration SQL
      const response = await fetch("/api/admin/run-migration", {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to run migration")
      }

      const result = await response.json()
      setStatus("success")
      setMessage(result.message || "Database setup completed successfully")
    } catch (error: any) {
      console.error("Migration error:", error)
      setStatus("error")
      setMessage(error.message || "An error occurred during database setup")
    } finally {
      setIsLoading(false)
    }
  }

  const checkConnection = async () => {
    setIsLoading(true)
    setStatus("loading")
    setMessage("Checking database connection...")

    try {
      const { data, error } = await supabase.from("user_profiles").select("count(*)").limit(1)

      if (error) throw error

      setStatus("success")
      setMessage("Database connection successful")
    } catch (error: any) {
      console.error("Connection error:", error)
      setStatus("error")
      setMessage(error.message || "Failed to connect to database")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Supabase Database Setup
        </CardTitle>
        <CardDescription>Set up your database schema for the OMNIA fitness platform</CardDescription>
      </CardHeader>
      <CardContent>
        {status === "success" && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert className="mb-4 bg-red-50 text-red-800 border-red-200" variant="destructive">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            This utility will set up the necessary tables and security policies in your Supabase database. Make sure you
            have the correct environment variables configured.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={checkConnection} disabled={isLoading}>
          {isLoading && status === "loading" ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : "Check Connection"}
        </Button>
        <Button onClick={runMigration} disabled={isLoading}>
          {isLoading && status === "loading" ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Setting Up...
            </>
          ) : (
            "Run Migration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
