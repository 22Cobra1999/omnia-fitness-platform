import type React from "react"

interface OmniaCoinIconProps {
  className?: string
}

export const OmniaCoinIcon: React.FC<OmniaCoinIconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" fill="#FFD700" />
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
        fill="#FF7939"
      />
      <path d="M11 7h2v2h-2zm0 4h2v6h-2z" fill="#FF7939" />
    </svg>
  )
}
