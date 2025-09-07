// Service de déduplication des transactions financières
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  writeBatch,
  query,
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { transactionsService } from '../firebase/firebaseService';

export interface DeduplicationResult {
  success: boolean;
  totalTransactions: number;
  duplicatesFound: number;
  duplicatesRemoved: number;
  uniqueTransactionsKept: number;
  errors: string[];
  duplicateGroups: Array<{
    signature: string;
    count: number;
    description: string;
    amount: number;
    date: string;
  }>;
}

export class TransactionDeduplicationService {
  /**
   * Analyser les doublons sans les supprimer
   */
  static async analyzeDuplicates(): Promise<DeduplicationResult> {
    try {
      console.log('🔍 Analyse des doublons de transactions...');
      
      const allTransactions = await transactionsService.getAll();
      console.log(`📊 Total transactions trouvées: ${allTransactions.length}`);
      
      if (allTransactions.length === 0) {
        return {
          success: true,
          totalTransactions: 0,
          duplicatesFound: 0,
          duplicatesRemoved: 0,
          uniqueTransactionsKept: 0,
          errors: [],
          duplicateGroups: []
        };
      }
      
      // Grouper les transactions par signature unique
      const transactionGroups = new Map<string, any[]>();
      
      allTransactions.forEach(transaction => {
        // Créer une signature unique basée sur les champs critiques
        const signature = this.createTransactionSignature(transaction);
        
        if (!transactionGroups.has(signature)) {
          transactionGroups.set(signature, []);
        }
        transactionGroups.get(signature)!.push(transaction);
      });
      
      // Identifier les groupes avec des doublons
      const duplicateGroups: Array<{
        signature: string;
        count: number;
        description: string;
        amount: number;
        date: string;
      }> = [];
      
      let duplicatesFound = 0;
      
      for (const [signature, transactions] of transactionGroups) {
        if (transactions.length > 1) {
          duplicateGroups.push({
            signature,
            count: transactions.length,
            description: transactions[0].description,
            amount: transactions[0].amount,
            date: transactions[0].date
          });
          duplicatesFound += transactions.length - 1; // -1 car on garde un original
        }
      }
      
      console.log(`📊 Analyse terminée: ${duplicateGroups.length} groupe(s) de doublons, ${duplicatesFound} doublons au total`);
      
      return {
        success: true,
        totalTransactions: allTransactions.length,
        duplicatesFound,
        duplicatesRemoved: 0,
        uniqueTransactionsKept: allTransactions.length - duplicatesFound,
        errors: [],
        duplicateGroups
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'analyse des doublons:', error);
      return {
        success: false,
        totalTransactions: 0,
        duplicatesFound: 0,
        duplicatesRemoved: 0,
        uniqueTransactionsKept: 0,
        errors: [error.message],
        duplicateGroups: []
      };
    }
  }

  /**
   * Supprimer tous les doublons de transactions
   */
  static async removeDuplicates(): Promise<DeduplicationResult> {
    try {
      console.log('🧹 🤖 SUPPRESSION AUTOMATIQUE DES DOUBLONS - Début du processus');
      
      const allTransactions = await transactionsService.getAll();
      console.log(`📊 Total transactions à analyser: ${allTransactions.length}`);
      
      if (allTransactions.length === 0) {
        return {
          success: true,
          totalTransactions: 0,
          duplicatesFound: 0,
          duplicatesRemoved: 0,
          uniqueTransactionsKept: 0,
          errors: [],
          duplicateGroups: []
        };
      }
      
      // Grouper les transactions par signature unique
      const transactionGroups = new Map<string, any[]>();
      
      allTransactions.forEach(transaction => {
        const signature = this.createTransactionSignature(transaction);
        
        if (!transactionGroups.has(signature)) {
          transactionGroups.set(signature, []);
        }
        transactionGroups.get(signature)!.push(transaction);
      });
      
      let duplicatesRemoved = 0;
      let duplicateGroups = 0;
      const errors: string[] = [];
      
      console.log(`📊 Analyse: ${transactionGroups.size} groupe(s) de transactions trouvé(s)`);
      
      // Traiter chaque groupe de doublons
      for (const [signature, transactions] of transactionGroups) {
        if (transactions.length > 1) {
          duplicateGroups++;
          console.log(`🔍 DOUBLON DÉTECTÉ: ${transactions.length} exemplaires de "${transactions[0].description}" (${transactions[0].amount.toLocaleString()} Ar)`);
          
          try {
            // Trier par date de création (garder le plus récent)
            const sortedTransactions = transactions.sort((a, b) => {
              const dateA = new Date(a.createdAt || a.date).getTime();
              const dateB = new Date(b.createdAt || b.date).getTime();
              return dateB - dateA; // Plus récent en premier
            });
            
            // Garder le premier (plus récent) et supprimer les autres
            const transactionToKeep = sortedTransactions[0];
            const transactionsToDelete = sortedTransactions.slice(1);
            
            console.log(`✅ CONSERVATION: Transaction ${transactionToKeep.id} (la plus récente)`);
            console.log(`🗑️ SUPPRESSION: ${transactionsToDelete.length} doublon(s) ancien(s)`);
            
            // Supprimer les doublons par lots
            for (const transaction of transactionsToDelete) {
              try {
                if (transaction.id) {
                  await transactionsService.delete(transaction.id);
                  duplicatesRemoved++;
                  console.log(`🗑️ ✅ Doublon supprimé: ${transaction.id}`);
                }
              } catch (deleteError: any) {
                errors.push(`Erreur suppression ${transaction.id}: ${deleteError.message}`);
                console.error(`❌ Erreur suppression ${transaction.id}:`, deleteError);
              }
            }
            
          } catch (groupError: any) {
            errors.push(`Erreur traitement groupe: ${groupError.message}`);
            console.error(`❌ Erreur traitement groupe:`, groupError);
          }
        }
      }
      
      const uniqueTransactionsKept = allTransactions.length - duplicatesRemoved;
      
      console.log(`🎉 DÉDUPLICATION AUTOMATIQUE TERMINÉE:`);
      console.log(`   • ${duplicatesRemoved} doublon(s) supprimé(s) dans ${duplicateGroups} groupe(s)`);
      console.log(`   • ${uniqueTransactionsKept} transaction(s) unique(s) conservée(s)`);
      console.log(`   • Base de données nettoyée et cohérente`);
      
      return {
        success: errors.length === 0,
        totalTransactions: allTransactions.length,
        duplicatesFound: duplicatesRemoved,
        duplicatesRemoved,
        uniqueTransactionsKept,
        errors,
        duplicateGroups: [] // Pas besoin de retourner les groupes après suppression
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression des doublons:', error);
      return {
        success: false,
        totalTransactions: 0,
        duplicatesFound: 0,
        duplicatesRemoved: 0,
        uniqueTransactionsKept: 0,
        errors: [error.message],
        duplicateGroups: []
      };
    }
  }

  /**
   * Créer une signature unique pour une transaction
   */
  private static createTransactionSignature(transaction: any): string {
    // Normaliser les données pour créer une signature cohérente
    const type = transaction.type?.trim() || '';
    const category = transaction.category?.trim() || '';
    const description = transaction.description?.trim() || '';
    const amount = Math.round(transaction.amount || 0);
    const date = transaction.date?.trim() || '';
    const paymentMethod = transaction.paymentMethod?.trim() || '';
    
    return `${type}-${category}-${description}-${amount}-${date}-${paymentMethod}`;
  }

  /**
   * Supprimer automatiquement les doublons lors de la création
   */
  static async preventDuplicateOnCreate(transactionData: any): Promise<{
    shouldCreate: boolean;
    existingTransactionId?: string;
    message: string;
  }> {
    try {
      const duplicateCheck = await this.checkForDuplicate(transactionData);
      
      if (duplicateCheck.isDuplicate) {
        console.log('🚫 PRÉVENTION DE DOUBLON - Transaction identique existante');
        return {
          shouldCreate: false,
          existingTransactionId: duplicateCheck.existingTransaction?.id,
          message: 'Transaction identique déjà existante'
        };
      }
      
      return {
        shouldCreate: true,
        message: 'Transaction unique, création autorisée'
      };
    } catch (error: any) {
      console.error('Erreur lors de la prévention de doublon:', error);
      return {
        shouldCreate: true,
        message: 'Erreur de vérification, création autorisée par sécurité'
      };
    }
  }

  /**
   * Vérifier si une transaction est un doublon potentiel
   */
  static async checkForDuplicate(transactionData: any): Promise<{
    isDuplicate: boolean;
    existingTransaction?: any;
  }> {
    try {
      const allTransactions = await transactionsService.getAll();
      const signature = this.createTransactionSignature(transactionData);
      
      const existingTransaction = allTransactions.find(t => {
        const existingSignature = this.createTransactionSignature(t);
        return existingSignature === signature;
      });
      
      return {
        isDuplicate: !!existingTransaction,
        existingTransaction
      };
    } catch (error) {
      console.error('Erreur lors de la vérification de doublon:', error);
      return { isDuplicate: false };
    }
  }

  /**
   * Obtenir des statistiques sur les doublons
   */
  static async getDuplicationStats(): Promise<{
    totalTransactions: number;
    duplicateGroups: number;
    totalDuplicates: number;
    cleanlinessRate: number;
  }> {
    try {
      const analysis = await this.analyzeDuplicates();
      
      const cleanlinessRate = analysis.totalTransactions > 0 ? 
        ((analysis.totalTransactions - analysis.duplicatesFound) / analysis.totalTransactions) * 100 : 
        100;
      
      return {
        totalTransactions: analysis.totalTransactions,
        duplicateGroups: analysis.duplicateGroups.length,
        totalDuplicates: analysis.duplicatesFound,
        cleanlinessRate
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return {
        totalTransactions: 0,
        duplicateGroups: 0,
        totalDuplicates: 0,
        cleanlinessRate: 100
      };
    }
  }

  /**
   * Nettoyer les doublons créés par l'intégration automatique
   */
  static async cleanupIntegrationDuplicates(): Promise<{
    cleaned: number;
    errors: string[];
  }> {
    try {
      console.log('🧹 Nettoyage spécifique des doublons d\'intégration');
      
      const allTransactions = await transactionsService.getAll();
      
      // Grouper par module et ID lié
      const integrationGroups = new Map<string, any[]>();
      
      allTransactions
        .filter(t => t.relatedModule && t.relatedId)
        .forEach(transaction => {
          const key = `${transaction.relatedModule}-${transaction.relatedId}`;
          
          if (!integrationGroups.has(key)) {
            integrationGroups.set(key, []);
          }
          integrationGroups.get(key)!.push(transaction);
        });
      
      let cleaned = 0;
      const errors: string[] = [];
      
      for (const [key, transactions] of integrationGroups) {
        if (transactions.length > 1) {
          // Garder la transaction la plus récente
          const sortedTransactions = transactions.sort((a, b) => 
            new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime()
          );
          
          const transactionsToDelete = sortedTransactions.slice(1);
          
          for (const transaction of transactionsToDelete) {
            try {
              if (transaction.id) {
                await transactionsService.delete(transaction.id);
                cleaned++;
              }
            } catch (error: any) {
              errors.push(`Erreur suppression ${transaction.id}: ${error.message}`);
            }
          }
        }
      }
      
      console.log(`✅ Nettoyage d'intégration terminé: ${cleaned} doublon(s) supprimé(s)`);
      
      return { cleaned, errors };
    } catch (error: any) {
      console.error('❌ Erreur lors du nettoyage d\'intégration:', error);
      return { cleaned: 0, errors: [error.message] };
    }
  }
}