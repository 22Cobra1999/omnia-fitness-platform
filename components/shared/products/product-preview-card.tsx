"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { motion } from "framer-motion"
import { useProductPreviewLogic, ProductPreviewLogicProps } from "./hooks/useProductPreviewLogic"
import { ProductImage } from "./ProductPreviewCard/ProductImage"
import { ProductInfo } from "./ProductPreviewCard/ProductInfo"
import { ProductDetails } from "./ProductPreviewCard/ProductDetails"
import { ProductPriceAction } from "./ProductPreviewCard/ProductPriceAction"

interface ProductPreviewCardProps extends ProductPreviewLogicProps {
  showPurchaseButton?: boolean
  onExpand?: () => void
  isPreview?: boolean
}

export function ProductPreviewCard({
  product,
  showPurchaseButton = true,
  onPurchase,
  onExpand,
  isPreview = true,
  csvData
}: ProductPreviewCardProps) {

  // Logic extraction
  const {
    isDragging,
    dragOffset,
    isAnimating,
    priceRef,
    getTypeIcon,
    getTypeLabel,
    getTypeColor,
    getProductImage,
    getProductDetails,
    handleDragStart,
    handleDragMove,
    handleDragEnd
  } = useProductPreviewLogic({ product, onPurchase, csvData })

  // Wrappers for mouse/touch events to pass clientX
  const onMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX)
  const onMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX)
  const onTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX)
  const onTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX)

  return (
    <motion.div
      whileHover={{ scale: isPreview ? 1 : 1.03 }}
      transition={{ duration: 0.2 }}
      className="w-full max-w-sm"
    >
      <Card className="bg-[#1E1E1E] border-none overflow-hidden shadow-lg">
        <CardContent className="p-0">
          <ProductImage
            title={product.title}
            imageUrl={getProductImage()}
            videoUrl={product.videoUrl || null}
            typeIcon={React.createElement(getTypeIcon() as any, { className: "text-white text-2xl" })}
            typeLabel={getTypeLabel()}
            typeColor={getTypeColor()}
            isPreview={isPreview}
          />

          <div className="p-4">
            <ProductInfo
              title={product.title}
              description={product.description}
            />

            <ProductDetails details={getProductDetails()} />

            <ProductPriceAction
              price={product.price}
              productRef={priceRef}
              isDragging={isDragging}
              dragOffset={dragOffset}
              isAnimating={isAnimating}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={handleDragEnd}
            />

            {onExpand && (
              <Button
                variant="ghost"
                className="w-full text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 border border-orange-400/20 py-3 rounded-xl transition-all duration-300"
                onClick={onExpand}
              >
                <ChevronDown className="w-5 h-5 mr-2" />
                Ver más
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
