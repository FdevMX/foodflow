// Renombramos Link de wouter para evitar conflictos con el componente de shadcn
import { Link as WouterLink, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  UtensilsCrossed,
  ClipboardList,
  RockingChair,
  MoreHorizontal
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <BarChart3 className="text-lg" />,
    },
    {
      title: "Menú",
      href: "/menu",
      icon: <UtensilsCrossed className="text-lg" />,
    },
    {
      title: "Órdenes",
      href: "/orders",
      icon: <ClipboardList className="text-lg" />,
    },
    {
      title: "Mesas",
      href: "/tables",
      icon: <RockingChair className="text-lg" />,
    },
    {
      title: "Más",
      href: "#more",
      icon: <MoreHorizontal className="text-lg" />,
      isMore: true
    },
  ];

  const moreNavItems = [
    {
      title: "Gestión de Personal",
      href: "/staff",
    },
    {
      title: "Reportes",
      href: "/reports",
    },
    {
      title: "Configuración",
      href: "/settings",
    },
    {
      title: "Ayuda y Soporte",
      href: "/help",
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setSheetOpen(false);
      navigate("/auth");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-background border-t border-border z-10">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) =>
            item.isMore ? (
              <Sheet key={item.href} open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <button className="flex flex-col items-center justify-center text-muted-foreground">
                    {item.icon}
                    <span className="text-xs mt-1">{item.title}</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[90vh] rounded-t-xl">
                  <SheetHeader className="text-left mb-6">
                    <SheetTitle className="text-xl">Más opciones</SheetTitle>
                  </SheetHeader>

                  <div className="space-y-2">
                    {moreNavItems.map((moreItem) => (
                      <WouterLink
                        key={moreItem.href}
                        href={moreItem.href}
                        className="flex items-center p-3 text-base font-medium rounded-md hover:bg-muted"
                        onClick={() => setSheetOpen(false)}
                      >
                        {moreItem.title}
                      </WouterLink>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80" alt={user?.name} />
                          <AvatarFallback>{user?.name?.charAt(0) || user?.username?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="font-medium">{user?.name || user?.username}</p>
                          <p className="text-sm text-muted-foreground">{user?.role}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLogout}
                        className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        Cerrar sesión
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <WouterLink
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center",
                  location === item.href
                    ? "text-secondary"
                    : "text-muted-foreground"
                )}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.title}</span>
              </WouterLink>
            )
          )}
        </div>
      </nav>
    </>
  );
}
