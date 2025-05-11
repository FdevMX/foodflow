import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

interface SalesByCategoryData {
  category: string;
  totalSales: number;
}

interface SalesChartProps {
  data: SalesByCategoryData[];
  isLoading: boolean;
}

export function SalesChart({ data, isLoading }: SalesChartProps) {
  // Transform the data for the chart
  const chartData = data.map(item => ({
    name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
    value: Number(item.totalSales)
  }));

  // Calculate percentages
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const dataWithPercentage = chartData.map(item => ({
    ...item,
    percentage: total ? ((item.value / total) * 100).toFixed(0) : 0
  }));

  // Colors for the chart
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <Card className="h-full">
      <CardHeader className="px-6 py-4 border-b border-border">
        <CardTitle className="text-base font-medium">Ventas por Categoría</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="aspect-square flex flex-col items-center justify-center">
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="aspect-square bg-muted/30 rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">No hay datos de ventas disponibles</p>
          </div>
        ) : (
          <div className="aspect-square">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataWithPercentage}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="70%"
                  innerRadius="40%"
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                >
                  {dataWithPercentage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Sales']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
