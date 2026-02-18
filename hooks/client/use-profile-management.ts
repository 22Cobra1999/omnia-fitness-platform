import { useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/use-toast'

// Modular hooks
import { useProfileState } from './profile/modules/useProfileState'
import { useProfileFetchers } from './profile/modules/useProfileFetchers'
import { useProfileActions } from './profile/modules/useProfileActions'

export function useProfileManagement() {
  const { user } = useAuth()
  const { toast } = useToast()

  // 1. Initial State
  const state = useProfileState(user)

  // 2. Data Fetchers
  const fetchers = useProfileFetchers({
    userId: user?.id,
    setLoading: state.setLoading,
    setProfile: state.setProfile,
    setBiometrics: state.setBiometrics,
    setInjuries: state.setInjuries,
    setLastProfileLoadAt: state.setLastProfileLoadAt,
    lastProfileLoadAt: state.lastProfileLoadAt,
    profile: state.profile,
    toast
  })

  // 3. Domain Actions
  const actions = useProfileActions({
    userId: user?.id,
    userLevel: user?.level,
    setLoading: state.setLoading,
    setProfile: state.setProfile,
    setBiometrics: state.setBiometrics,
    setInjuries: state.setInjuries,
    toast
  })

  // --- Initial Data Load ---
  useEffect(() => {
    if (!user?.id) return

    // Load profile immediately
    fetchers.loadProfile()

    // Defer non-critical data
    const id = setTimeout(() => {
      fetchers.loadBiometrics()
      fetchers.loadInjuries()
    }, 0)

    return () => clearTimeout(id)
  }, [user?.id])

  // Return the stable API
  return {
    loading: state.loading,
    profile: state.profile,
    biometrics: state.biometrics,
    injuries: state.injuries,
    ...actions,
    ...fetchers
  }
}
