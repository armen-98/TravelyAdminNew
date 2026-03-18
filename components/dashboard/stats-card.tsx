import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: number;
  color?: "blue" | "green" | "orange" | "red" | "purple" | "yellow";
}

const colorMap = {
  blue:   "bg-blue-500/10 text-blue-600",
  green:  "bg-green-500/10 text-green-600",
  orange: "bg-orange-500/10 text-orange-600",
  red:    "bg-red-500/10 text-red-600",
  purple: "bg-purple-500/10 text-purple-600",
  yellow: "bg-yellow-500/10 text-yellow-600",
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = "blue",
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend !== undefined && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% from last month
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-xl", colorMap[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
