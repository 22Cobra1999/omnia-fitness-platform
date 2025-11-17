import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface InformationPanelProps {
  category: string
}

export function InformationPanel({ category }: InformationPanelProps) {
  const content = {
    nutrition: [
      { title: "New detox plan available this week!", type: "coach" },
      { title: "Remember: every bite brings you closer to your goals.", type: "motivation" },
      { title: "Your meal plan has been updated to focus on protein intake.", type: "personal" },
      { title: "Join our Healthy Cooking Workshop this Saturday!", type: "event" },
      { title: "See how Ana lost 10kg in 3 months with our balanced diet plan.", type: "story" },
      { title: "This month's superfood: Quinoa - packed with protein and fiber!", type: "highlight" },
    ],
    fitness: [
      { title: "New HIIT workout series launched!", type: "coach" },
      { title: "Push yourself today, your future self will thank you.", type: "motivation" },
      { title: "Your cardio plan has been adjusted to improve endurance.", type: "personal" },
      { title: "Don't miss our Yoga in the Park event this Sunday!", type: "event" },
      { title: "John completed his first marathon after 6 months of training.", type: "story" },
      { title: "Trending workout: Pilates for core strength and flexibility.", type: "highlight" },
    ],
    gym: [
      { title: "New strength training program now available!", type: "coach" },
      { title: "The pain you feel today will be the strength you feel tomorrow.", type: "motivation" },
      { title: "Your workout plan has been updated to focus on upper body.", type: "personal" },
      { title: "Join our Powerlifting Seminar next week!", type: "event" },
      { title: "Mike increased his bench press by 50% in just 2 months.", type: "story" },
      { title: "This month's focus: Proper form for deadlifts to prevent injuries.", type: "highlight" },
    ],
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "coach":
        return "👨‍🏫"
      case "motivation":
        return "💪"
      case "personal":
        return "🎯"
      case "event":
        return "📅"
      case "story":
        return "🏆"
      case "highlight":
        return "🌟"
      default:
        return "📢"
    }
  }

  return (
    <Card className="bg-[#1E1E1E] border-none shadow-md">
      <CardHeader>
        <CardTitle>News and Community</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          {content[category as keyof typeof content].map((item, index) => (
            <div key={index} className="mb-3 p-2 bg-[#2A2A2A] rounded-lg">
              <div className="flex items-start">
                <span className="text-xl mr-2">{getIcon(item.type)}</span>
                <p className="text-xs">{item.title}</p>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
