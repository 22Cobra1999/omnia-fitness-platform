import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import Image from "next/image"

const windowContent = {
  gym: [
    { title: "Strength Training", image: "/strength-training.jpg" },
    { title: "Cardio Workouts", image: "/cardio-workouts.jpg" },
    { title: "Weight Lifting", image: "/weight-lifting.jpg" },
    { title: "CrossFit", image: "/crossfit.jpg" },
    { title: "Bodyweight Exercises", image: "/bodyweight-exercises.jpg" },
  ],
  nutrition: [
    { title: "Meal Planning", image: "/meal-planning.jpg" },
    { title: "Healthy Recipes", image: "/healthy-recipes.jpg" },
    { title: "Macro Tracking", image: "/macro-tracking.jpg" },
    { title: "Supplement Guide", image: "/supplement-guide.jpg" },
    { title: "Hydration Tips", image: "/hydration-tips.jpg" },
  ],
  fitness: [
    { title: "Yoga Sessions", image: "/yoga-sessions.jpg" },
    { title: "Pilates Classes", image: "/pilates-classes.jpg" },
    { title: "Stretching Routines", image: "/stretching-routines.jpg" },
    { title: "Meditation", image: "/meditation.jpg" },
    { title: "Mobility Exercises", image: "/mobility-exercises.jpg" },
  ],
}

export function InteractiveWindows({ tab }: { tab: "gym" | "nutrition" | "fitness" }) {
  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border border-[#333]">
      <div className="flex w-max space-x-4 p-4">
        {windowContent[tab].map((item, index) => (
          <Card key={index} className="w-[250px] flex-shrink-0 bg-[#1E1E1E]">
            <CardContent className="p-0">
              <Image src={item.image} alt={item.title} width={250} height={350} className="rounded-t-lg" />
              <div className="p-4">
                <h3 className="font-semibold text-lg">{item.title}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
