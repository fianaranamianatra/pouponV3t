// Hook personnalisé pour l'intégration financière automatique
import { useState, useEffect } from 'react';
import { FinancialIntegrationService } from '../lib/services/financialIntegrationService';

export interface FinancialSummary {
  totalEcolages: number;
  totalSalaires: number;
  soldeNet: number;
  transactionsCount: number;
  lastUpdated: Date;
}

export function useFinancialIntegration() {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger le résumé financier
  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const summaryData = await FinancialIntegrationService.calculateFinancialSummary();
      setSummary({
        ...summaryData,
        lastUpdated: new Date()
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Créer une transaction de salaire
  const createSalaryTransaction = async (salaryRecord: any) => {
    try {
      const result = await FinancialIntegrationService.createSalaryTransaction(salaryRecord);
      if (result.success) {
        await loadSummary(); // Recharger le résumé
        return result.transactionId;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erreur lors de la création de transaction de salaire:', error);
      throw error;
    }
  };

  // Créer une transaction d'écolage
  const createEcolageTransaction = async (payment: any) => {
    try {
      const result = await FinancialIntegrationService.createEcolageTransaction(payment);
      if (result.success) {
        await loadSummary(); // Recharger le résumé
        return result.transactionId;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erreur lors de la création de transaction d\'écolage:', error);
      throw error;
    }
  };

  // Valider la cohérence financière
  const validateConsistency = async () => {
    try {
      return await FinancialIntegrationService.validateFinancialConsistency();
    } catch (error) {
      console.error('Erreur lors de la validation de cohérence:', error);
      throw error;
    }
  };

  // Réparer les incohérences
  const repairInconsistencies = async () => {
    try {
      const result = await FinancialIntegrationService.repairFinancialInconsistencies();
      await loadSummary(); // Recharger le résumé après réparation
      return result;
    } catch (error) {
      console.error('Erreur lors de la réparation:', error);
      throw error;
    }
  };

  // Charger le résumé au montage du composant
  useEffect(() => {
    // Délai pour éviter les appels trop fréquents
    const timer = setTimeout(() => {
      loadSummary();
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  return {
    summary,
    loading,
    error,
    loadSummary,
    createSalaryTransaction,
    createEcolageTransaction,
    validateConsistency,
    repairInconsistencies
  };
}