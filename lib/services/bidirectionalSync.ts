// Service de synchronisation bidirectionnelle centralisé
import { StudentEcolageSyncService } from './studentEcolageSync';
import { PayrollSalarySyncService } from './payrollSalarySync';

export interface SyncStatus {
  isActive: boolean;
  activeConnections: number;
  lastSyncTime: Date;
  totalSyncedRecords: number;
  errors: string[];
}

export class BidirectionalSyncService {
  private static syncStatus: SyncStatus = {
    isActive: false,
    activeConnections: 0,
    lastSyncTime: new Date(),
    totalSyncedRecords: 0,
    errors: []
  };

  /**
   * Initialiser toutes les synchronisations bidirectionnelles
   */
  static async initializeAllSync(): Promise<void> {
    try {
      console.log('🚀 Initialisation de toutes les synchronisations bidirectionnelles');
      
      // Initialiser la synchronisation Écolage ↔ Profils Étudiants
      const ecolageResult = await StudentEcolageSyncService.syncAllStudentProfiles();
      
      // Initialiser la synchronisation Paie ↔ Salaires
      const payrollResult = await PayrollSalarySyncService.initializeGlobalSync();
      
      this.syncStatus = {
        isActive: true,
        activeConnections: (ecolageResult?.syncedRecords || 0) + (payrollResult?.syncedRecords || 0),
        lastSyncTime: new Date(),
        totalSyncedRecords: (ecolageResult?.syncedRecords || 0) + (payrollResult?.syncedRecords || 0),
        errors: [...(ecolageResult?.errors || []), ...(payrollResult?.errors || [])]
      };

      console.log('✅ Synchronisations bidirectionnelles initialisées:', this.syncStatus);
      
      // Émettre un événement global de synchronisation
      window.dispatchEvent(new CustomEvent('globalSyncInitialized', {
        detail: this.syncStatus
      }));
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'initialisation des synchronisations:', error);
      this.syncStatus.errors.push(error.message);
    }
  }

  /**
   * Obtenir le statut de synchronisation global
   */
  static getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Nettoyer toutes les synchronisations
   */
  static cleanup(): void {
    console.log('🧹 Nettoyage de toutes les synchronisations bidirectionnelles');
    
    StudentEcolageSyncService.cleanup();
    PayrollSalarySyncService.cleanup();
    
    this.syncStatus = {
      isActive: false,
      activeConnections: 0,
      lastSyncTime: new Date(),
      totalSyncedRecords: 0,
      errors: []
    };
  }

  /**
   * Redémarrer toutes les synchronisations
   */
  static async restart(): Promise<void> {
    console.log('🔄 Redémarrage de toutes les synchronisations bidirectionnelles');
    
    this.cleanup();
    await this.initializeAllSync();
    await PayrollSalarySyncService.syncHierarchyChanges();
  }

  /**
   * Vérifier la santé des synchronisations
   */
  static healthCheck(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!this.syncStatus.isActive) {
      issues.push('Synchronisation inactive');
      recommendations.push('Redémarrer les synchronisations');
    }

    if (this.syncStatus.errors.length > 0) {
      issues.push(`${this.syncStatus.errors.length} erreur(s) détectée(s)`);
      recommendations.push('Vérifier les logs d\'erreur');
    }

    if (this.syncStatus.activeConnections === 0) {
      issues.push('Aucune connexion active');
      recommendations.push('Vérifier la connectivité Firebase');
    }

    const timeSinceLastSync = Date.now() - this.syncStatus.lastSyncTime.getTime();
    if (timeSinceLastSync > 300000) { // 5 minutes
      issues.push('Dernière synchronisation trop ancienne');
      recommendations.push('Redémarrer les synchronisations');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations
    };
  }
}