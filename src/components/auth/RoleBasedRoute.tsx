import React from 'react';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { hasRole } from '../../lib/roles';
import { AlertTriangle, Shield, RefreshCw } from 'lucide-react';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
  timeout?: number; // Timeout en millisecondes
  showPageOnTimeout?: boolean; // Afficher la page même en cas de timeout
}

export function RoleBasedRoute({ 
  children, 
  allowedRoles, 
  redirectTo = '/access-denied',
  timeout = 10000, // 10 secondes par défaut
  showPageOnTimeout = true
}: RoleBasedRouteProps) {
  const { profile, loading } = useAuth();
  const [permissionTimeout, setPermissionTimeout] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Gérer le timeout des permissions
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Timeout des permissions Firebase atteint');
        setPermissionTimeout(true);
        setShowTimeoutWarning(true);
      }, timeout);

      return () => clearTimeout(timeoutId);
    }
  }, [loading, timeout, retryCount]);

  // Fonction de retry
  const handleRetry = () => {
    setPermissionTimeout(false);
    setShowTimeoutWarning(false);
    setRetryCount(prev => prev + 1);
    // Forcer un rechargement de l'auth
    window.location.reload();
  };

  // Afficher la page avec un avertissement si timeout et showPageOnTimeout = true
  if (permissionTimeout && showPageOnTimeout) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Bannière d'avertissement */}
        <div className="bg-yellow-50 border-b border-yellow--200 p-4200 p-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">
                  Vérification des permissions en cours...
                </p>
                <p className="text-yellow-700 text-sm">
                  La page s'affiche en mode dégradé. Certaines fonctionnalités peuvent être limitées.
                </p>
              </div>
            </div>
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </button>
          </div>
        </div>
        
        {/* Contenu de la page avec avertissement */}
        <div className="relative">
          {children}
          
          {/* Overlay d'avertissement flottant */}
          {showTimeoutWarning && (
            <div className="fixed bottom-4 right-4 bg-white border border-yellow-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Permissions en cours</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    La vérification des permissions Firebase prend plus de temps que prévu.
                  </p>
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => setShowTimeoutWarning(false)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Masquer
                    </button>
                    <button
                      onClick={handleRetry}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Afficher l'état de chargement avec timeout
  if (loading && !permissionTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Vérification des autorisations</h3>
          <p className="text-gray-600 mb-4">Connexion à Firebase en cours...</p>
          
          {/* Barre de progression du timeout */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
              style={{ 
                width: `${Math.min(((timeout - (Date.now() % timeout)) / timeout) * 100, 100)}%`,
                animation: `progress ${timeout}ms linear`
              }}
            ></div>
          </div>
          
          <div className="text-sm text-gray-500 space-y-2">
            <p>• Vérification des permissions utilisateur</p>
            <p>• Chargement du profil Firebase</p>
            <p>• Validation des accès</p>
          </div>
          
          <button
            onClick={handleRetry}
            className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Forcer le chargement
          </button>
        </div>
      </div>
    );
  }

  // Redirection en cas de timeout sans showPageOnTimeout
  if (permissionTimeout && !showPageOnTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md w-full mx-4">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Timeout des Permissions</h3>
          <p className="text-gray-600 mb-6">
            La vérification des permissions Firebase a pris trop de temps. 
            Cela peut être dû à un problème de connectivité.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer la Connexion
            </button>
            
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Retour à la Connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Afficher un avertissement si en mode hors ligne mais permettre l'accès
  if (error && error.includes('hors ligne') && profile) {
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
  
  // Vérification des rôles avec gestion d'erreur
  if (profile) {
    try {
      const hasRequiredRole = hasRole(profile.role, allowedRoles);
      if (!hasRequiredRole) {
        return <Navigate to={redirectTo} replace />;
      }
    } catch (roleError) {
      console.error('Erreur lors de la vérification des rôles:', roleError);
      
      // En cas d'erreur de vérification des rôles, afficher la page avec avertissement
      if (showPageOnTimeout) {
        return (
          <div className="min-h-screen bg-gray-50">
            <div className="bg-red-50 border-b border-red-200 p-3">
              <div className="flex items-center justify-center space-x-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Erreur de vérification des permissions - Accès en mode dégradé
                </span>
              </div>
            </div>
            {children}
          </div>
        );
      } else {
        return <Navigate to={redirectTo} replace />;
      }
    }
  }
  
  // Rediriger vers la page de login si l'utilisateur n'est pas connecté
  if (!profile && !loading && !permissionTimeout) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

// Styles CSS pour l'animation de la barre de progression
const progressKeyframes = `
  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }
`;

// Injecter les styles dans le document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = progressKeyframes;
  document.head.appendChild(style);
}