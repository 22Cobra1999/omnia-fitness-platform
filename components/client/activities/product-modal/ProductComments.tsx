"use client"

import React from 'react'
import Image from 'next/image'
import { Star } from 'lucide-react'

interface ProductCommentsProps {
    comments: any[]
    loading: boolean
    rating?: number
    ratingCount?: number
}

export function ProductComments({ comments, loading, rating, ratingCount }: ProductCommentsProps) {
    if (loading) return <div className="text-gray-400 text-sm p-6">Cargando comentarios...</div>

    return (
        <div className="px-6 border-t border-gray-800 pt-4 space-y-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-white font-semibold">Comentarios</h4>
                {rating && rating > 0 && (
                    <div className="flex items-center space-x-1.5">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-white font-medium text-sm">{rating.toFixed(1)}</span>
                        <span className="text-gray-400 text-xs font-normal">({ratingCount ?? comments.length})</span>
                    </div>
                )}
            </div>

            {comments.length > 0 ? (
                <div className="space-y-4">
                    {comments.map((c, i) => (
                        <div key={c.id || i} className="bg-gray-800/50 rounded-lg p-3">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
                                    <Image src={c.user_profiles?.avatar_url || '/placeholder.svg'} alt="User" width={32} height={32} className="object-cover" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-white text-sm font-medium">{c.user_profiles?.full_name || 'Usuario Anónimo'}</p>
                                    <div className="flex items-center space-x-1">
                                        {c.difficulty_rating > 0 && (
                                            <div className="flex items-center space-x-0.5 mr-2">
                                                {[...Array(5)].map((_, j) => (
                                                    <Star key={j} className={`h-3 w-3 ${j < Math.floor(c.difficulty_rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`} />
                                                ))}
                                            </div>
                                        )}
                                        <span className="text-gray-400 text-xs">{new Date(c.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-gray-300 text-sm">{c.comments}</p>
                        </div>
                    ))}
                </div>
            ) : <p className="text-gray-400 text-sm">No hay comentarios aún</p>}
        </div>
    )
}
