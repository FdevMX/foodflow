import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { MenuCategoryFilter } from "@/components/menu/menu-category-filter";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import { MenuForm } from "@/components/menu/menu-form";
import { MenuItem } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function MenuPage() {
  const { toast } = useToast();
  const [category, setCategory] = useState<string | null>(null);
  const [openMenuDialog, setOpenMenuDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ["/api/menu", category],
    queryFn: async ({ queryKey }) => {
      const categoryFilter = queryKey[1] ? `?category=${queryKey[1]}` : "";
      const res = await fetch(`/api/menu${categoryFilter}`);
      if (!res.ok) throw new Error("Fallo al obtener los artículos del menú");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/menu/${id}`);
    },
    onSuccess: () => {
      // Invalidate all menu queries (all categories and All Items)
      queryClient.invalidateQueries({
        predicate: (query) => {
          return Array.isArray(query.queryKey) && query.queryKey[0] === "/api/menu";
        }
      });
      toast({
        title: "Artículo del menú eliminado",
        description: "El artículo del menú ha sido eliminado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Fallo al eliminar el artículo del menú: ${error.message}`,
        variant: "destructive",
      });
    },
  });

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

  const handleEdit = (menuItem: MenuItem) => {
    setEditingItem(menuItem);
    setOpenMenuDialog(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setOpenMenuDialog(true);
  };

  const handleFormClose = () => {
    setOpenMenuDialog(false);
    setEditingItem(null);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Gestión de Menú" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/20 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-poppins text-2xl font-semibold">Gestión de Menú</h2>
            <Dialog open={openMenuDialog} onOpenChange={setOpenMenuDialog}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90" onClick={handleAddNew}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Editar Producto del Menú" : "Agregar Nuevo Produucto al Menú"}</DialogTitle>
                  <DialogDescription>
                    {editingItem ? "Actualiza los detalles de este producto del menú." : "Completa los detalles para agregar un nuevo producto al menú."}
                  </DialogDescription>
                </DialogHeader>
                <MenuForm
                  menuItem={editingItem}
                  onClose={handleFormClose}
                />
              </DialogContent>
            </Dialog>
          </div>

          <MenuCategoryFilter
            activeCategory={category}
            onCategoryChange={setCategory}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-card rounded-xl shadow-sm overflow-hidden">
                  <Skeleton className="w-full h-48" />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-4 w-24 mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-9 w-16" />
                      <Skeleton className="h-9 w-28" />
                    </div>
                  </div>
                </div>
              ))
            ) : menuItems && menuItems.length > 0 ? (
              menuItems.map((item: MenuItem) => (
                <MenuItemCard
                  key={item.id}
                  menuItem={item}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <h3 className="text-lg font-medium mb-2">No se encontraron productos en el menú</h3>
                <p className="text-muted-foreground mb-4">
                  {category
                    ? `No se encontraron productos en la categoría "${category}"`
                    : "Tu menú está vacío. ¡Agrega tu primer producto!"
                  }
                </p>
                <Button className="bg-accent hover:bg-accent/90" onClick={handleAddNew}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Producto
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>

      <MobileNav />

      {/* Confirmation dialog for delete */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar este producto del menú? Esta acción no se puede deshacer.
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
