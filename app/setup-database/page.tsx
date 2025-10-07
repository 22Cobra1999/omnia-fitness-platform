"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react'

export default function SetupDatabasePage() {
  const [loading, setLoading] = useState(false)
  const [databaseStructure, setDatabaseStructure] = useState<any>(null)
  const [setupResult, setSetupResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const checkDatabaseStructure = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/check-database-structure')
      const result = await response.json()
      
      if (result.success) {
        setDatabaseStructure(result.databaseStructure)
      } else {
        setError(result.error || 'Error al verificar estructura de base de datos')
      }
    } catch (error) {
      setError(`Error de conexión: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const createMissingTables = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/create-missing-tables', {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.success) {
        setSetupResult(result)
        // Recargar la estructura después de crear las tablas
        await checkDatabaseStructure()
      } else {
        setError(result.error || 'Error al crear tablas faltantes')
      }
    } catch (error) {
      setError(`Error de conexión: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (exists: boolean) => {
    return exists ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  const getStatusText = (exists: boolean) => {
    return exists ? '✅ Existe' : '❌ No existe'
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-3">
            🗄️ Configuración de Base de Datos
          </h1>
          <p className="text-gray-400">
            Verificar y crear las tablas necesarias para el sistema de productos
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={checkDatabaseStructure}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            🔍 Verificar Estructura
          </Button>
          
          <Button
            onClick={createMissingTables}
            disabled={loading || !databaseStructure}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            🛠️ Crear Tablas Faltantes
          </Button>
        </div>

        {/* Error */}
        {error && (
          <Alert className="bg-red-900/20 border-red-500">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Resultado del setup */}
        {setupResult && (
          <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
            <CardHeader>
              <CardTitle className="text-white">📊 Resultado de la Configuración</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-white">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-[#1A1A1A] rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {setupResult.summary.scheduleBlocksCreated ? '✅' : '❌'}
                    </div>
                    <div className="text-sm">Schedule Blocks</div>
                  </div>
                  <div className="text-center p-4 bg-[#1A1A1A] rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {setupResult.summary.workshopDetailsCreated ? '✅' : '❌'}
                    </div>
                    <div className="text-sm">Workshop Details</div>
                  </div>
                  <div className="text-center p-4 bg-[#1A1A1A] rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {setupResult.summary.programDetailsCreated ? '✅' : '❌'}
                    </div>
                    <div className="text-sm">Program Details</div>
                  </div>
                  <div className="text-center p-4 bg-[#1A1A1A] rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {setupResult.summary.activitiesUpdated ? '✅' : '❌'}
                    </div>
                    <div className="text-sm">Activities Updated</div>
                  </div>
                </div>
                
                <div className="bg-[#1A1A1A] p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Detalles:</h4>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(setupResult.tablesCreated, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estructura de la base de datos */}
        {databaseStructure && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tabla Activities */}
            <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {getStatusIcon(!databaseStructure.activities.error)}
                  Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-white">
                  <p><strong>Estado:</strong> {getStatusText(!databaseStructure.activities.error)}</p>
                  <p><strong>Columnas:</strong> {databaseStructure.activities.totalColumns}</p>
                  {databaseStructure.activities.hasRequiredFields && (
                    <div>
                      <p className="font-bold mb-1">Campos Requeridos:</p>
                      <div className="grid grid-cols-2 gap-1 text-sm">
                        {Object.entries(databaseStructure.activities.hasRequiredFields).map(([field, exists]) => (
                          <div key={field} className="flex items-center gap-1">
                            {exists ? '✅' : '❌'} {field}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabla User Profiles */}
            <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {getStatusIcon(!databaseStructure.user_profiles.error)}
                  User Profiles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-white">
                  <p><strong>Estado:</strong> {getStatusText(!databaseStructure.user_profiles.error)}</p>
                  <p><strong>Columnas:</strong> {databaseStructure.user_profiles.totalColumns}</p>
                  {databaseStructure.user_profiles.hasRequiredFields && (
                    <div>
                      <p className="font-bold mb-1">Campos Requeridos:</p>
                      <div className="grid grid-cols-2 gap-1 text-sm">
                        {Object.entries(databaseStructure.user_profiles.hasRequiredFields).map(([field, exists]) => (
                          <div key={field} className="flex items-center gap-1">
                            {exists ? '✅' : '❌'} {field}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabla Schedule Blocks */}
            <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {getStatusIcon(databaseStructure.schedule_blocks?.exists || false)}
                  Schedule Blocks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-white">
                  <p><strong>Estado:</strong> {getStatusText(databaseStructure.schedule_blocks?.exists || false)}</p>
                  {!databaseStructure.schedule_blocks?.exists && (
                    <div className="text-yellow-400 text-sm">
                      <p><strong>Sugerencia:</strong> {databaseStructure.schedule_blocks?.suggestion}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabla Workshop Details */}
            <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {getStatusIcon(databaseStructure.workshop_details?.exists || false)}
                  Workshop Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-white">
                  <p><strong>Estado:</strong> {getStatusText(databaseStructure.workshop_details?.exists || false)}</p>
                  {!databaseStructure.workshop_details?.exists && (
                    <div className="text-yellow-400 text-sm">
                      <p><strong>Sugerencia:</strong> {databaseStructure.workshop_details?.suggestion}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Instrucciones */}
        <Card className="bg-[#0A0A0A] border-[#1A1A1A]">
          <CardHeader>
            <CardTitle className="text-white">📋 Instrucciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-white space-y-2">
              <p>1. <strong>Verificar Estructura:</strong> Revisa qué tablas existen y cuáles faltan</p>
              <p>2. <strong>Crear Tablas Faltantes:</strong> Crea las tablas necesarias para el sistema</p>
              <p>3. <strong>Verificar Nuevamente:</strong> Confirma que todas las tablas se crearon correctamente</p>
              <p>4. <strong>Probar Creación de Productos:</strong> Una vez configurado, prueba crear un producto</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


