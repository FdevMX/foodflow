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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { insertMenuItemSchema, MenuItem } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Extend the schema for form validation
const menuFormSchema = insertMenuItemSchema.extend({
  // Add any additional validation rules
  price: z.number().min(0.01, "Price must be greater than 0"),
});

interface MenuFormProps {
  menuItem: MenuItem | null;
  onClose: () => void;
}

export function MenuForm({ menuItem, onClose }: MenuFormProps) {
  const { toast } = useToast();

  // Create or update mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof menuFormSchema>) => {
      return apiRequest("POST", "/api/menu", data);
    },
    onSuccess: () => {
      // Invalidate all menu queries (all categories and All Items)
      queryClient.invalidateQueries({ predicate: (query) => {
        return Array.isArray(query.queryKey) && query.queryKey[0] === "/api/menu";
      }});
      toast({
        title: "Producto agregado",
        description: "El producto se ha agregado correctamente",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear el producto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof menuFormSchema> }) => {
      return apiRequest("PUT", `/api/menu/${id}`, data);
    },
    onSuccess: () => {
      // Invalidate all menu queries (all categories and All Items)
      queryClient.invalidateQueries({ predicate: (query) => {
        return Array.isArray(query.queryKey) && query.queryKey[0] === "/api/menu";
      }});
      toast({
        title: "Producto actualizado",
        description: "El producto se ha actualizado correctamente",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar el producto: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof menuFormSchema>>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name: menuItem?.name || "",
      description: menuItem?.description || "",
      price: menuItem?.price || 0,
      category: menuItem?.category || "dinner",
      imageUrl: menuItem?.imageUrl || "",
      inStock: menuItem?.inStock ?? true,
    },
  });

  const onSubmit = (data: z.infer<typeof menuFormSchema>) => {
    if (menuItem) {
      updateMutation.mutate({ id: menuItem.id, data });
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
              <FormLabel>Nombre del Producto</FormLabel>
              <FormControl>
                <Input placeholder="Hamburguesa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Hamburguesa con queso, cebolla, tomate y lechuga"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="24.99"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="breakfast">Desayuno</SelectItem>
                    <SelectItem value="lunch">Almuerzo</SelectItem>
                    <SelectItem value="dinner">Cena</SelectItem>
                    <SelectItem value="beverages">Bebidas</SelectItem>
                    <SelectItem value="desserts">Postres</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://example.com/image.jpg"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Ingrese la URL de la imagen del producto. (Opcional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="inStock"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Disponibilidad</FormLabel>
                <FormDescription>
                  Establezca si este producto está actualmente disponible para ordenar
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
            {menuItem ? "Actualizar Producto" : "Agregar Producto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
