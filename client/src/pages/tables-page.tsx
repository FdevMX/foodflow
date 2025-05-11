import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Loader2 } from "lucide-react";
import { TableLayout } from "@/components/tables/table-layout";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { InsertTable, Table } from "@shared/schema";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tableFormSchema = z.object({
  number: z.number().int().positive("El número de mesa debe ser positivo"),
  seats: z.number().int().min(1, "El número de sillas debe ser al menos 1"),
  status: z.enum(["available", "reserved", "occupied"]),
});

export default function TablesPage() {
  const { toast } = useToast();
  const [openTableDialog, setOpenTableDialog] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: tables, isLoading } = useQuery({
    queryKey: ["/api/tables"],
    queryFn: async () => {
      const res = await fetch("/api/tables");
      if (!res.ok) throw new Error("Fallo al obtener las mesas");
      return res.json();
    },
  });

  const { data: activeOrders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["/api/orders", "active"],
    queryFn: async () => {
      const res = await fetch("/api/orders?status=active");
      if (!res.ok) throw new Error("Fallo al obtener las órdenes activas");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertTable) => {
      return apiRequest("POST", "/api/tables", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return Array.isArray(query.queryKey) && query.queryKey[0] === "/api/tables";
        }
      });
      toast({
        title: "Mesa creada",
        description: "La mesa ha sido agregada exitosamente",
      });
      setOpenTableDialog(false);
    },
    onError: (error: any) => {
      let message = error?.response?.data?.message || error?.data?.message || error.message || "Ocurrió un error inesperado";
      // Si el mensaje es tipo '400: {"message":"La mesa 5 ya existe"}', extraer solo el texto
      if (typeof message === 'string') {
        const match = message.match(/"message"\s*:\s*"([^"]+)"/);
        if (match) message = match[1];
      }
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertTable> }) => {
      return apiRequest("PUT", `/api/tables/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return Array.isArray(query.queryKey) && query.queryKey[0] === "/api/tables";
        }
      });
      toast({
        title: "Mesa actualizada",
        description: "La mesa ha sido actualizada exitosamente",
      });
      setOpenTableDialog(false);
    },
    onError: (error: any) => {
      let message = error?.response?.data?.message || error?.data?.message || error.message || "Ocurrió un error inesperado";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/tables/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return Array.isArray(query.queryKey) && query.queryKey[0] === "/api/tables";
        }
      });
      toast({
        title: "Mesa eliminada",
        description: "La mesa ha sido eliminada correctamente.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      let message = error?.response?.data?.message || error?.data?.message || error.message || "Ocurrió un error inesperado";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const statusUpdateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PUT", `/api/tables/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return Array.isArray(query.queryKey) && query.queryKey[0] === "/api/tables";
        }
      });
      toast({
        title: "Estado actualizado",
        description: "El estado de la mesa ha sido actualizado exitosamente",
      });
    },
    onError: (error: any) => {
      let message = error?.response?.data?.message || error?.data?.message || error.message || "Ocurrió un error inesperado";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof tableFormSchema>>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: {
      number: 1,
      seats: 4,
      status: "available",
    },
  });

  const handleEdit = (table: Table) => {
    setEditingTable(table);
    form.reset({
      number: table.number,
      seats: table.seats,
      status: table.status as "available" | "reserved" | "occupied",
    });
    setOpenTableDialog(true);
  };

  const handleAddNew = () => {
    setEditingTable(null);
    form.reset({
      number: Math.max(0, ...(tables?.map((t: Table) => t.number) || [])) + 1,
      seats: 4,
      status: "available",
    });
    setOpenTableDialog(true);
  };

  const handleDelete = (id: number) => {
    // Check if table has active orders
    const hasActiveOrders = activeOrders?.some((order: any) => order.tableId === id);
    if (hasActiveOrders) {
      toast({
        title: "No se puede eliminar la mesa",
        description: "Esta mesa tiene órdenes activas. Complete o cancele las órdenes primero.",
        variant: "destructive",
      });
      return;
    }
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

  const handleStatusChange = (id: number, status: string) => {
    statusUpdateMutation.mutate({ id, status });
  };

  const onSubmit = (data: z.infer<typeof tableFormSchema>) => {
    if (editingTable) {
      updateMutation.mutate({ id: editingTable.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isDataLoading = isLoading || isOrdersLoading;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Gestion de mesas" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/20 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-poppins text-2xl font-semibold">Gestion de mesas</h2>
            <div className="flex space-x-2">
              <Dialog open={openTableDialog} onOpenChange={setOpenTableDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-accent hover:bg-accent/90" onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Mesa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingTable ? "Editar Mesa" : "Agregar Nueva Mesa"}</DialogTitle>
                    <DialogDescription>
                      {editingTable
                        ? "Actualice los detalles de la mesa."
                        : "Rellene los detalles para agregar una nueva mesa."}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Mesa</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="seats"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número de Sillas</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="available">Disponible</SelectItem>
                                <SelectItem value="reserved">Reservada</SelectItem>
                                <SelectItem value="occupied">Ocupada</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setOpenTableDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={createMutation.isPending || updateMutation.isPending}
                        >
                          {createMutation.isPending || updateMutation.isPending
                            ? "Guardando..."
                            : editingTable
                              ? "Actualizar Mesa"
                              : "Agregar Mesa"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TableLayout
            tables={tables || []}
            orders={activeOrders || []}
            isLoading={isDataLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />

          {/* Confirmation dialog for delete */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogDescription>
                  ¿Está seguro que desea eliminar esta mesa? Esta acción no se puede deshacer.
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
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
