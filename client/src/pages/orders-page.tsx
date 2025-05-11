import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { OrderTable } from "@/components/orders/order-table";
import { OrderForm } from "@/components/orders/order-form";
import { PlusCircle, FilterIcon, Loader2 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Order } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function OrdersPage() {
  const { toast } = useToast();
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const { data: orders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["/api/orders", orderStatus],
    queryFn: async ({ queryKey }) => {
      const statusFilter = queryKey[1] ? `?status=${queryKey[1]}` : "";
      const res = await fetch(`/api/orders${statusFilter}`);
      if (!res.ok) throw new Error("Fallo al obtener las órdenes");
      return res.json();
    },
  });

  const { data: staffMembers, isLoading: isStaffLoading } = useQuery({
    queryKey: ["/api/staff"],
    queryFn: async () => {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Fallo al obtener el personal");
      return res.json();
    },
  });

  const { data: tables, isLoading: isTablesLoading } = useQuery({
    queryKey: ["/api/tables"],
    queryFn: async () => {
      const res = await fetch("/api/tables");
      if (!res.ok) throw new Error("Fallo al obtener las mesas");
      return res.json();
    },
  });

  const statusUpdateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Orden actualizada",
        description: "El estado de la orden ha sido actualizado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Fallo al actualizar la orden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Orden eliminada",
        description: "La orden ha sido eliminada correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Fallo al eliminar la orden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (id: number, status: string) => {
    statusUpdateMutation.mutate({ id, status });
  };

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId !== null) {
      deleteMutation.mutate(deleteId);
      setDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setOpenOrderDialog(true);
  };

  const handleCreateNew = () => {
    setEditingOrder(null);
    setOpenOrderDialog(true);
  };

  const handleFormClose = () => {
    setOpenOrderDialog(false);
    setEditingOrder(null);
  };

  const isLoading = isOrdersLoading || isStaffLoading || isTablesLoading;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Órdenes" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/20 p-4 lg:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="font-poppins text-2xl font-semibold">Gestión de Órdenes</h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <FilterIcon className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={orderStatus || "all"}
                  onValueChange={(value) => setOrderStatus(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las Órdenes</SelectItem>
                    <SelectItem value="active">Activas</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="completed">Completadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Dialog open={openOrderDialog} onOpenChange={setOpenOrderDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-secondary hover:bg-secondary/90" onClick={handleCreateNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nueva Orden
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>{editingOrder ? "Editar Orden" : "Crear Nueva Orden"}</DialogTitle>
                    <DialogDescription>
                      {editingOrder
                        ? "Actualiza los detalles de la orden."
                        : "Completa los detalles para crear una nueva orden."}
                    </DialogDescription>
                  </DialogHeader>
                  <OrderForm
                    order={editingOrder}
                    staffMembers={staffMembers || []}
                    tables={tables || []}
                    onClose={handleFormClose}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <OrderTable
            orders={orders || []}
            staffMembers={staffMembers || []}
            tables={tables || []}
            isLoading={isLoading}
            onStatusChange={handleStatusChange}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </main>
      </div>

      <MobileNav />

      {/* Confirmation dialog for delete */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar esta orden? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
