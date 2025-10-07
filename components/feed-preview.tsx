import { Card } from "@/components/ui/card"
import { Heart, MessageCircle, Bookmark } from "lucide-react"
import Image from "next/image"
import { GeometricBackground } from "@/components/geometric-background"

export function FeedPreview() {
  return (
    <section className="relative py-24 bg-gradient-dark overflow-hidden">
      <GeometricBackground />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <Card className="shadow-custom-lg overflow-hidden bg-[#1E1E1E] border-none">
              <div className="relative aspect-[9/16] bg-gray-800">
                <Image src="/workout-preview.jpg" alt="5-Minute Ab Workout" fill className="object-cover" />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <h3 className="text-2xl font-semibold mb-2">5-Minute Ab Workout</h3>
                  <p className="text-gray-200">@fitnessguru</p>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center">
                <div className="flex gap-4">
                  <button className="flex items-center text-gray-400 hover:text-[#FF7939] transition-colors">
                    <Heart className="h-5 w-5 mr-1" />
                    <span>2.5k</span>
                  </button>
                  <button className="flex items-center text-gray-400 hover:text-[#FF7939] transition-colors">
                    <MessageCircle className="h-5 w-5 mr-1" />
                    <span>184</span>
                  </button>
                </div>
                <button className="text-gray-400 hover:text-[#FF7939] transition-colors">
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>
            </Card>
          </div>

          <div>
            <h2 className="text-4xl font-semibold mb-6 text-gradient">Endless Inspiration at Your Fingertips</h2>
            <p className="text-xl mb-8 text-gray-300 font-light">
              Scroll through a curated feed of health and fitness content from top professionals. Discover workout
              routines, nutrition tips, and wellness advice tailored to your interests.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center">
                <span className="text-[#FF7939] mr-2 text-2xl">•</span>
                <span className="text-gray-300 font-light">Personalized content based on your preferences</span>
              </li>
              <li className="flex items-center">
                <span className="text-[#FF7939] mr-2 text-2xl">•</span>
                <span className="text-gray-300 font-light">Exclusive videos and tutorials from health experts</span>
              </li>
              <li className="flex items-center">
                <span className="text-[#FF7939] mr-2 text-2xl">•</span>
                <span className="text-gray-300 font-light">Engage with professionals through likes and comments</span>
              </li>
              <li className="flex items-center">
                <span className="text-[#FF7939] mr-2 text-2xl">•</span>
                <span className="text-gray-300 font-light">Save your favorite content for later</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
