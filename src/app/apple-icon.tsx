import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// Three ascending bars representing training volume progression (Apple touch icon)
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '8px',
          background: '#000000', // Black background for Apple icon
          padding: '20px',
        }}
      >
        {/* Bar 1: Short */}
        <div
          style={{
            width: 32,
            height: 50,
            background: '#00ff00',
            borderRadius: 4,
          }}
        />
        {/* Bar 2: Medium */}
        <div
          style={{
            width: 32,
            height: 90,
            background: '#00ff00',
            borderRadius: 4,
          }}
        />
        {/* Bar 3: Tall */}
        <div
          style={{
            width: 32,
            height: 130,
            background: '#00ff00',
            borderRadius: 4,
          }}
        />
      </div>
    ),
    { ...size }
  )
}
