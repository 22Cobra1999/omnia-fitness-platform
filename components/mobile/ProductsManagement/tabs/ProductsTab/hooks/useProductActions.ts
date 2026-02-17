import { useState, useCallback } from "react"
import { toast } from "sonner"
import { Product } from "../../../types"

export function useProductActions(fetchProducts: () => Promise<void>, coachPhone?: string) {
    // Selection & Modals
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)

    // Deletion
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false)
    const [productToDelete, setProductToDelete] = useState<Product | null>(null)
    const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false)
    const [deletedProductName, setDeletedProductName] = useState<string>('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [wasPreviewOpenBeforeEdit, setWasPreviewOpenBeforeEdit] = useState(false)

    // Survey
    const [completedCoachSurveys, setCompletedCoachSurveys] = useState<Record<number, boolean>>({})
    const [showSurveyModalInDetail, setShowSurveyModalInDetail] = useState(false)
    const [surveyModalProduct, setSurveyModalProduct] = useState<Product | null>(null)
    const [surveyModalBlocking, setSurveyModalBlocking] = useState(false)
    const [workshopRating, setWorkshopRating] = useState(0)
    const [workshopFeedback, setWorkshopFeedback] = useState('')
    const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false)
    const [surveySubmitted, setSurveySubmitted] = useState(false)

    // Meet & WhatsApp
    const [isMeetModalOpen, setIsMeetModalOpen] = useState(false)
    const [selectedSaleForMeet, setSelectedSaleForMeet] = useState<any>(null)
    const [meetSchedule, setMeetSchedule] = useState({
        date: '',
        time1: '',
        time2: '',
        meetingName: ''
    })

    const handleDeleteProduct = useCallback((product: Product) => {
        setProductToDelete(product)
        setDeleteConfirmationOpen(true)
    }, [])

    const confirmDelete = useCallback(async () => {
        if (!productToDelete || isDeleting) return
        const pId = productToDelete.id
        const pTitle = productToDelete.title

        setDeleteConfirmationOpen(false)
        setProductToDelete(null)
        setIsDeleting(true)

        try {
            const response = await fetch(`/api/delete-activity-final?id=${pId}`, { method: 'DELETE' })
            if (response.ok) {
                setDeletedProductName(pTitle)
                setDeleteSuccessOpen(true)
                await fetchProducts()
            } else {
                toast.error('Error al eliminar')
                await fetchProducts()
            }
        } catch (error) {
            toast.error('Error al eliminar')
            await fetchProducts()
        } finally {
            setIsDeleting(false)
        }
    }, [productToDelete, isDeleting, fetchProducts])

    const cancelDelete = useCallback(() => {
        setDeleteConfirmationOpen(false)
        setProductToDelete(null)
        setIsDeleting(false)
    }, [])

    const closeDeleteSuccess = useCallback(() => {
        setDeleteSuccessOpen(false)
        setDeletedProductName('')
        setIsDeleting(false)
    }, [])

    const handlePreviewProduct = useCallback(async (product: Product) => {
        const isWorkshopFinished = product.type === 'workshop' && ((product as any).is_finished === true || (product as any).taller_activo === false)
        if (isWorkshopFinished && !completedCoachSurveys[product.id]) {
            try {
                const res = await fetch(`/api/activities/${product.id}/check-coach-survey`)
                const data = await res.json()
                if (data.hasSurvey) {
                    setCompletedCoachSurveys(prev => ({ ...prev, [product.id]: true }))
                } else {
                    setSurveyModalProduct(product)
                    setSurveyModalBlocking(false)
                    setShowSurveyModalInDetail(true)
                }
            } catch (error) {
                console.error(error)
            }
        }
        setSelectedProduct(product)
        setIsProductModalOpen(true)
    }, [completedCoachSurveys])

    const handleWhatsAppClick = useCallback((sale: any) => {
        if (coachPhone) {
            const message = `Hola! Te contacto desde Omnia. ¿Podemos coordinar la consulta de café?`
            const whatsappUrl = `https://wa.me/${coachPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
            window.open(whatsappUrl, '_blank')
        } else {
            toast.error('No se encontró el número de teléfono del coach')
        }
    }, [coachPhone])

    const handleMeetClick = useCallback((sale: any) => {
        setSelectedSaleForMeet(sale)
        setIsMeetModalOpen(true)
        setMeetSchedule({
            date: '',
            time1: '',
            time2: '',
            meetingName: `Consulta de Café con ${sale.userName || 'Cliente'}`
        })
    }, [])

    const handleSendMeet = useCallback(() => {
        if (!meetSchedule.date || !meetSchedule.time1 || !meetSchedule.time2) {
            toast.error('Por favor completa todos los campos')
            return
        }
        console.log('Enviando Meet:', {
            sale: selectedSaleForMeet,
            schedule: meetSchedule
        })
        setIsMeetModalOpen(false)
        setSelectedSaleForMeet(null)
        setMeetSchedule({ date: '', time1: '', time2: '', meetingName: '' })
        toast.success('Invitación enviada')
    }, [meetSchedule, selectedSaleForMeet])

    const handleOpenModal = useCallback(() => {
        setEditingProduct(null)
        setIsModalOpen(true)
    }, [])

    const handleCloseModal = useCallback(async (shouldRefresh?: boolean) => {
        setIsModalOpen(false)
        if (shouldRefresh === true) {
            await fetchProducts()
        }
        setEditingProduct(null)
        if (wasPreviewOpenBeforeEdit && selectedProduct) {
            setIsProductModalOpen(true)
            setWasPreviewOpenBeforeEdit(false)
        }
    }, [fetchProducts, wasPreviewOpenBeforeEdit, selectedProduct])

    const handleEditProduct = useCallback(async (product: Product) => {
        if (isProductModalOpen && selectedProduct?.id === product.id) {
            setWasPreviewOpenBeforeEdit(true)
        }
        setEditingProduct(product)
        setIsModalOpen(true)
    }, [isProductModalOpen, selectedProduct])

    return {
        state: {
            isModalOpen,
            editingProduct,
            selectedProduct,
            isProductModalOpen,
            deleteConfirmationOpen,
            productToDelete,
            deleteSuccessOpen,
            deletedProductName,
            isDeleting,
            showSurveyModalInDetail,
            surveyModalProduct,
            surveyModalBlocking,
            workshopRating,
            workshopFeedback,
            isSubmittingSurvey,
            surveySubmitted,
            isMeetModalOpen,
            selectedSaleForMeet,
            meetSchedule
        },
        actions: {
            setIsModalOpen,
            setEditingProduct,
            setSelectedProduct,
            setIsProductModalOpen,
            setWorkshopRating,
            setWorkshopFeedback,
            setIsSubmittingSurvey,
            setSurveySubmitted,
            handleOpenModal,
            handleCloseModal,
            handleEditProduct,
            handleDeleteProduct,
            confirmDelete,
            cancelDelete,
            closeDeleteSuccess,
            handlePreviewProduct,
            handleWhatsAppClick,
            handleMeetClick,
            handleSendMeet,
            setMeetSchedule,
            setIsMeetModalOpen,
            setShowSurveyModalInDetail,
            setDeleteConfirmationOpen,
            setDeleteSuccessOpen
        }
    }
}
