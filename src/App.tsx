import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.tsx';
import AuthGuard from './components/auth/AuthGuard';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { StudentsFirebase } from './pages/StudentsFirebase';
import { TeachersFirebase } from './pages/TeachersFirebase';
import { ClassesFirebase } from './pages/ClassesFirebase';
import SubjectsFirebase from './pages/SubjectsFirebase';
import { EcolageFirebase } from './pages/EcolageFirebase';
import ReportsFirebase from './pages/ReportsFirebase';
import UserProfile from './pages/UserProfile';
import HumanResources from './pages/HumanResources';
import PayrollManagement from './pages/PayrollManagement';
import SalaryManagement from './pages/SalaryManagement';
import { ExpensesManagement } from './pages/ExpensesManagement';
import FinancialTransactions from './pages/FinancialTransactions';
import { AccessDenied } from './pages/AccessDenied';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="/*" element={
              <AuthGuard>
                <div className="flex h-screen">
                  <Sidebar />
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <Header />
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/students" element={<StudentsFirebase />} />
                        <Route path="/teachers" element={<TeachersFirebase />} />
                        <Route path="/classes" element={<ClassesFirebase />} />
                        <Route path="/subjects" element={<SubjectsFirebase />} />
                        <Route path="/ecolage" element={<EcolageFirebase />} />
                        <Route path="/reports" element={<ReportsFirebase />} />
                        <Route path="/profile" element={<UserProfile />} />
                        <Route path="/hr" element={<HumanResources />} />
                        <Route path="/payroll" element={<PayrollManagement />} />
                        <Route path="/salary" element={<SalaryManagement />} />
                        <Route path="/expenses" element={<ExpensesManagement />} />
                        <Route path="/transactions" element={<FinancialTransactions />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </AuthGuard>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;