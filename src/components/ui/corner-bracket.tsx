interface CornerBracketProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  size?: number;
  color?: string;
}

export function CornerBracket({
  position,
  size = 8,
  color = "#444444",
}: CornerBracketProps) {
  const positionClasses = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "bottom-right": "bottom-0 right-0",
  };

  // SVG paths for each corner (L-shaped brackets)
  const paths = {
    "top-left": (
      <>
        <line x1="0" y1={size} x2="0" y2="0" stroke={color} strokeWidth="1" />
        <line x1="0" y1="0" x2={size} y2="0" stroke={color} strokeWidth="1" />
      </>
    ),
    "top-right": (
      <>
        <line
          x1={size}
          y1={size}
          x2={size}
          y2="0"
          stroke={color}
          strokeWidth="1"
        />
        <line x1={size} y1="0" x2="0" y2="0" stroke={color} strokeWidth="1" />
      </>
    ),
    "bottom-left": (
      <>
        <line x1="0" y1="0" x2="0" y2={size} stroke={color} strokeWidth="1" />
        <line x1="0" y1={size} x2={size} y2={size} stroke={color} strokeWidth="1" />
      </>
    ),
    "bottom-right": (
      <>
        <line
          x1={size}
          y1="0"
          x2={size}
          y2={size}
          stroke={color}
          strokeWidth="1"
        />
        <line x1={size} y1={size} x2="0" y2={size} stroke={color} strokeWidth="1" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      className={`absolute ${positionClasses[position]} pointer-events-none`}
      style={{ zIndex: 10 }}
    >
      {paths[position]}
    </svg>
  );
}
