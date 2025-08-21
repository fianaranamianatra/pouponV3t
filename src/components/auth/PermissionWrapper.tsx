import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission } from '../../lib/roles';

interface PermissionWrapperProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

export function PermissionWrapper({ 
  children, 
  permission, 
  fallback = null 
}: PermissionWrapperProps) {
  const { profile } = useAuth();
  
  // If no profile or user doesn't have the required permission, render fallback or nothing
  if (!profile || !hasPermission(profile.role, permission)) {
    return <>{fallback}</>;
  }
  
  // User has the required permission, render the children
  return <>{children}</>;
}