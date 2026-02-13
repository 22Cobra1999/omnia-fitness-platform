"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { useFitnessInsights } from "./useFitnessInsights"

// Sub-components
import { FitnessMetrics } from "./fitness-insights/FitnessMetrics"
import { FitnessVideoPlayer } from "./fitness-insights/FitnessVideoPlayer"
import { FitnessJourney } from "./fitness-insights/FitnessJourney"
import { FitnessInfo } from "./fitness-insights/FitnessInfo"
import { FitnessCategories } from "./fitness-insights/FitnessCategories"
import { FitnessFolders } from "./fitness-insights/FitnessFolders"
import { FitnessModals } from "./fitness-insights/FitnessModals"

export function FitnessInsights() {
  const { state, actions } = useFitnessInsights()

  return (
    <div className="relative min-h-screen bg-[#121212] p-8">
      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-12 gap-4">
          {/* Title Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="col-span-12 mb-4">
            <Card className="bg-black text-white border-none shadow-2xl">
              <CardContent className="p-8">
                <h1 className="text-4xl font-bold mb-2">Fitness Insights</h1>
                <p className="text-gray-400">Track your progress and optimize your fitness routine</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Metrics Cards */}
          <FitnessMetrics />

          {/* Video Player */}
          <FitnessVideoPlayer
            currentVideoIndex={state.currentVideoIndex}
            myJourneyVideos={state.myJourneyVideos}
            isPlaying={state.isPlaying}
            volume={state.volume}
            isMuted={state.isMuted}
            handlePreviousVideo={actions.handlePreviousVideo}
            handleNextVideo={actions.handleNextVideo}
            playMyJourney={actions.playMyJourney}
          />

          {/* My Journey Section */}
          <FitnessJourney
            selectedWeek={state.selectedWeek}
            selectedDate={state.selectedDate}
            myJourneyVideos={state.myJourneyVideos}
            categoryInput={state.categoryInput}
            categorySuggestions={state.categorySuggestions}
            goToPreviousWeek={actions.goToPreviousWeek}
            goToNextWeek={actions.goToNextWeek}
            goToPreviousDay={actions.goToPreviousDay}
            goToNextDay={actions.goToNextDay}
            updateExercise={actions.updateExercise}
            setCategoryInput={actions.setCategoryInput}
            setCategorySuggestions={actions.setCategorySuggestions}
            formatRepsXSeries={actions.formatRepsXSeries}
            handlePlayVideo={actions.handlePlayVideo}
            setMyJourneyVideos={actions.setMyJourneyVideos}
          />

          {/* Fitness Info Card */}
          <FitnessInfo />

          {/* Fitness Categories */}
          <FitnessCategories setSelectedCategory={actions.setSelectedCategory} />

          {/* Fitness Folders Section */}
          <FitnessFolders
            fitnessFolders={state.fitnessFolders}
            isAddFolderDialogOpen={state.isAddFolderDialogOpen}
            setIsAddFolderDialogOpen={actions.setIsAddFolderDialogOpen}
            newFolderTitle={state.newFolderTitle}
            setNewFolderTitle={actions.setNewFolderTitle}
            addNewFolder={actions.addNewFolder}
            editingFolder={state.editingFolder}
            setEditingFolder={actions.setEditingFolder}
            updateFolderTitle={actions.updateFolderTitle}
            deleteFolder={actions.deleteFolder}
            handlePlayVideo={actions.handlePlayVideo}
            myJourneyVideos={state.myJourneyVideos}
            setMyJourneyVideos={actions.setMyJourneyVideos}
            addedVideos={state.addedVideos}
            setAddedVideos={actions.setAddedVideos}
          />
        </div>
      </div>

      {/* Dialogs & Modals */}
      <FitnessModals
        openDialog={state.openDialog}
        setOpenDialog={actions.setOpenDialog}
        isTimeModalOpen={state.isTimeModalOpen}
        setIsTimeModalOpen={actions.setIsTimeModalOpen}
        mealTime={state.mealTime}
        setMealTime={actions.setMealTime}
        addMealToJourney={actions.addMealToJourney}
        selectedCategory={state.selectedCategory}
        setSelectedCategory={actions.setSelectedCategory}
        addExerciseToJourney={actions.addExerciseToJourney}
        handlePlayVideo={actions.handlePlayVideo}
        selectedVideo={state.selectedVideo}
        setSelectedVideo={actions.setSelectedVideo}
        isAddCategoryDialogOpen={state.isAddCategoryDialogOpen}
        setIsAddCategoryDialogOpen={actions.setIsAddCategoryDialogOpen}
        newCategoryName={state.newCategoryName}
        setNewCategoryName={actions.setNewCategoryName}
        setAvailableCategories={actions.setAvailableCategories}
        setNewExercise={actions.setNewExercise}
      />
    </div>
  )
}
