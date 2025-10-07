"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function TestImportForm() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const testGet = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-import", {
        method: "GET",
      })


      const responseText = await response.text()

      if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html")) {
        setResult(`❌ ERROR: Recibido HTML en lugar de JSON:\n${responseText.substring(0, 200)}...`)
        return
      }

      const data = JSON.parse(responseText)
      setResult(`✅ GET exitoso: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      console.error("❌ Error en test GET:", error)
      setResult(`❌ Error GET: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  const testPost = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/test-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          test: "data",
          timestamp: new Date().toISOString(),
        }),
      })


      const responseText = await response.text()

      if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html")) {
        setResult(`❌ ERROR: Recibido HTML en lugar de JSON:\n${responseText.substring(0, 200)}...`)
        return
      }

      const data = JSON.parse(responseText)
      setResult(`✅ POST exitoso: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      console.error("❌ Error en test POST:", error)
      setResult(`❌ Error POST: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  const testFormData = async () => {
    setLoading(true)
    setResult(null)

    try {

      // Crear un archivo de prueba
      const testCsvContent = "Día,Semana,Comida\n1,1,Desayuno\n2,1,Almuerzo"
      const testFile = new File([testCsvContent], "test.csv", { type: "text/csv" })

      const formData = new FormData()
      formData.append("file", testFile)
      formData.append("activityId", "21")
      formData.append("coachId", "test-coach")
      formData.append("programType", "nutrition")

      const response = await fetch("/api/import-program", {
        method: "POST",
        body: formData,
      })


      const responseText = await response.text()

      if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html")) {
        setResult(`❌ ERROR: Recibido HTML en lugar de JSON:\n${responseText.substring(0, 300)}...`)
        return
      }

      const data = JSON.parse(responseText)
      setResult(`✅ FormData exitoso: ${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      console.error("❌ Error en test FormData:", error)
      setResult(`❌ Error FormData: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Test de API Routes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testGet} disabled={loading} variant="outline">
            Test GET
          </Button>
          <Button onClick={testPost} disabled={loading} variant="outline">
            Test POST JSON
          </Button>
          <Button onClick={testFormData} disabled={loading} variant="outline">
            Test POST FormData
          </Button>
        </div>

        {result && (
          <Alert>
            <AlertDescription>
              <pre className="whitespace-pre-wrap text-xs">{result}</pre>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
