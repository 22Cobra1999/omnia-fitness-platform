import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

const macroData = [
  { name: "Protein", value: 75, target: 100, color: "#FF7939" },
  { name: "Carbs", value: 180, target: 250, color: "#FFB56B" },
  { name: "Fat", value: 45, target: 60, color: "#FFD700" },
]

export function TrackMacros() {
  const totalCalories = macroData.reduce((sum, macro) => sum + macro.value * (macro.name === "Fat" ? 9 : 4), 0)
  const targetCalories = macroData.reduce((sum, macro) => sum + macro.target * (macro.name === "Fat" ? 9 : 4), 0)

  return (
    <div className="space-y-4">
      <Card className="bg-[#1E1E1E] border-none">
        <CardHeader>
          <CardTitle>Macronutrient Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1E1E1E] border-none">
        <CardHeader>
          <CardTitle>Daily Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {macroData.map((macro) => (
            <div key={macro.name} className="mb-4">
              <div className="flex justify-between mb-1">
                <span>{macro.name}</span>
                <span>
                  {macro.value}g / {macro.target}g
                </span>
              </div>
              <Progress value={(macro.value / macro.target) * 100} className="h-2" />
            </div>
          ))}
          <div className="mt-4">
            <div className="flex justify-between mb-1">
              <span>Total Calories</span>
              <span>
                {totalCalories} / {targetCalories}
              </span>
            </div>
            <Progress value={(totalCalories / targetCalories) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
