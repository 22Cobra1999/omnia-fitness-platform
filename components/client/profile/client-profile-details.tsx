"use client"

import { useClientProfile } from "@/components/client/hooks/useClientProfile"
import { ProfileHeader } from "./details/ProfileHeader"
import { BasicInfoSection } from "./details/BasicInfoSection"
import { AdditionalInfoSection } from "./details/AdditionalInfoSection"
import { GoalsSection } from "./details/GoalsSection"
import { RestrictionsSection } from "./details/RestrictionsSection"

export function ClientProfileDetails() {
  const { state, actions } = useClientProfile()

  return (
    <div className="p-6 bg-[#1A1A1A] rounded-lg">
      <ProfileHeader
        isEditing={state.isEditing}
        onToggle={actions.toggleEditing}
        onSave={actions.saveChanges}
      />

      {/* Basic Info and Profile Data - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <BasicInfoSection
          data={state.personalInfo.basic}
          onChange={actions.updateBasicInfo}
          isEditing={state.isEditing}
        />
        <AdditionalInfoSection
          data={state.personalInfo.profile}
          onChange={actions.updateProfileInfo}
          isEditing={state.isEditing}
        />
      </div>

      {/* Goals and Restrictions - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GoalsSection
          goals={state.personalInfo.goals}
          actions={actions.goals}
          state={state}
          isEditing={state.isEditing}
        />
        <RestrictionsSection
          restrictions={state.personalInfo.restrictions}
          draft={state.currentRestriction}
          step={state.restrictionStep}
          actions={actions.restrictions}
          isEditing={state.isEditing}
        />
      </div>
    </div>
  )
}
