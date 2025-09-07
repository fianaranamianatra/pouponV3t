// Service d'intégration financière pour synchroniser automatiquement
// les salaires et écolages avec les transactions financières

import { transactionsService, salariesService, feesService } from '../firebase/firebaseService';
import type { Transaction, SalaryRecord, Fee } from '../firebase/collections';

export interface FinancialIntegrationResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export class FinancialIntegrationService {
  /**
   * Créer automatiquement un décaissement lors du paiement d'un salaire
   */
  static async createSalaryTransaction(salaryRecord: SalaryRecord): Promise<FinancialIntegrationResult> {
    try {
      console.log('🔄 Création automatique de transaction pour salaire:', salaryRecord.employeeName);
      
      const currentDate = new Date();
      const monthYear = currentDate.toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      const transactionData: Omit<Transaction, 'id'> = {
        type: 'Décaissement',
        category: 'Salaires',
        description: `Salaire ${salaryRecord.employeeName} - ${monthYear}`,
        amount: salaryRecord.netSalary,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Virement',
        status: 'Validé',
        reference: `SAL-${currentDate.getFullYear()}-${salaryRecord.employeeId?.substring(0, 4).toUpperCase()}`,
        relatedModule: 'salary',
        relatedId: salaryRecord.id,
        notes: `Paiement automatique - Salaire net: ${salaryRecord.netSalary.toLocaleString()} Ar`
      };

      const transactionId = await transactionsService.create(transactionData);
      
      console.log('✅ Transaction de salaire créée automatiquement:', transactionId);
      
      return {
        success: true,
        transactionId
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de la création de transaction de salaire:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Créer automatiquement un encaissement lors du paiement d'écolage
   */
  static async createEcolageTransaction(payment: Fee): Promise<FinancialIntegrationResult> {
    try {
      console.log('🔄 Création automatique de transaction pour écolage:', payment.studentName);
      
      const transactionData: Omit<Transaction, 'id'> = {
        type: 'Encaissement',
        category: 'Écolages',
        description: `Écolage ${payment.studentName} - ${payment.period}`,
        amount: payment.amount,
        date: payment.paymentDate,
        paymentMethod: this.mapPaymentMethod(payment.paymentMethod),
        status: 'Validé',
        reference: payment.reference,
        relatedModule: 'ecolage',
        relatedId: payment.id,
        notes: `Paiement automatique - Classe: ${payment.class}`
      };

      const transactionId = await transactionsService.create(transactionData);
      
      console.log('✅ Transaction d\'écolage créée automatiquement:', transactionId);
      
      return {
        success: true,
        transactionId
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de la création de transaction d\'écolage:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Synchroniser une transaction existante avec les modules liés
   */
  static async syncTransactionWithModules(transaction: Transaction): Promise<void> {
    try {
      console.log('🔄 Synchronisation de transaction:', transaction.id);
      
      if (transaction.relatedModule === 'salary' && transaction.relatedId) {
        // Mettre à jour le statut du salaire si nécessaire
        const salaryRecord = await salariesService.getById(transaction.relatedId);
        if (salaryRecord && salaryRecord.status !== 'paid') {
          await salariesService.update(transaction.relatedId, {
            status: transaction.status === 'Validé' ? 'paid' : 'pending'
          });
          console.log('✅ Statut du salaire synchronisé');
        }
      }
      
      if (transaction.relatedModule === 'ecolage' && transaction.relatedId) {
        // Mettre à jour le statut de l'écolage si nécessaire
        const payment = await feesService.getById(transaction.relatedId);
        if (payment && payment.status !== 'paid') {
          await feesService.update(transaction.relatedId, {
            status: transaction.status === 'Validé' ? 'paid' : 'pending'
          });
          console.log('✅ Statut de l\'écolage synchronisé');
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
    }
  }

  /**
   * Supprimer automatiquement les transactions liées lors de la suppression
   */
  static async deleteRelatedTransactions(module: 'salary' | 'ecolage', recordId: string): Promise<void> {
    try {
      console.log(`🗑️ Suppression des transactions liées au module ${module}, ID: ${recordId}`);
      
      // Récupérer toutes les transactions
      const allTransactions = await transactionsService.getAll();
      
      // Filtrer les transactions liées
      const relatedTransactions = allTransactions.filter(
        t => t.relatedModule === module && t.relatedId === recordId
      );
      
      // Supprimer chaque transaction liée
      for (const transaction of relatedTransactions) {
        if (transaction.id) {
          await transactionsService.delete(transaction.id);
          console.log(`✅ Transaction supprimée: ${transaction.id}`);
        }
      }
      
      console.log(`✅ ${relatedTransactions.length} transaction(s) liée(s) supprimée(s)`);
    } catch (error) {
      console.error('❌ Erreur lors de la suppression des transactions liées:', error);
    }
  }

  /**
   * Obtenir toutes les transactions liées à un enregistrement
   */
  static async getRelatedTransactions(module: 'salary' | 'ecolage', recordId: string): Promise<Transaction[]> {
    try {
      const allTransactions = await transactionsService.getAll();
      return allTransactions.filter(
        t => t.relatedModule === module && t.relatedId === recordId
      );
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des transactions liées:', error);
      return [];
    }
  }

  /**
   * Calculer le résumé financier global
   */
  static async calculateFinancialSummary(): Promise<{
    totalEcolages: number;
    totalSalaires: number;
    soldeNet: number;
    transactionsCount: number;
  }> {
    try {
      const allTransactions = await transactionsService.getAll();
      const validTransactions = allTransactions.filter(t => t.status === 'Validé');
      
      const totalEcolages = validTransactions
        .filter(t => t.type === 'Encaissement' && t.category === 'Écolages')
        .reduce((acc, t) => acc + t.amount, 0);
      
      const totalSalaires = validTransactions
        .filter(t => t.type === 'Décaissement' && t.category === 'Salaires')
        .reduce((acc, t) => acc + t.amount, 0);
      
      const totalEncaissements = validTransactions
        .filter(t => t.type === 'Encaissement')
        .reduce((acc, t) => acc + t.amount, 0);
      
      const totalDecaissements = validTransactions
        .filter(t => t.type === 'Décaissement')
        .reduce((acc, t) => acc + t.amount, 0);
      
      return {
        totalEcolages,
        totalSalaires,
        soldeNet: totalEncaissements - totalDecaissements,
        transactionsCount: allTransactions.length
      };
    } catch (error) {
      console.error('❌ Erreur lors du calcul du résumé financier:', error);
      return {
        totalEcolages: 0,
        totalSalaires: 0,
        soldeNet: 0,
        transactionsCount: 0
      };
    }
  }

  /**
   * Mapper les méthodes de paiement entre les modules
   */
  private static mapPaymentMethod(method: string): string {
    const mapping: { [key: string]: string } = {
      'cash': 'Espèces',
      'bank_transfer': 'Virement',
      'mobile_money': 'Mobile Money',
      'check': 'Chèque',
      'card': 'Carte bancaire'
    };
    
    return mapping[method] || method;
  }

  /**
   * Valider la cohérence des données financières
   */
  static async validateFinancialConsistency(): Promise<{
    isConsistent: boolean;
    issues: string[];
  }> {
    try {
      const issues: string[] = [];
      
      // Vérifier les écolages sans transactions
      const allPayments = await feesService.getAll();
      const allTransactions = await transactionsService.getAll();
      
      const paymentsWithoutTransactions = allPayments.filter(payment => {
        return !allTransactions.some(t => 
          t.relatedModule === 'ecolage' && t.relatedId === payment.id
        );
      });
      
      if (paymentsWithoutTransactions.length > 0) {
        issues.push(`${paymentsWithoutTransactions.length} paiement(s) d'écolage sans transaction associée`);
      }
      
      // Vérifier les salaires sans transactions
      const allSalaries = await salariesService.getAll();
      const salariesWithoutTransactions = allSalaries.filter(salary => {
        return !allTransactions.some(t => 
          t.relatedModule === 'salary' && t.relatedId === salary.id
        );
      });
      
      if (salariesWithoutTransactions.length > 0) {
        issues.push(`${salariesWithoutTransactions.length} salaire(s) sans transaction associée`);
      }
      
      return {
        isConsistent: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('❌ Erreur lors de la validation de cohérence:', error);
      return {
        isConsistent: false,
        issues: ['Erreur lors de la validation']
      };
    }
  }

  /**
   * Réparer automatiquement les incohérences détectées
   */
  static async repairFinancialInconsistencies(): Promise<{
    repaired: number;
    errors: string[];
  }> {
    try {
      let repaired = 0;
      const errors: string[] = [];
      
      // Créer les transactions manquantes pour les écolages
      const allPayments = await feesService.getAll();
      const allTransactions = await transactionsService.getAll();
      
      for (const payment of allPayments) {
        const hasTransaction = allTransactions.some(t => 
          t.relatedModule === 'ecolage' && t.relatedId === payment.id
        );
        
        if (!hasTransaction && payment.status === 'paid') {
          try {
            await this.createEcolageTransaction(payment);
            repaired++;
          } catch (error: any) {
            errors.push(`Écolage ${payment.studentName}: ${error.message}`);
          }
        }
      }
      
      // Créer les transactions manquantes pour les salaires
      const allSalaries = await salariesService.getAll();
      
      for (const salary of allSalaries) {
        const hasTransaction = allTransactions.some(t => 
          t.relatedModule === 'salary' && t.relatedId === salary.id
        );
        
        if (!hasTransaction && salary.status === 'active') {
          try {
            await this.createSalaryTransaction(salary);
            repaired++;
          } catch (error: any) {
            errors.push(`Salaire ${salary.employeeName}: ${error.message}`);
          }
        }
      }
      
      console.log(`✅ Réparation terminée: ${repaired} transaction(s) créée(s)`);
      
      return { repaired, errors };
    } catch (error: any) {
      console.error('❌ Erreur lors de la réparation:', error);
      return {
        repaired: 0,
        errors: [error.message]
      };
    }
  }
}