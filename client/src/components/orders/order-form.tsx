import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { insertOrderSchema, Order, Staff, Table } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Extend the schema for form validation
const orderFormSchema = insertOrderSchema.extend({
  // Add additional validation as needed
});

interface OrderFormProps {
  order: Order | null;
  staffMembers: Staff[];
  tables: Table[];
  onClose: () => void;
}

export function OrderForm({ order, staffMembers, tables, onClose }: OrderFormProps) {
  const { toast } = useToast();

  // Create or update mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof orderFormSchema>) => {
      return apiRequest("POST", "/api/orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Orden creada",
        description: "La orden se ha creado correctamente",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear la orden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof orderFormSchema> }) => {
      return apiRequest("PUT", `/api/orders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Orden actualizada",
        description: "La orden se ha actualizado correctamente",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar la orden: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      tableId: order?.tableId || undefined,
      staffId: order?.staffId || undefined,
      status: order?.status || "active",
      notes: order?.notes || "",
      withVatInvoice: order?.withVatInvoice || false,
    },
  });

  const onSubmit = (data: z.infer<typeof orderFormSchema>) => {
    if (order) {
      updateMutation.mutate({ id: order.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Filter to only show available tables for new orders
  const availableTables = tables.filter(
    (table) => table.status === "available" || (order && order.tableId === table.id)
  );

  // Filter to only show active staff members who are waiters
  const activeWaiters = staffMembers.filter(
    (staff) => (staff.isActive || (order && order.staffId === staff.id)) && staff.jobTitle.toLowerCase().includes("mesero")
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="tableId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mesa</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una mesa" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableTables.length === 0 ? (
                    <SelectItem value="no-tables" disabled>
                      No hay mesas disponibles
                    </SelectItem>
                  ) : (
                    availableTables.map((table) => (
                      <SelectItem key={table.id} value={table.id.toString()}>
                        Mesa {table.number} ({table.seats} sillas)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                {availableTables.length === 0
                  ? "Todas las mesas están actualmente ocupadas o reservadas"
                  : "Selecciona la mesa para esta orden"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="staffId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mesero</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Asignar un mesero" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {activeWaiters.length === 0 ? (
                    <SelectItem value="no-staff" disabled>
                      No hay meseros activos
                    </SelectItem>
                  ) : (
                    activeWaiters.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        {staff.name} ({staff.jobTitle})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormDescription>Asignar un mesero a esta orden</FormDescription>
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Estado actual de la orden</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Agregue cualquier instrucción especial o notas aquí"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>Notas opcionales para esta orden</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="withVatInvoice"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Factura de IVA</FormLabel>
                <FormDescription>
                  Generar una factura de IVA para esta orden
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {order ? "Actualizar Orden" : "Crear Orden"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
