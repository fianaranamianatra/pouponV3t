// Service de gestion du mode hors ligne pour Firebase
import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { db } from '../firebase';

export class OfflineHandler {
  private static isOnline = navigator.onLine;
  private static listeners: Set<(isOnline: boolean) => void> = new Set();

  static initialize() {
    // Écouter les changements de connectivité
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Vérifier l'état initial
    this.updateConnectionStatus(navigator.onLine);
  }

  private static handleOnline() {
    console.log('🌐 Connexion internet rétablie');
    this.updateConnectionStatus(true);
    
    // Tenter de reconnecter Firestore
    enableNetwork(db)
      .then(() => {
        console.log('✅ Firestore reconnecté');
      })
      .catch((error) => {
        console.warn('⚠️ Erreur lors de la reconnexion Firestore:', error);
      });
  }

  private static handleOffline() {
    console.log('📡 Connexion internet perdue');
    this.updateConnectionStatus(false);
  }

  private static updateConnectionStatus(isOnline: boolean) {
    this.isOnline = isOnline;
    
    // Notifier tous les listeners
    this.listeners.forEach(listener => {
      try {
        listener(isOnline);
      } catch (error) {
        console.error('Erreur dans le listener de connectivité:', error);
      }
    });
  }

  static getConnectionStatus(): boolean {
    return this.isOnline;
  }

  static addConnectionListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    
    // Retourner une fonction de nettoyage
    return () => {
      this.listeners.delete(listener);
    };
  }

  static async forceOfflineMode(): Promise<void> {
    try {
      await disableNetwork(db);
      console.log('🔌 Mode hors ligne forcé');
    } catch (error) {
      console.error('Erreur lors du passage en mode hors ligne:', error);
    }
  }

  static async forceOnlineMode(): Promise<void> {
    try {
      await enableNetwork(db);
      console.log('🌐 Mode en ligne forcé');
    } catch (error) {
      console.error('Erreur lors du passage en mode en ligne:', error);
    }
  }

  static cleanup() {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    this.listeners.clear();
  }
}

// Initialiser automatiquement
OfflineHandler.initialize();