import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Moon, Heart, Activity } from "lucide-react"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const sleepData = [
  { day: "Mon", duration: 7.5, quality: 85 },
  { day: "Tue", duration: 6.8, quality: 75 },
  { day: "Wed", duration: 7.2, quality: 80 },
  { day: "Thu", duration: 8.0, quality: 90 },
  { day: "Fri", duration: 7.0, quality: 78 },
  { day: "Sat", duration: 7.8, quality: 88 },
  { day: "Sun", duration: 7.5, quality: 82 },
]

const recoveryData = [
  { day: "Mon", hrv: 65, restingHR: 58 },
  { day: "Tue", hrv: 70, restingHR: 56 },
  { day: "Wed", hrv: 68, restingHR: 57 },
  { day: "Thu", hrv: 72, restingHR: 55 },
  { day: "Fri", hrv: 67, restingHR: 58 },
  { day: "Sat", hrv: 71, restingHR: 56 },
  { day: "Sun", hrv: 69, restingHR: 57 },
]

const strainData = [
  { day: "Mon", strain: 12.5 },
  { day: "Tue", strain: 14.2 },
  { day: "Wed", strain: 10.8 },
  { day: "Thu", strain: 15.5 },
  { day: "Fri", strain: 13.7 },
  { day: "Sat", strain: 11.3 },
  { day: "Sun", strain: 9.6 },
]

export function WellnessMonitoring() {
  return (
    <div className="space-y-6">
      <Card className="bg-[#1E1E1E] border-none">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Moon className="w-6 h-6 text-blue-400" />
            <span>Sleep</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sleepData}>
                <XAxis dataKey="day" stroke="#888888" />
                <YAxis yAxisId="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E1E1E",
                    border: "none",
                    borderRadius: "8px",
                  }}
                />
                <CartesianGrid stroke="#333" strokeDasharray="5 5" />
                <Line yAxisId="left" type="monotone" dataKey="duration" stroke="#8884d8" />
                <Line yAxisId="right" type="monotone" dataKey="quality" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Last night's sleep quality:</p>
            <Progress value={82} className="h-2" />
            <p className="text-sm text-gray-400 mt-2">7.5 hours | 82% quality</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1E1E1E] border-none">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-red-400" />
            <span>Recovery</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={recoveryData}>
                <XAxis dataKey="day" stroke="#888888" />
                <YAxis yAxisId="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E1E1E",
                    border: "none",
                    borderRadius: "8px",
                  }}
                />
                <CartesianGrid stroke="#333" strokeDasharray="5 5" />
                <Line yAxisId="left" type="monotone" dataKey="hrv" stroke="#8884d8" />
                <Line yAxisId="right" type="monotone" dataKey="restingHR" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Today's recovery score:</p>
            <Progress value={75} className="h-2" />
            <p className="text-sm text-gray-400 mt-2">75% recovered | Ready for moderate training</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#1E1E1E] border-none">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-yellow-400" />
            <span>Strain</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strainData}>
                <XAxis dataKey="day" stroke="#888888" />
                <YAxis stroke="#8884d8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1E1E1E",
                    border: "none",
                    borderRadius: "8px",
                  }}
                />
                <CartesianGrid stroke="#333" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="strain" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Today's strain:</p>
            <Progress value={68} className="h-2" />
            <p className="text-sm text-gray-400 mt-2">13.7 | Moderate strain</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
