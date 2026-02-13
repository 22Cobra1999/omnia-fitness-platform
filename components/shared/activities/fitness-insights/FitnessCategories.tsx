import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { fitnessCategoriesData } from "../fitness-insights-data"

interface FitnessCategoriesProps {
    setSelectedCategory: (val: string | null) => void
}

export const FitnessCategories = ({ setSelectedCategory }: FitnessCategoriesProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="col-span-12 mt-8"
        >
            <Card className="bg-[#1E1E1E] text-white border-none shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Fitness Categories</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {fitnessCategoriesData.map((category, index) => (
                            <Card key={index} className="bg-[#2A2A2A] border-none">
                                <CardHeader className="flex flex-row items-center space-x-2">
                                    <category.icon className={`w-6 h-6 ${category.color}`} />
                                    <CardTitle>{category.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-400">{category.description}</p>

                                    <div className="flex items-center mt-4 mb-4">
                                        <div className="relative w-10 h-10 mr-3">
                                            <Image
                                                src={category.coachImage || "/placeholder.svg"}
                                                alt={category.coach}
                                                width={40}
                                                height={40}
                                                className="rounded-full object-cover"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">Coach</p>
                                            <p className={`text-sm font-bold ${category.color}`}>{category.coach}</p>
                                        </div>
                                    </div>

                                    <div className="mt-2">
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => setSelectedCategory(category.title)}
                                        >
                                            View Routines
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
