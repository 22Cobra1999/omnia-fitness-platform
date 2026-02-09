import { useState, useEffect } from 'react'
import { DocumentMaterialState } from '../../product-constants'

export function useDocumentLogic(editingProduct: any, selectedType: string | null) {
    const [documentMaterial, setDocumentMaterial] = useState<DocumentMaterialState>({
        pdfType: 'general',
        pdfFile: null,
        pdfUrl: null,
        pdfFileName: null,
        topics: [],
        topicPdfs: {}
    })

    // Document specific form fields
    const [documentType, setDocumentType] = useState('')
    const [pages, setPages] = useState('')

    useEffect(() => {
        if (editingProduct && selectedType === 'document') {
            setDocumentMaterial({
                pdfType: editingProduct.pdf_url ? 'general' : (editingProduct.topicPdfs ? 'by-topic' : 'general'),
                pdfFile: null,
                pdfUrl: editingProduct.pdf_url || null,
                pdfFileName: editingProduct.pdf_url?.split('/').pop() || null,
                topics: editingProduct.topics || [],
                topicPdfs: editingProduct.topicPdfs || {}
            })
            // If documentType or pages exist in editingProduct, set them
            // Assuming they might be mapped or stored differently
        }
    }, [editingProduct, selectedType])

    return {
        documentMaterial,
        setDocumentMaterial,
        documentType, setDocumentType,
        pages, setPages
    }
}
