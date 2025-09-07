// Service de déduplication automatique pour les transactions financières
import { TransactionDeduplicationService } from './transactionDeduplicationService';

export interface AutoDeduplicationConfig {
  enabled: boolean;
  checkInterval: number; // en millisecondes
  maxDuplicatesBeforeAlert: number;
  silentMode: boolean;
}

export class AutomaticDeduplicationService {
  private static config: AutoDeduplicationConfig = {
    enabled: true,
    checkInterval: 30000, // 30 secondes
    maxDuplicatesBeforeAlert: 5,
    silentMode: false
  };

  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  /**
   * Démarrer la déduplication automatique
   */
  static start(config?: Partial<AutoDeduplicationConfig>): void {
    if (this.isRunning) {
      console.log('⚠️ Déduplication automatique déjà en cours');
      return;
    }

    // Appliquer la configuration personnalisée
    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (!this.config.enabled) {
      console.log('ℹ️ Déduplication automatique désactivée');
      return;
    }

    console.log('🚀 Démarrage de la déduplication automatique');
    console.log('⚙️ Configuration:', this.config);

    this.isRunning = true;

    // Première vérification immédiate
    this.performDeduplicationCheck();

    // Programmer les vérifications périodiques
    this.intervalId = setInterval(() => {
      this.performDeduplicationCheck();
    }, this.config.checkInterval);

    console.log(`✅ Déduplication automatique démarrée (vérification toutes les ${this.config.checkInterval / 1000}s)`);
  }

  /**
   * Arrêter la déduplication automatique
   */
  static stop(): void {
    if (!this.isRunning) {
      console.log('ℹ️ Déduplication automatique déjà arrêtée');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log('🛑 Déduplication automatique arrêtée');
  }

  /**
   * Effectuer une vérification et suppression des doublons
   */
  private static async performDeduplicationCheck(): Promise<void> {
    try {
      console.log('🔍 Vérification automatique des doublons...');

      // Analyser les doublons
      const analysis = await TransactionDeduplicationService.analyzeDuplicates();

      if (analysis.duplicatesFound === 0) {
        console.log('✅ Aucun doublon détecté');
        return;
      }

      console.log(`⚠️ ${analysis.duplicatesFound} doublon(s) détecté(s) dans ${analysis.duplicateGroups.length} groupe(s)`);

      // Alerter si trop de doublons (sauf en mode silencieux)
      if (analysis.duplicatesFound > this.config.maxDuplicatesBeforeAlert && !this.config.silentMode) {
        this.showDuplicateAlert(analysis.duplicatesFound);
      }

      // Supprimer automatiquement les doublons
      const result = await TransactionDeduplicationService.removeDuplicates();

      if (result.success && result.duplicatesRemoved > 0) {
        console.log(`✅ Suppression automatique réussie: ${result.duplicatesRemoved} doublon(s) supprimé(s)`);
        
        // Notification visuelle discrète
        this.showSuccessNotification(result.duplicatesRemoved);
        
        // Émettre un événement pour notifier les composants
        window.dispatchEvent(new CustomEvent('automaticDeduplicationCompleted', {
          detail: {
            duplicatesRemoved: result.duplicatesRemoved,
            uniqueTransactionsKept: result.uniqueTransactionsKept,
            timestamp: new Date()
          }
        }));
      } else if (result.errors.length > 0) {
        console.error('❌ Erreurs lors de la suppression automatique:', result.errors);
        
        if (!this.config.silentMode) {
          this.showErrorNotification(result.errors.length);
        }
      }

    } catch (error: any) {
      console.error('❌ Erreur lors de la vérification automatique:', error);
      
      if (!this.config.silentMode) {
        this.showErrorNotification(1);
      }
    }
  }

  /**
   * Afficher une alerte pour un nombre élevé de doublons
   */
  private static showDuplicateAlert(duplicateCount: number): void {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'fixed top-4 right-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm';
    alertDiv.innerHTML = `
      <div class="flex items-start space-x-3">
        <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <div>
          <h4 class="font-medium text-yellow-800">Doublons Détectés</h4>
          <p class="text-sm text-yellow-700 mt-1">
            ${duplicateCount} transaction(s) en double détectée(s). 
            Suppression automatique en cours...
          </p>
        </div>
      </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Supprimer l'alerte après 8 secondes
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 8000);
  }

  /**
   * Afficher une notification de succès
   */
  private static showSuccessNotification(duplicatesRemoved: number): void {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-100 border border-green-300 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-sm font-medium">🤖 ${duplicatesRemoved} doublon(s) supprimé(s) automatiquement</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer la notification après 5 secondes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  /**
   * Afficher une notification d'erreur
   */
  private static showErrorNotification(errorCount: number): void {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-sm font-medium">❌ ${errorCount} erreur(s) de déduplication</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer la notification après 7 secondes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 7000);
  }

  /**
   * Forcer une vérification immédiate
   */
  static async forceCheck(): Promise<{
    duplicatesFound: number;
    duplicatesRemoved: number;
    errors: string[];
  }> {
    try {
      console.log('🔄 Vérification forcée des doublons...');

      const analysis = await TransactionDeduplicationService.analyzeDuplicates();
      
      if (analysis.duplicatesFound === 0) {
        return {
          duplicatesFound: 0,
          duplicatesRemoved: 0,
          errors: []
        };
      }

      const result = await TransactionDeduplicationService.removeDuplicates();
      
      return {
        duplicatesFound: analysis.duplicatesFound,
        duplicatesRemoved: result.duplicatesRemoved,
        errors: result.errors
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de la vérification forcée:', error);
      return {
        duplicatesFound: 0,
        duplicatesRemoved: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Obtenir le statut de la déduplication automatique
   */
  static getStatus(): {
    isRunning: boolean;
    config: AutoDeduplicationConfig;
    lastCheck?: Date;
  } {
    return {
      isRunning: this.isRunning,
      config: { ...this.config },
      lastCheck: new Date() // Dans une vraie implémentation, on stockerait la vraie date
    };
  }

  /**
   * Mettre à jour la configuration
   */
  static updateConfig(newConfig: Partial<AutoDeduplicationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Configuration de déduplication mise à jour:', this.config);

    // Redémarrer si nécessaire
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Nettoyer les ressources
   */
  static cleanup(): void {
    this.stop();
    console.log('🧹 Service de déduplication automatique nettoyé');
  }
}