import { useState, useRef, useEffect } from "react"
import { Client } from "../types"

// Helper
const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--
    }
    return age
}

export function useClientDetailLogic(selectedClient: Client | null) {
    const [clientDetail, setClientDetail] = useState<any>(null)
    const [loadingDetail, setLoadingDetail] = useState(false)

    // Tabs & Navigation
    const [activeModalTab, setActiveModalTab] = useState<'calendar' | 'info' | 'activities'>('activities')
    const [activeClientPanel, setActiveClientPanel] = useState<'activities' | 'todo' | 'progress' | 'revenue' | null>(null)
    const [activitySubTab, setActivitySubTab] = useState<'en-curso' | 'por-empezar' | 'finalizadas'>('en-curso')

    // Todo Logic
    const [showTodoSection, setShowTodoSection] = useState(false)
    const [todoTasks, setTodoTasks] = useState<string[]>([])
    const [newTask, setNewTask] = useState("")
    const [loadingTodo, setLoadingTodo] = useState(false)
    const [showTodoInput, setShowTodoInput] = useState(false)

    // Bio Logic
    const [isEditingBio, setIsEditingBio] = useState(false)
    const [tempBioData, setTempBioData] = useState<any>({ weight: '', height: '', biometrics: [] })
    const [savingBio, setSavingBio] = useState(false)
    const [showInjuries, setShowInjuries] = useState(false)
    const [showBiometrics, setShowBiometrics] = useState(false)
    const [showObjectives, setShowObjectives] = useState(false)

    // Objectives Logic
    const [isEditingObjectives, setIsEditingObjectives] = useState(false)
    const [savingObjectives, setSavingObjectives] = useState(false)
    const objectivesListRef = useRef<any>(null)

    // Activities Logic
    const [hiddenActivities, setHiddenActivities] = useState<Set<number>>(new Set())

    // Survey Modal State
    const [showSurveyModal, setShowSurveyModal] = useState(false)

    // Refs & Scroll
    const calendarScrollRef = useRef<HTMLDivElement>(null)

    const preserveModalScrollPosition = (fn: () => void) => {
        const prevTop = calendarScrollRef.current?.scrollTop
        fn()
        setTimeout(() => {
            if (calendarScrollRef.current && typeof prevTop === 'number') {
                calendarScrollRef.current.scrollTop = prevTop
            }
        }, 0)
    }

    // Modals & Selection states
    const [selectedBiometric, setSelectedBiometric] = useState<any>(null)
    const [biometricsModalMode, setBiometricsModalMode] = useState<'register' | 'edit'>('register')

    // Functions
    const fetchClientDetail = async (clientId: string) => {
        try {
            setLoadingDetail(true)
            const response = await fetch(`/api/coach/clients/${clientId}/details`, {
                credentials: 'include'
            })
            const data = await response.json()

            if (response.ok && data.success && data.client) {
                setClientDetail(data)
                // Initialize temp data for inline editing
                setTempBioData({
                    weight: data.client.physicalData?.weight || '',
                    height: data.client.physicalData?.height || '',
                    biometrics: data.client.biometrics || []
                })
            }
        } catch (error) {
            console.error('❌ [CLIENT DETAIL] Error fetching client detail:', error)
        } finally {
            setLoadingDetail(false)
        }
    }

    const loadTodoTasks = async (clientId: string) => {
        try {
            setLoadingTodo(true)
            const response = await fetch(`/api/coach/clients/${clientId}/todo`, { credentials: 'include' })
            const data = await response.json()
            if (data.success && data.tasks) setTodoTasks(data.tasks)
        } catch (error) {
            console.error('Error loading todo tasks:', error)
        } finally {
            setLoadingTodo(false)
        }
    }

    const addNewTask = async () => {
        if (!newTask.trim() || !selectedClient || todoTasks.length >= 5) return
        try {
            setLoadingTodo(true)
            const response = await fetch(`/api/coach/clients/${selectedClient.id}/todo`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ task: newTask.trim() })
            })
            const data = await response.json()
            if (data.success) {
                setTodoTasks(data.tasks)
                setNewTask("")
                setShowTodoInput(false)
            }
        } catch (error) {
            console.error('Error adding task:', error)
        } finally {
            setLoadingTodo(false)
        }
    }

    const completeTask = async (taskIndex: number) => {
        if (!selectedClient) return
        try {
            setLoadingTodo(true)
            const response = await fetch(`/api/coach/clients/${selectedClient.id}/todo`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskIndex })
            })
            const data = await response.json()
            if (data.success) setTodoTasks(data.tasks)
        } catch (error) {
            console.error('Error completing task:', error)
        } finally {
            setLoadingTodo(false)
        }
    }

    const handleSaveBio = async () => {
        if (!selectedClient) return
        setSavingBio(true)
        try {
            const resp = await fetch(`/api/coach/clients/${selectedClient.id}/biometrics`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tempBioData)
            })
            if (resp.ok) {
                await fetchClientDetail(selectedClient.id)
                setIsEditingBio(false)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setSavingBio(false)
        }
    }

    const handleSaveBiometricInternal = async (data: { name: string, value: number, unit: string }) => {
        if (!selectedClient) return
        try {
            const isEdit = biometricsModalMode === 'edit' && selectedBiometric?.id

            // Special case: Profile biometrics (weight/height)
            if (isEdit && (selectedBiometric.id === 'profile-weight' || selectedBiometric.id === 'profile-height')) {
                const isWeight = selectedBiometric.id === 'profile-weight'
                const body = isWeight ? { weight: data.value } : { height: data.value }

                const resp = await fetch(`/api/coach/clients/${selectedClient.id}/biometrics`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                })

                if (resp.ok) {
                    await fetchClientDetail(selectedClient.id)
                    setShowBiometrics(false)
                    setSelectedBiometric(null)
                }
                return
            }

            const method = isEdit ? 'PUT' : 'POST'
            const body = isEdit
                ? { id: selectedBiometric.id, ...data }
                : data

            const resp = await fetch(`/api/coach/clients/${selectedClient.id}/biometrics`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (resp.ok) {
                await fetchClientDetail(selectedClient.id)
                setShowBiometrics(false)
                setSelectedBiometric(null)
            }
        } catch (error) {
            console.error('Error saving biometric:', error)
        }
    }

    const handleDeleteBiometricInternal = async () => {
        if (!selectedClient || !selectedBiometric) return
        try {
            const resp = await fetch(`/api/coach/clients/${selectedClient.id}/biometrics?id=${selectedBiometric.id}`, {
                method: 'DELETE'
            })
            if (resp.ok) {
                await fetchClientDetail(selectedClient.id)
                setShowBiometrics(false)
                setSelectedBiometric(null)
            }
        } catch (error) {
            console.error('Error deleting biometric:', error)
        }
    }

    const handleSaveInjuriesInternal = async (updatedInjuries: any[]) => {
        if (!selectedClient) return
        try {
            const currentInjuries = clientDetail?.client?.injuries || []
            const currentIds = currentInjuries.map((i: any) => i.id)
            const updatedIds = updatedInjuries.filter(i => i.id && !i.id.toString().startsWith('temp_')).map(i => i.id)

            // Eliminadas
            const toDelete = currentIds.filter((id: string) => !updatedIds.includes(id))
            // Nuevas
            const toCreate = updatedInjuries.filter(i => !i.id || i.id.toString().startsWith('temp_'))
            // Actualizadas
            const toUpdate = updatedInjuries.filter(i => i.id && !i.id.toString().startsWith('temp_'))

            const promises = []

            for (const id of toDelete) {
                promises.push(fetch(`/api/coach/clients/${selectedClient.id}/injuries?id=${id}`, { method: 'DELETE' }))
            }

            for (const injury of toCreate) {
                const { id, muscleId, muscleName, muscleGroup, painLevel, painDescription, ...rest } = injury
                promises.push(fetch(`/api/coach/clients/${selectedClient.id}/injuries`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...rest,
                        muscle_id: muscleId,
                        muscle_name: muscleName,
                        muscle_group: muscleGroup,
                        pain_level: painLevel,
                        pain_description: painDescription
                    })
                }))
            }

            for (const injury of toUpdate) {
                const { muscleId, muscleName, muscleGroup, painLevel, painDescription, ...rest } = injury
                promises.push(fetch(`/api/coach/clients/${selectedClient.id}/injuries`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...rest,
                        muscle_id: muscleId,
                        muscle_name: muscleName,
                        muscle_group: muscleGroup,
                        pain_level: painLevel,
                        pain_description: painDescription
                    })
                }))
            }

            await Promise.all(promises)
            await fetchClientDetail(selectedClient.id)
            setShowInjuries(false)
        } catch (error) {
            console.error('Error saving injuries:', error)
        }
    }

    // Effect to fetch details when client changes
    useEffect(() => {
        if (selectedClient) {
            // Reset states
            setClientDetail(null)
            setActiveModalTab('activities')
            setActivitySubTab('en-curso')
            setShowTodoSection(false)
            setTodoTasks([])
            setNewTask("")
            setShowInjuries(false)
            setShowBiometrics(false)
            setShowObjectives(false)

            // Fetch
            fetchClientDetail(selectedClient.id)
        } else {
            setClientDetail(null)
        }
    }, [selectedClient?.id]) // Depend strictly on ID change

    // Lock body scroll
    useEffect(() => {
        if (selectedClient) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [selectedClient])

    return {
        clientDetail,
        loadingDetail,
        activeModalTab,
        setActiveModalTab,
        activeClientPanel,
        setActiveClientPanel,
        activitySubTab,
        setActivitySubTab,

        // Todo
        showTodoSection,
        setShowTodoSection,
        todoTasks,
        newTask,
        setNewTask,
        loadingTodo,
        showTodoInput,
        setShowTodoInput,
        loadTodoTasks,
        addNewTask,
        completeTask,

        // Bio
        isEditingBio,
        setIsEditingBio,
        tempBioData,
        setTempBioData,
        savingBio,
        handleSaveBio,
        showInjuries,
        setShowInjuries,
        showBiometrics,
        setShowBiometrics,
        showObjectives,
        setShowObjectives,
        selectedBiometric,
        setSelectedBiometric,
        biometricsModalMode,
        setBiometricsModalMode,
        handleSaveBiometricInternal,
        handleDeleteBiometricInternal,
        handleSaveInjuriesInternal,

        // Objectives
        isEditingObjectives,
        setIsEditingObjectives,
        savingObjectives,
        setSavingObjectives,
        objectivesListRef,

        // Activities
        hiddenActivities,
        setHiddenActivities,

        // Survey
        showSurveyModal,
        setShowSurveyModal,

        // Refs & Utils
        calendarScrollRef,
        preserveModalScrollPosition,
        calculateAge
    }
}
