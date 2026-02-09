import React, { useRef, useState } from 'react'
import { Upload, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CsvUploadAreaProps {
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
    onManualEntrySelect: () => void
    onDownloadTemplate?: () => void
    productCategory?: 'fitness' | 'nutricion'
    mode: 'manual' | 'csv' | 'existentes'
}

export function CsvUploadArea({
    onFileSelect,
    onManualEntrySelect,
    onDownloadTemplate,
    productCategory = 'fitness',
    mode
}: CsvUploadAreaProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const isNutricion = productCategory === 'nutricion'

    return (
        <div className="mb-6">
            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${mode === 'csv'
                        ? 'border-[#FF7939] bg-[#FF7939]/5'
                        : 'border-zinc-800 hover:border-zinc-700 bg-black'
                    }`}
                onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                }}
                onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const file = e.dataTransfer.files[0]
                        if (fileInputRef.current) {
                            const dataTransfer = new DataTransfer()
                            dataTransfer.items.add(file)
                            fileInputRef.current.files = dataTransfer.files

                            const event = {
                                target: fileInputRef.current,
                                currentTarget: fileInputRef.current
                            } as unknown as React.ChangeEvent<HTMLInputElement>

                            onFileSelect(event)
                        }
                    }
                }}
            >
                <div className="flex flex-col items-center justify-center gap-3">
                    <div className={`p-4 rounded-full ${mode === 'csv' ? 'bg-[#FF7939]/10' : 'bg-zinc-900'}`}>
                        <Upload className={`h-8 w-8 ${mode === 'csv' ? 'text-[#FF7939]' : 'text-zinc-500'}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-white mb-1">
                            {isNutricion ? 'Subir archivo de platos' : 'Subir archivo de ejercicios'}
                        </h3>
                        <p className="text-sm text-zinc-400 max-w-sm mx-auto mb-4">
                            Arrastra y suelta tu archivo CSV o Excel aquí
                        </p>
                    </div>

                    <div className="flex gap-3 items-center flex-wrap justify-center">
                        {onDownloadTemplate && (
                            <Button
                                variant="outline"
                                onClick={onDownloadTemplate}
                                className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Descargar Plantilla
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-transparent border-zinc-700 hover:bg-zinc-800 text-white"
                        >
                            Seleccionar archivo
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                            onChange={onFileSelect}
                        />

                        <span className="text-zinc-600 flex items-center">- o -</span>

                        <Button
                            variant="default"
                            onClick={onManualEntrySelect}
                            className="bg-[#FF7939] hover:bg-[#FF6B35] text-white border-0"
                        >
                            Carga Manual
                        </Button>
                    </div>

                    <p className="text-xs text-zinc-600 mt-2">
                        Formatos soportados: CSV, Excel (.xlsx)
                    </p>
                </div>
            </div>
        </div>
    )
}
