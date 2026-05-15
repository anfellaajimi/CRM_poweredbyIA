import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('Admin' | 'Manager' | 'Developer' | 'Client')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    // If not authenticated, redirect based on the context if possible, 
    // but defaulting to /login is standard.
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If authenticated but role not allowed
    if (user.role === 'Client') {
      return <Navigate to="/client-portal" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
