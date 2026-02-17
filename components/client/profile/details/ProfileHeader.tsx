interface ProfileHeaderProps {
    isEditing: boolean
    onToggle: () => void
    onSave: () => void
}

export function ProfileHeader({ isEditing, onToggle, onSave }: ProfileHeaderProps) {
    return (
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Profile Details</h2>
            {isEditing ? (
                <button
                    onClick={onSave}
                    className="px-6 py-2 bg-[#FF7939] text-white rounded-md hover:bg-[#E86A2D] transition"
                >
                    Save Changes
                </button>
            ) : (
                <button
                    onClick={onToggle}
                    className="px-4 py-2 bg-[#FF7939] text-white rounded-md hover:bg-[#E86A2D] transition"
                >
                    Edit
                </button>
            )}
        </div>
    )
}
