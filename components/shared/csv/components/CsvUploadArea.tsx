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
        <div className="mb-4">
            <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${mode === 'csv'
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
                <div className="flex flex-col items-center justify-center gap-1">
                    <div className={`p-1.5 rounded-full ${mode === 'csv' ? 'bg-[#FF7939]/10' : 'bg-zinc-900'}`}>
                        <Upload className={`h-4 w-4 ${mode === 'csv' ? 'text-[#FF7939]' : 'text-zinc-600'}`} />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-medium text-white">
                            {isNutricion ? 'Subir platos' : 'Subir ejercicios'}
                        </h3>
                    </div>

                    <div className="flex gap-4 items-center flex-wrap justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-transparent border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs h-8 border-dashed"
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

                        {onDownloadTemplate && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onDownloadTemplate}
                                className="text-zinc-500 hover:text-white text-[10px] h-7 px-2"
                            >
                                <Download className="h-3 w-3 mr-1" />
                                Plantilla
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
