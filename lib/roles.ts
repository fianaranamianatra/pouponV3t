// Enumeration of user roles
export const USER_ROLES = {
  ADMIN: 'admin',
  DIRECTOR: 'director',
  SECRETARY: 'secretary',
  TEACHER: 'teacher',
  PARENT: 'parent',
  ACCOUNTANT: 'accountant'
};

// Define permissions for each role
export const PERMISSIONS = {
  // Administrator - FULL ACCESS
  [USER_ROLES.ADMIN]: [
    'manage_users', 'system_config', 'all_reports', 'all_data_access',
    'manage_students', 'manage_teachers', 'manage_classes', 'manage_subjects',
    'manage_grades', 'manage_fees', 'manage_schedules', 'manage_finances',
    'manage_hierarchy', 'manage_communications'
  ],
  
  // Director - GENERAL SUPERVISION
  [USER_ROLES.DIRECTOR]: [
    'view_all_reports', 'approve_actions', 'view_finances', 'manage_staff',
    'view_students', 'view_teachers', 'view_classes', 'view_schedules',
    'view_hierarchy', 'manage_communications'
  ],
  
  // Secretary - ADMINISTRATIVE MANAGEMENT
  [USER_ROLES.SECRETARY]: [
    'manage_students', 'manage_fees', 'generate_certificates', 
    'manage_communications', 'view_schedules', 'manage_enrollments'
  ],
  
  // Teachers - PEDAGOGY
  [USER_ROLES.TEACHER]: [
    'manage_grades', 'view_schedules', 'view_students', 
    'manage_attendance', 'teacher_communications'
  ],
  
  // Parents/Guardians - CONSULTATION
  [USER_ROLES.PARENT]: [
    'view_child_grades', 'view_child_fees', 'view_child_schedule',
    'parent_communications', 'view_child_attendance'
  ],
  
  // Accountant - FINANCES
  [USER_ROLES.ACCOUNTANT]: [
    'manage_finances', 'view_all_fees', 'manage_salaries', 
    'generate_financial_reports', 'view_accounting_data'
  ]
};

// Function to check if a user has a specific permission
export const hasPermission = (userRole: string, permission: string): boolean => {
  if (!userRole || !permission) return false;
  
  // Admin has all permissions
  if (userRole === USER_ROLES.ADMIN) return true;
  
  // Check if the user's role has the specific permission
  return PERMISSIONS[userRole]?.includes(permission) || false;
};

// Function to check if a user has any of the specified roles
export const hasRole = (userRole: string, allowedRoles: string[]): boolean => {
  if (!userRole || !allowedRoles || allowedRoles.length === 0) return false;
  return allowedRoles.includes(userRole);
};

// Get all permissions for a specific role
export const getRolePermissions = (role: string): string[] => {
  return PERMISSIONS[role] || [];
};

// Get all available roles
export const getAllRoles = (): string[] => {
  return Object.values(USER_ROLES);
};

// Get role display name
export const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'Administrateur';
    case USER_ROLES.DIRECTOR:
      return 'Directeur';
    case USER_ROLES.SECRETARY:
      return 'Secrétaire';
    case USER_ROLES.TEACHER:
      return 'Enseignant';
    case USER_ROLES.PARENT:
      return 'Parent';
    case USER_ROLES.ACCOUNTANT:
      return 'Comptable';
    default:
      return 'Utilisateur';
  }
};