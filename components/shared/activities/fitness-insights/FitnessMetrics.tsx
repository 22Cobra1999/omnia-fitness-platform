import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Flame, Scale, Droplet } from "lucide-react"

export const FitnessMetrics = () => {
    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="col-span-4"
            >
                <Card className="bg-[#1E1E1E] border-none shadow-xl hover:shadow-2xl transition-all h-full">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 rounded-full bg-[#FF7939]/10 mb-4">
                                <Flame className="h-6 w-6 text-[#FF7939]" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-white">750</h3>
                                <p className="text-sm text-gray-400">Active Minutes</p>
                                <p className="text-xs font-semibold text-green-400">Good</p>
                                <p className="text-xs text-gray-400">
                                    <span className="text-green-400">+50</span> from last week
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="col-span-4"
            >
                <Card className="bg-[#1E1E1E] border-none shadow-xl hover:shadow-2xl transition-all h-full">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 rounded-full bg-[#FFB56B]/10 mb-4">
                                <Scale className="h-6 w-6 text-[#FFB56B]" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-white">75.2 kg</h3>
                                <p className="text-sm text-gray-400">Weight</p>
                                <p className="text-xs font-semibold text-[#FFB56B]">Excellent</p>
                                <p className="text-xs text-gray-400">
                                    <span className="text-green-400">-0.5 kg</span> from last week
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="col-span-4"
            >
                <Card className="bg-[#1E1E1E] border-none shadow-xl hover:shadow-2xl transition-all h-full">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 rounded-full bg-[#60A5FA]/10 mb-4">
                                <Droplet className="h-6 w-6 text-[#60A5FA]" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold text-white">1.8 L</h3>
                                <p className="text-sm text-gray-400">Water Intake</p>
                                <p className="text-xs font-semibold text-yellow-400">Needs Improvement</p>
                                <p className="text-xs text-gray-400">
                                    <span className="text-red-400">-0.2 L</span> from last week
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </>
    )
}
