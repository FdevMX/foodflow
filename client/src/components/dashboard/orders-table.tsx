import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { Order, Staff } from "@shared/schema";

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
  staffMembers: Staff[];
}

export function OrdersTable({ orders, isLoading, staffMembers }: OrdersTableProps) {
  const [activeTab, setActiveTab] = useState("all");
  const [, navigate] = useLocation();

  const filteredOrders = activeTab === "all" 
    ? orders 
    : orders.filter(order => order.status === activeTab);

  const getStaffName = (staffId: number | null) => {
    if (!staffId) return "Unassigned";
    const staff = staffMembers.find(s => s.id === staffId);
    return staff ? staff.name : "Unknown";
  };

  const formatTime = (timestamp: Date | string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Card>
      <CardHeader className="px-6 py-4 border-b border-border flex flex-row items-center justify-between">
        <CardTitle className="text-base font-medium">Pedidos</CardTitle>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-3">Todos</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs px-3">Pendiente</TabsTrigger>
            <TabsTrigger value="active" className="text-xs px-3">Activo</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Pedido #</th>
                <th className="px-6 py-3 text-left">Mesa</th>
                <th className="px-6 py-3 text-left">Cantidad</th>
                <th className="px-6 py-3 text-left">Empleado</th>
                <th className="px-6 py-3 text-left">Estado</th>
                <th className="px-6 py-3 text-left">Hora</th>
                <th className="px-6 py-3 text-left">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-16" /></td>
                  </tr>
                ))
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                    No se encontraron pedidos
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4">#{order.id.toString().padStart(4, '0')}</td>
                    <td className="px-6 py-4">Mesa {order.tableId}</td>
                    <td className="px-6 py-4">${order.totalAmount.toFixed(2)}</td>
                    <td className="px-6 py-4">{getStaffName(order.staffId)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">{formatTime(order.createdAt || new Date())}</td>
                    <td className="px-6 py-4">
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-secondary hover:text-secondary/80"
                        onClick={() => navigate(`/orders/${order.id}`)}
                      >
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 border-t border-border text-right">
          <Button 
            variant="link" 
            className="p-0 h-auto text-secondary hover:text-secondary/80"
            onClick={() => navigate("/orders")}
          >
            Ver todos los pedidos →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
