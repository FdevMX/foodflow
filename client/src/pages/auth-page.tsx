import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Importamos el hook de autenticación
import { useAuth } from "@/hooks/use-auth";
import { insertUserSchema } from "@shared/schema";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useState } from "react";

// Esquema para validación de inicio de sesión
const loginSchema = z.object({
  email: z.string().email("Ingresa un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// Esquema para validación de registro
const registerSchema = insertUserSchema.extend({
  email: z.string().email("Ingresa un correo electrónico válido"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

export default function AuthPage() {
  const { user, login, register, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Si el usuario ya está autenticado, redirigir al dashboard
  if (user) {
    navigate("/");
    return null;
  }

  // Formulario de inicio de sesión
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Formulario de registro
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      roleId: 3, // ID del rol Administrador
    },
  });

  // Envío del formulario de inicio de sesión
  const onLoginSubmit = async (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    try {
      await login(values.email, values.password);
      navigate("/");
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      loginForm.setError("root", {
        message: error instanceof Error ? error.message : "Error al iniciar sesión"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Envío del formulario de registro
  const onRegisterSubmit = async (values: z.infer<typeof registerSchema>) => {
    setIsSubmitting(true);
    try {
      const { confirmPassword, ...userData } = values;
      await register(userData);
      navigate("/");
    } catch (error) {
      console.error("Error al registrarse:", error);
      registerForm.setError("root", {
        message: error instanceof Error ? error.message : "Error al registrarse"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Lado izquierdo - Formularios de autenticación */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center">Bienvenido de nuevo</CardTitle>
                  <CardDescription className="text-center">
                    Ingresa tus credenciales para acceder a tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo electrónico</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Ingresa tu contraseña" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {loginForm.formState.errors.root && (
                        <p className="text-destructive text-sm">{loginForm.formState.errors.root.message}</p>
                      )}
                      <Button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90"
                        disabled={isSubmitting || isLoading}
                      >
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Iniciando sesión...</>
                        ) : (
                          "Iniciar sesión"
                        )}
                      </Button>
                    </form>
                  </Form>

                  {/* Credenciales de prueba */}
                  <div className="mt-6 p-3 bg-muted rounded-md text-sm">
                    <p className="font-semibold mb-1">Credenciales de prueba:</p>
                    <p>Correo: <span className="font-mono">admin@ejemplo.com</span></p>
                    <p>Contraseña: <span className="font-mono">admin123</span></p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-center">Crear una cuenta</CardTitle>
                  <CardDescription className="text-center">
                    Ingresa tus datos para crear tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre de usuario</FormLabel>
                            <FormControl>
                              <Input placeholder="usuario" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre completo</FormLabel>
                            <FormControl>
                              <Input placeholder="Juan Pérez" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correo electrónico</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="correo@ejemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Crea una contraseña" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirmar contraseña</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Confirma tu contraseña" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {registerForm.formState.errors.root && (
                        <p className="text-destructive text-sm">{registerForm.formState.errors.root.message}</p>
                      )}
                      <Button
                        type="submit"
                        className="w-full bg-accent hover:bg-accent/90"
                        disabled={isSubmitting || isLoading}
                      >
                        {isSubmitting ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando cuenta...</>
                        ) : (
                          "Crear cuenta"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Lado derecho - Sección de información */}
      <div className="flex-1 bg-primary p-12 hidden md:flex flex-col justify-center text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-4">FoodFlow</h1>
          <h2 className="text-2xl font-medium mb-6">Sistema de Gestión de Restaurantes</h2>
          <p className="mb-8 text-primary-foreground">
            Una solución completa para propietarios y gerentes de restaurantes.
            Gestiona de manera eficiente tu menú, personal, pedidos y mesas en un solo lugar.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <p className="ml-2 text-primary-foreground">Gestión completa de menú con categorías</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <p className="ml-2 text-primary-foreground">Seguimiento y gestión de personal</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <p className="ml-2 text-primary-foreground">Procesamiento y seguimiento de pedidos en tiempo real</p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <p className="ml-2 text-primary-foreground">Panel completo de análisis de ventas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
