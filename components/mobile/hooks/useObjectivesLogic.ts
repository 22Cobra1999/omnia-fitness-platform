import { useState, useEffect, useCallback } from "react"

export interface ObjectiveExercise {
    id: string
    exercise_title: string
    unit: string
    value_1?: number
    value_2?: number
    value_3?: number
    value_4?: number
    date_1?: string
    date_2?: string
    date_3?: string
    date_4?: string
}

export const UNIT_OPTIONS = [
    { value: "kg", label: "kg" },
    { value: "tiempo", label: "tiempo" },
    { value: "km", label: "km" },
    { value: "m", label: "m" },
    { value: "cm", label: "cm" },
    { value: "reps", label: "reps" },
    { value: "sets", label: "sets" },
    { value: "cal", label: "cal" }
]

export function useObjectivesLogic(isOpen: boolean) {
    const [exercises, setExercises] = useState<ObjectiveExercise[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [editingRecord, setEditingRecord] = useState<string | null>(null)

    // Formulario para nuevo ejercicio
    const [newExercise, setNewExercise] = useState({
        title: "",
        unit: "",
        current_value: ""
    })

    const [timeValue, setTimeValue] = useState({
        hours: 0,
        minutes: 0,
        seconds: 0
    })

    // Formulario para nuevo record
    const [newRecord, setNewRecord] = useState({
        exercise_title: "",
        current_value: "",
        notes: ""
    })

    // Formulario para editar record
    const [editRecord, setEditRecord] = useState({
        id: "",
        current_value: "",
        notes: ""
    })

    const fetchExercises = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/profile/exercise-progress')
            if (response.ok) {
                const data = await response.json()
                setExercises(data.exercises || [])
            }
        } catch (error) {
            console.error('Error fetching exercises:', error)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        if (isOpen) {
            fetchExercises()
        }
    }, [isOpen, fetchExercises])

    // Funciones para manejar tiempo
    const formatTimeToString = (hours: number, minutes: number, seconds: number) => {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    const convertTimeToSeconds = (hours: number, minutes: number, seconds: number) => {
        return hours * 3600 + minutes * 60 + seconds
    }

    const convertSecondsToTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600)
        const minutes = Math.floor((totalSeconds % 3600) / 60)
        const seconds = totalSeconds % 60
        return { hours, minutes, seconds }
    }

    const handleAddExercise = async () => {
        if (!newExercise.title || !newExercise.unit) return

        let valueToSend = newExercise.current_value

        if (newExercise.unit === "tiempo") {
            valueToSend = convertTimeToSeconds(timeValue.hours, timeValue.minutes, timeValue.seconds).toString()
        }

        if (!valueToSend || valueToSend === "0") return

        setIsLoading(true)
        try {
            const response = await fetch('/api/profile/exercise-progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exercise_title: newExercise.title,
                    unit: newExercise.unit,
                    value: valueToSend
                })
            })

            if (response.ok) {
                setNewExercise({ title: "", unit: "", current_value: "" })
                setTimeValue({ hours: 0, minutes: 0, seconds: 0 })
                setShowAddForm(false)
                fetchExercises()
            }
        } catch (error) {
            console.error('Error adding exercise:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddValue = async (exerciseId: string, value: string) => {
        if (!value) return

        setIsLoading(true)
        try {
            const response = await fetch('/api/profile/exercise-progress', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: exerciseId,
                    current_value: parseFloat(value)
                })
            })

            if (response.ok) {
                setNewRecord({ exercise_title: "", current_value: "", notes: "" })
                fetchExercises()
            }
        } catch (error) {
            console.error('Error adding value:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleEditValue = async (exerciseId: string, valueIndex: number, value: string) => {
        if (!value) return

        setIsLoading(true)
        try {
            const response = await fetch('/api/profile/exercise-progress', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: exerciseId,
                    value_index: valueIndex,
                    value: parseFloat(value)
                })
            })

            if (response.ok) {
                setEditingRecord(null)
                setEditRecord({ id: "", current_value: "", notes: "" })
                fetchExercises()
            }
        } catch (error) {
            console.error('Error editing value:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDeleteExercise = async (exerciseId: string) => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/profile/exercise-progress?id=${exerciseId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchExercises()
            }
        } catch (error) {
            console.error('Error deleting exercise:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit'
        })
    }

    const formatValueForDisplay = (value: number | undefined | null, unit: string) => {
        if (unit === "tiempo" && value) {
            const time = convertSecondsToTime(value)
            return formatTimeToString(time.hours, time.minutes, time.seconds)
        }
        return value?.toString() || "0"
    }

    const getUnitLabel = (unitValue: string) => {
        return UNIT_OPTIONS.find(u => u.value === unitValue)?.label || unitValue
    }

    return {
        exercises,
        isLoading,
        showAddForm,
        setShowAddForm,
        editingRecord,
        setEditingRecord,
        newExercise,
        setNewExercise,
        timeValue,
        setTimeValue,
        newRecord,
        setNewRecord,
        editRecord,
        setEditRecord,
        handleAddExercise,
        handleAddValue,
        handleEditValue,
        handleDeleteExercise,
        formatDate,
        formatValueForDisplay,
        getUnitLabel
    }
}
