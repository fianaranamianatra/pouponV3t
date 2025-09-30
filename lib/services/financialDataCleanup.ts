// Service de nettoyage des données financières
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface CleanupResult {
  success: boolean;
  deletedCounts: {
    transactions: number;
    fees: number;
    salaries: number;
    payroll: number;
  };
  errors: string[];
}

export class FinancialDataCleanupService {
  /**
   * Supprimer toutes les données financières
   */
  static async deleteAllFinancialData(): Promise<CleanupResult> {
    console.log('🗑️ Début de la suppression de toutes les données financières');
    
    const result: CleanupResult = {
      success: false,
      deletedCounts: {
        transactions: 0,
        fees: 0,
        salaries: 0,
        payroll: 0
      },
      errors: []
    };

    try {
      // Supprimer les transactions financières
      result.deletedCounts.transactions = await this.deleteCollection('transactions');
      console.log(`✅ ${result.deletedCounts.transactions} transaction(s) supprimée(s)`);

      // Supprimer les paiements d'écolage
      result.deletedCounts.fees = await this.deleteCollection('fees');
      console.log(`✅ ${result.deletedCounts.fees} paiement(s) d'écolage supprimé(s)`);

      // Supprimer les salaires
      result.deletedCounts.salaries = await this.deleteCollection('salaries');
      console.log(`✅ ${result.deletedCounts.salaries} salaire(s) supprimé(s)`);

      // Supprimer les bulletins de paie (si collection séparée)
      try {
        result.deletedCounts.payroll = await this.deleteCollection('payroll');
        console.log(`✅ ${result.deletedCounts.payroll} bulletin(s) de paie supprimé(s)`);
      } catch (error) {
        console.log('ℹ️ Collection payroll non trouvée (normal si pas encore créée)');
      }

      // Supprimer les paramètres financiers
      try {
        await this.deleteCollection('financial_settings');
        console.log('✅ Paramètres financiers supprimés');
      } catch (error) {
        console.log('ℹ️ Paramètres financiers non trouvés');
      }

      // Supprimer les logs d'intégration
      try {
        await this.deleteCollection('integration_logs');
        console.log('✅ Logs d\'intégration supprimés');
      } catch (error) {
        console.log('ℹ️ Logs d\'intégration non trouvés');
      }

      result.success = true;
      console.log('🎉 Suppression de toutes les données financières terminée avec succès');

    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression des données financières:', error);
      result.errors.push(error.message);
    }

    return result;
  }

  /**
   * Supprimer tous les documents d'une collection
   */
  private static async deleteCollection(collectionName: string): Promise<number> {
    try {
      console.log(`🔄 Suppression de la collection: ${collectionName}`);
      
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      if (snapshot.empty) {
        console.log(`ℹ️ Collection ${collectionName} est déjà vide`);
        return 0;
      }

      // Supprimer par lots de 500 documents maximum
      const batchSize = 500;
      let totalDeleted = 0;
      const docs = snapshot.docs;

      // Traiter les documents par lots
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(db); // Créer un nouveau batch pour chaque lot
        const batchDocs = docs.slice(i, i + batchSize);
        
        // Ajouter les suppressions au batch
        for (const docSnapshot of batchDocs) {
          batch.delete(doc(db, collectionName, docSnapshot.id));
        }

        // Commit le batch
        await batch.commit();
        totalDeleted += batchDocs.length;
        
        console.log(`📦 Batch de ${batchDocs.length} documents supprimé de ${collectionName} (${totalDeleted}/${docs.length})`);
        
        // Petite pause entre les batches pour éviter la surcharge
        if (i + batchSize < docs.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`✅ Collection ${collectionName} vidée: ${totalDeleted} document(s) supprimé(s)`);
      return totalDeleted;

    } catch (error: any) {
      console.error(`❌ Erreur lors de la suppression de la collection ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Vérifier le nombre de documents dans les collections financières
   */
  static async getFinancialDataCounts(): Promise<{
    transactions: number;
    fees: number;
    salaries: number;
    payroll: number;
  }> {
    try {
      const counts = {
        transactions: 0,
        fees: 0,
        salaries: 0,
        payroll: 0
      };

      // Compter les transactions
      try {
        const transactionsSnapshot = await getDocs(collection(db, 'transactions'));
        counts.transactions = transactionsSnapshot.size;
      } catch (error) {
        // Collection vide ou non créée, c'est normal
      }

      // Compter les paiements d'écolage
      try {
        const feesSnapshot = await getDocs(collection(db, 'fees'));
        counts.fees = feesSnapshot.size;
      } catch (error) {
        // Collection vide ou non créée, c'est normal
      }

      // Compter les salaires
      try {
        const salariesSnapshot = await getDocs(collection(db, 'salaries'));
        counts.salaries = salariesSnapshot.size;
      } catch (error) {
        // Collection vide ou non créée, c'est normal
      }

      // Compter les bulletins de paie
      try {
        const payrollSnapshot = await getDocs(collection(db, 'payroll'));
        counts.payroll = payrollSnapshot.size;
      } catch (error) {
        // Collection vide ou non créée, c'est normal
      }

      return counts;
    } catch (error) {
      console.warn('Erreur lors du comptage des données (normal si base vide):', error);
      return { transactions: 0, fees: 0, salaries: 0, payroll: 0 };
    }
  }

  /**
   * Nettoyer TOUS les doublons de transactions (pas seulement les salaires)
   */
  static async cleanupAllDuplicateTransactions(): Promise<{
    totalCleaned: number;
    duplicateGroups: number;
    errors: string[];
  }> {
    try {
      console.log('🧹 Début du nettoyage de TOUS les doublons de transactions');
      
      const allTransactions = await transactionsService.getAll();
      console.log(`📊 Total transactions trouvées: ${allTransactions.length}`);
      
      if (allTransactions.length === 0) {
        return { totalCleaned: 0, duplicateGroups: 0, errors: [] };
      }
      
      // Grouper les transactions par signature unique
      const transactionGroups = new Map<string, any[]>();
      
      allTransactions.forEach(transaction => {
        // Créer une signature unique basée sur les champs critiques
        const signature = `${transaction.type}-${transaction.category}-${transaction.description}-${transaction.amount}-${transaction.date}-${transaction.paymentMethod}`;
        
        if (!transactionGroups.has(signature)) {
          transactionGroups.set(signature, []);
        }
        transactionGroups.get(signature)!.push(transaction);
      });
      
      let totalCleaned = 0;
      let duplicateGroups = 0;
      const errors: string[] = [];
      
      console.log(`📊 Groupes de transactions trouvés: ${transactionGroups.size}`);
      
      // Traiter chaque groupe de doublons
      for (const [signature, transactions] of transactionGroups) {
        if (transactions.length > 1) {
          duplicateGroups++;
          console.log(`🔍 Groupe de doublons trouvé: ${transactions.length} transactions identiques`);
          console.log(`📝 Signature: ${signature}`);
          
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
            
            console.log(`✅ Transaction à conserver: ${transactionToKeep.id}`);
            console.log(`🗑️ Transactions à supprimer: ${transactionsToDelete.length}`);
            
            // Supprimer les doublons par lots
            for (const transaction of transactionsToDelete) {
              try {
                if (transaction.id) {
                  await transactionsService.delete(transaction.id);
                  totalCleaned++;
                  console.log(`🗑️ Doublon supprimé: ${transaction.id}`);
                }
              } catch (deleteError: any) {
                errors.push(`Erreur suppression ${transaction.id}: ${deleteError.message}`);
              }
            }
            
          } catch (groupError: any) {
            errors.push(`Erreur traitement groupe: ${groupError.message}`);
          }
        }
      }
      
      console.log(`✅ Nettoyage global terminé: ${totalCleaned} doublon(s) supprimé(s) dans ${duplicateGroups} groupe(s)`);
      
      return { totalCleaned, duplicateGroups, errors };
    } catch (error: any) {
      console.error('❌ Erreur lors du nettoyage global des doublons:', error);
      return { totalCleaned: 0, duplicateGroups: 0, errors: [error.message] };
    }
  }

  /**
   * Analyser les doublons sans les supprimer
   */
  static async analyzeDuplicateTransactions(): Promise<{
    totalTransactions: number;
    duplicateGroups: Array<{
      signature: string;
      count: number;
      transactions: any[];
    }>;
    totalDuplicates: number;
  }> {
    try {
      console.log('🔍 Analyse des doublons de transactions');
      
      const allTransactions = await transactionsService.getAll();
      console.log(`📊 Total transactions à analyser: ${allTransactions.length}`);
      
      if (allTransactions.length === 0) {
        return { totalTransactions: 0, duplicateGroups: [], totalDuplicates: 0 };
      }
      
      // Grouper les transactions par signature unique
      const transactionGroups = new Map<string, any[]>();
      
      allTransactions.forEach(transaction => {
        const signature = `${transaction.type}-${transaction.category}-${transaction.description}-${transaction.amount}-${transaction.date}-${transaction.paymentMethod}`;
        
        if (!transactionGroups.has(signature)) {
          transactionGroups.set(signature, []);
        }
        transactionGroups.get(signature)!.push(transaction);
      });
      
      // Identifier les groupes avec des doublons
      const duplicateGroups: Array<{
        signature: string;
        count: number;
        transactions: any[];
      }> = [];
      
      let totalDuplicates = 0;
      
      for (const [signature, transactions] of transactionGroups) {
        if (transactions.length > 1) {
          duplicateGroups.push({
            signature,
            count: transactions.length,
            transactions
          });
          totalDuplicates += transactions.length - 1; // -1 car on garde un original
        }
      }
      
      console.log(`📊 Analyse terminée: ${duplicateGroups.length} groupe(s) de doublons, ${totalDuplicates} doublons au total`);
      
      return {
        totalTransactions: allTransactions.length,
        duplicateGroups,
        totalDuplicates
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'analyse des doublons:', error);
      return { totalTransactions: 0, duplicateGroups: [], totalDuplicates: 0 };
    }
  }
}