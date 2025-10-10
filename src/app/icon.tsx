import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// Three ascending bars representing training volume progression
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap: '2px',
          background: 'transparent',
        }}
      >
        {/* Bar 1: Short (10px tall) */}
        <div
          style={{
            width: 6,
            height: 10,
            background: '#00ff00',
            borderRadius: 1,
          }}
        />
        {/* Bar 2: Medium (18px tall) */}
        <div
          style={{
            width: 6,
            height: 18,
            background: '#00ff00',
            borderRadius: 1,
          }}
        />
        {/* Bar 3: Tall (26px tall) */}
        <div
          style={{
            width: 6,
            height: 26,
            background: '#00ff00',
            borderRadius: 1,
          }}
        />
      </div>
    ),
    { ...size }
  )
}
