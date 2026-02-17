import { RefreshCw } from 'lucide-react'

interface StorageHeaderProps {
    loading: boolean
    onRefresh: () => void
}

export function StorageHeader({ loading, onRefresh }: StorageHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-medium text-white/40">Almacenamiento</h3>
            <button
                onClick={onRefresh}
                disabled={loading}
                className="text-white/20 hover:text-white transition-colors"
            >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
    )
}
