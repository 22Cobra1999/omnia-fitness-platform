import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface AchievementBadgeProps {
  title: string
  count: number
  icon: LucideIcon
}

export function AchievementBadge({ title, count, icon: Icon }: AchievementBadgeProps) {
  return (
    <Card className="bg-[#1E1E1E] border-none shadow-custom-lg">
      <CardContent className="p-4 flex flex-col items-center">
        <div className="bg-[#FF7939] rounded-full p-3 mb-2">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <p className="text-white font-semibold">{title}</p>
        <p className="text-2xl font-bold text-[#FF7939]">{count}</p>
      </CardContent>
    </Card>
  )
}
