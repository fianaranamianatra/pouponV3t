// Hook personnalisé pour la synchronisation financière centralisée
import { useState, useEffect } from 'react';
import { CentralizedFinancialSyncService, CentralizedSyncStatus } from '../lib/services/centralizedFinancialSync';

export interface CentralizedFinancialSyncData {
  syncStatus: CentralizedSyncStatus;
  isInitialized: boolean;
  lastSyncEvent?: any;
  loading: boolean;
  error: string | null;
  stats?: {
    totalTransactions: number;
    ecolageTransactions: number;
    salaryTransactions: number;
    manualTransactions: number;
    totalEncaissements: number;
    totalDecaissements: number;
    soldeNet: number;
  };
}

export function useCentralizedFinancialSync() {
  const [syncData, setSyncData] = useState<CentralizedFinancialSyncData>({
    syncStatus: {
      isActive: false,
      activeListeners: 0,
      lastSyncTime: new Date(),
      totalSyncedRecords: 0,
      ecolageSync: {
        active: false,
        recordsProcessed: 0
      },
      salarySync: {
        active: false,
        recordsProcessed: 0
      },
      errors: []
    },
    isInitialized: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    console.log('🔄 Initialisation du hook de synchronisation centralisée');

    // Initialiser la synchronisation
    const initializeSync = async () => {
      try {
        const result = await CentralizedFinancialSyncService.initializeCentralizedSync();
        const stats = await CentralizedFinancialSyncService.getCentralizationStats();
        
        setSyncData(prev => ({
          ...prev,
          syncStatus: CentralizedFinancialSyncService.getSyncStatus(),
          isInitialized: result.success,
          loading: false,
          error: result.errors.length > 0 ? result.errors.join(', ') : null,
          stats
        }));

        console.log('✅ Synchronisation centralisée initialisée');
      } catch (error: any) {
        setSyncData(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    initializeSync();

    // Écouter les événements de synchronisation
    const handleEcolageSync = (event: CustomEvent) => {
      console.log('📊 Événement de synchronisation écolage reçu:', event.detail);
      setSyncData(prev => ({
        ...prev,
        lastSyncEvent: event.detail,
        syncStatus: CentralizedFinancialSyncService.getSyncStatus()
      }));
    };

    const handleSalarySync = (event: CustomEvent) => {
      console.log('📊 Événement de synchronisation salaire reçu:', event.detail);
      setSyncData(prev => ({
        ...prev,
        lastSyncEvent: event.detail,
        syncStatus: CentralizedFinancialSyncService.getSyncStatus()
      }));
    };

    const handleSyncInitialized = () => {
      setSyncData(prev => ({
        ...prev,
        syncStatus: CentralizedFinancialSyncService.getSyncStatus(),
        isInitialized: true
      }));
    };

    // Écouter les événements personnalisés
    window.addEventListener('ecolageToTransactionSync', handleEcolageSync as EventListener);
    window.addEventListener('salaryToTransactionSync', handleSalarySync as EventListener);
    window.addEventListener('centralizedFinancialSyncInitialized', handleSyncInitialized);

    // Actualiser les statistiques périodiquement
    const statsInterval = setInterval(async () => {
      try {
        const stats = await CentralizedFinancialSyncService.getCentralizationStats();
        setSyncData(prev => ({
          ...prev,
          stats,
          syncStatus: CentralizedFinancialSyncService.getSyncStatus()
        }));
      } catch (error) {
        console.error('Erreur lors de la mise à jour des statistiques:', error);
      }
    }, 30000); // Toutes les 30 secondes

    return () => {
      console.log('🧹 Nettoyage du hook de synchronisation centralisée');
      window.removeEventListener('ecolageToTransactionSync', handleEcolageSync as EventListener);
      window.removeEventListener('salaryToTransactionSync', handleSalarySync as EventListener);
      window.removeEventListener('centralizedFinancialSyncInitialized', handleSyncInitialized);
      clearInterval(statsInterval);
      CentralizedFinancialSyncService.cleanup();
    };
  }, []);

  // Fonctions utilitaires
  const restart = async () => {
    setSyncData(prev => ({ ...prev, loading: true }));
    try {
      await CentralizedFinancialSyncService.restart();
      const stats = await CentralizedFinancialSyncService.getCentralizationStats();
      setSyncData(prev => ({
        ...prev,
        syncStatus: CentralizedFinancialSyncService.getSyncStatus(),
        stats,
        loading: false,
        error: null
      }));
    } catch (error: any) {
      setSyncData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  const syncAllExistingData = async () => {
    try {
      const result = await CentralizedFinancialSyncService.syncAllExistingData();
      const stats = await CentralizedFinancialSyncService.getCentralizationStats();
      setSyncData(prev => ({
        ...prev,
        syncStatus: CentralizedFinancialSyncService.getSyncStatus(),
        stats
      }));
      return result;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const validateCentralization = async () => {
    try {
      return await CentralizedFinancialSyncService.validateCentralization();
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const repairCentralization = async () => {
    try {
      const result = await CentralizedFinancialSyncService.repairCentralization();
      const stats = await CentralizedFinancialSyncService.getCentralizationStats();
      setSyncData(prev => ({
        ...prev,
        syncStatus: CentralizedFinancialSyncService.getSyncStatus(),
        stats
      }));
      return result;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const healthCheck = () => {
    return CentralizedFinancialSyncService.healthCheck();
  };

  return {
    ...syncData,
    restart,
    syncAllExistingData,
    validateCentralization,
    repairCentralization,
    healthCheck
  };
}