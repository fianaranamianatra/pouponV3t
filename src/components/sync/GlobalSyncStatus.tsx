import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle, AlertTriangle, RefreshCw, Activity, Users, DollarSign } from 'lucide-react';
import { BidirectionalSyncService, SyncStatus } from '../../lib/services/bidirectionalSync';
import { usePayrollSalarySync } from '../../hooks/usePayrollSalarySync';

interface GlobalSyncStatusProps {
  className?: string;
  compact?: boolean;
}

export function GlobalSyncStatus({ className = '', compact = false }: GlobalSyncStatusProps) {
  const payrollSyncData = usePayrollSalarySync();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [healthCheck, setHealthCheck] = useState<any>(null);

  useEffect(() => {
    // Charger le statut initial
    const loadStatus = () => {
      const status = BidirectionalSyncService.getSyncStatus();
      const health = BidirectionalSyncService.healthCheck();
      setSyncStatus(status);
      setHealthCheck(health);
    };

    loadStatus();

    // Écouter les événements de synchronisation globale
    const handleSyncUpdate = () => {
      loadStatus();
    };

    window.addEventListener('globalSyncInitialized', handleSyncUpdate);
    window.addEventListener('studentPaymentUpdate', handleSyncUpdate);
    window.addEventListener('payrollSalarySyncInitialized', handleSyncUpdate);
    window.addEventListener('payrollSalarySync', handleSyncUpdate);

    // Actualiser périodiquement
    const interval = setInterval(loadStatus, 30000); // Toutes les 30 secondes

    return () => {
      window.removeEventListener('globalSyncInitialized', handleSyncUpdate);
      window.removeEventListener('studentPaymentUpdate', handleSyncUpdate);
      window.removeEventListener('payrollSalarySyncInitialized', handleSyncUpdate);
      window.removeEventListener('payrollSalarySync', handleSyncUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleRestart = async () => {
    try {
      await BidirectionalSyncService.restart();
      alert('✅ Synchronisations redémarrées avec succès');
    } catch (error: any) {
      alert('❌ Erreur lors du redémarrage: ' + error.message);
    }
  };

  if (!syncStatus) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Chargement du statut...</span>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
        healthCheck?.isHealthy 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      } ${className}`}>
        {healthCheck?.isHealthy ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <AlertTriangle className="w-3 h-3" />
        )}
        <span>
          {healthCheck?.isHealthy ? 'Sync Active' : 'Sync Issues'}
        </span>
        <span className="text-gray-600">({syncStatus.activeConnections})</span>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Statut de Synchronisation Globale</h3>
          {healthCheck?.isHealthy ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          )}
        </div>
        
        <button
          onClick={handleRestart}
          className="inline-flex items-center px-2 py-1 text-xs border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors"
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Redémarrer
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Activity className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-900">Connexions</span>
          </div>
          <p className="text-xl font-bold text-blue-600">{syncStatus.activeConnections}</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Enregistrements</span>
          </div>
          <p className="text-xl font-bold text-green-600">{syncStatus.totalSyncedRecords}</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-gray-900">Erreurs</span>
          </div>
          <p className="text-xl font-bold text-red-600">{syncStatus.errors.length}</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">Paie ↔ Salaires</span>
          </div>
          <p className="text-xl font-bold text-purple-600">
            {payrollSyncData.syncStatus.activeConnections}
          </p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Statut:</span>
          <span className={`font-medium ${syncStatus.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {syncStatus.isActive ? 'Actif' : 'Inactif'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Dernière synchronisation:</span>
          <span className="font-medium text-gray-900">
            {syncStatus.lastSyncTime.toLocaleTimeString('fr-FR')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Sync Paie ↔ Salaires:</span>
          <span className={`font-medium ${payrollSyncData.syncStatus.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {payrollSyncData.syncStatus.isActive ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>

      {healthCheck && !healthCheck.isHealthy && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium text-yellow-800 mb-2">Problèmes Détectés</h4>
          <ul className="text-yellow-700 text-sm space-y-1">
            {healthCheck.issues.map((issue: string, index: number) => (
              <li key={index}>• {issue}</li>
            ))}
          </ul>
          {healthCheck.recommendations.length > 0 && (
            <div className="mt-2">
              <h5 className="font-medium text-yellow-800 text-xs">Recommandations:</h5>
              <ul className="text-yellow-700 text-xs space-y-1 mt-1">
                {healthCheck.recommendations.map((rec: string, index: number) => (
                  <li key={index}>→ {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}