type FlameIconProps = {
  primaryColor: string
  secondaryColor: string
  centerColor: string
  className?: string
}

export function FlameIcon({ primaryColor, secondaryColor, centerColor, className = "w-6 h-6" }: FlameIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M12 2.25C10.5 4.25 7.5 8.5 7.5 12.5C7.5 16.5 9.5 19.75 12 19.75C14.5 19.75 16.5 16.5 16.5 12.5C16.5 8.5 13.5 4.25 12 2.25Z"
        fill={primaryColor}
      />
      <path
        d="M12 4.75C11 6.25 9.5 9.5 9.5 12C9.5 15 10.75 17.25 12 17.25C13.25 17.25 14.5 15 14.5 12C14.5 9.5 13 6.25 12 4.75Z"
        fill={secondaryColor}
      />
      <path
        d="M12 7.75C11.5 8.75 11 10.5 11 12C11 13.5 11.5 14.75 12 14.75C12.5 14.75 13 13.5 13 12C13 10.5 12.5 8.75 12 7.75Z"
        fill={centerColor}
      />
    </svg>
  )
}
