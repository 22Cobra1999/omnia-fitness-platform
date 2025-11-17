import { Card, CardContent } from "@/components/ui/card"
import { GeometricBackground } from '@/components/shared/misc/geometric-background'
import Image from "next/image"

export function DashboardPreview() {
  return (
    <section className="relative py-24 bg-gradient-dark overflow-hidden">
      <GeometricBackground />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-4xl font-semibold text-center mb-16 text-gradient">Powerful Dashboards</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-[#1E1E1E] border-none shadow-custom-lg overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-2xl font-semibold mb-4 text-[#FF7939]">Client Dashboard</h3>
              <p className="text-gray-300 mb-6">
                Track your progress, manage workouts, and stay connected with your fitness journey.
              </p>
              <div className="relative aspect-[16/10] rounded-lg overflow-hidden">
                <Image src="/dashboard-client.png" alt="Client Dashboard Preview" fill className="object-cover" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#1E1E1E] border-none shadow-custom-lg overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-2xl font-semibold mb-4 text-[#FF7939]">Coach Dashboard</h3>
              <p className="text-gray-300 mb-6">
                Manage clients, track revenue, and grow your coaching business efficiently.
              </p>
              <div className="relative aspect-[16/10] rounded-lg overflow-hidden">
                <Image src="/dashboard-coach.png" alt="Coach Dashboard Preview" fill className="object-cover" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
