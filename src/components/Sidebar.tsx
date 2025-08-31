import React from 'react';
import { useState } from 'react';
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
  Upload,
  ChevronDown,
  ChevronRight,
  Wallet,
  TrendingUp,
  Receipt
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
  { id: 'hr', label: 'Ressources Humaines', icon: UserCheck },
  { id: 'reports', label: 'Rapports', icon: BarChart3 },
  { id: 'import', label: 'Import de Données', icon: Upload }
] as const;

const financialMenuItems = [
  { id: 'ecolage', label: 'Gestion Écolage', icon: CreditCard },
  { id: 'financial-transactions', label: 'Encaissements & Décaissements', icon: TrendingUp },
  { id: 'salary-management', label: 'Gestion des Salaires', icon: Wallet },
  { id: 'payroll', label: 'Bulletins de Paie', icon: Receipt }
] as const;

export function Sidebar({ currentPage, onPageChange, collapsed, onToggleCollapse }: SidebarProps) {
  const { can, is } = usePermissions();
  const [financialMenuOpen, setFinancialMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Détecter si on est sur mobile
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Sur mobile, fermer le menu par défaut
      if (mobile && !collapsed) {
        onToggleCollapse();
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [collapsed, onToggleCollapse]);

  // Fermer le menu mobile quand on change de page
  React.useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [currentPage, isMobile]);

  // Gérer l'ouverture/fermeture du menu mobile
  const handleMobileMenuToggle = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      onToggleCollapse();
    }
  };

  // Gérer la sélection d'une page sur mobile
  const handlePageChange = (page: Page) => {
    onPageChange(page);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };
  
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
        case 'reports':
          return can('all_reports') || can('view_all_reports');
        case 'hr':
          return is([USER_ROLES.ADMIN, USER_ROLES.DIRECTOR]);
        case 'import':
          return is([USER_ROLES.ADMIN, USER_ROLES.DIRECTOR]);
        default:
          return true; // Dashboard is always visible
      }
    });
  };
  
  // Check if user has access to financial features
  const hasFinancialAccess = () => {
    return can('manage_fees') || can('view_all_fees') || can('view_child_fees') ||
           can('manage_finances') || can('view_finances') ||
           is([USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.ACCOUNTANT]);
  };
  
  // Filter financial menu items based on permissions
  const getFilteredFinancialItems = () => {
    return financialMenuItems.filter(item => {
      switch (item.id) {
        case 'ecolage':
          return can('manage_fees') || can('view_all_fees') || can('view_child_fees');
        case 'financial-transactions':
          return can('manage_finances') || can('view_finances') || is([USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.ACCOUNTANT]);
        case 'salary-management':
        case 'payroll':
          return can('manage_finances') || can('view_finances') || is([USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.ACCOUNTANT]);
        default:
          return true;
      }
    });
  };
  
  const filteredMenuItems = getFilteredMenuItems();
  const filteredFinancialItems = getFilteredFinancialItems();
  
  // Check if current page is a financial page
  const isFinancialPage = financialMenuItems.some(item => item.id === currentPage);
  
  // Auto-open financial menu if current page is financial
  React.useEffect(() => {
    if (isFinancialPage) {
      setFinancialMenuOpen(true);
    }
  }, [isFinancialPage]);
  
  return (
    <>
      {/* Mobile Overlay - Affiché quand le menu mobile est ouvert */}
      {isMobile && mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar Container */}
      <div className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-50 ${
        isMobile 
          ? mobileMenuOpen 
            ? 'w-80 translate-x-0' 
            : 'w-80 -translate-x-full'
          : collapsed 
            ? 'w-16' 
            : 'w-64'
      }`}>
        {/* Header */}
        <div className={`h-16 border-b border-gray-200 flex items-center justify-between ${
          isMobile ? 'px-6' : 'px-4'
        }`}>
          {((!collapsed && !isMobile) || (isMobile && mobileMenuOpen)) && (
            <div className="flex items-center space-x-2">
              <div className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center`}>
                <School className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-white`} />
              </div>
              <div>
                <h1 className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-sm'}`}>LES POUPONS</h1>
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-500`}>Gestion Scolaire</p>
              </div>
            </div>
          )}
          
          {/* Close button for mobile */}
          {isMobile && mobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          )}
          
          {/* Collapse button for desktop */}
          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={`${isMobile ? 'mt-8 flex-1 overflow-y-auto' : 'mt-6 overflow-y-auto flex-1'}`}>
          <ul className={`space-y-1 ${isMobile ? 'px-6' : 'px-3'}`}>
            {filteredMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <li key={item.id} className="relative">
                  <button
                    onClick={() => handlePageChange(item.id as Page)}
                    className={`w-full flex items-center space-x-3 ${isMobile ? 'px-4 py-3' : 'px-3 py-2.5'} rounded-lg text-left transition-all duration-200 group ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} transition-colors ${
                      isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    {((!collapsed && !isMobile) || (isMobile && mobileMenuOpen)) && (
                      <span className={`font-medium ${isMobile ? 'text-base' : 'text-sm'}`}>{item.label}</span>
                    )}
                  </button>
                </li>
              );
            })}
            
            {/* Financial Management Menu */}
            {hasFinancialAccess() && (
              <li className="relative">
                <button
                  onClick={() => setFinancialMenuOpen(!financialMenuOpen)}
                  className={`w-full flex items-center space-x-3 ${isMobile ? 'px-4 py-3' : 'px-3 py-2.5'} rounded-lg text-left transition-all duration-200 group ${
                    isFinancialPage
                      ? 'bg-green-50 text-green-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Wallet className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} transition-colors ${
                    isFinancialPage ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  {((!collapsed && !isMobile) || (isMobile && mobileMenuOpen)) && (
                    <>
                      <span className={`font-medium ${isMobile ? 'text-base' : 'text-sm'} flex-1`}>Gestion Financière</span>
                      {financialMenuOpen ? (
                        <ChevronDown className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                      ) : (
                        <ChevronRight className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                      )}
                    </>
                  )}
                </button>
                
                {/* Financial Submenu */}
                {((!collapsed && !isMobile) || (isMobile && mobileMenuOpen)) && financialMenuOpen && (
                  <ul className={`mt-1 ${isMobile ? 'ml-10' : 'ml-8'} space-y-1`}>
                    {filteredFinancialItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPage === item.id;
                      
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => handlePageChange(item.id as Page)}
                            className={`w-full flex items-center space-x-3 ${isMobile ? 'px-4 py-2.5' : 'px-3 py-2'} rounded-lg text-left transition-all duration-200 group ${
                              isActive
                                ? 'bg-green-100 text-green-700 shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                            }`}
                          >
                            <Icon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} transition-colors ${
                              isActive ? 'text-green-700' : 'text-gray-400 group-hover:text-gray-600'
                            }`} />
                            <span className={`font-medium ${isMobile ? 'text-sm' : 'text-xs'}`}>{item.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            )}
            
            {/* User Management - Admin Only */}
            <li>
              <Link
                to="/profile"
                className={`w-full flex items-center space-x-3 ${isMobile ? 'px-4 py-3' : 'px-3 py-2.5'} rounded-lg text-left transition-all duration-200 group text-gray-600 hover:bg-gray-50 hover:text-gray-900`}
                onClick={() => isMobile && setMobileMenuOpen(false)}
              >
                <User className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-gray-400 group-hover:text-gray-600`} />
                {((!collapsed && !isMobile) || (isMobile && mobileMenuOpen)) && (
                  <span className={`font-medium ${isMobile ? 'text-base' : 'text-sm'}`}>Mon Profil</span>
                )}
              </Link>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        {((!collapsed && !isMobile) || (isMobile && mobileMenuOpen)) && (
          <div className={`absolute bottom-4 ${isMobile ? 'left-6 right-6' : 'left-4 right-4'}`}>
            <div className={`bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg ${isMobile ? 'p-5' : 'p-4'} text-white`}>
              <h3 className={`font-semibold ${isMobile ? 'text-base' : 'text-sm'}`}>Support</h3>
              <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-blue-100 mt-1`}>
                Besoin d'aide ? Contactez notre équipe.
              </p>
              <button className={`mt-2 ${isMobile ? 'text-sm px-4 py-2' : 'text-xs px-3 py-1'} bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors`}>
                Contacter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu Button - Affiché uniquement sur mobile */}
      {isMobile && (
        <button
          onClick={() => {
            console.log('🔘 Clic sur le bouton hamburger mobile - état actuel:', mobileMenuOpen);
            handleMobileMenuToggle();
          }}
          className="fixed top-4 left-4 z-60 p-3 bg-white border border-gray-200 rounded-lg shadow-lg hover:bg-gray-50 transition-colors touch-manipulation"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
      )}
    </>
  );
}