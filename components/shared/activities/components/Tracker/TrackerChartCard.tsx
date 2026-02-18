import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { LucideIcon } from "lucide-react"

interface ChartData {
    day: string
    [key: string]: string | number
}

interface TrackerChartCardProps {
    title: string
    icon: LucideIcon
    iconColor: string
    data: ChartData[]
    mainDataKey: string
    secondaryDataKey?: string
    mainLineColor: string
    secondaryLineColor?: string
    footerLabel: string
    footerValue: string
    progressValue: number
    type?: 'line' | 'bar'
}

export function TrackerChartCard({
    title,
    icon: Icon,
    iconColor,
    data,
    mainDataKey,
    secondaryDataKey,
    mainLineColor,
    secondaryLineColor,
    footerLabel,
    footerValue,
    progressValue,
    type = 'line'
}: TrackerChartCardProps) {
    return (
        <Card className="bg-[#1E1E1E] border-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        {type === 'line' ? (
                            <LineChart data={data}>
                                <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} hide />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1E1E1E",
                                        border: "none",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Line type="monotone" dataKey={mainDataKey} stroke={mainLineColor} strokeWidth={2} dot={false} />
                                {secondaryDataKey && (
                                    <Line type="monotone" dataKey={secondaryDataKey} stroke={secondaryLineColor} strokeWidth={2} dot={false} />
                                )}
                            </LineChart>
                        ) : (
                            <BarChart data={data}>
                                <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} hide />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1E1E1E",
                                        border: "none",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Bar dataKey={mainDataKey} fill={mainLineColor} radius={[4, 4, 0, 0]} />
                                {secondaryDataKey && (
                                    <Bar dataKey={secondaryDataKey} fill={secondaryLineColor} radius={[4, 4, 0, 0]} />
                                )}
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>
                <div className="mt-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <span>{footerLabel}</span>
                        <span>{footerValue}</span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                </div>
            </CardContent>
        </Card>
    )
}
