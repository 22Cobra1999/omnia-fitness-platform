import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useAuth } from '@/contexts/auth-context'
import { API_ENDPOINTS } from '@/lib/config/api-config'
import { toast } from "sonner"
import { Product } from "../types"

// Specialized Hooks
import { useConsultationLogic } from "../tabs/ProductsTab/hooks/useConsultationLogic"
import { useProductsFiltering } from "../tabs/ProductsTab/hooks/useProductsFiltering"
import { useProductActions } from "../tabs/ProductsTab/hooks/useProductActions"
import { useCoachOnboarding } from "@/hooks/coach/useCoachOnboarding"

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

// Hook 0: Onboarding Status
    const onboarding = useCoachOnboarding(user?.id)

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

    const hasPreselected = useRef(false)
    const initialConditionedIds = useRef<number[]>([])

    // Effect: Pre-select already conditioned products only ONCE when mode is activated
    useEffect(() => {
        if (isConditioningMode && products.length > 0 && !hasPreselected.current) {
            const alreadyConditionedIds = products
                .filter(p => (p as any).adaptive_rule_ids && (p as any).adaptive_rule_ids.length > 0)
                .map(p => p.id)
            
            if (alreadyConditionedIds.length > 0) {
                setSelectedProductsForConditioning(alreadyConditionedIds)
                initialConditionedIds.current = alreadyConditionedIds
            }
            hasPreselected.current = true
        } else if (!isConditioningMode) {
            // Reset state when exiting mode
            setSelectedProductsForConditioning([])
            hasPreselected.current = false
            initialConditionedIds.current = []
        }
    }, [isConditioningMode, products])

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
        console.log("💾 [OMNIA_RECONSTRUCTOR] Auto-syncing rules:", {
            selected: selectedProductsForConditioning,
            unlinked: initialConditionedIds.current.filter(id => !selectedProductsForConditioning.includes(id))
        })
        try {
            // 1. CLEAR rules for initially conditioned products that ARE NO LONGER selected
            const productsToUnlink = initialConditionedIds.current.filter(
                id => !selectedProductsForConditioning.includes(id)
            )

            if (productsToUnlink.length > 0) {
                await fetch('/api/activities/apply-adaptive-config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productIds: productsToUnlink,
                        config: { adaptive_rule_ids: [] }
                    })
                })
            }

            // 2. APPLY rules to currently selected products
            if (selectedProductsForConditioning.length > 0) {
                const response = await fetch('/api/activities/apply-adaptive-config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productIds: selectedProductsForConditioning,
                        config: rules
                    })
                })

                const result = await response.json()
                if (!result.success) throw new Error(result.error || 'Error al aplicar configuración')
            }

            toast.success('Condicionamiento sincronizado correctamente')
            resetConditioning()
            fetchProducts()
            setIsConditionalRulesPanelOpen(false)
        } catch (error: any) {
            console.error('Error syncing adaptive config:', error)
            toast.error(error.message || 'Error al sincronizar configuración')
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
            isConditionalRulesPanelOpen,
            onboarding
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
