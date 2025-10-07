import { CheckCircle } from "lucide-react"

const clientBenefits = [
  "Efficient organization of workouts and diets",
  "Connect with multiple specialized coaches",
  "Compare coach profiles and reviews",
  "Track progress with interactive charts",
  "Access challenges and personalized discounts",
  "Earn points and rewards for continued use",
]

const coachBenefits = [
  "Reliable platform for service organization",
  "Transparent payment processing",
  "Integrated accounting management",
  "Benefits based on client volume",
  "Integration with social media platforms",
  "Access to fitness product marketplace",
]

export function Benefits() {
  return (
    <section className="py-16 bg-[#1E1E1E]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gradient">Benefits for Clients and Coaches</h2>
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-white">For Clients</h3>
            <ul className="space-y-4">
              {clientBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-[#FF7939] mr-2 flex-shrink-0" />
                  <span className="text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-semibold mb-6 text-white">For Coaches</h3>
            <ul className="space-y-4">
              {coachBenefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-[#FF7939] mr-2 flex-shrink-0" />
                  <span className="text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
