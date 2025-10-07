import { GeometricBackground } from "@/components/geometric-background"
import Image from "next/image"
import { Heart, Calendar, Search, MessageCircle } from "lucide-react"

export function AppPreview() {
  return (
    <section className="relative py-24 bg-gradient-dark overflow-hidden">
      <GeometricBackground />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-semibold mb-6 text-gradient">Your Fitness Journey in Your Pocket</h2>
            <p className="text-xl mb-8 text-gray-300 font-light">
              Access your workouts, track progress, and connect with your fitness community anywhere, anytime with the
              OMNIA mobile app.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Heart className="h-6 w-6 text-[#FF7939]" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Social Fitness</h3>
                  <p className="text-gray-300 text-sm">Share your progress and inspire others</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-6 w-6 text-[#FF7939]" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Workout Tracking</h3>
                  <p className="text-gray-300 text-sm">Log and monitor your exercises</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Search className="h-6 w-6 text-[#FF7939]" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Find Coaches</h3>
                  <p className="text-gray-300 text-sm">Connect with fitness experts</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MessageCircle className="h-6 w-6 text-[#FF7939]" />
                <div>
                  <h3 className="font-semibold text-white mb-1">Direct Chat</h3>
                  <p className="text-gray-300 text-sm">Instant communication with coaches</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative max-w-[300px] mx-auto">
              <Image
                src="/app-preview.png"
                alt="OMNIA Mobile App"
                width={300}
                height={600}
                className="rounded-[2.5rem] shadow-2xl"
              />
              <div className="absolute inset-0 rounded-[2.5rem] shadow-[inset_0_0_100px_rgba(255,121,57,0.2)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
