"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"

interface CSVUploadFormProps {
  activityId: string
  activityTitle?: string
}

export function CSVUploadForm({ activityId, activityTitle }: CSVUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [programType, setProgramType] = useState<"fitness" | "nutrition">("fitness")
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    count?: number
    type?: string
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setFile(selectedFile || null)
    setResult(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("programType", programType)
      formData.append("activityId", activityId)
      formData.append("replaceExisting", replaceExisting.toString())

      const response = await fetch("/api/upload-program", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al subir el archivo")
      }

      setResult(data)
      setFile(null)

      // Reset file input
      const fileInput = document.getElementById("csv-file") as HTMLInputElement
      if (fileInput) fileInput.value = ""
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Error desconocido",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Enlace al Google Sheet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Plantilla de Google Sheets
          </CardTitle>
          <CardDescription>Descarga la plantilla oficial para asegurar el formato correcto</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <a
              href="https://docs.google.com/spreadsheets/d/17hB8NMNa8ycfC79p4p96NJqo5A92cHL8/edit?gid=66425028#gid=66425028"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir Plantilla de Google Sheets
            </a>
          </Button>
          <div className="mt-3 text-sm text-muted-foreground">
            <p>
              <strong>Instrucciones:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Abre la plantilla de Google Sheets</li>
              <li>Selecciona la pestaña que necesites (Fitness o Nutrition)</li>
              <li>Completa los datos según tu programa</li>
              <li>Descarga como CSV: Archivo → Descargar → Valores separados por comas (.csv)</li>
              <li>Sube el archivo aquí seleccionando el tipo correcto</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Formulario de subida */}
      <Card>
        <CardHeader>
          <CardTitle>Subir Programa CSV</CardTitle>
          <CardDescription>{activityTitle && `Subiendo para: ${activityTitle}`}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label>Tipo de Programa</Label>
                <RadioGroup
                  value={programType}
                  onValueChange={(value) => setProgramType(value as "fitness" | "nutrition")}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fitness" id="fitness" />
                    <Label htmlFor="fitness">Fitness</Label>
                    <Badge variant="secondary">Ejercicios</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nutrition" id="nutrition" />
                    <Label htmlFor="nutrition">Nutrición</Label>
                    <Badge variant="secondary">Comidas</Badge>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="csv-file">Archivo CSV</Label>
                <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} className="mt-1" />
                {file && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Archivo seleccionado: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="replace" checked={replaceExisting} onCheckedChange={setReplaceExisting} />
                <Label htmlFor="replace" className="text-sm">
                  Reemplazar datos existentes para esta actividad
                </Label>
              </div>

              {result && (
                <Alert variant={result.success ? "default" : "destructive"}>
                  {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertDescription>
                    {result.message}
                    {result.success && result.count && (
                      <div className="mt-1">
                        <Badge variant="outline">{result.count} registros importados</Badge>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button type="submit" disabled={!file || loading} className="w-full">
              {loading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Programa CSV
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
