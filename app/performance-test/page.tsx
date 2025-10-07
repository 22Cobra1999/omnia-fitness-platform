"use client"

import { PerformanceDemo } from '@/components/performance-demo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, Zap, Database } from 'lucide-react'

export default function PerformanceTestPage() {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-orange-500">
            🚀 Optimización de Rendimiento OMNIA
          </h1>
          <p className="text-gray-300 text-lg max-w-3xl mx-auto">
            Análisis y comparación de rendimiento entre el sistema actual y las optimizaciones implementadas
          </p>
        </div>

        {/* Problemas identificados */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              Problemas Críticos Identificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-400">APIs Extremadamente Lentas</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-red-900/20 rounded">
                    <span>activities/search</span>
                    <Badge variant="destructive">14,057ms</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-900/20 rounded">
                    <span>profile/biometrics</span>
                    <Badge variant="destructive">4,150ms</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-900/20 rounded">
                    <span>profile/exercise-progress</span>
                    <Badge variant="destructive">4,361ms</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-400">Problemas de Navegación</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-red-900/20 rounded">
                    <span>Cambios de pantalla</span>
                    <Badge variant="destructive">25+ segundos</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-900/20 rounded">
                    <span>Cálculos repetitivos</span>
                    <Badge variant="destructive">Múltiples ejecuciones</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-red-900/20 rounded">
                    <span>Cache Hit Rate</span>
                    <Badge variant="destructive">0.0%</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Soluciones implementadas */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              Soluciones Implementadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Sistema de Caché Inteligente
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• TTL configurable por tipo de datos</li>
                  <li>• Refresco automático en background</li>
                  <li>• Persistencia en localStorage</li>
                  <li>• Invalidación inteligente</li>
                  <li>• Estadísticas de uso</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  APIs Optimizadas
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Queries simplificadas</li>
                  <li>• Caché en memoria del servidor</li>
                  <li>• Respuestas rápidas desde caché</li>
                  <li>• Refresco en background</li>
                  <li>• Límites de resultados</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-green-400 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Precarga Inteligente
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li>• Detección de navegación</li>
                  <li>• Precarga de datos relacionados</li>
                  <li>• Retry automático</li>
                  <li>• Estrategias por tipo de datos</li>
                  <li>• Optimización de memoria</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estrategias de caché */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <Database className="w-5 h-5" />
              Estrategias de Caché por Tipo de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700">
                <h4 className="font-semibold text-blue-400 mb-2">Datos Persistentes</h4>
                <div className="text-sm space-y-1">
                  <div>• Coaches, Perfiles</div>
                  <div>• TTL: 10 minutos</div>
                  <div>• Refresco: 70% TTL</div>
                  <div>• Persistencia: localStorage</div>
                </div>
              </div>

              <div className="p-4 bg-green-900/20 rounded-lg border border-green-700">
                <h4 className="font-semibold text-green-400 mb-2">Datos Moderados</h4>
                <div className="text-sm space-y-1">
                  <div>• Actividades, Métricas</div>
                  <div>• TTL: 2 minutos</div>
                  <div>• Refresco: 50% TTL</div>
                  <div>• Persistencia: sessionStorage</div>
                </div>
              </div>

              <div className="p-4 bg-orange-900/20 rounded-lg border border-orange-700">
                <h4 className="font-semibold text-orange-400 mb-2">Datos Dinámicos</h4>
                <div className="text-sm space-y-1">
                  <div>• Progreso, Estadísticas</div>
                  <div>• TTL: 5 minutos</div>
                  <div>• Refresco: 60% TTL</div>
                  <div>• Persistencia: memoria</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo interactivo */}
        <PerformanceDemo />

        {/* Beneficios esperados */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400">
              <Zap className="w-5 h-5" />
              Beneficios Esperados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-yellow-400">Mejoras de Rendimiento</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-yellow-900/20 rounded">
                    <span>Tiempo de carga inicial</span>
                    <Badge className="bg-green-600">-80%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-900/20 rounded">
                    <span>Navegación entre pantallas</span>
                    <Badge className="bg-green-600">-90%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-900/20 rounded">
                    <span>Uso de memoria</span>
                    <Badge className="bg-green-600">-60%</Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-yellow-400">Experiencia de Usuario</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-yellow-900/20 rounded">
                    <span>Fluidez de navegación</span>
                    <Badge className="bg-green-600">+95%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-900/20 rounded">
                    <span>Tiempo de respuesta</span>
                    <Badge className="bg-green-600">+90%</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-yellow-900/20 rounded">
                    <span>Disponibilidad offline</span>
                    <Badge className="bg-green-600">+70%</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}




























