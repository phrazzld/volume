"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ValuePropCardProps {
  title: string;
  description: string[];
  accentColor?: "info" | "warning" | "accent";
}

const accentColorClasses = {
  info: "border-t-blue-500",
  warning: "border-t-yellow-500",
  accent: "border-t-purple-500",
};

export function ValuePropCard({
  title,
  description,
  accentColor = "info",
}: ValuePropCardProps) {
  return (
    <Card
      className={`border-t-2 ${accentColorClasses[accentColor]} transition-colors hover:border-primary`}
    >
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {description.map((line, index) => (
            <p key={index} className="text-sm text-muted-foreground">
              {line}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
