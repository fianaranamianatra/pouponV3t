// Hook personnalisé pour la gestion des montants d'écolage par classe
import { useState, useEffect } from 'react';
import { ClassEcolageService, ClassEcolageAmount, EcolageSettings } from '../lib/services/classEcolageService';

export interface UseClassEcolageAmountsResult {
  classAmounts: ClassEcolageAmount[];
  settings: EcolageSettings | null;
  loading: boolean;
  error: string | null;
  setClassAmount: (amount: Omit<ClassEcolageAmount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSettings: (settings: Omit<EcolageSettings, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  getSuggestedAmount: (className: string, level: string) => Promise<{
    monthlyAmount: number;
    registrationFee: number;
    examFee: number;
    source: 'configured' | 'default';
  }>;
  initializeDefaults: (classes: any[]) => Promise<void>;
}

export function useClassEcolageAmounts(): UseClassEcolageAmountsResult {
  const [classAmounts, setClassAmounts] = useState<ClassEcolageAmount[]>([]);
  const [settings, setSettings] = useState<EcolageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 Initialisation du hook des montants d\'écolage par classe');
    
    // Charger les données initiales
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Charger les montants par classe
        const amounts = await ClassEcolageService.getAllClassAmounts();
        setClassAmounts(amounts);
        
        // Charger les paramètres généraux
        const ecolageSettings = await ClassEcolageService.getEcolageSettings();
        setSettings(ecolageSettings);
        
        console.log(`✅ Données chargées: ${amounts.length} classe(s) configurée(s)`);
      } catch (err: any) {
        console.error('❌ Erreur lors du chargement:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Écouter les changements en temps réel
    const unsubscribe = ClassEcolageService.onClassAmountsChange((amounts) => {
      console.log('📊 Mise à jour temps réel des montants d\'écolage');
      setClassAmounts(amounts);
    });

    return () => {
      console.log('🔌 Déconnexion du listener des montants d\'écolage');
      unsubscribe();
    };
  }, []);

  const setClassAmount = async (amount: Omit<ClassEcolageAmount, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await ClassEcolageService.setClassAmount(amount);
      console.log(`✅ Montant défini pour ${amount.className}`);
    } catch (err: any) {
      console.error('❌ Erreur lors de la définition du montant:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateSettings = async (newSettings: Omit<EcolageSettings, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await ClassEcolageService.updateEcolageSettings(newSettings);
      setSettings(prev => ({ ...prev, ...newSettings } as EcolageSettings));
      console.log('✅ Paramètres d\'écolage mis à jour');
    } catch (err: any) {
      console.error('❌ Erreur lors de la mise à jour des paramètres:', err);
      setError(err.message);
      throw err;
    }
  };

  const getSuggestedAmount = async (className: string, level: string) => {
    try {
      return await ClassEcolageService.getSuggestedAmount(className, level);
    } catch (err: any) {
      console.error('❌ Erreur lors de la récupération du montant suggéré:', err);
      throw err;
    }
  };

  const initializeDefaults = async (classes: any[]) => {
    try {
      await ClassEcolageService.initializeDefaultAmounts(classes);
      console.log('✅ Montants par défaut initialisés');
    } catch (err: any) {
      console.error('❌ Erreur lors de l\'initialisation:', err);
      setError(err.message);
      throw err;
    }
  };

  return {
    classAmounts,
    settings,
    loading,
    error,
    setClassAmount,
    updateSettings,
    getSuggestedAmount,
    initializeDefaults
  };
}