import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] to-[#1A1A1A] pt-32 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <Skeleton className="h-10 w-64 bg-[#252525] mb-2" />
            <Skeleton className="h-5 w-96 bg-[#252525]" />
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Skeleton className="h-10 w-10 rounded-full bg-[#252525]" />
            <Skeleton className="h-10 w-40 rounded-full bg-[#252525]" />
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <Skeleton className="h-12 w-96 rounded-full bg-[#252525]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-[#252525]" />
          ))}
        </div>

        <Skeleton className="h-[600px] rounded-xl bg-[#252525] mb-8" />
      </div>
    </div>
  )
}
