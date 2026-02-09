interface OmniaBubbleWordmarkProps {
  text?: string;
  size?: number;
  darkBg?: boolean;
  inflate?: number;
}

export function OmniaBubbleWordmark({
  text = "OMNIA",
  size = 80,
  darkBg = false,
  inflate = 1
}: OmniaBubbleWordmarkProps) {
  return (
    <div
      style={{
        fontSize: size * 0.4,
        fontWeight: 900,
        color: '#FF6A00',
        letterSpacing: '-0.05em',
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        background: darkBg ? 'transparent' : 'rgba(255, 106, 0, 0.1)',
        filter: `drop-shadow(0 0 8px rgba(255, 106, 0, ${darkBg ? 0.3 : 0.1}))`,
        transform: `scale(${inflate})`,
        lineHeight: 1
      }}
    >
      {text}
    </div>
  )
}

export default OmniaBubbleWordmark
