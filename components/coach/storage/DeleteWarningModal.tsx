import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { StorageFile } from '../hooks/storage/useStorageLogic'

interface DeleteWarningModalProps {
    show: boolean
    file: StorageFile | null
    onClose: () => void
    onConfirm: () => void
}

export function DeleteWarningModal({ show, file, onClose, onConfirm }: DeleteWarningModalProps) {
    if (!show || !file) return null

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-6" onClick={onClose}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[#111] border border-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="bg-red-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-4"><Trash2 className="w-6 h-6 text-red-500" /></div>
                <h3 className="text-white text-lg font-bold mb-2">¿Eliminar archivo?</h3>
                <p className="text-gray-400 text-xs mb-6">{file.activities.length > 0 ? `Este archivo se eliminará de ${file.activities.length} actividades.` : 'Esta acción eliminará el archivo de forma permanente.'}</p>
                <div className="flex gap-3">
                    <button className="flex-1 py-3 text-white text-xs font-bold border border-gray-800 rounded-2xl" onClick={onClose}>Cancelar</button>
                    <button className="flex-1 py-3 bg-red-600 text-white text-xs font-bold rounded-2xl" onClick={onConfirm}>Eliminar</button>
                </div>
            </motion.div>
        </motion.div>
    )
}
