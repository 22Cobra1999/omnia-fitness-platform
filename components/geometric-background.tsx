export function GeometricBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] opacity-20">
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#FF7939] blur-3xl" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-[#1E1E1E] shadow-2xl" />
        <div className="absolute top-[10%] right-[30%] w-[200px] h-[200px] rounded-full bg-[#2A2A2A] shadow-2xl" />
      </div>
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] opacity-20">
        <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-[#FF7939] blur-3xl" />
        <div className="absolute bottom-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-[#1E1E1E] shadow-2xl" />
        <div className="absolute bottom-[10%] left-[30%] w-[200px] h-[200px] rounded-full bg-[#2A2A2A] shadow-2xl" />
      </div>
    </div>
  )
}
