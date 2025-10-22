import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Three ascending bars with gradient representing progression (Apple touch icon)
export default function AppleIcon() {
  // Lighter gradient for contrast on blue background
  const gradient =
    "linear-gradient(to top, hsl(210, 100%, 60%), hsl(142, 76%, 45%))";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
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
            background: gradient,
            borderRadius: 4,
          }}
        />
        {/* Bar 2: Medium (75px) */}
        <div
          style={{
            width: 28,
            height: 75,
            background: gradient,
            borderRadius: 4,
          }}
        />
        {/* Bar 3: Tall (105px) */}
        <div
          style={{
            width: 28,
            height: 105,
            background: gradient,
            borderRadius: 4,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
