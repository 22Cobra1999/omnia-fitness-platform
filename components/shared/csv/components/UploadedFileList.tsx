import React from "react"
import { X } from "lucide-react"

interface UploadedFile {
    name: string
    timestamp: number
}

interface UploadedFileListProps {
    uploadedFiles: UploadedFile[]
    activityId: number
    productCategory: string
    csvData: any[]
    setCsvData: React.Dispatch<React.SetStateAction<any[]>>
    parentCsvData?: any[]
    parentSetCsvData?: (data: any[]) => void
    setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
    updateErrorState: (message: string | null, rows?: string[]) => void
}

export const UploadedFileList = ({
    uploadedFiles,
    activityId,
    productCategory,
    csvData,
    setCsvData,
    parentCsvData,
    parentSetCsvData,
    setUploadedFiles,
    updateErrorState,
}: UploadedFileListProps) => {
    if (uploadedFiles.length === 0) return null

    const handleRemoveFile = async (idx: number, uploadedFile: UploadedFile) => {
        const timestampToRemove = uploadedFile.timestamp
        const allCurrentData = [...csvData, ...(parentCsvData || [])]
        const rowsFromThisFile = allCurrentData.filter((item) => item.csvFileTimestamp === timestampToRemove)
        const rowsWithIds = rowsFromThisFile.filter((item) => item.id)
        const idsToDelete = rowsWithIds.map((item) => item.id).filter((id): id is number => id !== undefined)

        if (idsToDelete.length > 0 && activityId > 0) {
            const endpoint = productCategory === "nutricion" ? "/api/delete-nutrition-items" : "/api/delete-exercise-items"
            await fetch(endpoint, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids: idsToDelete, activityId: activityId }),
            })
        }

        setCsvData((prev) => prev.filter((item) => !item.csvFileTimestamp || item.csvFileTimestamp !== timestampToRemove))
        if (parentSetCsvData)
            parentSetCsvData(
                (parentCsvData || []).filter((item: any) => !item.csvFileTimestamp || item.csvFileTimestamp !== timestampToRemove)
            )
        setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))

        const remainingFiles = [...csvData, ...(parentCsvData || [])].filter(
            (item) => item.csvFileTimestamp && item.csvFileTimestamp !== timestampToRemove
        )
        if (remainingFiles.length === 0) updateErrorState(null)
    }

    return (
        <div className="mb-4">
            <div className="flex gap-2 pb-2 overflow-x-auto">
                {uploadedFiles.map((uploadedFile, idx) => (
                    <div
                        key={idx}
                        className="bg-black border border-[#FF7939]/30 rounded-full px-3 py-1.5 flex items-center gap-2 flex-shrink-0"
                    >
                        <span className="text-[#FF7939] text-[10px] font-medium whitespace-nowrap">{uploadedFile.name}</span>
                        <button
                            onClick={() => handleRemoveFile(idx, uploadedFile)}
                            className="text-gray-400 hover:text-red-400"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
