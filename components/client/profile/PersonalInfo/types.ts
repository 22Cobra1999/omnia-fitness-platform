export type Restriction = {
    category: string
    type: string
    specification: string
}

export type NutritionJourneyItem = {
    type: "meal" | "action"
    description: string
}

export type ProfileInfo = {
    bio?: string
    location?: string
    profession?: string
    interests?: string
}

export type PersonalInfoState = {
    basic: {
        birthDate: string
        weight: string
        height: string
        gender: string
    }
    goals: {
        objectives: string
        estimatedTime: string
        fatPercentage: string
        musclePercentage: string
    }
    sports: string[]
    restrictions: Restriction[]
    profile: ProfileInfo
}
