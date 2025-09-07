import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { School, Wifi, WifiOff } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, error } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4 inline-block"></div>
          <p className="text-gray-600">Chargement...</p>
          {error && error.includes('hors ligne') && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-yellow-600">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm">Mode hors ligne</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // Afficher un avertissement si en mode hors ligne mais permettre l'accès
  if (error && error.includes('hors ligne') && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="flex items-center justify-center space-x-2 text-yellow-800">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">Mode hors ligne - Certaines fonctionnalités peuvent être limitées</span>
          </div>
        </div>
        {children}
      </div>
    );
  }
  
  // Rediriger vers la page de login si l'utilisateur n'est pas connecté
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}

export default AuthGuard;