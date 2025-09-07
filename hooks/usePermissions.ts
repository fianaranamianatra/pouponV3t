import { useAuth } from './useAuth';
import { hasPermission, hasRole } from '../lib/roles';

export function usePermissions() {
  const { profile } = useAuth();
  
  // Check if the current user has a specific permission
  const can = (permission: string): boolean => {
    if (!profile) return false;
    return hasPermission(profile.role, permission);
  };
  
  // Check if the current user has any of the specified roles
  const is = (roles: string | string[]): boolean => {
    if (!profile) return false;
    const rolesToCheck = typeof roles === 'string' ? [roles] : roles;
    return hasRole(profile.role, rolesToCheck);
  };
  
  // Get the current user's role
  const role = profile?.role || null;
  
  return { can, is, role };
}