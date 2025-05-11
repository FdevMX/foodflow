import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background dark:bg-gray-900">
      <Card className="w-full max-w-md mx-4 border-red-200 dark:border-red-900">
        <CardContent className="pt-6 pb-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-foreground">404 - Página no encontrada</h1>
          </div>

          <p className="mt-4 mb-6 text-muted-foreground">
            Lo sentimos, la página que buscas no existe o ha sido movida a otra ubicación.
          </p>
          
          <div className="flex gap-3">
            <Button 
              variant="default" 
              onClick={() => navigate("/")}
              className="flex-1"
            >
              Ir al inicio
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex-1"
            >
              Volver atrás
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
