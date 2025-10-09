import { CSVDemo } from '@/components/csv-demo'

export default function CSVDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Importación CSV
          </h1>
          <p className="text-gray-600">
            Configurado para el formato específico del coach
          </p>
        </div>
        
        <CSVDemo />
      </div>
    </div>
  )
}







































