import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { School, Wifi, WifiOff, AlertTriangle, RefreshCw, Shield } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  timeout?: number;
}

function AuthGuard({ children, timeout = 10000 }: AuthGuardProps) {
  const { user, loading, error, permissionTimeout } = useAuth();
  
  // Fonction de retry
  const handleRetry = () => {
    window.location.reload();
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <School className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">LES POUPONS</h2>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Authentification en cours...</p>
          
          {/* Indicateur de progression */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
          </div>
          
          <div className="text-sm text-gray-500 space-y-1">
            <p>• Vérification des identifiants</p>
            <p>• Chargement du profil utilisateur</p>
            <p>• Configuration des permissions</p>
          </div>
          
          {error && error.includes('hors ligne') && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-yellow-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm">Mode hors ligne détecté</span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleRetry}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Forcer la connexion
          </button>
        </div>
      </div>
    );
  }
  
  // Afficher avec avertissement si timeout des permissions
  if (permissionTimeout && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Bannière d'avertissement pour timeout */}
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">
                  Connexion Firebase lente détectée
                </p>
                <p className="text-yellow-700 text-sm">
                  L'application fonctionne en mode dégradé. Certaines fonctionnalités peuvent être limitées.
                </p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reconnecter
            </button>
          </div>
        </div>
        {children}
      </div>
    );
  }
  
  // Afficher un avertissement si en mode hors ligne mais permettre l'accès
  if (error && error.includes('hors ligne') && user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-2 text-yellow-800">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">Mode hors ligne - Certaines fonctionnalités peuvent être limitées</span>
            </div>
            <button
              onClick={handleRetry}
              className="text-sm text-yellow-700 hover:text-yellow-900 font-medium"
            >
              Réessayer la connexion
            </button>
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