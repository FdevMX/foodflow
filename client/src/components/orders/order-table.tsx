import { Order, Staff, Table } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "./order-status-badge";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface OrderTableProps {
  orders: Order[];
  staffMembers: Staff[];
  tables: Table[];
  isLoading: boolean;
  onStatusChange: (id: number, status: string) => void;
  onEdit: (order: Order) => void;
  onDelete: (id: number) => void;
}

export function OrderTable({
  orders,
  staffMembers,
  tables,
  isLoading,
  onStatusChange,
  onEdit,
  onDelete,
}: OrderTableProps) {
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [statusChangeOrder, setStatusChangeOrder] = useState<{
    order: Order;
    newStatus: string;
  } | null>(null);

  const getStaffName = (staffId: number | null) => {
    if (!staffId) return "Unassigned";
    const staff = staffMembers.find((s) => s.id === staffId);
    return staff ? staff.name : "Unknown";
  };

  const getTableNumber = (tableId: number | null) => {
    if (!tableId) return "Takeout";
    const table = tables.find((t) => t.id === tableId);
    return table ? `Table ${table.number}` : "Unknown";
  };

  const formatDateTime = (timestamp: string | Date) => {
    return format(new Date(timestamp), "MMM d, yyyy h:mm a");
  };

  const handleStatusChange = (order: Order, newStatus: string) => {
    if (order.status === newStatus) return;
    setStatusChangeOrder({ order, newStatus });
  };

  const confirmStatusChange = () => {
    if (statusChangeOrder) {
      onStatusChange(statusChangeOrder.order.id, statusChangeOrder.newStatus);
      setStatusChangeOrder(null);
    }
  };

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      onDelete(orderToDelete.id);
      setOrderToDelete(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b bg-muted/50 transition-colors">
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Orden #
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Mesa
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Mesero
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Monto
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Fecha y Hora
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Estado
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading ? (
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="border-b transition-colors hover:bg-muted/30">
                      <td className="p-4 align-middle">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </td>
                      <td className="p-4 align-middle">
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </td>
                    </tr>
                  ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b transition-colors hover:bg-muted/30">
                    <td className="p-4 align-middle font-medium">#{order.id}</td>
                    <td className="p-4 align-middle">{getTableNumber(order.tableId)}</td>
                    <td className="p-4 align-middle">{getStaffName(order.staffId)}</td>
                    <td className="p-4 align-middle">${order.totalAmount.toFixed(2)}</td>
                    <td className="p-4 align-middle">{formatDateTime(order.createdAt || new Date())}</td>
                    <td className="p-4 align-middle">
                      <OrderStatusBadge
                        status={order.status}
                        onClick={() => {
                          const nextStatus = {
                            pending: "active",
                            active: "completed",
                            completed: "pending",
                          }[order.status] as string;
                          handleStatusChange(order, nextStatus);
                        }}
                      />
                    </td>
                    <td className="p-4 align-middle">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem 
                            onClick={() => onEdit(order)}
                            className="cursor-pointer"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(order, "pending")}
                            disabled={order.status === "pending"}
                            className="cursor-pointer"
                          >
                            Marcar como Pendiente
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(order, "active")}
                            disabled={order.status === "active"}
                            className="cursor-pointer"
                          >
                            Marcar como Activa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(order, "completed")}
                            disabled={order.status === "completed"}
                            className="cursor-pointer"
                          >
                            Marcar como Completada
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(order)}
                            className="text-destructive focus:text-destructive cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={!!statusChangeOrder} onOpenChange={() => setStatusChangeOrder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar Estado de la Orden</AlertDialogTitle>
            <AlertDialogDescription>
              {statusChangeOrder && (
                <>
                  ¿Está seguro que desea cambiar el estado de la orden #{statusChangeOrder.order.id}{" "}
                  de{" "}
                  <span className="font-semibold capitalize">{statusChangeOrder.order.status}</span>{" "}
                  a{" "}
                  <span className="font-semibold capitalize">{statusChangeOrder.newStatus}</span>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Orden</AlertDialogTitle>
            <AlertDialogDescription>
              {orderToDelete && (
                <>
                  ¿Está seguro que desea eliminar la orden #{orderToDelete.id}? Esta acción no se puede
                  deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
