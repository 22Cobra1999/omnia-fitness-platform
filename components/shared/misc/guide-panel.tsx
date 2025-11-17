import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

interface GuidePanelProps {
  category: string
}

export function GuidePanel({ category }: GuidePanelProps) {
  const content = {
    nutrition: [
      { title: "How to balance macronutrients", type: "education" },
      { title: "Weekly meal planning", type: "plan" },
      { title: "Healthy snack alternatives", type: "tip" },
    ],
    fitness: [
      { title: "What is a HIIT workout?", type: "education" },
      { title: "5K running plan for beginners", type: "plan" },
      { title: "Active recovery exercises", type: "tip" },
    ],
    gym: [
      { title: "Proper use of weight machines", type: "education" },
      { title: "4-week strength building program", type: "plan" },
      { title: "Preventing gym injuries", type: "tip" },
    ],
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "education":
        return "📚"
      case "plan":
        return "📅"
      case "tip":
        return "💡"
      default:
        return "📌"
    }
  }

  return (
    <Card className="bg-[#1E1E1E] border-none shadow-md">
      <CardHeader>
        <CardTitle>Guide and Tools</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-3">
          {content[category as keyof typeof content].map((item, index) => (
            <div key={index} className="mb-3 p-2 bg-[#2A2A2A] rounded-lg">
              <div className="flex items-start mb-1">
                <span className="text-xl mr-2">{getIcon(item.type)}</span>
                <p className="text-xs font-medium">{item.title}</p>
              </div>
              <Button variant="outline" size="sm" className="w-full text-xs">
                Learn More
              </Button>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
