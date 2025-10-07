import { Skeleton } from "@/components/ui/skeleton"

export function ActivitySkeletonLoader() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
          {/* Image skeleton */}
          <div className="relative">
            <Skeleton className="h-48 w-full bg-[#2A2A2A]" />
            {/* Type/Category badge skeleton */}
            <div className="absolute top-3 left-3">
              <Skeleton className="h-6 w-20 rounded-full bg-[#3A3A3A]" />
            </div>
            {/* Difficulty badge skeleton */}
            <div className="absolute top-3 right-3">
              <Skeleton className="h-6 w-16 rounded-full bg-[#3A3A3A]" />
            </div>
          </div>

          <div className="p-4">
            {/* Title skeleton */}
            <Skeleton className="h-6 w-4/5 mb-2 bg-[#2A2A2A]" />

            {/* Description skeleton */}
            <Skeleton className="h-4 w-full mb-1 bg-[#2A2A2A]" />
            <Skeleton className="h-4 w-3/4 mb-4 bg-[#2A2A2A]" />

            {/* Coach info skeleton */}
            <div className="flex items-center space-x-3 mb-3">
              <Skeleton className="h-8 w-8 rounded-full bg-[#2A2A2A]" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1 bg-[#2A2A2A]" />
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-3 w-3 bg-[#2A2A2A]" />
                  <Skeleton className="h-3 w-8 bg-[#2A2A2A]" />
                </div>
              </div>
            </div>

            {/* Rating and duration info skeleton */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-1">
                <Skeleton className="h-4 w-4 bg-[#2A2A2A]" />
                <Skeleton className="h-4 w-12 bg-[#2A2A2A]" />
                <Skeleton className="h-4 w-8 bg-[#2A2A2A]" />
              </div>
              <div className="flex items-center space-x-1">
                <Skeleton className="h-4 w-4 bg-[#2A2A2A]" />
                <Skeleton className="h-4 w-16 bg-[#2A2A2A]" />
              </div>
            </div>

            {/* Price and button skeleton */}
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-16 bg-[#2A2A2A]" />
              <Skeleton className="h-9 w-24 rounded-md bg-[#2A2A2A]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function CoachSkeletonLoader() {
  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex-shrink-0 w-40">
          <Skeleton className="h-40 w-40 rounded-xl bg-[#2A2A2A]" />
          <Skeleton className="h-4 w-20 mt-2 mx-auto bg-[#2A2A2A]" />
        </div>
      ))}
    </div>
  )
}
