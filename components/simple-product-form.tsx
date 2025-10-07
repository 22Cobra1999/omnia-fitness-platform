'use client'

import { useState } from 'react'
import { useSimpleLogger } from '@/lib/simple-logger'

// ✅ FORMULARIO SIMPLIFICADO DE CREACIÓN DE PRODUCTOS
// - Verificación general única
// - Extracción clara de campos
// - Sin logs excesivos

interface ProductFormData {
  title: string
  description: string
  price: string
  type: 'program' | 'workshop' | 'consultation'
  categoria?: string
  difficulty?: string
  capacity?: string
  modality?: string
}

export default function SimpleProductForm() {
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    description: '',
    price: '',
    type: 'program',
    categoria: 'fitness',
    difficulty: 'beginner',
    capacity: '20',
    modality: 'online'
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const logger = useSimpleLogger('SimpleProductForm')

  // 🔍 VERIFICACIÓN GENERAL ÚNICA
  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      logger.error('El título es requerido')
      return false
    }
    if (!formData.description.trim()) {
      logger.error('La descripción es requerida')
      return false
    }
    if (!formData.price || isNaN(parseFloat(formData.price))) {
      logger.error('El precio debe ser un número válido')
      return false
    }
    return true
  }

  // 📤 EXTRAER CAMPOS PARA BACKEND
  const extractBackendFields = (data: ProductFormData) => {
    return {
      title: data.title.trim(),
      description: data.description.trim(),
      price: parseFloat(data.price),
      type: data.type,
      categoria: data.categoria || 'fitness',
      difficulty: data.difficulty || 'beginner',
      capacity: data.capacity ? parseInt(data.capacity) : 20,
      modality: data.modality || 'online',
      coach_id: 'mock-coach-id', // Temporal
      is_public: true
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const backendFields = extractBackendFields(formData)
      
      const response = await fetch('/api/create-product-simple-optimized', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backendFields)
      })
      
      const result = await response.json()
      
      if (result.success) {
        logger.success('Producto creado exitosamente')
        // Reset form
        setFormData({
          title: '',
          description: '',
          price: '',
          type: 'program',
          categoria: 'fitness',
          difficulty: 'beginner',
          capacity: '20',
          modality: 'online'
        })
      } else {
        logger.error('Error al crear producto', result.error)
      }
    } catch (error) {
      logger.error('Error de conexión', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-gray-900 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">Crear Producto</h2>
      
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Título *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          required
        />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Descripción *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          rows={3}
          required
        />
      </div>

      {/* Precio */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Precio *
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: e.target.value})}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          required
        />
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Tipo *
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({...formData, type: e.target.value as any})}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="program">Programa</option>
          <option value="workshop">Taller</option>
          <option value="consultation">Consulta</option>
        </select>
      </div>

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        {isSubmitting ? 'Creando...' : 'Crear Producto'}
      </button>
    </form>
  )
}
















