import { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from '@/contexts/auth-context'
import { API_ENDPOINTS } from '@/lib/config/api-config'
import { toast } from "sonner"
import { Product } from "../types"

// Specialized Hooks
import { useConsultationLogic } from "../tabs/ProductsTab/hooks/useConsultationLogic"
import { useProductsFiltering } from "../tabs/ProductsTab/hooks/useProductsFiltering"
import { useProductActions } from "../tabs/ProductsTab/hooks/useProductActions"

export function useProductsManagementLogic() {
    const { user, loading: authLoading } = useAuth()

    // UI Tabs State
    const [activeMainTab, setActiveMainTab] = useState<'products' | 'exercises' | 'storage'>('products')
    const [activeSubTab, setActiveSubTab] = useState<'fitness' | 'nutrition'>('fitness')
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [editingPrice, setEditingPrice] = useState<string | null>(null)

    // OMNIA Adaptive Mode State
    const [isConditioningMode, setIsConditioningMode] = useState(false)
    const [selectedProductsForConditioning, setSelectedProductsForConditioning] = useState<number[]>([])
    const [isConditionalRulesPanelOpen, setIsConditionalRulesPanelOpen] = useState(false)

    // Hook 1: Consultation Logic
    const consultation = useConsultationLogic(user?.id)

    // Hook 2: Filtering & Stats
    const filtering = useProductsFiltering(products)

    // Hook 3: Actions (CRUD)
    const fetchProducts = useCallback(async () => {
        console.log("📡 [ProductsLogicV2] Calling fetchProducts API...")
        try {
            setLoading(true)
            const response = await fetch(API_ENDPOINTS.PRODUCTS, { credentials: 'include' })
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const result = await response.json()
            if (result.success) {
                setProducts(result.products || [])
            }
        } catch (error) {
            console.error('Error fetching products:', error)
            toast.error('Error al cargar productos')
        } finally {
            setLoading(false)
        }
    }, [])

    const productActions = useProductActions(fetchProducts, consultation.state.coachPhone)

    // Adaptive Motor Logic
    const toggleProductConditioning = (productId: number) => {
        setSelectedProductsForConditioning(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        )
    }

    const resetConditioning = () => {
        setIsConditioningMode(false)
        setSelectedProductsForConditioning([])
        setIsConditionalRulesPanelOpen(false)
    }

    const handleApplyConditioning = () => {
        if (selectedProductsForConditioning.length > 0) {
            setIsConditionalRulesPanelOpen(true)
        }
    }

    const handleSaveConditioning = async (rules: any) => {
        console.log("💾 [OMNIA_RECONSTRUCTOR] Saving rules to programs:", selectedProductsForConditioning, rules)
        try {
            const response = await fetch('/api/activities/apply-adaptive-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productIds: selectedProductsForConditioning,
                    config: rules
                })
            })

            const result = await response.json()
            if (result.success) {
                toast.success('Configuración aplicada correctamente')
                resetConditioning()
                fetchProducts()
            } else {
                throw new Error(result.error || 'Error desconocido')
            }
        } catch (error: any) {
            console.error('Error saving adaptive config:', error)
            toast.error(error.message || 'Error al aplicar configuración')
        }
    }

    // Initial Data Load
    useEffect(() => {
        if (authLoading || !user?.id) return

        const loadData = async () => {
            console.log("🔄 [ProductsLogicV2] Initial data fetch for user:", user?.id)
            try {
                setLoading(true)
                await Promise.all([
                    fetchProducts(),
                    consultation.actions.fetchCafeConsultation()
                ])
                console.log("✅ [ProductsLogicV2] Initial data load complete")
            } catch (err) {
                console.error("❌ [ProductsLogicV2] Error loading initial data:", err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [authLoading, user?.id])

    // Event Listeners
    useEffect(() => {
        const handleProductCreated = () => fetchProducts()
        const handleProductUpdated = () => fetchProducts()
        const handleProductPauseChanged = (event: any) => {
            const { productId, is_paused } = event.detail
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_paused } : p))
        }

        window.addEventListener('productCreated', handleProductCreated as EventListener)
        window.addEventListener('productUpdated', handleProductUpdated as EventListener)
        window.addEventListener('productPauseChanged', handleProductPauseChanged as EventListener)

        return () => {
            window.removeEventListener('productCreated', handleProductCreated as EventListener)
            window.removeEventListener('productUpdated', handleProductUpdated as EventListener)
            window.removeEventListener('productPauseChanged', handleProductPauseChanged as EventListener)
        }
    }, [fetchProducts])

    return {
        state: {
            ...consultation.state,
            ...filtering.state,
            ...productActions.state,
            loading,
            activeMainTab,
            activeSubTab,
            editingPrice,
            user,
            isConditioningMode,
            selectedProductsForConditioning,
            isConditionalRulesPanelOpen
        },
        actions: {
            ...consultation.actions,
            ...filtering.actions,
            ...productActions.actions,
            setActiveMainTab,
            setActiveSubTab,
            setEditingPrice,
            fetchProducts,
            setIsConditioningMode,
            toggleProductConditioning,
            resetConditioning,
            setIsConditionalRulesPanelOpen,
            handleApplyConditioning,
            handleSaveConditioning
        }
    }
}
