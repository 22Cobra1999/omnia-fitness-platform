"use client"

import React from "react"
// Modular Components
import { ClientProfileHeader } from "./components/ClientProfileHeader"
import { ClientProfileActivity } from "./components/ClientProfileActivity"
import { ClientProfileMetrics } from "./components/ClientProfileMetrics"
import { ClientProfileHistory } from "./components/ClientProfileHistory"

interface ClientProfileViewProps {
    logic: any
}

export function ClientProfileView({ logic }: ClientProfileViewProps) {
    const {
        user,
        managedProfile,
        isEditingProfile,
        handleCancelProfileEdit,
        handleEditSection,
        showOnboardingForm,
        setShowOnboardingForm,
        editName,
        setEditName,
        editLocation,
        setEditLocation,
        editBirthDate,
        setEditBirthDate,
        editGoals,
        setEditGoals,
        editSports,
        setEditSports,
        isUploadingAvatar,
        setIsUploadingAvatar,
        setShowGoalsSelect,
        setShowSportsSelect,
        handleSaveProfile,
        loadProfile,
        calculateAge,
        activityFilter,
        setActivityFilter,
        ringsWeek,
        setRingsWeek,
        selectedDay,
        setSelectedDay,
        showCalendar,
        setShowCalendar,
        metricsLoading,
        activityRings,
        displayBiometrics,
        handleEditBiometric,
        setIsBiometricsModalOpen,
        setBiometricsModalMode,
        isEditingObjectives,
        setIsEditingObjectives,
        objectivesRef,
        isSavingObjectives,
        setIsSavingObjectives,
        showQuickAdd,
        setShowQuickAdd,
        handleQuickAddExercise,
        setShowInjuriesModal,
        injuries
    } = logic

    return (
        <div className="space-y-6">
            <ClientProfileHeader
                user={user}
                managedProfile={managedProfile}
                isEditingProfile={isEditingProfile}
                handleCancelProfileEdit={handleCancelProfileEdit}
                handleEditSection={handleEditSection}
                showOnboardingForm={showOnboardingForm}
                setShowOnboardingForm={setShowOnboardingForm}
                editName={editName}
                setEditName={setEditName}
                editLocation={editLocation}
                setEditLocation={setEditLocation}
                editBirthDate={editBirthDate}
                setEditBirthDate={setEditBirthDate}
                editGoals={editGoals}
                setEditGoals={setEditGoals}
                editSports={editSports}
                setEditSports={setEditSports}
                isUploadingAvatar={isUploadingAvatar}
                setIsUploadingAvatar={setIsUploadingAvatar}
                setShowGoalsSelect={setShowGoalsSelect}
                setShowSportsSelect={setShowSportsSelect}
                handleSaveProfile={handleSaveProfile}
                loadProfile={loadProfile}
                calculateAge={calculateAge}
            />

            <ClientProfileActivity
                user={user}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                activityFilter={activityFilter}
                setActivityFilter={setActivityFilter}
                ringsWeek={ringsWeek}
                setRingsWeek={setRingsWeek}
                showCalendar={showCalendar}
                setShowCalendar={setShowCalendar}
                metricsLoading={metricsLoading}
                activityRings={activityRings}
            />

            <ClientProfileMetrics
                displayBiometrics={displayBiometrics}
                handleEditBiometric={handleEditBiometric}
                setBiometricsModalMode={setBiometricsModalMode}
                setIsBiometricsModalOpen={setIsBiometricsModalOpen}
                isEditingObjectives={isEditingObjectives}
                setIsEditingObjectives={setIsEditingObjectives}
                objectivesRef={objectivesRef}
                isSavingObjectives={isSavingObjectives}
                setIsSavingObjectives={setIsSavingObjectives}
                showQuickAdd={showQuickAdd}
                setShowQuickAdd={setShowQuickAdd}
                handleQuickAddExercise={handleQuickAddExercise}
                injuries={injuries}
                setShowInjuriesModal={setShowInjuriesModal}
            />

            <ClientProfileHistory
                user={user}
                handleEditSection={handleEditSection}
            />
        </div>
    )
}
