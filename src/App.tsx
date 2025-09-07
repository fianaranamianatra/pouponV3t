import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './components/auth/AuthGuard';
import { RoleBasedRoute } from './components/auth/RoleBasedRoute';
import { LoginPage } from './pages/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { TeachersFirebase } from './pages/TeachersFirebase';
import { ClassesFirebase } from './pages/ClassesFirebase';
import { SubjectsFirebase } from './pages/SubjectsFirebase';
import { StudentsFirebase } from './pages/StudentsFirebase';
import { EcolageFirebase } from './pages/EcolageFirebase';
import { PayrollManagement } from './pages/PayrollManagement';
import { ReportsFirebase } from './pages/ReportsFirebase';
import { HumanResources } from './pages/HumanResources';
import { UserProfile } from './pages/UserProfile';
import { AccessDenied } from './pages/AccessDenied';
import { SalaryManagement } from './pages/SalaryManagement';
import FinancialTransactions from './pages/FinancialTransactions';
import { StudentEcolageSyncService } from './lib/services/studentEcolageSync';
import { BidirectionalSyncService } from './lib/services/bidirectionalSync';
import { PayrollSalarySyncService } from './lib/services/payrollSalarySync';
import { USER_ROLES } from './lib/roles';
import { useAuth } from './hooks/useAuth';
import { OfflineHandler } from './lib/firebase/offlineHandler';

export type Page = 'dashboard' | 'students' | 'teachers' | 'classes' | 'subjects' | 'ecolage' | 'payroll' | 'salary-management' | 'financial-transactions' | 'reports' | 'hr' | 'import';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  // Détecter la taille d'écran
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Sur mobile, fermer le menu par défaut
      if (mobile) {
        setSidebarCollapsed(true);
        setMobileMenuOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Gérer l'ouverture/fermeture du menu mobile
  const handleToggleSidebar = () => {
    console.log('🔘 handleToggleSidebar appelé - isMobile:', isMobile, 'sidebarCollapsed:', sidebarCollapsed);
    if (isMobile) {
      // Pour mobile, on utilise la prop onToggleCollapse du Sidebar
      setSidebarCollapsed(!sidebarCollapsed);
      console.log('📱 Menu mobile togglé via sidebar collapsed:', !sidebarCollapsed);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
      console.log('🖥️ Sidebar desktop togglé:', !sidebarCollapsed);
    }
  };

  // Gérer l'état de connectivité
  useEffect(() => {
    const removeListener = OfflineHandler.addConnectionListener((online) => {
      setIsOnline(online);
    });

    return removeListener;
  }, []);

  // Initialiser la synchronisation bidirectionnelle seulement après authentification
  React.useEffect(() => {
    // Ne pas initialiser la synchronisation si l'utilisateur n'est pas connecté
    if (!user || !isOnline) {
      return;
    }

    console.log('🚀 Initialisation de la synchronisation bidirectionnelle Écolage ↔ Profils');
    console.log('🚀 Initialisation de la synchronisation bidirectionnelle Paie ↔ Salaires');
    
    const initializeSync = async () => {
      try {
        await BidirectionalSyncService.initializeAllSync();
        await PayrollSalarySyncService.initializeGlobalSync();
        console.log('✅ Toutes les synchronisations bidirectionnelles sont actives');
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la synchronisation:', error);
      }
    };

    // Seulement si en ligne
    if (isOnline) {
      initializeSync();
    }

    // Nettoyer les listeners au démontage
    return () => {
      BidirectionalSyncService.cleanup();
      PayrollSalarySyncService.cleanup();
    };
  }, [user, isOnline]);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return (
          <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.SECRETARY, USER_ROLES.TEACHER]}>
            <StudentsFirebase />
          </RoleBasedRoute>
        );
      case 'teachers':
        return (
          <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DIRECTOR]}>
            <TeachersFirebase />
          </RoleBasedRoute>
        );
      case 'classes':
        return (
          <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.SECRETARY]}>
            <ClassesFirebase />
          </RoleBasedRoute>
        );
      case 'subjects':
        return (
          <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DIRECTOR]}>
            <SubjectsFirebase />
          </RoleBasedRoute>
        );
      case 'ecolage':
        return (
          <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.SECRETARY, USER_ROLES.ACCOUNTANT]}>
            <EcolageFirebase />
          </RoleBasedRoute>
        );
      case 'payroll':
        return (
          <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.ACCOUNTANT]}>
            <PayrollManagement />
          </RoleBasedRoute>
        );
      case 'salary-management':
        return (
          <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.ACCOUNTANT]}>
            <SalaryManagement />
          </RoleBasedRoute>
        );
      case 'financial-transactions':
        return (
          <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.ACCOUNTANT]}>
            <FinancialTransactions />
          </RoleBasedRoute>
        );
      case 'reports':
        return (
          <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.TEACHER]}>
            <ReportsFirebase />
          </RoleBasedRoute>
        );
      case 'hr':
        return (
          <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DIRECTOR]}>
            <HumanResources />
          </RoleBasedRoute>
        );
      case 'import':
        return (
          <RoleBasedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DIRECTOR]}>
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Import de Données</h1>
                <p className="text-gray-600">Importez vos données en masse via des fichiers CSV ou Excel pour une mise à jour rapide du système.</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Zone d'Import</h3>
                  <p className="text-gray-500 mb-6">Glissez vos fichiers ici ou cliquez pour sélectionner des fichiers</p>
                  <p className="text-sm text-gray-400">Formats acceptés: CSV, Excel (.xlsx, .xls)</p>
                </div>
              </div>
            </div>
          </RoleBasedRoute>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/access-denied" element={<AccessDenied />} />
        <Route path="/profile" element={
          <AuthGuard>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Sidebar 
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                collapsed={sidebarCollapsed}
                onToggleCollapse={handleToggleSidebar}
              />
              <div className={`flex-1 flex flex-col transition-all duration-300 ${
                isMobile 
                  ? 'ml-0' 
                  : sidebarCollapsed 
                    ? 'ml-16' 
                    : 'ml-64'
              }`}>
                <Header 
                  onToggleSidebar={() => {
                    console.log('🔘 onToggleSidebar appelé depuis Header');
                    handleToggleSidebar();
                  }} 
                  isMobile={isMobile}
                />
                <main className={`flex-1 ${isMobile ? 'p-4' : 'p-6'}`}>
                  <UserProfile />
                </main>
              </div>
            </div>
          </AuthGuard>
        } />
        <Route path="/" element={
          <AuthGuard>
            <div className="min-h-screen bg-gray-50 flex flex-col">
              <Sidebar 
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => {
                  console.log('🔘 onToggleCollapse appelé depuis Sidebar');
                  handleToggleSidebar();
                }}
              />
              <div className={`flex-1 flex flex-col transition-all duration-300 ${
                isMobile 
                  ? 'ml-0' 
                  : sidebarCollapsed 
                    ? 'ml-16' 
                    : 'ml-64'
              }`}>
                <Header 
                  onToggleSidebar={() => {
                    console.log('🔘 onToggleSidebar appelé depuis Header');
                    handleToggleSidebar();
                  }} 
                  isMobile={isMobile}
                />
                <main className={`flex-1 ${isMobile ? 'p-4' : 'p-6'}`}>
                  {renderPage()}
                </main>
              </div>
            </div>
          </AuthGuard>
        } />
      </Routes>
    </Router>
  );
}

export default App;