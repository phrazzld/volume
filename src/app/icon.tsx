import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Three black bars centered vertically (audio equalizer / dumbbell aesthetic)
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "2px",
          background: "transparent",
          padding: "3px",
        }}
      >
        {/* Bar 1: Short (10px tall) */}
        <div
          style={{
            width: 6,
            height: 10,
            background: "hsl(0, 0%, 0%)",
            borderRadius: 1.5,
          }}
        />
        {/* Bar 2: Medium (18px tall) */}
        <div
          style={{
            width: 6,
            height: 18,
            background: "hsl(0, 0%, 0%)",
            borderRadius: 1.5,
          }}
        />
        {/* Bar 3: Tall (26px tall) */}
        <div
          style={{
            width: 6,
            height: 26,
            background: "hsl(0, 0%, 0%)",
            borderRadius: 1.5,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
