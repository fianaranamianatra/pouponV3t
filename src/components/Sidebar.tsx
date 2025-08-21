import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Home, 
  Users, 
  GraduationCap,
  BookOpen, 
  FileText,
  Menu,
  X,
  CreditCard,
  DollarSign,
  Calculator,
  BarChart3,
  UserCheck,
  User,
  School,
  ChevronDown,
  ChevronRight,
  Upload
} from 'lucide-react';
import type { Page } from '../App';
import { usePermissions } from '../hooks/usePermissions';
import { USER_ROLES } from '../lib/roles';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: Home },
  { id: 'students', label: 'Élèves', icon: Users },
  { id: 'teachers', label: 'Enseignants', icon: GraduationCap },
  { id: 'classes', label: 'Classes', icon: BookOpen },
  { id: 'subjects', label: 'Matières', icon: BookOpen },
  { id: 'ecolage', label: 'Gestion Écolage', icon: CreditCard },
  { id: 'payroll', label: 'Gestion de la Paie', icon: Calculator },
  { id: 'transactions', label: 'Encaissements/Décaissements', icon: DollarSign },
  { id: 'reports', label: 'Rapports', icon: BarChart3 },
  { id: 'hr', label: 'Ressources Humaines', icon: UserCheck }
] as const;

// Sous-menus pour Ressources Humaines
const hrSubMenus = [
  { id: 'hr', label: 'Gestion des Employés', icon: Users },
  { id: 'ecolage', label: 'Gestion Écolage', icon: CreditCard },
  { id: 'payroll', label: 'Bulletins de Paie', icon: Calculator },
  { id: 'transactions', label: 'Encaissements', icon: DollarSign },
  { id: 'reports', label: 'Rapports', icon: BarChart3 },
  { id: 'import', label: 'Import de Données', icon: Upload }
] as const;
export function Sidebar({ currentPage, onPageChange, collapsed, onToggleCollapse }: SidebarProps) {
  const { can, is } = usePermissions();
  const [hrExpanded, setHrExpanded] = React.useState(false);
  
  // Vérifier si on est dans une section RH
  const isInHrSection = ['hr', 'ecolage', 'payroll', 'transactions', 'reports'].includes(currentPage);
  
  // Ouvrir automatiquement le menu RH si on est dans une de ses sections
  React.useEffect(() => {
    if (isInHrSection) {
      setHrExpanded(true);
    }
  }, [isInHrSection]);
  
  // Filter menu items based on user permissions
  const getFilteredMenuItems = () => {
    return menuItems.filter(item => {
      switch (item.id) {
        case 'students':
          return can('manage_students') || can('view_students');
        case 'teachers':
          return can('manage_teachers') || can('view_teachers');
        case 'classes':
          return can('manage_classes') || can('view_classes');
        case 'subjects':
          return can('manage_subjects') || can('view_subjects');
        case 'ecolage':
          return can('manage_fees') || can('view_all_fees') || can('view_child_fees');
        case 'payroll':
          return can('manage_finances') || is([USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.ACCOUNTANT]);
        case 'transactions':
          return can('manage_finances') || can('view_finances') || is([USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.ACCOUNTANT]);
        case 'reports':
          return can('all_reports') || can('view_all_reports');
        case 'hr':
          return is([USER_ROLES.ADMIN, USER_ROLES.DIRECTOR]);
        default:
          return true; // Dashboard is always visible
      }
    });
  };
  
  const filteredMenuItems = getFilteredMenuItems();
  
  // Filtrer les sous-menus RH selon les permissions
  const getFilteredHrSubMenus = () => {
    return hrSubMenus.filter(item => {
      switch (item.id) {
        case 'hr':
          return is([USER_ROLES.ADMIN, USER_ROLES.DIRECTOR]);
        case 'ecolage':
          return can('manage_fees') || can('view_all_fees') || can('view_child_fees');
        case 'payroll':
          return can('manage_finances') || is([USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.ACCOUNTANT]);
        case 'transactions':
          return can('manage_finances') || can('view_finances') || is([USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.ACCOUNTANT]);
        case 'reports':
          return can('all_reports') || can('view_all_reports');
        case 'import':
          return is([USER_ROLES.ADMIN, USER_ROLES.DIRECTOR]);
        default:
          return true;
      }
    });
  };
  
  const filteredHrSubMenus = getFilteredHrSubMenus();
  
  return (
    <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-30 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <School className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm">LES POUPONS</h1>
              <p className="text-xs text-gray-500">Gestion Scolaire</p>
            </div>
          </div>
        )}
        
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        <ul className="space-y-1 px-3">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const isHrItem = item.id === 'hr';
            const showHrSubMenu = isHrItem && hrExpanded && !collapsed;
            
            // Pour les items RH, ne pas les afficher individuellement s'ils sont dans le sous-menu
            if (['ecolage', 'payroll', 'transactions', 'reports'].includes(item.id) && !collapsed) {
              return null;
            }
            
            return (
              <li key={item.id} className="relative">
                {isHrItem ? (
                  // Menu principal RH avec sous-menus
                  <>
                    <button
                      onClick={() => {
                        if (collapsed) {
                          onPageChange(item.id as Page);
                        } else {
                          setHrExpanded(!hrExpanded);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                        isInHrSection
                          ? 'bg-blue-50 text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 transition-colors ${
                          isInHrSection ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                        }`} />
                        {!collapsed && (
                          <span className="font-medium text-sm">{item.label}</span>
                        )}
                      </div>
                      {!collapsed && (
                        <div className="transition-transform duration-200">
                          {hrExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </button>
                    
                    {/* Sous-menus RH */}
                    {showHrSubMenu && (
                      <ul className="mt-2 ml-4 space-y-1 border-l-2 border-gray-100 pl-4">
                        {filteredHrSubMenus.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = currentPage === subItem.id;
                          
                          return (
                            <li key={subItem.id}>
                              <button
                                onClick={() => onPageChange(subItem.id as Page)}
                                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 group ${
                                  isSubActive
                                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }`}
                              >
                                <SubIcon className={`w-4 h-4 transition-colors ${
                                  isSubActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'
                                }`} />
                                <span className="font-medium text-sm">{subItem.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                ) : (
                  // Menu normal
                <button
                  onClick={() => onPageChange(item.id as Page)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  {!collapsed && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                </button>
                )}
              </li>
            );
          })}
          
          {/* User Management - Admin Only */}
          <li>
            <Link
              to="/profile"
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group text-gray-600 hover:bg-gray-50 hover:text-gray-900`}
            >
              <User className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
              {!collapsed && (
                <span className="font-medium text-sm">Mon Profil</span>
              )}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <h3 className="font-semibold text-sm">Support</h3>
            <p className="text-xs text-blue-100 mt-1">
              Besoin d'aide ? Contactez notre équipe.
            </p>
            <button className="mt-2 text-xs bg-white text-blue-600 px-3 py-1 rounded-md hover:bg-blue-50 transition-colors">
              Contacter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}