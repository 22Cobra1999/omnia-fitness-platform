"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from '@/lib/supabase/supabase-client'
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

export function DebugSupabase() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{
    auth: { success: boolean; message: string }
    storage: { success: boolean; message: string }
    database: { success: boolean; message: string }
  } | null>(null)

  const runTests = async () => {
    setLoading(true)
    const supabase = createClient()
    const testResults = {
      auth: { success: false, message: "" },
      storage: { success: false, message: "" },
      database: { success: false, message: "" },
    }

    try {
      // Probar autenticación
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) {
        testResults.auth = { success: false, message: `Error: ${authError.message}` }
      } else if (!authData.user) {
        testResults.auth = { success: false, message: "No hay usuario autenticado" }
      } else {
        testResults.auth = { success: true, message: `Usuario autenticado: ${authData.user.id}` }
      }

      // Probar almacenamiento
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

        if (bucketsError) {
          testResults.storage = { success: false, message: `Error al listar buckets: ${bucketsError.message}` }
        } else {
          const coachContentBucket = buckets?.find((b) => b.name === "coach-content")

          if (!coachContentBucket) {
            testResults.storage = { success: false, message: "No existe el bucket 'coach-content'" }
          } else {
            // Intentar listar archivos
            const { data: files, error: filesError } = await supabase.storage.from("coach-content").list()

            if (filesError) {
              testResults.storage = { success: false, message: `Error al listar archivos: ${filesError.message}` }
            } else {
              testResults.storage = {
                success: true,
                message: `Bucket 'coach-content' accesible. ${files?.length || 0} archivos/carpetas encontrados`,
              }
            }
          }
        }
      } catch (storageError) {
        testResults.storage = {
          success: false,
          message: `Error en almacenamiento: ${storageError instanceof Error ? storageError.message : "Error desconocido"}`,
        }
      }

      // Probar base de datos
      try {
        const { data: activities, error: dbError } = await supabase.from("activities").select("id, title").limit(1)

        if (dbError) {
          testResults.database = { success: false, message: `Error de base de datos: ${dbError.message}` }
        } else {
          testResults.database = {
            success: true,
            message: `Conexión a base de datos correcta. ${activities?.length || 0} actividades encontradas`,
          }
        }
      } catch (dbError) {
        testResults.database = {
          success: false,
          message: `Error en base de datos: ${dbError instanceof Error ? dbError.message : "Error desconocido"}`,
        }
      }
    } catch (error) {
      console.error("Error en diagnóstico:", error)
    } finally {
      setResults(testResults)
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Diagnóstico de Supabase</CardTitle>
        <CardDescription>Verifica la conexión y permisos de Supabase</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <span className="ml-2">Ejecutando pruebas...</span>
          </div>
        ) : results ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-md bg-gray-100">
              {results.auth.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div>
                <h3 className="font-medium">Autenticación</h3>
                <p className="text-sm text-gray-600">{results.auth.message}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-md bg-gray-100">
              {results.storage.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div>
                <h3 className="font-medium">Almacenamiento</h3>
                <p className="text-sm text-gray-600">{results.storage.message}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-md bg-gray-100">
              {results.database.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
              )}
              <div>
                <h3 className="font-medium">Base de datos</h3>
                <p className="text-sm text-gray-600">{results.database.message}</p>
              </div>
            </div>

            {(!results.auth.success || !results.storage.success || !results.database.success) && (
              <div className="flex items-start gap-3 p-3 rounded-md bg-yellow-50 border border-yellow-200">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-700">Problemas detectados</h3>
                  <p className="text-sm text-yellow-600">
                    Se han encontrado problemas que pueden afectar la funcionalidad de la aplicación. Verifica los
                    permisos y la configuración de Supabase.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-6 text-gray-500">
            Haz clic en "Ejecutar diagnóstico" para verificar la conexión a Supabase
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runTests} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ejecutando...
            </>
          ) : (
            "Ejecutar diagnóstico"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
