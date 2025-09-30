// Hook personnalisé pour la déduplication automatique
import { useState, useEffect } from 'react';
import { AutomaticDeduplicationService } from '../lib/services/automaticDeduplication';

export interface AutoDeduplicationData {
  isActive: boolean;
  lastCheck?: Date;
  duplicatesRemoved: number;
  totalChecks: number;
  errors: string[];
  config: any;
}

export function useAutomaticDeduplication() {
  const [deduplicationData, setDeduplicationData] = useState<AutoDeduplicationData>({
    isActive: false,
    duplicatesRemoved: 0,
    totalChecks: 0,
    errors: [],
    config: null
  });

  useEffect(() => {
    console.log('🔄 Initialisation de la déduplication automatique');

    // Démarrer la déduplication automatique
    AutomaticDeduplicationService.start({
      enabled: true,
      checkInterval: 30000, // 30 secondes
      maxDuplicatesBeforeAlert: 3,
      silentMode: false
    });

    // Mettre à jour le statut initial
    const status = AutomaticDeduplicationService.getStatus();
    setDeduplicationData(prev => ({
      ...prev,
      isActive: status.isRunning,
      config: status.config,
      lastCheck: status.lastCheck
    }));

    // Écouter les événements de déduplication
    const handleDeduplicationCompleted = (event: CustomEvent) => {
      console.log('📊 Événement de déduplication reçu:', event.detail);
      
      setDeduplicationData(prev => ({
        ...prev,
        duplicatesRemoved: prev.duplicatesRemoved + event.detail.duplicatesRemoved,
        totalChecks: prev.totalChecks + 1,
        lastCheck: new Date(event.detail.timestamp)
      }));
    };

    const handleDeduplicationError = (event: CustomEvent) => {
      console.error('❌ Erreur de déduplication:', event.detail);
      
      setDeduplicationData(prev => ({
        ...prev,
        errors: [...prev.errors, event.detail.error]
      }));
    };

    // Écouter les événements personnalisés
    window.addEventListener('automaticDeduplicationCompleted', handleDeduplicationCompleted as EventListener);
    window.addEventListener('automaticDeduplicationError', handleDeduplicationError as EventListener);

    // Actualiser le statut périodiquement
    const statusInterval = setInterval(() => {
      const status = AutomaticDeduplicationService.getStatus();
      setDeduplicationData(prev => ({
        ...prev,
        isActive: status.isRunning,
        config: status.config
      }));
    }, 60000); // Toutes les minutes

    return () => {
      console.log('🧹 Nettoyage de la déduplication automatique');
      window.removeEventListener('automaticDeduplicationCompleted', handleDeduplicationCompleted as EventListener);
      window.removeEventListener('automaticDeduplicationError', handleDeduplicationError as EventListener);
      clearInterval(statusInterval);
      AutomaticDeduplicationService.cleanup();
    };
  }, []);

  // Fonctions utilitaires
  const forceCheck = async () => {
    try {
      const result = await AutomaticDeduplicationService.forceCheck();
      
      setDeduplicationData(prev => ({
        ...prev,
        duplicatesRemoved: prev.duplicatesRemoved + result.duplicatesRemoved,
        totalChecks: prev.totalChecks + 1,
        lastCheck: new Date(),
        errors: result.errors.length > 0 ? [...prev.errors, ...result.errors] : prev.errors
      }));

      return result;
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  const updateConfig = (newConfig: any) => {
    AutomaticDeduplicationService.updateConfig(newConfig);
    
    setDeduplicationData(prev => ({
      ...prev,
      config: { ...prev.config, ...newConfig }
    }));
  };

  const start = () => {
    AutomaticDeduplicationService.start();
    setDeduplicationData(prev => ({ ...prev, isActive: true }));
  };

  const stop = () => {
    AutomaticDeduplicationService.stop();
    setDeduplicationData(prev => ({ ...prev, isActive: false }));
  };

  return {
    ...deduplicationData,
    forceCheck,
    updateConfig,
    start,
    stop
  };
}