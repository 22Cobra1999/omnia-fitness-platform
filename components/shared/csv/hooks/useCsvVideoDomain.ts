import { useCallback } from 'react'
import { extractBunnyVideoIdFromUrl } from '../utils/csv-helpers'

interface UseCsvVideoDomainProps {
    selectedRows: Set<number>
    setSelectedRows: (rows: Set<number>) => void
    parentSetSelectedRows?: (rows: Set<number>) => void
    csvData: any[]
    setCsvData: (updater: any) => void
    parentCsvData?: any[]
    parentSetCsvData?: (data: any[]) => void
    existingData: any[]
    setExistingData: (updater: any) => void
    allData: any[]
    onVideoFileSelected?: (exercise: any, index: number, videoFile: File) => void
    onVideoCleared?: (index: number, exercise: any, meta?: any) => void
    setManualForm: (updater: any) => void
    setShowAssignedVideoPreview: (show: boolean) => void
    editingExerciseIndex: number | null
}

export function useCsvVideoDomain({
    selectedRows,
    setSelectedRows,
    parentSetSelectedRows,
    csvData,
    setCsvData,
    parentCsvData,
    parentSetCsvData,
    existingData,
    setExistingData,
    allData,
    onVideoFileSelected,
    onVideoCleared,
    setManualForm,
    setShowAssignedVideoPreview,
    editingExerciseIndex
}: UseCsvVideoDomainProps) {

    const handleVideoSelection = useCallback(async (
        mediaUrl: string,
        _mediaType: string,
        mediaFile?: File,
        fileName?: string,
        targetIndex?: number | number[],
        targetId?: string | number | (string | number)[]
    ) => {
        const derivedBunnyId = extractBunnyVideoIdFromUrl(mediaUrl)
        const videoFile = mediaFile || null
        const resolvedName = fileName || (videoFile?.name ?? '').trim() || (derivedBunnyId ? `video_${derivedBunnyId.slice(0, 12)}.mp4` : '')

        if (videoFile) {
            const selectedIndices = targetIndex !== undefined 
                ? (Array.isArray(targetIndex) ? targetIndex : [targetIndex]) 
                : Array.from(selectedRows)
            const currentData = csvData.length > 0 ? csvData : (parentCsvData || [])
            selectedIndices.forEach((idx) => {
                const exercise = currentData[idx]
                if (exercise && onVideoFileSelected) onVideoFileSelected(exercise, idx, videoFile)
            })
        }

        const applyVideo = (row: any) => ({
            ...row,
            video_url: mediaUrl,
            video_file_name: resolvedName,
            video_source: videoFile ? 'upload' : 'existing',
            bunny_video_id: derivedBunnyId || row.bunny_video_id || '',
            bunny_library_id: null,
            video_thumbnail_url: derivedBunnyId ? `${mediaUrl.split(derivedBunnyId)[0]}${derivedBunnyId}/thumbnail.jpg` : null
        })

        // Optimized state update: favor targetIndex/targetId for background uploads
        setCsvData((prev: any) => prev.map((row: any, idx: number) => {
            let isMatch = false;
            if (targetIndex !== undefined) {
                isMatch = Array.isArray(targetIndex) ? targetIndex.includes(idx) : idx === targetIndex;
            } else if (targetId !== undefined) {
                const ids = Array.isArray(targetId) ? targetId.map(String) : [String(targetId)];
                isMatch = ids.includes(String(row.id)) || ids.includes(String(row.tempRowId));
            } else {
                isMatch = selectedRows.has(idx);
            }
            return isMatch ? applyVideo(row) : row;
        }))

        if (parentSetCsvData) {
            parentSetCsvData((parentCsvData || []).map((row: any, idx: number) => {
                let isMatch = false;
                if (targetIndex !== undefined) {
                    isMatch = Array.isArray(targetIndex) ? targetIndex.includes(idx) : idx === targetIndex;
                } else if (targetId !== undefined) {
                    const ids = Array.isArray(targetId) ? targetId.map(String) : [String(targetId)];
                    isMatch = ids.includes(String(row.id)) || ids.includes(String(row.tempRowId));
                } else {
                    isMatch = selectedRows.has(idx);
                }
                return isMatch ? applyVideo(row) : row;
            }))
        }

        setExistingData((prev: any) => prev.map((row: any) => {
            let isMatch = false;
            if (targetId !== undefined) {
                const ids = Array.isArray(targetId) ? targetId.map(String) : [String(targetId)];
                isMatch = ids.includes(String(row.id)) || ids.includes(String(row.tempRowId));
            } else if (targetIndex !== undefined) {
                const indices = Array.isArray(targetIndex) ? targetIndex : [targetIndex];
                isMatch = indices.some(idx => {
                    const selectedRow = allData[idx];
                    return selectedRow && (String(selectedRow.id) === String(row.id) || selectedRow.tempRowId === row.tempRowId);
                });
            } else {
                isMatch = Array.from(selectedRows).some(idx => {
                    const selectedRow = allData[idx]
                    return selectedRow && (String(selectedRow.id) === String(row.id) || selectedRow.tempRowId === row.tempRowId)
                })
            }
            return isMatch ? applyVideo(row) : row
        }))

        // Only clear global selection if we were using it
        if (targetIndex === undefined && targetId === undefined) {
            setSelectedRows(new Set())
            if (parentSetSelectedRows) parentSetSelectedRows(new Set())
        }
    }, [selectedRows, csvData, parentCsvData, setCsvData, parentSetCsvData, setExistingData, onVideoFileSelected, parentSetSelectedRows, setSelectedRows, allData])

    const handleRemoveVideoFromManualForm = useCallback(() => {
        setManualForm((prev: any) => ({
            ...prev,
            video_url: '',
            video_file_name: '',
            bunny_video_id: '',
            bunny_library_id: '',
            video_thumbnail_url: ''
        }))
        setShowAssignedVideoPreview(false)

        if (editingExerciseIndex !== null) {
            const existingRow = allData[editingExerciseIndex]
            if (onVideoCleared) {
                onVideoCleared(editingExerciseIndex, existingRow, {
                    bunnyVideoId: existingRow?.bunny_video_id,
                    bunnyLibraryId: existingRow?.bunny_library_id,
                    videoUrl: existingRow?.video_url
                })
            }

            const applyClear = (row: any) => ({
                ...row,
                video_url: '',
                video_file_name: '',
                video_source: '',
                bunny_video_id: '',
                bunny_library_id: '',
                video_thumbnail_url: ''
            })

            setCsvData((prev: any) => prev.map((row: any, idx: number) => idx === editingExerciseIndex ? applyClear(row) : row))
            if (parentSetCsvData) {
                parentSetCsvData((parentCsvData || []).map((row: any, idx: number) => idx === editingExerciseIndex ? applyClear(row) : row))
            }
            setExistingData((prev: any) => prev.map((row: any) => (String(row.id) === String(existingRow.id) || row.tempRowId === existingRow.tempRowId) ? applyClear(row) : row))
        }
    }, [editingExerciseIndex, allData, setManualForm, setShowAssignedVideoPreview, onVideoCleared, setCsvData, parentSetCsvData, parentCsvData, setExistingData])

    return {
        handleVideoSelection,
        handleRemoveVideoFromManualForm
    }
}
