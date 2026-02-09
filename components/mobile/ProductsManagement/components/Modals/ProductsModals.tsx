import React from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Flame, Trash2, Calendar, Coffee } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import CreateProductModal from '@/components/shared/products/create-product-modal-refactored'
import ClientProductModal from '@/components/client/activities/client-product-modal'
import { Product } from '../../types'

interface ProductsModalsProps {
    state: any
    actions: any
    helpers: any
}

export const ProductsModals: React.FC<ProductsModalsProps> = ({ state, actions, helpers }) => {
    return (
        <>
            {/* Create / Edit Modal */}
            {state.isModalOpen && (
                <CreateProductModal
                    isOpen={state.isModalOpen}
                    onClose={actions.handleCloseModal}
                    editingProduct={state.editingProduct}
                    initialStep={state.shouldOpenWorkshopSchedule ? 'workshopSchedule' : undefined}
                    showDateChangeNotice={state.shouldShowDateChangeNoticeAfterStep5}
                />
            )}

            {/* Detail Modal */}
            {state.selectedProduct && (
                <ClientProductModal
                    isOpen={state.isProductModalOpen}
                    onClose={async () => {
                        actions.setIsProductModalOpen(false)
                    }}
                    product={{
                        ...helpers.convertProductToActivity(state.selectedProduct),
                        isOwnProduct: true
                    }}
                    showEditButton={true}
                    onEdit={() => actions.handleEditProduct(state.selectedProduct)}
                    onDelete={actions.handleDeleteProduct}
                />
            )}

            {/* Survey Modal */}
            {state.showSurveyModalInDetail && state.surveyModalProduct && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
                    <div className="bg-[#0A0A0A] rounded-2xl p-6 max-w-lg w-full border border-[#1A1A1A] max-h-[90vh] overflow-y-auto">
                        <div className="flex flex-col space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-semibold text-lg">Taller finalizado</h3>
                                {!state.surveyModalBlocking && (
                                    <button onClick={() => actions.setShowSurveyModalInDetail(false)} className="text-gray-400">
                                        <X className="h-5 w-5" />
                                    </button>
                                )}
                            </div>

                            {!state.surveySubmitted ? (
                                <>
                                    <p className="text-gray-400 text-sm">
                                        {state.surveyModalBlocking ? "Completa la encuesta para editar." : "Taller finalizado. Completa la encuesta."}
                                    </p>
                                    <div className="space-y-4 pt-4 border-t border-gray-800">
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => actions.setWorkshopRating(star)}
                                                    className={`w-10 h-10 rounded-lg ${star <= state.workshopRating ? 'bg-[#FF7939]' : 'bg-gray-800'}`}
                                                >
                                                    {star}
                                                </button>
                                            ))}
                                        </div>
                                        <Textarea
                                            value={state.workshopFeedback}
                                            onChange={(e) => actions.setWorkshopFeedback(e.target.value)}
                                            placeholder="Comentarios..."
                                            className="bg-gray-900 text-white"
                                        />
                                    </div>
                                    <Button
                                        onClick={async () => {
                                            actions.setIsSubmittingSurvey(true)
                                            // ... fetch call ...
                                            actions.setSurveySubmitted(true)
                                            actions.setIsSubmittingSurvey(false)
                                            actions.fetchProducts()
                                        }}
                                        disabled={state.isSubmittingSurvey || state.workshopRating === 0}
                                        className="bg-[#FF7939]"
                                    >
                                        Enviar encuesta
                                    </Button>
                                </>
                            ) : (
                                <div className="text-center">
                                    <Flame className="w-8 h-8 text-green-400 mx-auto" />
                                    <h3 className="text-white mt-4">Encuesta enviada</h3>
                                    <Button onClick={() => actions.setShowSurveyModalInDetail(false)}>Cerrar</Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <Dialog open={state.deleteConfirmationOpen} onOpenChange={actions.setDeleteConfirmationOpen}>
                <DialogContent className="bg-black border-none text-white max-w-sm rounded-3xl p-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-6">
                            <Trash2 className="w-8 h-8 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-bold">¿Eliminar actividad?</DialogTitle>
                        <DialogDescription className="text-gray-300 mb-6">
                            Estás por eliminar <span className="text-[#FF7939] font-semibold">{state.productToDelete?.title}</span>
                        </DialogDescription>
                        <div className="flex flex-col gap-3 w-full">
                            <Button onClick={actions.confirmDelete} disabled={state.isDeleting} className="bg-red-500 hover:bg-red-600 h-12 rounded-xl">
                                {state.isDeleting ? "Eliminando..." : "Eliminar"}
                            </Button>
                            <Button onClick={actions.cancelDelete} variant="ghost" className="text-gray-400">Cancelar</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Meet Modal */}
            <Dialog open={state.isMeetModalOpen} onOpenChange={actions.setIsMeetModalOpen}>
                <DialogContent className="bg-[#0A0A0A] border-[#1A1A1A] text-white">
                    <DialogHeader>
                        <DialogTitle>{state.meetSchedule.meetingName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs text-gray-400">Fecha</label>
                            <input
                                type="date"
                                value={state.meetSchedule.date}
                                onChange={(e) => actions.setMeetSchedule({ ...state.meetSchedule, date: e.target.value })}
                                className="w-full bg-[#1A1A1A] border-none rounded-lg p-2 text-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Horario 1</label>
                                <input
                                    type="time"
                                    value={state.meetSchedule.time1}
                                    onChange={(e) => actions.setMeetSchedule({ ...state.meetSchedule, time1: e.target.value })}
                                    className="w-full bg-[#1A1A1A] border-none rounded-lg p-2 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-400">Horario 2 (Opcional)</label>
                                <input
                                    type="time"
                                    value={state.meetSchedule.time2}
                                    onChange={(e) => actions.setMeetSchedule({ ...state.meetSchedule, time2: e.target.value })}
                                    className="w-full bg-[#1A1A1A] border-none rounded-lg p-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => actions.setIsMeetModalOpen(false)}>Cancelar</Button>
                        <Button onClick={actions.handleSendMeet} className="bg-[#FF7939] hover:bg-[#E66829]">Enviar</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Success Modal */}
            <Dialog open={state.deleteSuccessOpen} onOpenChange={actions.setDeleteSuccessOpen}>
                <DialogContent className="bg-black border-none text-white max-w-sm rounded-3xl p-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
                            <Flame className="w-8 h-8 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-bold">¡Eliminado!</DialogTitle>
                        <DialogDescription className="text-gray-300 mb-6">
                            <span className="text-white font-semibold">{state.deletedProductName}</span> ha sido eliminado correctamente.
                        </DialogDescription>
                        <Button onClick={actions.closeDeleteSuccess} className="bg-green-500 hover:bg-green-600 h-12 rounded-xl w-full">
                            Entendido
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
