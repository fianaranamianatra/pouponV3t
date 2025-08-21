import React, { useState } from 'react';
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
import { FinancialTransactions } from './pages/FinancialTransactions';
import { ReportsFirebase } from './pages/ReportsFirebase';
import { HumanResources } from './pages/HumanResources';
import { UserProfile } from './pages/UserProfile';
import { AccessDenied } from './pages/AccessDenied';
import { USER_ROLES } from './lib/roles';

export type Page = 'dashboard' | 'students' | 'teachers' | 'classes' | 'subjects' | 'ecolage' | 'payroll' | 'transactions' | 'reports' | 'hr';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      case 'transactions':
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
            <div className="min-h-screen bg-gray-50 flex">
              <Sidebar 
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
              <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
                <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
                <main className="p-6">
                  <UserProfile />
                </main>
              </div>
            </div>
          </AuthGuard>
        } />
        <Route path="/" element={
          <AuthGuard>
            <div className="min-h-screen bg-gray-50 flex">
              <Sidebar 
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              />
              <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
                <Header onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
                <main className="p-6">
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