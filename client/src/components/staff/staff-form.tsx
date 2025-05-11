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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { insertStaffSchema, Staff } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Extend the schema for form validation
const staffFormSchema = insertStaffSchema.extend({
  // El RFC debe tener exactamente 13 caracteres
  rfcNumber: z.string()
    .length(13, "El RFC debe tener exactamente 13 caracteres"),
});

interface StaffFormProps {
  staffMember: Staff | null;
  onClose: () => void;
}

export function StaffForm({ staffMember, onClose }: StaffFormProps) {
  const { toast } = useToast();

  // Create or update mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof staffFormSchema>) => {
      return apiRequest("POST", "/api/staff", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Miembro del personal creado",
        description: "El nuevo miembro del personal ha sido agregado exitosamente",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Fallo al crear el miembro del personal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof staffFormSchema> }) => {
      return apiRequest("PUT", `/api/staff/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Miembro del personal actualizado",
        description: "El miembro del personal ha sido actualizado exitosamente",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Fallo al actualizar el miembro del personal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof staffFormSchema>>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      name: staffMember?.name || "",
      jobTitle: staffMember?.jobTitle || "",
      rfcNumber: staffMember?.rfcNumber || "",
      isActive: staffMember?.isActive ?? true,
      imageUrl: staffMember?.imageUrl || "",
    },
  });

  const onSubmit = (data: z.infer<typeof staffFormSchema>) => {
    if (staffMember) {
      updateMutation.mutate({ id: staffMember.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre Completo</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="jobTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo</FormLabel>
              <FormControl>
                <Input placeholder="Mesero" {...field} />
              </FormControl>
              <FormDescription>
                Ej., Mesero, Cocinero, Personal de Cocina, Gerente
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rfcNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numero de RFC</FormLabel>
              <FormControl>
                <Input placeholder="RFC12345678" {...field} />
              </FormControl>
              <FormDescription>
                Identificador único para propósitos fiscales
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de la Imagen de Perfil</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ""} />
              </FormControl>
              <FormDescription>
                Ingresa una URL para la imagen de perfil del miembro del personal (opcional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Estado Activo</FormLabel>
                <FormDescription>
                  Establece si este miembro del personal está actualmente activo y en servicio
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
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {staffMember ? "Actualizar Personal" : "Agregar Personal"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
