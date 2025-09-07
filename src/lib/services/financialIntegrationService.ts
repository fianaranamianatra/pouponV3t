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
      
      // PRÉVENTION DES DOUBLONS : Vérification stricte d'unicité
      const existingTransactions = await transactionsService.getAll();
      
      // Créer une signature unique pour cette transaction
      const currentDate = new Date();
      const monthYear = currentDate.toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
      });
      const expectedDescription = `Salaire ${salaryRecord.employeeName} - ${monthYear}`;
      const expectedAmount = salaryRecord.netSalary;
      const expectedDate = new Date().toISOString().split('T')[0];
      
      // Vérifier les doublons avec une signature stricte
      const duplicateTransaction = existingTransactions.find(t => 
        t.relatedModule === 'salary' && 
        t.type === 'Décaissement' &&
        t.category === 'Salaires' &&
        t.description === expectedDescription &&
        t.amount === expectedAmount &&
        t.date === expectedDate
      );
      
      if (duplicateTransaction) {
        console.log('🚫 DOUBLON DÉTECTÉ - Transaction identique existante:', duplicateTransaction.id);
        console.log('📊 Signature:', { expectedDescription, expectedAmount, expectedDate });
        
        // Mettre à jour le lien vers le nouveau salaire si nécessaire
        if (duplicateTransaction.relatedId !== salaryRecord.id) {
          const updateData = {
            relatedId: salaryRecord.id,
            notes: `Lié au salaire ID: ${salaryRecord.id} - Mis à jour: ${new Date().toLocaleString('fr-FR')}`
          };
          
          await transactionsService.update(duplicateTransaction.id, updateData);
          console.log('✅ Lien de transaction mis à jour vers le nouveau salaire');
        }
        
        console.log('✅ Transaction existante réutilisée (pas de doublon créé):', duplicateTransaction.id);
        
        return {
          success: true,
          transactionId: duplicateTransaction.id
        };
      }
      
      // Créer une nouvelle transaction uniquement si aucun doublon n'existe
      console.log('✅ Aucun doublon détecté, création d\'une nouvelle transaction');
      
      const transactionData: Omit<Transaction, 'id'> = {
        type: 'Décaissement',
        category: 'Salaires',
        description: expectedDescription,
        amount: expectedAmount,
        date: expectedDate,
        paymentMethod: 'Virement',
        status: 'Validé',
        reference: `SAL-${currentDate.getFullYear()}-${salaryRecord.employeeId?.substring(0, 4).toUpperCase()}`,
        relatedModule: 'salary',
        relatedId: salaryRecord.id,
        notes: `Paiement automatique - Salaire net: ${salaryRecord.netSalary.toLocaleString()} Ar - Créé: ${new Date().toLocaleString('fr-FR')}`
      };

      const transactionId = await transactionsService.create(transactionData);
      
      console.log('✅ Nouvelle transaction de salaire créée:', transactionId);
      
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
      
      // PRÉVENTION DES DOUBLONS : Vérification stricte d'unicité
      const existingTransactions = await transactionsService.getAll();
      
      // Créer une signature unique pour cette transaction
      const expectedDescription = `Écolage ${payment.studentName} - ${payment.period}`;
      const expectedAmount = payment.amount;
      const expectedDate = payment.paymentDate;
      const expectedPaymentMethod = this.mapPaymentMethod(payment.paymentMethod);
      
      // Vérifier les doublons avec une signature stricte
      const duplicateTransaction = existingTransactions.find(t => 
        t.relatedModule === 'ecolage' && 
        t.type === 'Encaissement' &&
        t.category === 'Écolages' &&
        t.description === expectedDescription &&
        t.amount === expectedAmount &&
        t.date === expectedDate &&
        t.paymentMethod === expectedPaymentMethod
      );
      
      if (duplicateTransaction) {
        console.log('🚫 DOUBLON DÉTECTÉ - Transaction identique existante:', duplicateTransaction.id);
        console.log('📊 Signature:', { expectedDescription, expectedAmount, expectedDate, expectedPaymentMethod });
        
        // Mettre à jour le lien vers le nouveau paiement si nécessaire
        if (duplicateTransaction.relatedId !== payment.id) {
          const updateData = {
            relatedId: payment.id,
            notes: `Lié au paiement ID: ${payment.id} - Mis à jour: ${new Date().toLocaleString('fr-FR')}`
          };
          
          await transactionsService.update(duplicateTransaction.id, updateData);
          console.log('✅ Lien de transaction mis à jour vers le nouveau paiement');
        }
        
        console.log('✅ Transaction existante réutilisée (pas de doublon créé):', duplicateTransaction.id);
        
        return {
          success: true,
          transactionId: duplicateTransaction.id
        };
      }
      
      // Créer une nouvelle transaction uniquement si aucun doublon n'existe
      console.log('✅ Aucun doublon détecté, création d\'une nouvelle transaction');
      
      const transactionData: Omit<Transaction, 'id'> = {
        type: 'Encaissement',
        category: 'Écolages',
        description: expectedDescription,
        amount: expectedAmount,
        date: expectedDate,
        paymentMethod: expectedPaymentMethod,
        status: 'Validé',
        reference: payment.reference,
        relatedModule: 'ecolage',
        relatedId: payment.id,
        notes: `Paiement automatique - Classe: ${payment.class} - Créé: ${new Date().toLocaleString('fr-FR')}`
      };

      const transactionId = await transactionsService.create(transactionData);
      
      console.log('✅ Nouvelle transaction d\'écolage créée:', transactionId);
      
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
      
      // Si aucune transaction, retourner des valeurs par défaut
      if (allTransactions.length === 0) {
        return {
          totalEcolages: 0,
          totalSalaires: 0,
          soldeNet: 0,
          transactionsCount: 0
        };
      }
      
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
      
      // Si aucune donnée, considérer comme cohérent
      if (allPayments.length === 0 && allTransactions.length === 0) {
        return {
          isConsistent: true,
          issues: []
        };
      }
      
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

  /**
   * Vérifier et nettoyer les transactions en double pour un employé
   */
  static async cleanupDuplicateSalaryTransactions(employeeId: string, employeeName: string): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    try {
      console.log(`🧹 Nettoyage des transactions en double pour ${employeeName}`);
      
      const allTransactions = await transactionsService.getAll();
      
      // Grouper les transactions de salaire par employé et période
      const salaryTransactions = allTransactions.filter(t => 
        t.relatedModule === 'salary' && 
        t.type === 'Décaissement' && 
        t.category === 'Salaires' &&
        t.description.includes(employeeName)
      );
      
      if (salaryTransactions.length <= 1) {
        console.log(`ℹ️ Aucun doublon trouvé pour ${employeeName}`);
        return { cleaned: 0, errors: [] };
      }
      
      // Garder la transaction la plus récente et supprimer les autres
      const sortedTransactions = salaryTransactions.sort((a, b) => 
        new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
      );
      
      const transactionToKeep = sortedTransactions[0];
      const transactionsToDelete = sortedTransactions.slice(1);
      
      let cleaned = 0;
      const errors: string[] = [];
      
      for (const transaction of transactionsToDelete) {
        try {
          if (transaction.id) {
            await transactionsService.delete(transaction.id);
            cleaned++;
            console.log(`🗑️ Transaction en double supprimée: ${transaction.id}`);
          }
        } catch (error: any) {
          errors.push(`Erreur suppression ${transaction.id}: ${error.message}`);
        }
      }
      
      console.log(`✅ Nettoyage terminé pour ${employeeName}: ${cleaned} doublon(s) supprimé(s)`);
      
      return { cleaned, errors };
    } catch (error: any) {
      console.error('❌ Erreur lors du nettoyage des doublons:', error);
      return { cleaned: 0, errors: [error.message] };
    }
  }

  /**
   * Nettoyer tous les doublons de transactions de salaires
   */
  static async cleanupAllDuplicateSalaryTransactions(): Promise<{
    totalCleaned: number;
    employeesProcessed: number;
    errors: string[];
  }> {
    try {
      console.log('🧹 Début du nettoyage global des doublons de transactions de salaires');
      
      const allTransactions = await transactionsService.getAll();
      const salaryTransactions = allTransactions.filter(t => 
        t.relatedModule === 'salary' && 
        t.type === 'Décaissement' && 
        t.category === 'Salaires'
      );
      
      // Grouper par nom d'employé
      const transactionsByEmployee = salaryTransactions.reduce((acc, transaction) => {
        const employeeName = transaction.description.split(' - ')[0].replace('Salaire ', '');
        if (!acc[employeeName]) {
          acc[employeeName] = [];
        }
        acc[employeeName].push(transaction);
        return acc;
      }, {} as { [employeeName: string]: any[] });
      
      let totalCleaned = 0;
      let employeesProcessed = 0;
      const errors: string[] = [];
      
      for (const [employeeName, transactions] of Object.entries(transactionsByEmployee)) {
        if (transactions.length > 1) {
          try {
            const result = await this.cleanupDuplicateSalaryTransactions('', employeeName);
            totalCleaned += result.cleaned;
            errors.push(...result.errors);
            employeesProcessed++;
          } catch (error: any) {
            errors.push(`${employeeName}: ${error.message}`);
          }
        }
      }
      
      console.log(`✅ Nettoyage global terminé: ${totalCleaned} doublon(s) supprimé(s) pour ${employeesProcessed} employé(s)`);
      
      return { totalCleaned, employeesProcessed, errors };
    } catch (error: any) {
      console.error('❌ Erreur lors du nettoyage global:', error);
      return { totalCleaned: 0, employeesProcessed: 0, errors: [error.message] };
    }
  }
}