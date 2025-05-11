import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Definición del contexto de autenticación
type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: InsertUser) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

// Hook para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}

// Componente de proveedor de autenticación
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SelectUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  
  // Cargar usuario inicial
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user', {
          credentials: 'include'
        });
        
        if (res.status === 401) {
          setUser(null);
        } else if (res.ok) {
          const userData = await res.json();
          setUser(userData);
        } else {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
      } catch (err) {
        console.error("Error al cargar usuario:", err);
        setError(err instanceof Error ? err : new Error("Error desconocido"));
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, []);
  
  // Función de inicio de sesión
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await apiRequest("POST", "/api/login", { username, password });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Error al iniciar sesión");
      }
      const userData = await res.json();
      setUser(userData);
      toast({
        title: "Sesión iniciada",
        description: `¡Bienvenido de nuevo, ${userData.name || userData.username}!`,
      });
    } catch (err) {
      toast({
        title: "Error de inicio de sesión",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función de registro
  const register = async (userData: InsertUser) => {
    try {
      setIsLoading(true);
      const res = await apiRequest("POST", "/api/register", userData);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Error al registrarse");
      }
      const newUser = await res.json();
      setUser(newUser);
      toast({
        title: "Registro exitoso",
        description: `¡Bienvenido a FoodFlow, ${newUser.name || newUser.username}!`,
      });
    } catch (err) {
      toast({
        title: "Error de registro",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función de cierre de sesión
  const logout = async () => {
    try {
      setIsLoading(true);
      await apiRequest("POST", "/api/logout");
      setUser(null);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
    } catch (err) {
      toast({
        title: "Error al cerrar sesión",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        register
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
