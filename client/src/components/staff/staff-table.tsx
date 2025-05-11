import { Staff } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface StaffTableProps {
  staffMembers: Staff[];
  isLoading: boolean;
  onEdit: (staff: Staff) => void;
  onDelete: (id: number) => void;
  onToggleStatus: (staff: Staff) => void;
}

// Default staff images for different roles
const defaultStaffImages = {
  waiter: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200",
  chef: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200",
  manager: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200",
  kitchen: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200",
  default: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200",
};

// Helper function to get appropriate image based on job title
const getStaffImage = (staff: Staff) => {
  const jobTitle = staff.jobTitle.toLowerCase();
  if (staff.imageUrl) return staff.imageUrl;

  if (jobTitle.includes("waiter") || jobTitle.includes("waitress") || jobTitle.includes("server")) {
    return defaultStaffImages.waiter;
  } else if (jobTitle.includes("chef") || jobTitle.includes("cook")) {
    return defaultStaffImages.chef;
  } else if (jobTitle.includes("manager") || jobTitle.includes("admin")) {
    return defaultStaffImages.manager;
  } else if (jobTitle.includes("kitchen")) {
    return defaultStaffImages.kitchen;
  }

  return defaultStaffImages.default;
};

export function StaffTable({ staffMembers, isLoading, onEdit, onDelete, onToggleStatus }: StaffTableProps) {
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);

  const handleDelete = () => {
    if (staffToDelete) {
      onDelete(staffToDelete.id);
      setStaffToDelete(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider">
          <tr>
            <th className="px-6 py-3 text-left">Nombre</th>
            <th className="px-6 py-3 text-left">Cargo</th>
            <th className="px-6 py-3 text-left">RFC</th>
            <th className="px-6 py-3 text-left">Estado</th>
            <th className="px-6 py-3 text-left">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Skeleton className="w-8 h-8 rounded-full mr-3" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                <td className="px-6 py-4">
                  <div className="flex space-x-3">
                    <Skeleton className="h-8 w-12" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </td>
              </tr>
            ))
          ) : staffMembers.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                No se encontraron miembros del personal
              </td>
            </tr>
          ) : (
            staffMembers.map((staff) => (
              <tr key={staff.id} className="hover:bg-muted/30">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Avatar className="mr-3">
                      <AvatarImage src={getStaffImage(staff)} alt={staff.name} />
                      <AvatarFallback>{staff.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{staff.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{staff.jobTitle}</td>
                <td className="px-6 py-4">{staff.rfcNumber}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${staff.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                  >
                    {staff.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-3">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-secondary hover:text-secondary/80"
                      onClick={() => onEdit(staff)}
                    >
                      Editar
                    </Button>

                    <AlertDialog open={staffToDelete?.id === staff.id} onOpenChange={(open) => !open && setStaffToDelete(null)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="link"
                          className={`p-0 h-auto ${staff.isActive ? "text-red-500 hover:text-red-700" : "text-green-500 hover:text-green-700"
                            }`}
                          onClick={() => setStaffToDelete(staff)}
                        >
                          {staff.isActive ? "Desactivar" : "Activar"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {staff.isActive
                              ? `Esto marcará a ${staff.name} como inactivo. No podrán recibir nuevos pedidos.`
                              : `Esto marcará a ${staff.name} como activo. Podrán recibir nuevos pedidos.`}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onToggleStatus(staff)}>
                            {staff.isActive ? "Desactivar" : "Activar"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {staffMembers.length > 0 && (
        <div className="px-6 py-4 border-t border-border text-right">
          <span className="text-sm text-muted-foreground">
            Showing {staffMembers.length} staff members
          </span>
        </div>
      )}
    </div>
  );
}
