import React from "react"
import { Package, Coffee } from "lucide-react"
import ActivityCard from "@/components/shared/activities/ActivityCard"

interface CoachProfileProductsProps {
    coachProducts: any[]
    loadingProducts: boolean
    isCafeViewOpen: boolean
    setIsCafeViewOpen: (open: boolean | ((prev: boolean) => boolean)) => void
    coachConsultations: {
        express: { active: boolean }
        puntual: { active: boolean }
        profunda: { active: boolean }
    }
    handleProductClick: (product: any) => void
}

export const CoachProfileProducts: React.FC<CoachProfileProductsProps> = ({
    coachProducts,
    loadingProducts,
    isCafeViewOpen,
    setIsCafeViewOpen,
    coachConsultations,
    handleProductClick,
}) => {
    const hasActiveConsultations =
        coachConsultations.express.active ||
        coachConsultations.puntual.active ||
        coachConsultations.profunda.active

    return (
        <div className="px-6 pt-2 pb-16">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center">
                    <Package className="w-5 h-5 mr-2 text-[#FF7939]" />
                    Productos ({coachProducts.length})
                </h2>

                <button
                    onClick={() => setIsCafeViewOpen((prev) => !prev)}
                    className={
                        "relative w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 " +
                        "backdrop-blur-md bg-white/5 hover:bg-white/10 " +
                        "shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
                    }
                    style={{
                        borderColor: hasActiveConsultations
                            ? "rgba(255,121,57,0.65)"
                            : "rgba(255,255,255,0.14)",
                    }}
                >
                    < Coffee
                        className={"h-5 w-5 transition-all duration-200 " + (isCafeViewOpen ? "opacity-40" : "opacity-100")}
                        style={{
                            color: hasActiveConsultations ? "#FF7939" : "#9CA3AF",
                        }}
                    />
                </button>
            </div>

            {loadingProducts ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF7939]"></div>
                </div>
            ) : coachProducts.length > 0 ? (
                <div className="overflow-x-auto">
                    <div className="flex gap-4" style={{ minWidth: "min-content" }}>
                        {coachProducts.map((product, index) => (
                            <ActivityCard
                                key={product.id || `product-${index}`}
                                activity={product}
                                onClick={() => handleProductClick(product)}
                                size="small"
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Este coach aún no tiene productos disponibles</p>
                </div>
            )}
        </div>
    )
}
