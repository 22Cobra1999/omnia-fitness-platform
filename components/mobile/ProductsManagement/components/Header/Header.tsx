import React from 'react'

interface HeaderProps {
    activeMainTab: 'products' | 'exercises' | 'storage'
    onTabChange: (tab: 'products' | 'exercises' | 'storage') => void
}

export const Header: React.FC<HeaderProps> = ({ activeMainTab, onTabChange }) => {
    return (
        <div className="mt-8 mb-10">
            <div className="flex items-center justify-between mb-4 relative">
                <div className="absolute left-1/2 transform translate-x-[-45%] flex items-center gap-6">
                    <button
                        onClick={() => onTabChange('products')}
                        className={`text-sm transition-all ${activeMainTab === 'products'
                            ? 'text-[#FF7939] font-medium'
                            : 'text-gray-500 hover:text-gray-400'
                            }`}
                    >
                        Productos
                    </button>
                    <button
                        onClick={() => onTabChange('exercises')}
                        className={`text-sm transition-all ${activeMainTab === 'exercises'
                            ? 'text-[#FF7939] font-medium'
                            : 'text-gray-500 hover:text-gray-400'
                            }`}
                    >
                        Ejercicios/Platos
                    </button>
                    <button
                        onClick={() => onTabChange('storage')}
                        className={`text-sm transition-all ${activeMainTab === 'storage'
                            ? 'text-[#FF7939] font-medium'
                            : 'text-gray-500 hover:text-gray-400'
                            }`}
                    >
                        Almacenamiento
                    </button>
                </div>
            </div>
        </div>
    )
}
