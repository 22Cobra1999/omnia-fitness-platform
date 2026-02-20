import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"

export const FitnessInfo = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-12"
            style={{ marginTop: "2rem" }}
        >
            <Card className="bg-black text-white border-none transform hover:scale-[1.02] transition-transform duration-300 shadow-2xl">
                <CardContent className="p-6">
                    <h3 className="text-2xl font-mitr font-bold text-[#FF7939] mb-2 text-center px-4">
                        <span className="text-white">Fitness for</span> Optimal Health
                    </h3>
                    <p className="text-gray-400 mb-4">
                        Regular exercise is crucial for maintaining good health and well-being. A balanced fitness routine
                        should include cardio for heart health, strength training for muscle and bone strength, and
                        flexibility exercises for mobility and injury prevention.
                    </p>
                    <div className="flex justify-center items-center">
                        <div className="flex space-x-8">
                            <div className="text-center">
                                <span className="text-[#FF7939] font-bold">🏃‍♂️ Cardio</span>
                                <p className="text-sm">150 min/week</p>
                            </div>
                            <div className="text-center">
                                <span className="text-[#FF7939] font-bold">💪 Strength</span>
                                <p className="text-sm">2-3 sessions/week</p>
                            </div>
                            <div className="text-center">
                                <span className="text-[#FF7939] font-bold">🧘‍♀️ Flexibility</span>
                                <p className="text-sm">Daily stretching</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
