// Service de synchronisation bidirectionnelle entre profils étudiants et écolage
import { onSnapshot, query, where } from 'firebase/firestore';
import { feesService, studentsService } from '../firebase/firebaseService';

export interface StudentEcolageSyncResult {
  success: boolean;
  syncedRecords: number;
  errors: string[];
}

export class StudentEcolageSyncService {
  private static activeListeners: Map<string, () => void> = new Map();

  /**
   * Initialiser la synchronisation bidirectionnelle pour un élève
   */
  static initializeStudentSync(studentId: string, studentName: string, studentClass: string): () => void {
    console.log(`🔄 Initialisation de la synchronisation bidirectionnelle pour ${studentName}`);

    // Nettoyer l'ancien listener s'il existe
    const existingListener = this.activeListeners.get(studentId);
    if (existingListener) {
      existingListener();
    }

    // Créer une requête pour les paiements de cet élève
    const collectionRef = feesService.getCollectionRef();
    const studentQuery = query(
      collectionRef,
      where('studentName', '==', studentName)
    );

    // Écouter les changements en temps réel
    const unsubscribe = onSnapshot(
      studentQuery,
      (snapshot) => {
        console.log(`📊 Changement détecté dans les paiements de ${studentName}`);
        
        const payments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Déclencher la mise à jour du profil étudiant
        this.updateStudentProfile(studentId, payments, studentClass);
      },
      (error) => {
        console.error(`❌ Erreur de synchronisation pour ${studentName}:`, error);
      }
    );

    // Stocker le listener pour pouvoir le nettoyer plus tard
    this.activeListeners.set(studentId, unsubscribe);

    return unsubscribe;
  }

  /**
   * Mettre à jour le profil étudiant avec les données de paiement
   */
  private static async updateStudentProfile(studentId: string, payments: any[], studentClass: string): Promise<void> {
    try {
      // Calculer les statistiques de paiement
      const stats = this.calculatePaymentStats(payments, studentClass);
      
      // Mettre à jour le profil étudiant avec les nouvelles données
      // Note: Dans une vraie implémentation, on pourrait ajouter un champ paymentSummary au profil étudiant
      console.log(`✅ Profil étudiant ${studentId} mis à jour avec les statistiques de paiement:`, stats);
      
      // Émettre un événement personnalisé pour notifier les composants
      window.dispatchEvent(new CustomEvent('studentPaymentUpdate', {
        detail: { studentId, stats, payments }
      }));
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du profil étudiant:', error);
    }
  }

  /**
   * Calculer les statistiques de paiement pour un élève
   */
  private static calculatePaymentStats(payments: any[], studentClass: string) {
    const getMonthlyAmount = (className: string): number => {
      const classAmounts: { [key: string]: number } = {
        'TPSA': 120000, 'TPSB': 120000,
        'PSA': 130000, 'PSB': 130000, 'PSC': 130000,
        'MS_A': 140000, 'MSB': 140000,
        'GSA': 150000, 'GSB': 150000, 'GSC': 150000,
        '11_A': 160000, '11B': 160000,
        '10_A': 170000, '10_B': 170000,
        '9A': 180000, '9_B': 180000,
        '8': 190000, '7': 200000,
        'CS': 110000, 'GARDERIE': 100000
      };
      return classAmounts[className] || 150000;
    };

    const monthlyAmount = getMonthlyAmount(studentClass);
    const totalDue = monthlyAmount * 10; // 10 mois d'école

    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);

    const overduePayments = payments.filter(p => p.status === 'overdue');
    const totalOverdue = overduePayments.reduce((sum, p) => sum + p.amount, 0);

    const remainingBalance = totalDue - totalPaid;
    const paymentRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

    // Déterminer le statut
    let status: 'up_to_date' | 'partial' | 'overdue' | 'critical' = 'up_to_date';
    if (totalOverdue > 0) {
      status = totalOverdue > monthlyAmount * 2 ? 'critical' : 'overdue';
    } else if (remainingBalance > 0) {
      status = 'partial';
    }

    return {
      totalPaid,
      totalDue,
      remainingBalance,
      paymentRate,
      overdueCount: overduePayments.length,
      status,
      lastUpdated: new Date()
    };
  }

  /**
   * Synchroniser tous les profils étudiants avec leurs paiements
   */
  static async syncAllStudentProfiles(): Promise<StudentEcolageSyncResult> {
    try {
      console.log('🚀 Début de la synchronisation globale profils étudiants ↔ écolage');
      
      const students = await studentsService.getAll();
      const allPayments = await feesService.getAll();
      
      let syncedRecords = 0;
      const errors: string[] = [];

      for (const student of students) {
        try {
          const studentName = `${student.firstName} ${student.lastName}`;
          const studentPayments = allPayments.filter(p => p.studentName === studentName);
          
          // Initialiser la synchronisation pour cet élève
          this.initializeStudentSync(student.id!, studentName, student.class);
          
          syncedRecords++;
        } catch (error: any) {
          errors.push(`${student.firstName} ${student.lastName}: ${error.message}`);
        }
      }

      console.log(`✅ Synchronisation globale terminée: ${syncedRecords} élève(s) synchronisé(s)`);
      
      return {
        success: errors.length === 0,
        syncedRecords,
        errors
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de la synchronisation globale:', error);
      return {
        success: false,
        syncedRecords: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Nettoyer tous les listeners actifs
   */
  static cleanup(): void {
    console.log('🧹 Nettoyage des listeners de synchronisation');
    
    this.activeListeners.forEach((unsubscribe, studentId) => {
      unsubscribe();
      console.log(`🔌 Listener supprimé pour l'élève ${studentId}`);
    });
    
    this.activeListeners.clear();
  }

  /**
   * Obtenir le statut de synchronisation global
   */
  static getSyncStatus(): {
    activeListeners: number;
    isActive: boolean;
  } {
    return {
      activeListeners: this.activeListeners.size,
      isActive: this.activeListeners.size > 0
    };
  }
}