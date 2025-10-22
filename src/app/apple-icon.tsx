import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Three black bars centered vertically - audio equalizer / dumbbell aesthetic (Apple touch icon)
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          background: "hsl(210, 100%, 50%)", // Primary blue background
          padding: "30px",
        }}
      >
        {/* Bar 1: Short (45px) */}
        <div
          style={{
            width: 28,
            height: 45,
            background: "hsl(0, 0%, 0%)",
            borderRadius: 4,
          }}
        />
        {/* Bar 2: Medium (75px) */}
        <div
          style={{
            width: 28,
            height: 75,
            background: "hsl(0, 0%, 0%)",
            borderRadius: 4,
          }}
        />
        {/* Bar 3: Tall (105px) */}
        <div
          style={{
            width: 28,
            height: 105,
            background: "hsl(0, 0%, 0%)",
            borderRadius: 4,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
