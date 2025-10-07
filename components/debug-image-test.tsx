"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

export default function DebugImageTest() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products')
        const result = await response.json()
        
        if (result.success) {
          setProducts(result.products || [])
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  if (loading) return <div>Cargando...</div>

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Debug de Imágenes</h2>
      {products.map((product, index) => (
        <div key={product.id} className="border p-4 rounded">
          <h3 className="font-semibold">{product.title}</h3>
          <p>ID: {product.id}</p>
          <div className="space-y-2">
            <p><strong>activity_media:</strong> {JSON.stringify(product.activity_media)}</p>
            <p><strong>media:</strong> {JSON.stringify(product.media)}</p>
            
            {product.activity_media?.[0]?.image_url && (
              <div>
                <p><strong>Imagen desde activity_media:</strong></p>
                <div className="relative w-64 h-32">
                  <Image
                    src={product.activity_media[0].image_url}
                    alt={product.title}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error('Error cargando imagen:', e)
                    }}
                    onLoad={() => {
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

