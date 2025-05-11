import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, useLocation } from "wouter";
import { useTheme } from "next-themes";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  
  const navItems = [
    {
      title: "Dashboard",
      href: "/",
    },
    {
      title: "Menu Management",
      href: "/menu",
    },
    {
      title: "Staff Management",
      href: "/staff",
    },
    {
      title: "Orders",
      href: "/orders",
    },
    {
      title: "Tables",
      href: "/tables",
    },
    {
      title: "Reports",
      href: "/reports",
    },
  ];
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  
  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-background border-b border-border lg:shadow-sm z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-4 border-b border-border">
                <h1 className="font-poppins font-bold text-2xl text-secondary">FoodFlow</h1>
                <p className="text-sm text-muted-foreground">Restaurant Management</p>
              </div>
              
              <nav className="p-4">
                <ul className="space-y-2">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <Link 
                        href={item.href}
                        className={`block px-3 py-2 rounded-md text-sm font-medium ${
                          location === item.href 
                            ? "bg-secondary text-secondary-foreground" 
                            : "hover:bg-muted"
                        }`}
                      >
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8 pt-4 border-t border-border">
                  <Link 
                    href="/settings"
                    className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-muted"
                  >
                    Settings
                  </Link>
                  <Link 
                    href="/help"
                    className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-muted"
                  >
                    Help & Support
                  </Link>
                  <Button
                    variant="destructive"
                    className="mt-4 w-full"
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </Button>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="ml-3 font-poppins font-bold text-xl text-secondary">FoodFlow</h1>
        </div>
        
        <div className="hidden lg:flex items-center">
          <span className="text-lg font-medium">{title}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative text-muted-foreground">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>
          
          <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={toggleTheme}>
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          <div className="lg:hidden">
            <Avatar className="h-8 w-8 border-2 border-secondary">
              <AvatarImage 
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80" 
                alt={user?.name} 
              />
              <AvatarFallback>{user?.name?.charAt(0) || user?.username?.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}
