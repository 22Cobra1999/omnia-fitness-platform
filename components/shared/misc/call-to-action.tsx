import { Button } from "@/components/ui/button"
import { GeometricBackground } from '@/components/shared/misc/geometric-background'

export function CallToAction() {
  return (
    <section className="relative py-24 bg-gradient-dark overflow-hidden">
      <GeometricBackground />
      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-4xl font-semibold mb-6 text-gradient">Ready to Transform Your Fitness Journey?</h2>
        <p className="text-xl font-light mb-12 max-w-2xl mx-auto text-gray-300">
          Join OMNIA today and connect with expert coaches to achieve your health and fitness goals. Start your personal
          revolution now.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button
            size="lg"
            className="bg-[#FF7939] hover:bg-[#E66829] text-white rounded-full px-8 py-6 text-lg font-light shadow-[0_0_20px_rgba(255,121,57,0.3)] hover:shadow-[0_0_30px_rgba(255,121,57,0.5)] transition-all duration-300"
          >
            Sign Up as Client
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-[#FF7939] border-[#FF7939] hover:bg-[#FF7939] hover:text-white rounded-full px-8 py-6 text-lg font-light transition-all duration-300"
          >
            Become a Coach
          </Button>
        </div>
      </div>
    </section>
  )
}
