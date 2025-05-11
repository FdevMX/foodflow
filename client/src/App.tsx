import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import MenuPage from "@/pages/menu-page";
import StaffPage from "@/pages/staff-page";
import OrdersPage from "@/pages/orders-page";
import TablesPage from "@/pages/tables-page";
import ReportsPage from "@/pages/reports-page";

// Importamos el AuthProvider y ProtectedRoute
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

// Componente del Router
function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/menu" component={MenuPage} />
      <ProtectedRoute path="/staff" component={StaffPage} />
      <ProtectedRoute path="/orders" component={OrdersPage} />
      <ProtectedRoute path="/tables" component={TablesPage} />
      <ProtectedRoute path="/reports" component={ReportsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Componente principal
function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
