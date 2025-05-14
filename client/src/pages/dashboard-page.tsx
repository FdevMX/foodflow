import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { SalesChart } from "@/components/dashboard/sales-chart";
import { ChevronLeft, ChevronRight, Download, PlusCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());

  const formattedDate = format(currentDate, "MMMM d, yyyy");

  const { data: dailySales, isLoading: isSalesLoading } = useQuery({
    queryKey: ["/api/analytics/daily-sales", format(currentDate, "yyyy-MM-dd")],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(`/api/analytics/daily-sales?date=${queryKey[1]}`);
      if (!res.ok) throw new Error("Fallo al obtener las ventas diarias");
      return res.json();
    },
  });

  const { data: categoryData, isLoading: isCategoryLoading } = useQuery({
    queryKey: ["/api/analytics/sales-by-category"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/sales-by-category");
      if (!res.ok) throw new Error("Fallo al obtener las ventas por categoría");
      return res.json();
    },
  });

  const { data: popularItems, isLoading: isPopularLoading } = useQuery({
    queryKey: ["/api/analytics/popular-items"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/popular-items");
      if (!res.ok) throw new Error("Fallo al obtener los artículos populares");
      return res.json();
    },
  });

  const { data: staffSales, isLoading: isStaffLoading } = useQuery({
    queryKey: ["/api/analytics/sales-by-staff"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/sales-by-staff");
      if (!res.ok) throw new Error("Fallo al obtener las ventas por personal");
      return res.json();
    },
  });

  const { data: activeOrders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["/api/orders", "active"],
    queryFn: async () => {
      const res = await fetch("/api/orders?status=1,2");
      if (!res.ok) throw new Error("Fallo al obtener los pedidos activos");
      return res.json();
    },
  });

  const { data: staffMembers, isLoading: isStaffMembersLoading } = useQuery({
    queryKey: ["/api/staff"],
    queryFn: async () => {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Fallo al obtener el personal");
      return res.json();
    },
  });

  const goToPreviousDay = () => {
    setCurrentDate(prev => subDays(prev, 1));
  };

  const goToNextDay = () => {
    const tomorrow = subDays(new Date(), -1);
    if (currentDate < tomorrow) {
      setCurrentDate(prev => subDays(prev, -1));
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Dashboard" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/20 p-4 lg:p-6">
          <div className="mb-6">
            <h2 className="font-poppins text-2xl font-semibold">Resumen de la Dashboard</h2>
            <p className="text-muted-foreground">¡Bienvenido de nuevo! Aquí está lo que está sucediendo hoy.</p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div className="mb-4 md:mb-0">
              <div className="inline-flex items-center bg-background rounded-lg shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToPreviousDay}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-3 py-2 font-medium">Hoy: {formattedDate}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={goToNextDay}
                  disabled={format(currentDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                className="bg-secondary hover:bg-secondary/90"
                onClick={() => navigate("/orders")}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo Pedido
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Ventas de Hoy"
              value={isSalesLoading ? "Cargando..." : `$${dailySales?.totalSales?.toFixed(2) || "0.00"}`}
              icon="cash"
              trend={isSalesLoading ? null : { value: "12.5%", direction: "up" }}
              description={isSalesLoading ? "Cargando..." : `${dailySales?.orderCount || 0} órdenes hoy`}
            />

            <StatCard
              title="Órdenes Activas"
              value={isOrdersLoading ? "Cargando..." : activeOrders?.length || "0"}
              icon="orders"
              description={isOrdersLoading
                ? "Cargando..."
                : `${activeOrders?.filter((o: { statusId: number }) => o.statusId === 1).length || 0} pendientes, ${activeOrders?.filter((o: { statusId: number }) => o.statusId === 2).length || 0} en preparación`
              }
            />

            <StatCard
              title="Personal en Servicio"
              value={isStaffMembersLoading ? "Cargando..." : staffMembers?.filter((s: { roleId: number }) => s.roleId === 1).length || "0"}
              icon="staff"
              description={isStaffMembersLoading
                ? "Cargando..."
                : `${staffMembers?.filter((s: { roleId: number }) => s.roleId === 1).length || 0} meseros, ${staffMembers?.filter((s: { roleId: number }) => s.roleId === 2).length || 0} cocina`
              }
            />

            <StatCard
              title="Más Pedido"
              value={isPopularLoading ? "Cargando..." : popularItems?.[0]?.menuItemName || "Sin datos"}
              icon="food"
              description={isPopularLoading
                ? "Cargando..."
                : `${popularItems?.[0]?.orderCount || 0} órdenes hoy`
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <OrdersTable
                orders={activeOrders || []}
                isLoading={isOrdersLoading}
                staffMembers={staffMembers || []}
              />
            </div>

            <Card>
              <CardContent className="p-0">
                <SalesChart
                  data={categoryData || []}
                  isLoading={isCategoryLoading}
                />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
