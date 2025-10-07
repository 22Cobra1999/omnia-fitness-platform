import { ProtectedRoute } from "@/components/auth/protected-route"
import { ProfileScreen } from "@/components/mobile/profile-screen"
import { MobileHeader } from "@/components/mobile-header"

export default function MobileProfilePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <MobileHeader />
        <div className="pt-20">
          <ProfileScreen />
        </div>
      </div>
    </ProtectedRoute>
  )
}
