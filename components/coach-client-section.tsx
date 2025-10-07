import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GeometricBackground } from "@/components/geometric-background"
import { Dumbbell, Users } from "lucide-react"

export function CoachClientSection() {
  return (
    <section className="relative py-24 bg-gradient-dark overflow-hidden">
      <GeometricBackground />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-4xl font-semibold text-center mb-16 text-gradient">Choose Your Path</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="bg-[#1E1E1E] border-none shadow-custom-lg card-hover">
            <CardHeader>
              <Users className="h-12 w-12 mb-4 text-[#FF7939]" />
              <CardTitle className="text-white text-2xl">For Clients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-300">
                Transform your fitness journey with personalized guidance from expert coaches. Get access to customized
                workout plans, nutrition advice, and ongoing support.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <span className="text-[#FF7939] mr-2 text-2xl">•</span>
                  <span>Personalized workout and nutrition plans</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#FF7939] mr-2 text-2xl">•</span>
                  <span>Direct communication with expert coaches</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#FF7939] mr-2 text-2xl">•</span>
                  <span>Progress tracking and analytics</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#FF7939] mr-2 text-2xl">•</span>
                  <span>Access to exclusive content and resources</span>
                </li>
              </ul>
              <Button className="w-full bg-[#FF7939] hover:bg-[#E66829] text-white rounded-full py-6 text-lg font-light shadow-[0_0_20px_rgba(255,121,57,0.3)] hover:shadow-[0_0_30px_rgba(255,121,57,0.5)] transition-all duration-300">
                Start Your Journey
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#1E1E1E] border-none shadow-custom-lg card-hover">
            <CardHeader>
              <Dumbbell className="h-12 w-12 mb-4 text-[#FF7939]" />
              <CardTitle className="text-white text-2xl">For Coaches</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-300">
                Expand your coaching business with our comprehensive platform. Reach more clients, streamline your
                operations, and grow your impact.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center">
                  <span className="text-[#FF7939] mr-2 text-2xl">•</span>
                  <span>Powerful client management tools</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#FF7939] mr-2 text-2xl">•</span>
                  <span>Integrated payment processing</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#FF7939] mr-2 text-2xl">•</span>
                  <span>Marketing and growth resources</span>
                </li>
                <li className="flex items-center">
                  <span className="text-[#FF7939] mr-2 text-2xl">•</span>
                  <span>Brand partnership opportunities</span>
                </li>
              </ul>
              <Button className="w-full bg-transparent border-2 border-[#FF7939] text-[#FF7939] hover:bg-[#FF7939] hover:text-white rounded-full py-6 text-lg font-light transition-all duration-300">
                Start Coaching
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
