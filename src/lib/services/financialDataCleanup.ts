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

      // Utiliser un batch pour supprimer par lots (max 500 par batch)
      const batch = writeBatch(db);
      let batchCount = 0;
      let totalDeleted = 0;

      for (const docSnapshot of snapshot.docs) {
        batch.delete(doc(db, collectionName, docSnapshot.id));
        batchCount++;
        
        // Commit le batch quand on atteint 500 documents
        if (batchCount === 500) {
          await batch.commit();
          totalDeleted += batchCount;
          batchCount = 0;
          console.log(`📦 Batch de 500 documents supprimé de ${collectionName}`);
        }
      }

      // Commit le dernier batch s'il reste des documents
      if (batchCount > 0) {
        await batch.commit();
        totalDeleted += batchCount;
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
        console.log('Collection transactions non trouvée');
      }

      // Compter les paiements d'écolage
      try {
        const feesSnapshot = await getDocs(collection(db, 'fees'));
        counts.fees = feesSnapshot.size;
      } catch (error) {
        console.log('Collection fees non trouvée');
      }

      // Compter les salaires
      try {
        const salariesSnapshot = await getDocs(collection(db, 'salaries'));
        counts.salaries = salariesSnapshot.size;
      } catch (error) {
        console.log('Collection salaries non trouvée');
      }

      // Compter les bulletins de paie
      try {
        const payrollSnapshot = await getDocs(collection(db, 'payroll'));
        counts.payroll = payrollSnapshot.size;
      } catch (error) {
        console.log('Collection payroll non trouvée');
      }

      return counts;
    } catch (error) {
      console.error('Erreur lors du comptage des données:', error);
      return { transactions: 0, fees: 0, salaries: 0, payroll: 0 };
    }
  }
}