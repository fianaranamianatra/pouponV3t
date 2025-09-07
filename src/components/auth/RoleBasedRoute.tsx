import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { hasRole } from '../../lib/roles';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export function RoleBasedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/access-denied' 
}: RoleBasedRouteProps) {
  const { profile, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-2 text-gray-600">Vérification des autorisations...</p>
      </div>
    );
  }
  
  // Check if user has the required role
  if (!profile || !hasRole(profile.role, allowedRoles)) {
    return <Navigate to={redirectTo} replace />;
  }
  
  // User has the required role, render the children
  return <>{children}</>;
}