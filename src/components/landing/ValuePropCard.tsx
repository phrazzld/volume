"use client";

interface ValuePropCardProps {
  title: string;
  description: string[];
  accentColor?: "info" | "warning" | "accent";
}

const accentColorClasses = {
  info: "border-t-terminal-info",
  warning: "border-t-terminal-warning",
  accent: "border-t-terminal-accent",
};

export function ValuePropCard({ title, description, accentColor = "info" }: ValuePropCardProps) {
  return (
    <div
      className={`bg-terminal-bg border border-terminal-border border-t-2 ${accentColorClasses[accentColor]} p-6 transition-colors hover:border-terminal-info`}
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-terminal-text mb-4">
        {title}
      </h3>
      <div className="space-y-1">
        {description.map((line, index) => (
          <p key={index} className="text-xs uppercase text-terminal-textSecondary font-mono">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
