import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, Users, Trophy, MessageCircle, BarChart, ShoppingBag } from "lucide-react"
import { GeometricBackground } from '@/components/shared/misc/geometric-background'

const features = [
  {
    title: "Engaging Content Feed",
    description: "Scroll through personalized health and fitness content from top professionals.",
    icon: BarChart,
    color: "#FF7939",
  },
  {
    title: "Progress Tracking",
    description: "Monitor your fitness journey with comprehensive tools and visualizations.",
    icon: Trophy,
    color: "#FFB56B",
  },
  {
    title: "Expert Communication",
    description: "Chat directly with health professionals for personalized guidance and support.",
    icon: MessageCircle,
    color: "#FF9248",
  },
  {
    title: "Community Interaction",
    description: "Engage with coaches and peers for motivation and support.",
    icon: Users,
    color: "#FFA15A",
  },
  {
    title: "Tailored Workouts",
    description: "Access workout plans designed by expert coaches to meet your specific goals.",
    icon: Dumbbell,
    color: "#FF8142",
  },
  {
    title: "Fitness Marketplace",
    description: "Discover and shop for recommended fitness products and services.",
    icon: ShoppingBag,
    color: "#FFB56B",
  },
]

export function Features() {
  return (
    <section className="relative py-24 bg-gradient-dark overflow-hidden">
      <GeometricBackground />
      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-4xl font-semibold text-center mb-16 text-gradient">Redefining Your Fitness Experience</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="bg-[#1E1E1E] border-none shadow-custom-lg card-hover">
              <CardHeader>
                <feature.icon className="h-12 w-12 mb-4" style={{ color: feature.color }} />
                <CardTitle className="text-white">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
