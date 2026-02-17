import { useRef } from "react"
import { ShoppingCart, ChevronDown } from "lucide-react"

interface ProductPriceActionProps {
    price: number
    productRef: React.RefObject<HTMLDivElement | null>
    isDragging: boolean
    dragOffset: number
    isAnimating: boolean
    onMouseDown: (e: React.MouseEvent) => void
    onMouseMove: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
}

export const ProductPriceAction = ({
    price,
    productRef,
    isDragging,
    dragOffset,
    isAnimating,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchMove,
    onTouchEnd
}: ProductPriceActionProps) => {

    return (
        <div className="mb-4">
            <div
                ref={productRef}
                className="relative bg-gray-800 rounded-xl overflow-hidden cursor-pointer select-none shadow-lg touch-none"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Background with gradient */}
                <div
                    className="bg-gradient-to-r from-[#FF7939] to-[#E66829] p-4 transition-all duration-500 ease-out"
                    style={{
                        transform: `translateX(${isDragging ? Math.min(dragOffset * 0.3, 0) : 0}px)`,
                        filter: isDragging ? 'brightness(1.2) saturate(1.1)' : 'brightness(1) saturate(1)',
                        boxShadow: isDragging ? '0 8px 25px rgba(255, 121, 57, 0.4)' : '0 4px 15px rgba(0, 0, 0, 0.2)'
                    }}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-white transition-all duration-300"
                            style={{
                                transform: isDragging ? 'scale(1.05)' : 'scale(1)',
                                textShadow: 'none'
                            }}>
                            ${price?.toFixed(0) || '0'}
                        </span>
                        <ShoppingCart className="h-6 w-6 text-white transition-all duration-300"
                            style={{
                                transform: isDragging ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)'
                            }} />
                    </div>
                </div>

                {/* Progress overlay */}
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300 ease-out flex items-center justify-end pr-4 pointer-events-none"
                    style={{
                        width: `${Math.min((dragOffset / (productRef.current?.offsetWidth || 1)) * 100, 100)}%`,
                        opacity: isDragging ? 1 : 0,
                        transform: isAnimating ? 'scale(1.02)' : 'scale(1)'
                    }}
                >
                    <div className="flex items-center space-x-2 text-white">
                        <span className="font-bold text-lg">¡Comprar!</span>
                        <ShoppingCart className="h-5 w-5 animate-pulse" />
                    </div>
                </div>

                {/* Swipe indicator */}
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2 text-white transition-all duration-300 pointer-events-none"
                    style={{ opacity: isDragging ? 0 : 0.6 }}>
                    <div className="flex items-center space-x-1">
                        <span className="text-sm">Deslizar</span>
                        <ChevronDown className="h-4 w-4 rotate-90 animate-bounce" />
                    </div>
                </div>

                {/* Success indicator */}
                {isAnimating && dragOffset > 80 && (
                    <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center transition-all duration-300 z-10">
                        <div className="flex items-center space-x-2 text-white">
                            <span className="text-lg font-bold">¡Comprado!</span>
                            <ShoppingCart className="h-6 w-6 animate-bounce" />
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center mt-2">
                <p className="text-orange-400 text-sm font-medium">Desliza el precio hacia la derecha para comprar</p>
            </div>
        </div>
    )
}
