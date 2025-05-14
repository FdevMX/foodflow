import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const staff = localStorage.getItem('staff');

  if (!token || (!user && !staff)) {
    return <Navigate to="/auth" replace />;
  }

  // Verificar si el usuario es administrador
  if (user) {
    const userData = JSON.parse(user);
    if (userData?.role?.name === 'Administrador') {
      return <>{children}</>;
    }
  }

  // Si es personal, verificar el rol
  if (staff) {
    const staffData = JSON.parse(staff);
    const allowedRoles = ['Mesero', 'Cocinero', 'Gerente'];
    if (allowedRoles.includes(staffData?.role?.name)) {
      return <>{children}</>;
    }
  }

  return <Navigate to="/auth" replace />;
} 