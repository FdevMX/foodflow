import { cn } from "@/lib/utils";
// Renombramos Link de wouter para evitar conflictos con el componente de shadcn
import { Link as WouterLink, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  UtensilsCrossed, 
  Users, 
  ClipboardList, 
  RockingChair, 
  FileText, 
  Settings, 
  HelpCircle, 
  LogOut 
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  
  const navItems = [
    {
      title: "Panel de Control",
      href: "/",
      icon: <BarChart3 className="w-5 h-5 mr-2" />,
    },
    {
      title: "Gestión de Menú",
      href: "/menu",
      icon: <UtensilsCrossed className="w-5 h-5 mr-2" />,
    },
    {
      title: "Gestión de Personal",
      href: "/staff",
      icon: <Users className="w-5 h-5 mr-2" />,
    },
    {
      title: "Órdenes",
      href: "/orders",
      icon: <ClipboardList className="w-5 h-5 mr-2" />,
    },
    {
      title: "Mesas",
      href: "/tables",
      icon: <RockingChair className="w-5 h-5 mr-2" />,
    },
    {
      title: "Reportes",
      href: "/reports",
      icon: <FileText className="w-5 h-5 mr-2" />,
    },
  ];
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <aside className={cn(
      "hidden lg:flex flex-col w-64 bg-sidebar border-r border-sidebar-border",
      className
    )}>
      <div className="p-4 border-b border-sidebar-border">
        <h1 className="font-poppins font-bold text-2xl text-secondary">FoodFlow</h1>
        <p className="text-sm text-sidebar-foreground/70">Restaurant Management</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => (
            <WouterLink 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location === item.href 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent/10"
              )}
            >
              {item.icon}
              {item.title}
            </WouterLink>
          ))}
        </div>
        
        <div className="pt-6 mt-6 border-t border-sidebar-border">
          <div className="px-3 mb-4">
            <h2 className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Configuración</h2>
          </div>
          <WouterLink href="/settings" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-sidebar-accent/10">
            <Settings className="w-5 h-5 mr-2" />
            Configuración
          </WouterLink>
          <WouterLink href="/help" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-sidebar-foreground hover:bg-sidebar-accent/10">
            <HelpCircle className="w-5 h-5 mr-2" />
            Ayuda y Soporte
          </WouterLink>
        </div>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80" alt={user?.name} />
            <AvatarFallback>{user?.name?.charAt(0) || user?.username?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium">{user?.name || user?.username}</p>
            <Button variant="link" size="sm" className="p-0 h-auto text-xs text-sidebar-foreground/50 hover:text-secondary" onClick={handleLogout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
