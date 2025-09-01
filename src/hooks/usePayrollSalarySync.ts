// Hook personnalisé pour la synchronisation Paie ↔ Salaires
import { useState, useEffect } from 'react';
import { PayrollSalarySyncService, SyncStatus } from '../lib/services/payrollSalarySync';

export interface PayrollSalarySyncData {
  syncStatus: SyncStatus;
  isInitialized: boolean;
  lastSyncEvent?: any;
  loading: boolean;
  error: string | null;
}

export function usePayrollSalarySync() {
  const [syncData, setSyncData] = useState<PayrollSalarySyncData>({
    syncStatus: {
      isActive: false,
      activeConnections: 0,
      lastSyncTime: new Date(),
      totalSyncedRecords: 0,
      errors: []
    },
    isInitialized: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    console.log('🔄 Initialisation du hook de synchronisation Paie ↔ Salaires');

    // Initialiser la synchronisation
    const initializeSync = async () => {
      try {
        const result = await PayrollSalarySyncService.initializeGlobalSync();
        await PayrollSalarySyncService.syncHierarchyChanges();
        
        setSyncData(prev => ({
          ...prev,
          syncStatus: PayrollSalarySyncService.getSyncStatus(),
          isInitialized: result.success,
          loading: false,
          error: result.errors.length > 0 ? result.errors.join(', ') : null
        }));

        console.log('✅ Synchronisation Paie ↔ Salaires initialisée');
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
    const handleSyncEvent = (event: CustomEvent) => {
      console.log('📊 Événement de synchronisation reçu:', event.detail);
      setSyncData(prev => ({
        ...prev,
        lastSyncEvent: event.detail,
        syncStatus: PayrollSalarySyncService.getSyncStatus()
      }));
    };

    const handleSyncInitialized = () => {
      setSyncData(prev => ({
        ...prev,
        syncStatus: PayrollSalarySyncService.getSyncStatus(),
        isInitialized: true
      }));
    };

    // Écouter les événements personnalisés
    window.addEventListener('payrollSalarySync', handleSyncEvent as EventListener);
    window.addEventListener('hierarchySalarySync', handleSyncEvent as EventListener);
    window.addEventListener('payrollSalarySyncInitialized', handleSyncInitialized);

    // Actualiser le statut périodiquement
    const statusInterval = setInterval(() => {
      setSyncData(prev => ({
        ...prev,
        syncStatus: PayrollSalarySyncService.getSyncStatus()
      }));
    }, 30000); // Toutes les 30 secondes

    return () => {
      console.log('🧹 Nettoyage du hook de synchronisation');
      window.removeEventListener('payrollSalarySync', handleSyncEvent as EventListener);
      window.removeEventListener('hierarchySalarySync', handleSyncEvent as EventListener);
      window.removeEventListener('payrollSalarySyncInitialized', handleSyncInitialized);
      clearInterval(statusInterval);
      PayrollSalarySyncService.cleanup();
    };
  }, []);

  // Fonctions utilitaires
  const restart = async () => {
    setSyncData(prev => ({ ...prev, loading: true }));
    try {
      await PayrollSalarySyncService.restart();
      setSyncData(prev => ({
        ...prev,
        syncStatus: PayrollSalarySyncService.getSyncStatus(),
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

  const syncSpecificEmployee = async (employeeId: string) => {
    try {
      await PayrollSalarySyncService.syncSpecificEmployee(employeeId);
      setSyncData(prev => ({
        ...prev,
        syncStatus: PayrollSalarySyncService.getSyncStatus()
      }));
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const calculateAndSyncAll = async () => {
    setSyncData(prev => ({ ...prev, loading: true }));
    try {
      const result = await PayrollSalarySyncService.calculateAndSyncAllPayroll();
      setSyncData(prev => ({
        ...prev,
        syncStatus: PayrollSalarySyncService.getSyncStatus(),
        loading: false,
        error: result.errors.length > 0 ? result.errors.join(', ') : null
      }));
      return result;
    } catch (error: any) {
      setSyncData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      throw error;
    }
  };

  const healthCheck = () => {
    return PayrollSalarySyncService.healthCheck();
  };

  return {
    ...syncData,
    restart,
    syncSpecificEmployee,
    calculateAndSyncAll,
    healthCheck
  };
}