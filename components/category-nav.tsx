import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

const fitnessCategories = [
  "All Products",
  "Cardio Equipment",
  "Strength Training",
  "Yoga & Pilates",
  "Nutrition",
  "Wearables",
  "Recovery & Wellness",
]

const courseCategories = [
  "All Courses",
  "Nutrition",
  "Strength Training",
  "Cardio",
  "Yoga",
  "Personal Training",
  "Business Skills",
]

export function CategoryNav({ type = "fitness" }: { type?: "fitness" | "courses" }) {
  const categories = type === "courses" ? courseCategories : fitnessCategories

  return (
    <div className="mb-8">
      <ScrollArea className="w-full whitespace-nowrap rounded-md border border-[#333]">
        <div className="flex w-max space-x-4 p-4">
          {categories.map((category, index) => (
            <Button key={index} variant="ghost" className="text-white hover:text-[#FF7939] hover:bg-[#2A2A2A]">
              {category}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
