"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2 } from "lucide-react"
import Papa from "papaparse"

interface ProgramImportFormProps {
  activityId: string
  coachId: string
}

export function ProgramImportForm({ activityId, coachId }: ProgramImportFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [programType, setProgramType] = useState<"fitness" | "nutrition">("fitness")
  const [previewData, setPreviewData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setError(null)
    setResult(null)

    if (!selectedFile) {
      setFile(null)
      setPreviewData([])
      return
    }

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Solo se permiten archivos CSV")
      setFile(null)
      setPreviewData([])
      return
    }

    setFile(selectedFile)

    // Parsear CSV para vista previa
    Papa.parse(selectedFile, {
      header: true,
      preview: 5, // Mostrar solo las primeras 5 filas
      skipEmptyLines: true,
      complete: (results) => {
        console.log("Vista previa del CSV:", results.data)
        setPreviewData(results.data as any[])
      },
      error: (error) => {
        console.error("Error al parsear CSV:", error)
        setError(`Error al leer el archivo: ${error.message}`)
        setPreviewData([])
      },
    })
  }

  const resetForm = () => {
    setFile(null)
    setPreviewData([])
    setError(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log(`Procesando archivo CSV para ${programType}, actividad ${activityId}, tamaño: ${file.size} bytes`)

      // Parsear el archivo completo
      console.log("Iniciando parsing del archivo...")
      const parseResult = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject,
        })
      })

      console.log("Papa Parse completado, filas encontradas:", parseResult.data.length)
      console.log("Parsing completado, " + parseResult.data.length + " filas encontradas (incluyendo encabezados)")

      if (parseResult.errors.length > 0) {
        throw new Error(`Error al parsear el archivo: ${parseResult.errors[0].message}`)
      }

      if (parseResult.data.length === 0) {
        throw new Error("El archivo CSV está vacío")
      }

      console.log("Procesando " + parseResult.data.length + " filas de datos")

      // Crear FormData
      const formData = new FormData()
      formData.append("file", file)
      formData.append("activityId", activityId)
      formData.append("coachId", coachId)
      formData.append("programType", programType)

      console.log("Datos procesados correctamente, enviando " + parseResult.data.length + " registros al servidor...")

      // Primera petición para guardar los datos
      const response = await fetch("/api/import-program", {
        method: "POST",
        body: formData,
      })

      console.log("Respuesta recibida del servidor, status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || `Error del servidor: ${response.status} ${response.statusText}`)
      }

      // Intentar parsear la respuesta como JSON
      let responseData
      try {
        const responseText = await response.text()
        console.log("Respuesta del servidor (primeros 100 caracteres):", responseText.substring(0, 100))

        // Verificar si la respuesta es HTML
        if (responseText.trim().startsWith("<!DOCTYPE") || responseText.trim().startsWith("<html")) {
          throw new Error("El servidor devolvió HTML en lugar de JSON. Posible error interno del servidor.")
        }

        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Error al parsear la respuesta JSON:", parseError)
        throw new Error(
          `Error al procesar la respuesta del servidor: ${parseError instanceof Error ? parseError.message : "Error desconocido"}`,
        )
      }

      console.log("Respuesta procesada correctamente:", responseData)

      setResult({
        success: true,
        message: responseData.message || `Se importaron los datos correctamente`,
      })

      // Resetear el formulario después de un éxito
      setTimeout(() => {
        resetForm()
      }, 3000)
    } catch (error) {
      console.error("Error en la petición fetch:", error)
      setResult({
        success: false,
        message: `Error de conexión: ${error instanceof Error ? error.message : "Error desconocido"}`,
      })
      setError(`Error procesando archivo: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Importar Programa</CardTitle>
        <CardDescription>Sube un archivo CSV con los detalles del programa para importar</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="program-type">Tipo de Programa</Label>
              <RadioGroup
                id="program-type"
                value={programType}
                onValueChange={(value) => setProgramType(value as "fitness" | "nutrition")}
                className="flex flex-col space-y-1 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fitness" id="fitness" />
                  <Label htmlFor="fitness" className="font-normal">
                    Fitness
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="nutrition" id="nutrition" />
                  <Label htmlFor="nutrition" className="font-normal">
                    Nutrición
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="csv-file">Archivo CSV</Label>
              <Input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                {programType === "fitness"
                  ? "El archivo debe contener columnas para: Día, Semana, Nombre de la Actividad, Descripción, etc."
                  : "El archivo debe contener columnas para: Día, Semana, Comida, Nombre, Calorías, etc."}
              </p>
            </div>

            {file && previewData.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Vista previa:</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(previewData[0]).map((header) => (
                          <th
                            key={header}
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {Object.values(row).map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 whitespace-nowrap text-xs">
                              {cell as string}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Mostrando {previewData.length} de {file ? "múltiples" : "0"} filas
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertTitle>{result.success ? "Éxito" : "Error"}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!file || loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Importar Programa
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-start border-t px-6 py-4">
        <h3 className="text-sm font-medium mb-2">Formato esperado:</h3>
        {programType === "fitness" ? (
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              • <strong>Día</strong>: Número del día o texto (ej: "Lunes")
            </p>
            <p>
              • <strong>Semana</strong>: Número de la semana
            </p>
            <p>
              • <strong>Nombre de la Actividad</strong>: Texto descriptivo
            </p>
            <p>
              • <strong>Descripción</strong>: Texto detallado
            </p>
            <p>
              • <strong>Duración (min)</strong>: Tiempo en minutos
            </p>
            <p>
              • <strong>Tipo de Ejercicio</strong>: Categoría del ejercicio
            </p>
            <p>
              • <strong>Repeticiones</strong>: Número de repeticiones
            </p>
            <p>
              • <strong>Series</strong>: Número de series
            </p>
            <p>
              • <strong>Intervalo</strong>: Tiempo/distancia
            </p>
            <p>
              • <strong>Descanso</strong>: Tiempo de descanso
            </p>
            <p>
              • <strong>Peso</strong>: Peso utilizado
            </p>
            <p>
              • <strong>Nivel de Intensidad</strong>: Bajo/Medio/Alto
            </p>
            <p>
              • <strong>Equipo Necesario</strong>: Material requerido
            </p>
            <p>
              • <strong>1RM</strong>: Repetición máxima
            </p>
          </div>
        ) : (
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              • <strong>Día</strong>: Número del día o texto (ej: "Lunes")
            </p>
            <p>
              • <strong>Semana</strong>: Número de la semana
            </p>
            <p>
              • <strong>Comida</strong>: Desayuno/Almuerzo/Cena/Snack
            </p>
            <p>
              • <strong>Nombre</strong>: Nombre del plato
            </p>
            <p>
              • <strong>Calorías</strong>: Valor calórico
            </p>
            <p>
              • <strong>Proteínas (g)</strong>: Gramos de proteína
            </p>
            <p>
              • <strong>Carbohidratos (g)</strong>: Gramos de carbohidratos
            </p>
            <p>
              • <strong>Peso/Cantidad</strong>: Peso o porción
            </p>
            <p>
              • <strong>Receta/Notas</strong>: Instrucciones o comentarios
            </p>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
