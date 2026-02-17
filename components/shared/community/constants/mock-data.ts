export interface User {
    id: string
    name: string
    username: string
    avatar: string
    isCoach: boolean
    isTopClient: boolean
    coachType?: "gym" | "fitness" | "nutrition"
}

export interface Post {
    id: string
    user: User
    content: string
    image?: string
    video?: string
    thumbnail?: string
    likes: number
    comments: number
    reposts: number
    timestamp: string
    type:
    | "regular"
    | "coach"
    | "topClient"
    | "omnia"
    | "liveSession"
    | "challenge"
    | "qa"
    | "successStory"
    | "coachVideo"
    | "nutritionCoach"
    | "product"
    product?: {
        name: string
        price: number
        brand: string
        isBrandOmnia: boolean
    }
}

export interface FolderData {
    id: string
    title: string
    files: { id: string; title: string; thumbnail: string }[]
}

export interface VideoFile {
    id: string
    title: string
    thumbnail: string
}

export const mockUsers: User[] = [
    {
        id: "1",
        name: "Jane Doe",
        username: "janedoe",
        avatar: "/placeholder.svg?height=50&width=50",
        isCoach: false,
        isTopClient: false,
    },
    {
        id: "2",
        name: "John Smith",
        username: "johnsmith",
        avatar: "/placeholder.svg?height=50&width=50",
        isCoach: false,
        isTopClient: false,
    },
    {
        id: "3",
        name: "Fitness Coach",
        username: "fitnesscoach",
        avatar: "/placeholder.svg?height=50&width=50",
        isCoach: true,
        isTopClient: false,
        coachType: "fitness",
    },
    {
        id: "4",
        name: "Gym Coach",
        username: "gymcoach",
        avatar: "/placeholder.svg?height=50&width=50",
        isCoach: true,
        isTopClient: false,
        coachType: "gym",
    },
    {
        id: "5",
        name: "Top Client",
        username: "topclient",
        avatar: "/placeholder.svg?height=50&width=50",
        isCoach: false,
        isTopClient: true,
    },
    { id: "6", name: "Omnia Official", username: "omnia", avatar: "/omnia-logo-original.svg", isCoach: false, isTopClient: false },
    {
        id: "7",
        name: "Nutrition Coach",
        username: "nutritioncoach",
        avatar: "/placeholder.svg?height=50&width=50",
        isCoach: true,
        isTopClient: false,
        coachType: "nutrition",
    },
]

export const mockPosts: Post[] = [
    {
        id: "1",
        user: mockUsers[0],
        content: "Just finished an amazing workout! 💪 Feeling energized and ready to tackle the day. #FitnessGoals",
        image: "/placeholder.svg?height=400&width=600",
        likes: 120,
        comments: 15,
        reposts: 5,
        timestamp: "2h ago",
        type: "regular",
    },
    {
        id: "2",
        user: mockUsers[1],
        content:
            "New healthy recipe alert! 🥗 Check out this delicious and nutritious salad I made for lunch. #HealthyEating",
        likes: 85,
        comments: 10,
        reposts: 2,
        timestamp: "4h ago",
        type: "regular",
    },
    {
        id: "3",
        user: mockUsers[2],
        content: "Yoga training for beginners 🧘‍♀️ Unlock your flexibility and inner peace with these simple poses!",
        video: "/placeholder.mp4",
        thumbnail: "/placeholder.svg?height=400&width=600",
        likes: 200,
        comments: 30,
        reposts: 15,
        timestamp: "6h ago",
        type: "coachVideo",
    },
    {
        id: "4",
        user: mockUsers[3],
        content: "Build big biceps with this exercise 💪 Watch now to learn the secret to massive arms!",
        video: "/placeholder.mp4",
        thumbnail: "/placeholder.svg?height=400&width=600",
        likes: 180,
        comments: 25,
        reposts: 12,
        timestamp: "8h ago",
        type: "coachVideo",
    },
    {
        id: "5",
        user: mockUsers[4],
        content: "Here's my weekly progress update! Down 2 lbs and feeling stronger than ever. 💪 #FitnessJourney",
        likes: 150,
        comments: 25,
        reposts: 10,
        timestamp: "1d ago",
        type: "topClient",
    },
    {
        id: "6",
        user: mockUsers[5],
        content:
            "Improve your sleep quality by reading before bedtime. This helps relax your mind and prepare your body for rest. 📚💤 #WellnessTip",
        likes: 300,
        comments: 50,
        reposts: 30,
        timestamp: "1d ago",
        type: "omnia",
    },
    {
        id: "7",
        user: mockUsers[6],
        content: "Meal prep tips for a balanced diet 🥑🍗🥦 Learn how to plan your meals for optimal nutrition!",
        video: "/placeholder.mp4",
        thumbnail: "/placeholder.svg?height=400&width=600",
        likes: 250,
        comments: 40,
        reposts: 20,
        timestamp: "3h ago",
        type: "nutritionCoach",
    },
    {
        id: "8",
        user: mockUsers[5],
        content: "Elevate your workouts with our premium resistance bands. Perfect for home or gym use!",
        image: "/placeholder.svg?height=400&width=600",
        likes: 210,
        comments: 35,
        reposts: 18,
        timestamp: "5h ago",
        type: "product",
        product: {
            name: "Premium Resistance Bands Set",
            price: 29.99,
            brand: "OMNIA Fitness",
            isBrandOmnia: true,
        },
    },
    {
        id: "9",
        user: mockUsers[2],
        content: "This protein powder changed my recovery game! I recommend it to all my clients.",
        image: "/placeholder.svg?height=400&width=600",
        likes: 175,
        comments: 42,
        reposts: 15,
        timestamp: "7h ago",
        type: "product",
        product: {
            name: "Whey Protein Isolate",
            price: 39.99,
            brand: "NutriFit",
            isBrandOmnia: false,
        },
    },
    {
        id: "10",
        user: mockUsers[6],
        content: "The perfect meal prep containers for portion control and healthy eating on the go!",
        image: "/placeholder.svg?height=400&width=600",
        likes: 145,
        comments: 28,
        reposts: 12,
        timestamp: "9h ago",
        type: "product",
        product: {
            name: "Meal Prep Container Set",
            price: 24.99,
            brand: "MealMaster",
            isBrandOmnia: false,
        },
    },
]
