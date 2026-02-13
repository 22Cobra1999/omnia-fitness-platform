"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { User, Edit2, Save } from "lucide-react"

import { usePersonalInfoLogic } from "./hooks/usePersonalInfoLogic"
import { BasicInfoTab } from "./components/BasicInfoTab"
import { GoalsTab } from "./components/GoalsTab"
import { RestrictionsTab } from "./components/RestrictionsTab"
import { AboutMeTab } from "./components/AboutMeTab"

export function PersonalInfo() {
    const {
        loading,
        isEditing,
        setIsEditing,
        activeTab,
        setActiveTab,
        personalInfo,
        currentRestriction,
        restrictionStep,
        setRestrictionStep,
        handleBasicChange,
        handleGoalsChange,
        handleRestrictionChange,
        handleSportsChange,
        handleAddRestriction,
        handleRemoveRestriction,
        handleProfileChange,
        handleSave,
    } = usePersonalInfoLogic()

    if (loading) {
        return (
            <Card className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] border-none shadow-lg overflow-hidden animate-pulse">
                <div className="h-[400px] flex items-center justify-center">
                    <div className="text-gray-500">Loading profile...</div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="bg-gradient-to-br from-[#1E1E1E] to-[#2A2A2A] border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-[#2D2D2D] to-[#232323] pb-4">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-full bg-gradient-to-r from-[#FF7939] to-[#FF5C00]/80">
                            <User className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-white font-medium">Personal Information</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className="text-white hover:bg-[#FF7939]/20 hover:text-white"
                    >
                        {isEditing ? <Save className="h-4 w-4 mr-1" /> : <Edit2 className="h-4 w-4 mr-1" />}
                        {isEditing ? "Save" : "Edit"}
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(value) => {
                    setActiveTab(value)
                    // Scroll hacia arriba cuando se cambia de tab
                    setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                    }, 100)
                }}>
                    <TabsList className="grid w-full grid-cols-4 bg-[#2D2D2D] p-1">
                        <TabsTrigger value="basic" className="data-[state=active]:bg-[#FF7939] data-[state=active]:text-white">
                            Basic
                        </TabsTrigger>
                        <TabsTrigger value="goals" className="data-[state=active]:bg-[#FF7939] data-[state=active]:text-white">
                            Goals
                        </TabsTrigger>
                        <TabsTrigger
                            value="restrictions"
                            className="data-[state=active]:bg-[#FF7939] data-[state=active]:text-white"
                        >
                            Restrictions
                        </TabsTrigger>
                        <TabsTrigger value="profile" className="data-[state=active]:bg-[#FF7939] data-[state=active]:text-white">
                            About Me
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic">
                        <BasicInfoTab
                            isEditing={isEditing}
                            personalInfo={personalInfo}
                            handleBasicChange={handleBasicChange}
                            setIsEditing={setIsEditing}
                        />
                    </TabsContent>

                    <TabsContent value="goals">
                        <GoalsTab
                            isEditing={isEditing}
                            personalInfo={personalInfo}
                            handleGoalsChange={handleGoalsChange}
                            setIsEditing={setIsEditing}
                        />
                    </TabsContent>

                    <TabsContent value="restrictions">
                        <RestrictionsTab
                            isEditing={isEditing}
                            personalInfo={personalInfo}
                            currentRestriction={currentRestriction}
                            restrictionStep={restrictionStep}
                            setRestrictionStep={setRestrictionStep}
                            handleRestrictionChange={handleRestrictionChange}
                            handleAddRestriction={handleAddRestriction}
                            handleRemoveRestriction={handleRemoveRestriction}
                            setIsEditing={setIsEditing}
                            setActiveTab={setActiveTab}
                        />
                    </TabsContent>

                    <TabsContent value="profile">
                        <AboutMeTab
                            isEditing={isEditing}
                            personalInfo={personalInfo}
                            handleProfileChange={handleProfileChange}
                            handleSportsChange={handleSportsChange}
                            setIsEditing={setIsEditing}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card >
    )
}
