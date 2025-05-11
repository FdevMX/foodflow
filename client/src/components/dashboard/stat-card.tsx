import { Card, CardContent } from "@/components/ui/card";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  FileText,
  Users,
  ClipboardCheck,
  UtensilsCrossed,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: "chart" | "cash" | "orders" | "staff" | "food";
  trend?: {
    value: string;
    direction: "up" | "down";
  } | null;
  description: string;
}

export function StatCard({ title, value, icon, trend, description }: StatCardProps) {
  const iconMap = {
    chart: <BarChart3 className="text-xl" />,
    cash: <FileText className="text-xl" />,
    orders: <ClipboardCheck className="text-xl" />,
    staff: <Users className="text-xl" />,
    food: <UtensilsCrossed className="text-xl" />,
  };
  
  const bgColorMap = {
    chart: "bg-blue-100 dark:bg-blue-900 text-secondary",
    cash: "bg-blue-100 dark:bg-blue-900 text-secondary",
    orders: "bg-green-100 dark:bg-green-900 text-accent",
    staff: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
    food: "bg-yellow-100 dark:bg-yellow-900 text-warning",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`p-3 rounded-full ${bgColorMap[icon]}`}>
            {iconMap[icon]}
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
            <p className="text-2xl font-semibold">{value}</p>
            {trend ? (
              <p className={`text-sm ${trend.direction === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {trend.direction === 'up' ? <TrendingUp className="inline h-3 w-3 mr-1" /> : <TrendingDown className="inline h-3 w-3 mr-1" />}
                {trend.value} desde ayer
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
