import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Three gradient bars centered vertically (audio equalizer / dumbbell aesthetic)
export default function Icon() {
  // Gradient: Blue (primary/energy) → Green (success/achievement)
  const gradient =
    "linear-gradient(to top, hsl(210, 100%, 50%), hsl(142, 76%, 36%))";

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
            background: gradient,
            borderRadius: 1.5,
          }}
        />
        {/* Bar 2: Medium (18px tall) */}
        <div
          style={{
            width: 6,
            height: 18,
            background: gradient,
            borderRadius: 1.5,
          }}
        />
        {/* Bar 3: Tall (26px tall) */}
        <div
          style={{
            width: 6,
            height: 26,
            background: gradient,
            borderRadius: 1.5,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
