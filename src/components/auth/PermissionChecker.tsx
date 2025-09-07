import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, RefreshCw, Clock, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { hasRole, hasPermission } from '../../lib/roles';

interface PermissionCheckerProps {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showStatus?: boolean;
  timeout?: number;
}

export function PermissionChecker({
  requiredRoles = [],
  requiredPermissions = [],
  children,
  fallback = null,
  showStatus = false,
  timeout = 8000
}: PermissionCheckerProps) {
  const { user, profile, loading, error, permissionTimeout } = useAuth();
  const [checkStatus, setCheckStatus] = useState<'checking' | 'success' | 'failed' | 'timeout'>('checking');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (profile) {
        // Vérifier les permissions
        const hasRequiredRole = requiredRoles.length === 0 || hasRole(profile.role, requiredRoles);
        const hasRequiredPermissions = requiredPermissions.length === 0 || 
          requiredPermissions.every(permission => hasPermission(profile.role, permission));

        if (hasRequiredRole && hasRequiredPermissions) {
          setCheckStatus('success');
        } else {
          setCheckStatus('failed');
        }
      } else if (permissionTimeout) {
        setCheckStatus('timeout');
      } else if (error) {
        setCheckStatus('failed');
      }
    }
  }, [user, profile, loading, error, permissionTimeout, requiredRoles, requiredPermissions]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setCheckStatus('checking');
    window.location.reload();
  };

  // Afficher le statut si demandé
  if (showStatus) {
    return (
      <div className="space-y-4">
        {/* Status Banner */}
        <div className={`border rounded-lg p-4 ${
          checkStatus === 'success' ? 'bg-green-50 border-green-200' :
          checkStatus === 'failed' ? 'bg-red-50 border-red-200' :
          checkStatus === 'timeout' ? 'bg-yellow-50 border-yellow-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {checkStatus === 'checking' && (
                <>
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <p className="font-medium text-blue-800">Vérification des permissions</p>
                    <p className="text-blue-600 text-sm">Connexion à Firebase...</p>
                  </div>
                </>
              )}
              
              {checkStatus === 'success' && (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Permissions validées</p>
                    <p className="text-green-600 text-sm">Accès autorisé</p>
                  </div>
                </>
              )}
              
              {checkStatus === 'failed' && (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Permissions insuffisantes</p>
                    <p className="text-red-600 text-sm">Accès refusé</p>
                  </div>
                </>
              )}
              
              {checkStatus === 'timeout' && (
                <>
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Timeout des permissions</p>
                    <p className="text-yellow-600 text-sm">Connexion lente, mode dégradé activé</p>
                  </div>
                </>
              )}
            </div>
            
            {(checkStatus === 'failed' || checkStatus === 'timeout') && (
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {(checkStatus === 'success' || (checkStatus === 'timeout' && permissionTimeout)) ? (
          children
        ) : checkStatus === 'failed' ? (
          fallback || (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-800 mb-2">Accès Refusé</h3>
              <p className="text-red-600">Vous n'avez pas les permissions nécessaires pour accéder à cette section.</p>
            </div>
          )
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-blue-700">Vérification en cours...</p>
          </div>
        )}
      </div>
    );
  }

  // Mode silencieux - juste retourner le contenu ou fallback
  if (checkStatus === 'success' || (checkStatus === 'timeout' && permissionTimeout)) {
    return <>{children}</>;
  } else if (checkStatus === 'failed') {
    return <>{fallback}</>;
  } else {
    // En cours de vérification
    return <>{children}</>;
  }
}

export default PermissionChecker;