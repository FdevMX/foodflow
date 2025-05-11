import { MenuItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";

interface MenuItemCardProps {
  menuItem: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
}

// Default image URLs for menu categories
const defaultCategoryImages = {
  breakfast: "https://images.unsplash.com/photo-1533089860892-a9b9ac34769c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=800",
  lunch: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=800",
  dinner: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=800",
  beverages: "https://images.unsplash.com/photo-1536935338788-846bb9981813?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=800",
  desserts: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=800",
};

const getCategoryBadgeClass = (category: string) => {
  switch (category) {
    case "breakfast":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "lunch":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "dinner":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "beverages":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "desserts":
      return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
};

export function MenuItemCard({ menuItem, onEdit, onDelete }: MenuItemCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const handleDelete = () => {
    onDelete();
    setIsDeleteDialogOpen(false);
  };

  // Get image URL, fallback to default for category if none provided
  const imageUrl = menuItem.imageUrl || defaultCategoryImages[menuItem.category as keyof typeof defaultCategoryImages] || defaultCategoryImages.dinner;

  return (
    <>
      <div
        className="bg-card rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => setIsDetailDialogOpen(true)}
      >
        <img
          src={imageUrl}
          alt={menuItem.name}
          className="w-full h-48 object-cover"
        />
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-poppins font-semibold text-lg">{menuItem.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">{menuItem.description}</p>
            </div>
            <span className="font-poppins font-semibold text-lg">${menuItem.price.toFixed(2)}</span>
          </div>
          <div className="mt-3 flex items-center">
            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryBadgeClass(menuItem.category)}`}>
              {menuItem.category.charAt(0).toUpperCase() + menuItem.category.slice(1)}
            </span>
            <span className={`ml-2 text-sm ${menuItem.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {menuItem.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <div className="mt-4 flex justify-between">
            <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); onEdit(); }}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={e => { e.stopPropagation(); onDelete(); }}>
              Delete
            </Button>
          </div>
        </div>
      </div>
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{menuItem.name}</DialogTitle>
            <DialogDescription>
              <img src={imageUrl} alt={menuItem.name} className="w-full h-64 object-cover rounded mb-4" />
              <div className="mb-2 text-lg font-semibold">${menuItem.price.toFixed(2)}</div>
              <div className="mb-2"><span className={`px-2 py-1 text-xs rounded-full ${getCategoryBadgeClass(menuItem.category)}`}>{menuItem.category.charAt(0).toUpperCase() + menuItem.category.slice(1)}</span></div>
              <div className="mb-2"><span className={`text-sm ${menuItem.inStock ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{menuItem.inStock ? 'In Stock' : 'Out of Stock'}</span></div>
              <div className="mb-2 text-base">{menuItem.description}</div>
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </>
  );
}
