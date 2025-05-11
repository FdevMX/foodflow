import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DateRange } from "react-day-picker";
import { format, subDays, startOfDay, endOfDay, formatISO, addDays } from "date-fns";
import { Download, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const [activeTab, setActiveTab] = useState("sales");

  // Format date range for API calls
  const startDate = dateRange?.from ? formatISO(startOfDay(dateRange.from)) : "";
  const endDate = dateRange?.to ? formatISO(endOfDay(dateRange.to)) : "";

  // Orders by date range
  const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["/api/orders", "dateRange", startDate, endDate],
    queryFn: async () => {
      const res = await fetch(
        `/api/orders?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(
          endDate
        )}`
      );
      if (!res.ok) throw new Error("Fallo al obtener las órdenes por rango de fechas");
      return res.json();
    },
    enabled: !!(dateRange?.from && dateRange?.to),
  });

  // Sales by category
  const { data: categorySales, isLoading: isCategorySalesLoading } = useQuery({
    queryKey: ["/api/analytics/sales-by-category"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/sales-by-category");
      if (!res.ok) throw new Error("Fallo al obtener las ventas por categoría");
      return res.json();
    },
  });

  // Sales by staff
  const { data: staffSales, isLoading: isStaffSalesLoading } = useQuery({
    queryKey: ["/api/analytics/sales-by-staff"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/sales-by-staff");
      if (!res.ok) throw new Error("Fallo al obtener las ventas por personal");
      return res.json();
    },
  });

  // Popular items
  const { data: popularItems, isLoading: isPopularItemsLoading } = useQuery({
    queryKey: ["/api/analytics/popular-items", 10],
    queryFn: async () => {
      const res = await fetch("/api/analytics/popular-items?limit=10");
      if (!res.ok) throw new Error("Fallo al obtener los artículos populares");
      return res.json();
    },
  });

  // Process data for charts
  const generateSalesDataByDate = () => {
    if (!ordersData || !dateRange?.from || !dateRange?.to) return [];

    const salesMap = new Map();
    let currentDate = new Date(dateRange.from);
    const lastDate = new Date(dateRange.to);

    // Initialize with zero values for every day in range
    while (currentDate <= lastDate) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      salesMap.set(dateStr, { date: dateStr, sales: 0, orders: 0 });
      currentDate = addDays(currentDate, 1);
    }

    // Fill in actual values
    ordersData.forEach((order: any) => {
      const orderDate = format(new Date(order.createdAt), "yyyy-MM-dd");
      if (salesMap.has(orderDate)) {
        const current = salesMap.get(orderDate);
        salesMap.set(orderDate, {
          date: orderDate,
          sales: current.sales + order.totalAmount,
          orders: current.orders + 1,
        });
      }
    });

    return Array.from(salesMap.values()).map((item) => ({
      ...item,
      date: format(new Date(item.date), "MMM dd"),
      sales: Number(item.sales.toFixed(2)),
    }));
  };

  const formatCategorySalesData = () => {
    if (!categorySales) return [];

    return categorySales.map((item: any) => ({
      name: item.category.charAt(0).toUpperCase() + item.category.slice(1),
      value: Number(item.totalSales),
    }));
  };

  const salesByDateData = generateSalesDataByDate();
  const categorySalesData = formatCategorySalesData();

  // Generate colors for pie chart
  const COLORS = ["#0984E3", "#00B894", "#FDCB6E", "#00CEC9", "#FF7675"];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Reportes y Análisis" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/20 p-4 lg:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-poppins text-2xl font-semibold">Reportes y Análisis</h2>
              <p className="text-muted-foreground">
                Analiza el rendimiento de las ventas y las métricas de la restaurante
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="mb-6"
          >
            <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-flex">
              <TabsTrigger value="sales">Ventas</TabsTrigger>
              <TabsTrigger value="products">Productos</TabsTrigger>
              <TabsTrigger value="staff">Personal</TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Ventas a lo largo del tiempo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isOrdersLoading ? (
                      <Skeleton className="w-full h-[300px]" />
                    ) : salesByDateData.length === 0 ? (
                      <div className="w-full h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground">No hay datos de ventas disponibles para el período seleccionado</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={salesByDateData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [`$${value}`, "Sales"]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              borderColor: "hsl(var(--border))",
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="sales"
                            stroke="hsl(var(--secondary))"
                            strokeWidth={2}
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Ventas por Categoría</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isCategorySalesLoading ? (
                      <Skeleton className="w-full h-[300px]" />
                    ) : categorySalesData.length === 0 ? (
                      <div className="w-full h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground">No hay datos de ventas por categoría disponibles</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={categorySalesData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {categorySalesData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Sales"]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              borderColor: "hsl(var(--border))",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Métricas de Ordenes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <p className="text-muted-foreground mb-2">Total de Órdenes</p>
                      <p className="text-3xl font-bold">
                        {isOrdersLoading ? (
                          <Skeleton className="h-9 w-20 mx-auto" />
                        ) : (
                          ordersData?.length || 0
                        )}
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <p className="text-muted-foreground mb-2">Valor Promedio de Orden</p>
                      <p className="text-3xl font-bold">
                        {isOrdersLoading ? (
                          <Skeleton className="h-9 w-20 mx-auto" />
                        ) : ordersData?.length ? (
                          `$${(
                            ordersData.reduce(
                              (sum: number, order: any) => sum + order.totalAmount,
                              0
                            ) / ordersData.length
                          ).toFixed(2)}`
                        ) : (
                          "$0.00"
                        )}
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <p className="text-muted-foreground mb-2">Ingresos Totales</p>
                      <p className="text-3xl font-bold">
                        {isOrdersLoading ? (
                          <Skeleton className="h-9 w-20 mx-auto" />
                        ) : (
                          `$${ordersData
                            ?.reduce((sum: number, order: any) => sum + order.totalAmount, 0)
                            .toFixed(2) || "0.00"}`
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products" className="mt-6">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Artículos Populares</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isPopularItemsLoading ? (
                      <Skeleton className="w-full h-[300px]" />
                    ) : !popularItems || popularItems.length === 0 ? (
                      <div className="w-full h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground">No hay datos de productos disponibles</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={popularItems}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="menuItemName"
                            tick={{ fontSize: 12 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [value, "Orders"]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              borderColor: "hsl(var(--border))",
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="orderCount"
                            name="Número de Órdenes"
                            fill="hsl(var(--accent))"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="staff" className="mt-6">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium">Rendimiento del Personal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isStaffSalesLoading ? (
                      <Skeleton className="w-full h-[300px]" />
                    ) : !staffSales || staffSales.length === 0 ? (
                      <div className="w-full h-[300px] flex items-center justify-center bg-muted/30 rounded-lg">
                        <p className="text-muted-foreground">No hay datos de rendimiento del personal disponibles</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={staffSales}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="staffName" />
                          <YAxis />
                          <Tooltip
                            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Sales"]}
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              borderColor: "hsl(var(--border))",
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="totalSales"
                            name="Ventas Totales"
                            fill="hsl(var(--secondary))"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
