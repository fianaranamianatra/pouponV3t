// Indicateur de synchronisation centralisée pour les enregistrements individuels
import React from 'react';
import { Link2, CheckCircle, AlertTriangle, RefreshCw, TrendingUp, TrendingDown, Eye } from 'lucide-react';

interface CentralizedSyncIndicatorProps {
  module: 'ecolage' | 'salary';
  recordId: string;
  recordName: string;
  amount: number;
  className?: string;
  showDetails?: boolean;
}

export function CentralizedSyncIndicator({ 
  module, 
  recordId, 
  recordName, 
  amount, 
  className = '',
  showDetails = false
}: CentralizedSyncIndicatorProps) {
  const [syncStatus, setSyncStatus] = React.useState<'synced' | 'syncing' | 'error' | 'pending'>('pending');
  const [transactionId, setTransactionId] = React.useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    // Écouter les événements de synchronisation pour cet enregistrement
    const handleSyncEvent = (event: CustomEvent) => {
      const detail = event.detail;
      
      if (
        (module === 'ecolage' && detail.paymentId === recordId) ||
        (module === 'salary' && detail.salaryId === recordId)
      ) {
        setSyncStatus('synced');
        setLastSyncTime(new Date(detail.syncTime));
        setTransactionId(detail.transactionId);
      }
    };

    const handleSyncError = (event: CustomEvent) => {
      const detail = event.detail;
      
      if (
        (module === 'ecolage' && detail.paymentId === recordId) ||
        (module === 'salary' && detail.salaryId === recordId)
      ) {
        setSyncStatus('error');
      }
    };

    // Écouter les événements appropriés selon le module
    if (module === 'ecolage') {
      window.addEventListener('ecolageToTransactionSync', handleSyncEvent as EventListener);
    } else {
      window.addEventListener('salaryToTransactionSync', handleSyncEvent as EventListener);
    }
    
    window.addEventListener('centralizationSyncError', handleSyncError as EventListener);

    // Vérifier le statut initial
    checkInitialStatus();

    return () => {
      if (module === 'ecolage') {
        window.removeEventListener('ecolageToTransactionSync', handleSyncEvent as EventListener);
      } else {
        window.removeEventListener('salaryToTransactionSync', handleSyncEvent as EventListener);
      }
      window.removeEventListener('centralizationSyncError', handleSyncError as EventListener);
    };
  }, [module, recordId]);

  const checkInitialStatus = async () => {
    try {
      // Vérifier si une transaction existe déjà pour cet enregistrement
      // Note: Dans une vraie implémentation, on ferait un appel API
      setSyncStatus('synced');
      setLastSyncTime(new Date());
    } catch (error) {
      setSyncStatus('error');
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Link2 className="w-4 h-4 text-gray-400" />;
      default:
        return <Link2 className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (syncStatus) {
      case 'synced':
        return 'Centralisé';
      case 'syncing':
        return 'Centralisation...';
      case 'error':
        return 'Erreur';
      case 'pending':
        return 'En attente';
      default:
        return 'Inconnu';
    }
  };

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'synced':
        return 'text-green-600';
      case 'syncing':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      case 'pending':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getModuleIcon = () => {
    return module === 'ecolage' ? (
      <TrendingUp className="w-3 h-3 text-green-500" />
    ) : (
      <TrendingDown className="w-3 h-3 text-red-500" />
    );
  };

  const getTransactionType = () => {
    return module === 'ecolage' ? 'Encaissement' : 'Décaissement';
  };

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        {getModuleIcon()}
        {getStatusIcon()}
        <span className={`text-xs font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      {showDetails && syncStatus === 'synced' && (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>→</span>
          <span className={module === 'ecolage' ? 'text-green-600' : 'text-red-600'}>
            {getTransactionType()}
          </span>
          <span>{amount.toLocaleString()} Ar</span>
        </div>
      )}
      
      {lastSyncTime && syncStatus === 'synced' && (
        <span className="text-xs text-gray-500">
          {lastSyncTime.toLocaleTimeString('fr-FR')}
        </span>
      )}

      {transactionId && (
        <button
          onClick={() => {
            // Naviguer vers la transaction dans le module Encaissements et Décaissements
            alert(`Transaction centralisée: ${transactionId}\nType: ${getTransactionType()}\nMontant: ${amount.toLocaleString()} Ar`);
          }}
          className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
          title="Voir la transaction centralisée"
        >
          <Eye className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}