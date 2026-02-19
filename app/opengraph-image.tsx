import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const alt = 'OMNIA Fitness & Wellness'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

// Image generation
export default async function Image() {
    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 128,
                    background: 'black',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontFamily: 'sans-serif',
                }}
            >
                <div style={{
                    background: 'linear-gradient(to right, #FF5733, #FFC300)',
                    backgroundClip: 'text',
                    color: 'transparent',
                    fontWeight: 'bold'
                }}>
                    OMNIA
                </div>
                <div style={{ fontSize: 40, marginTop: 40, color: '#888' }}>
                    Fitness & Wellness Platform
                </div>
            </div>
        ),
        // ImageResponse options
        {
            ...size,
        }
    )
}
