import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { StaffTable } from "@/components/staff/staff-table";
import { StaffForm } from "@/components/staff/staff-form";
import { Staff } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function StaffPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [openStaffDialog, setOpenStaffDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const { data: staffMembers, isLoading } = useQuery({
    queryKey: ["/api/staff"],
    queryFn: async () => {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("Fallo al obtener el personal");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/staff/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Personal eliminado",
        description: "El personal ha sido eliminado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Fallo al eliminar el personal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PUT", `/api/staff/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "Status actualizado",
        description: "El estado del personal ha sido actualizado exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Fallo al actualizar el estado del personal: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("¿Está seguro de querer eliminar este miembro del personal?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (staff: Staff) => {
    toggleStatusMutation.mutate({
      id: staff.id,
      isActive: !staff.isActive,
    });
  };

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff);
    setOpenStaffDialog(true);
  };

  const handleAddNew = () => {
    setEditingStaff(null);
    setOpenStaffDialog(true);
  };

  const handleFormClose = () => {
    setOpenStaffDialog(false);
    setEditingStaff(null);
  };

  const filteredStaff = staffMembers
    ? staffMembers.filter(
        (staff: Staff) =>
          staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          staff.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          staff.rfcNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Gestión de Personal" />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-muted/20 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-poppins text-2xl font-semibold">Gestión de Personal</h2>
            <Dialog open={openStaffDialog} onOpenChange={setOpenStaffDialog}>
              <DialogTrigger asChild>
                <Button className="bg-accent hover:bg-accent/90" onClick={handleAddNew}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Personal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{editingStaff ? "Editar Miembro del Personal" : "Agregar Miembro del Personal"}</DialogTitle>
                  <DialogDescription>
                    {editingStaff
                      ? "Actualice la información del miembro del personal."
                      : "Rellene los detalles para agregar un nuevo miembro del personal."}
                  </DialogDescription>
                </DialogHeader>
                <StaffForm staffMember={editingStaff} onClose={handleFormClose} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card rounded-xl shadow-sm overflow-hidden mb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-poppins font-semibold">Miembros del Personal</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Buscar personal..."
                  className="pl-10 w-full md:w-[250px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <StaffTable
              staffMembers={filteredStaff}
              isLoading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
