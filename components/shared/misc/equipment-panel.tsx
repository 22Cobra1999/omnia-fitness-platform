import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

interface InformationPanelSecondaryProps {
  category: string
}

export function InformationPanelSecondary({ category }: InformationPanelSecondaryProps) {
  const equipment = {
    gym: [
      { name: "Dumbbells", image: "/dumbbells.jpg" },
      { name: "Barbell", image: "/barbell.jpg" },
      { name: "Squat Rack", image: "/squat-rack.jpg" },
    ],
    nutrition: [
      { name: "Blender", image: "/blender.jpg" },
      { name: "Food Scale", image: "/food-scale.jpg" },
      { name: "Meal Prep Containers", image: "/meal-prep-containers.jpg" },
    ],
    fitness: [
      { name: "Yoga Mat", image: "/yoga-mat.jpg" },
      { name: "Resistance Bands", image: "/resistance-bands.jpg" },
      { name: "Foam Roller", image: "/foam-roller.jpg" },
    ],
  }

  return (
    <Card className="h-full bg-[#1E1E1E] border-none">
      <CardHeader>
        <CardTitle>Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Image
          src="/gym-equipment-dark-2.jpg"
          alt="Gym Equipment"
          width={400}
          height={300}
          className="w-full h-48 object-cover rounded-md mb-4"
        />
      </CardContent>
    </Card>
  )
}
