import { Table, Order } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clock, CreditCard, Edit, MoreVertical, Trash2, Utensils } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface TableItemProps {
  table: Table;
  orders: Order[];
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
}

export function TableItem({ table, orders, onEdit, onDelete, onStatusChange }: TableItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState<string | null>(null);

  // Determine table status color
  const getStatusBorderColor = () => {
    switch (table.status) {
      case "available":
        return "border-green-500";
      case "reserved":
        return "border-yellow-500";
      case "occupied":
        return "border-red-500";
      default:
        return "border-gray-300";
    }
  };

  // Determine if table has pending orders (waiting for food)
  const hasPendingOrders = orders.some((order) => order.status === "pending");

  // Determine if table has active orders with payment requested
  const hasPaymentRequested = orders.some((order) => order.status === "completed");

  const confirmDelete = () => {
    onDelete();
    setShowDeleteDialog(false);
  };

  const confirmStatusChange = (status: string) => {
    onStatusChange(status);
    setShowStatusDialog(null);
  };

  return (
    <>
      <div className="relative">
        <div
          className={cn(
            "w-full aspect-square bg-card rounded-lg shadow-sm border-2 flex flex-col items-center justify-center p-2 cursor-pointer hover:bg-muted/10",
            getStatusBorderColor()
          )}
          onClick={onEdit}
        >
          <span className="font-poppins font-semibold">Table {table.number}</span>
          <span
            className={cn(
              "text-xs",
              table.status === "available"
                ? "text-green-600 dark:text-green-400"
                : table.status === "reserved"
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
            )}
          >
            {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
          </span>
          <div className="mt-1 text-xs text-muted-foreground">{table.seats} seats</div>

          <DropdownMenu>
            <DropdownMenuTrigger className="absolute top-1 right-1 p-1 rounded-full hover:bg-muted/20">
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Mesa {table.number}</DropdownMenuLabel>
              <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(); }}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); setShowStatusDialog("available"); }}
                disabled={table.status === "available"}
              >
                Marcar como Disponible
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); setShowStatusDialog("reserved"); }}
                disabled={table.status === "reserved"}
              >
                Marcar como Reservada
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); setShowStatusDialog("occupied"); }}
                disabled={table.status === "occupied"}
              >
                Marcar como Ocupada
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={e => { e.stopPropagation(); onDelete(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status indicators */}
        {hasPendingOrders && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full text-white text-xs flex items-center justify-center">
            <Clock className="h-3 w-3" />
          </div>
        )}

        {hasPaymentRequested && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full text-white text-xs flex items-center justify-center">
            <CreditCard className="h-3 w-3" />
          </div>
        )}

        {!hasPendingOrders && !hasPaymentRequested && table.status === "available" && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full text-white text-xs flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="9 12 12 15 17 10" />
            </svg>
          </div>
        )}
        {!hasPendingOrders && !hasPaymentRequested && table.status === "reserved" && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full text-white text-xs flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12" y2="16" />
            </svg>
          </div>
        )}
        {!hasPendingOrders && !hasPaymentRequested && table.status === "occupied" && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            <Utensils className="h-3 w-3" />
          </div>
        )}
      </div>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog
        open={!!showStatusDialog}
        onOpenChange={(open) => !open && setShowStatusDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cambiar Estado de la Mesa</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro que desea cambiar el estado de la Mesa {table.number} a{" "}
              <span className="font-semibold capitalize">{showStatusDialog}</span>?
              {orders.length > 0 && table.status === "occupied" && showStatusDialog !== "occupied" && (
                <span className="block font-semibold text-destructive mt-2">
                  Advertencia: Esta mesa tiene órdenes activas que se verán afectadas.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showStatusDialog && confirmStatusChange(showStatusDialog)}
            >
              Cambiar Estado
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
