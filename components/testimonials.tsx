import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Fitness Enthusiast",
    content:
      "OMNIA has transformed my fitness journey. The personalized workouts and nutrition advice from my coach have helped me achieve results I never thought possible.",
    avatar: "/avatar1.jpg",
  },
  {
    name: "Michael Chen",
    role: "Professional Coach",
    content:
      "As a coach, OMNIA has streamlined my business. The integrated tools for client management and accounting have saved me countless hours.",
    avatar: "/avatar2.jpg",
  },
  {
    name: "Emily Rodriguez",
    role: "Nutrition Client",
    content:
      "The ability to connect with both a fitness coach and a nutritionist on the same platform has been game-changing for my overall health goals.",
    avatar: "/avatar3.jpg",
  },
]

export function Testimonials() {
  return (
    <section className="bg-[#1E1E1E] py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 text-gradient">What Our Users Say</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-[#2A2A2A] border-none shadow-custom-lg">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-white">{testimonial.name}</CardTitle>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">{testimonial.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
