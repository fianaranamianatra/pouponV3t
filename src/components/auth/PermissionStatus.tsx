import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, RefreshCw, Clock, Wifi, WifiOff, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { PermissionManager } from '../../lib/firebase/permissionManager';

interface PermissionStatusProps {
  className?: string;
  compact?: boolean;
  showDiagnostic?: boolean;
}

export function PermissionStatus({ 
  className = '', 
  compact = false, 
  showDiagnostic = false 
}: PermissionStatusProps) {
  const { user, profile, loading, error, permissionTimeout } = useAuth();
  const [diagnostic, setDiagnostic] = useState<any>(null);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);

  useEffect(() => {
    // Vérifier la connexion Firebase au montage
    const checkConnection = async () => {
      try {
        const status = await PermissionManager.checkFirebaseConnection();
        setConnectionStatus(status);
      } catch (error) {
        console.error('Erreur lors de la vérification de connexion:', error);
      }
    };

    checkConnection();
  }, []);

  const runDiagnostic = async () => {
    if (!user) return;
    
    setIsRunningDiagnostic(true);
    try {
      const result = await PermissionManager.diagnosePermissionIssues(user.uid);
      setDiagnostic(result);
    } catch (error) {
      console.error('Erreur lors du diagnostic:', error);
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  const getStatusConfig = () => {
    if (loading) {
      return {
        color: 'bg-blue-50 border-blue-200',
        textColor: 'text-blue-800',
        icon: <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />,
        label: 'Vérification...',
        description: 'Connexion à Firebase'
      };
    }

    if (permissionTimeout) {
      return {
        color: 'bg-yellow-50 border-yellow-200',
        textColor: 'text-yellow-800',
        icon: <Clock className="w-4 h-4 text-yellow-600" />,
        label: 'Timeout',
        description: 'Connexion lente, mode dégradé'
      };
    }

    if (profile) {
      return {
        color: 'bg-green-50 border-green-200',
        textColor: 'text-green-800',
        icon: <CheckCircle className="w-4 h-4 text-green-600" />,
        label: 'Connecté',
        description: `Rôle: ${profile.role}`
      };
    }

    if (error) {
      return {
        color: 'bg-red-50 border-red-200',
        textColor: 'text-red-800',
        icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
        label: 'Erreur',
        description: 'Problème de connexion'
      };
    }

    return {
      color: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-800',
      icon: <Shield className="w-4 h-4 text-gray-600" />,
      label: 'Inconnu',
      description: 'État indéterminé'
    };
  };

  const statusConfig = getStatusConfig();

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs border ${statusConfig.color} ${className}`}>
        {statusConfig.icon}
        <span className={statusConfig.textColor}>{statusConfig.label}</span>
        {connectionStatus && (
          <span className="text-gray-500">
            ({connectionStatus.latency}ms)
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${statusConfig.color} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {statusConfig.icon}
          <div>
            <h4 className={`font-medium ${statusConfig.textColor}`}>
              Statut des Permissions
            </h4>
            <p className={`text-sm ${statusConfig.textColor} opacity-80`}>
              {statusConfig.description}
            </p>
          </div>
        </div>
        
        {showDiagnostic && (
          <button
            onClick={runDiagnostic}
            disabled={isRunningDiagnostic}
            className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Settings className={`w-3 h-3 mr-1 ${isRunningDiagnostic ? 'animate-spin' : ''}`} />
            Diagnostic
          </button>
        )}
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center space-x-2">
            {connectionStatus.isConnected ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            <span className={connectionStatus.isConnected ? 'text-green-700' : 'text-red-700'}>
              {connectionStatus.isConnected ? 'Firebase connecté' : 'Firebase déconnecté'}
            </span>
          </div>
          <span className="text-gray-600">
            {connectionStatus.latency}ms
          </span>
        </div>
      )}

      {/* User Info */}
      {profile && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Utilisateur:</span>
            <span className="font-medium">{profile.firstName} {profile.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{profile.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Rôle:</span>
            <span className="font-medium">{profile.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Permissions:</span>
            <span className="font-medium">{profile.permissions?.length || 0}</span>
          </div>
        </div>
      )}

      {/* Error Details */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
          <p className="text-red-800 font-medium">Erreur détectée:</p>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Diagnostic Results */}
      {diagnostic && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded">
          <h5 className="font-medium text-gray-900 mb-2 text-sm">Diagnostic</h5>
          
          {diagnostic.issues.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-red-800">Problèmes:</p>
              <ul className="text-xs text-red-700 mt-1 space-y-1">
                {diagnostic.issues.map((issue: string, index: number) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
          
          {diagnostic.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-medium text-blue-800">Recommandations:</p>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                {diagnostic.recommendations.map((rec: string, index: number) => (
                  <li key={index}>→ {rec}</li>
                ))}
              </ul>
            </div>
          )}
          
          {diagnostic.canRetry && (
            <button
              onClick={() => window.location.reload()}
              className="mt-2 w-full px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3 mr-1 inline" />
              Réessayer
            </button>
          )}
        </div>
      )}
    </div>
  );
}