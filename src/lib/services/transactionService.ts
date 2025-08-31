// Service de gestion des transactions financières
import { transactionsService } from '../firebase/firebaseService';
import { FinancialIntegrationService } from './financialIntegrationService';
import type { Transaction } from '../firebase/collections';

export class TransactionService {
  /**
   * Créer une transaction automatique depuis un paiement d'écolage
   * @deprecated Utiliser FinancialIntegrationService.createEcolageTransaction à la place
   */
  static async createFromEcolagePayment(payment: any): Promise<string> {
    console.warn('⚠️ TransactionService.createFromEcolagePayment est déprécié. Utilisez FinancialIntegrationService.createEcolageTransaction');
    const result = await FinancialIntegrationService.createEcolageTransaction(payment);
    if (result.success && result.transactionId) {
      return result.transactionId;
    } else {
      throw new Error(result.error || 'Erreur lors de la création de transaction');
    }
  }

  /**
   * Créer une transaction automatique depuis un paiement de salaire
   * @deprecated Utiliser FinancialIntegrationService.createSalaryTransaction à la place
   */
  static async createFromSalaryPayment(employee: any, salaryAmount: number): Promise<string> {
    console.warn('⚠️ TransactionService.createFromSalaryPayment est déprécié. Utilisez FinancialIntegrationService.createSalaryTransaction');
    const salaryRecord = {
      id: employee.id,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      netSalary: salaryAmount
    };
    const result = await FinancialIntegrationService.createSalaryTransaction(salaryRecord);
    if (result.success && result.transactionId) {
      return result.transactionId;
    } else {
      throw new Error(result.error || 'Erreur lors de la création de transaction');
    }
  }

  /**
   * Obtenir toutes les transactions avec filtres
   */
  static async getTransactions(filters?: {
    type?: 'Encaissement' | 'Décaissement';
    category?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Transaction[]> {
    try {
      const allTransactions = await transactionsService.getAll();
      
      if (!filters) return allTransactions;

      return allTransactions.filter(transaction => {
        if (filters.type && transaction.type !== filters.type) return false;
        if (filters.category && transaction.category !== filters.category) return false;
        if (filters.status && transaction.status !== filters.status) return false;
        if (filters.dateFrom && transaction.date < filters.dateFrom) return false;
        if (filters.dateTo && transaction.date > filters.dateTo) return false;
        return true;
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des transactions:', error);
      throw error;
    }
  }

  /**
   * Calculer les statistiques financières
   */
  static calculateFinancialStats(transactions: Transaction[]) {
    const validTransactions = transactions.filter(t => t.status === 'Validé');
    
    const totalEncaissements = validTransactions
      .filter(t => t.type === 'Encaissement')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const totalDecaissements = validTransactions
      .filter(t => t.type === 'Décaissement')
      .reduce((acc, t) => acc + t.amount, 0);
    
    const solde = totalEncaissements - totalDecaissements;
    
    const pendingTransactions = transactions.filter(t => t.status === 'En attente');
    const pendingAmount = pendingTransactions.reduce((acc, t) => acc + t.amount, 0);
    
    return {
      totalEncaissements,
      totalDecaissements,
      solde,
      pendingAmount,
      pendingCount: pendingTransactions.length,
      totalTransactions: transactions.length
    };
  }

  /**
   * Exporter les transactions au format CSV
   */
  static exportToCSV(transactions: Transaction[]): string {
    const csvContent = [
      'Date,Type,Catégorie,Description,Montant,Mode de Paiement,Statut,Référence',
      ...transactions.map(t => [
        t.date,
        t.type,
        t.category,
        t.description,
        t.amount,
        t.paymentMethod,
        t.status,
        t.reference || ''
      ].join(','))
    ].join('\n');
    
    return csvContent;
  }
}