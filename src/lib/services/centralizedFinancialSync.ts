// Service de synchronisation automatique centralisée pour toutes les opérations financières
import { onSnapshot, query, where } from 'firebase/firestore';
import { feesService, salariesService, transactionsService } from '../firebase/firebaseService';

export interface CentralizedSyncResult {
  success: boolean;
  syncedRecords: number;
  errors: string[];
}

export interface CentralizedSyncStatus {
  isActive: boolean;
  activeListeners: number;
  lastSyncTime: Date;
  totalSyncedRecords: number;
  ecolageSync: {
    active: boolean;
    recordsProcessed: number;
  };
  salarySync: {
    active: boolean;
    recordsProcessed: number;
  };
  errors: string[];
}

export class CentralizedFinancialSyncService {
  private static activeListeners: Map<string, () => void> = new Map();
  private static syncStatus: CentralizedSyncStatus = {
    isActive: false,
    activeListeners: 0,
    lastSyncTime: new Date(),
    totalSyncedRecords: 0,
    ecolageSync: {
      active: false,
      recordsProcessed: 0
    },
    salarySync: {
      active: false,
      recordsProcessed: 0
    },
    errors: []
  };

  /**
   * Initialiser la synchronisation centralisée complète
   */
  static async initializeCentralizedSync(): Promise<CentralizedSyncResult> {
    try {
      console.log('🚀 Initialisation de la synchronisation financière centralisée');
      
      // Nettoyer les anciens listeners
      this.cleanup();
      
      let totalSyncedRecords = 0;
      const errors: string[] = [];

      // 1. Initialiser la synchronisation Écolage → Encaissements
      try {
        const ecolageResult = await this.initializeEcolageSync();
        totalSyncedRecords += ecolageResult.syncedRecords;
        errors.push(...ecolageResult.errors);
        
        this.syncStatus.ecolageSync = {
          active: ecolageResult.success,
          recordsProcessed: ecolageResult.syncedRecords
        };
        
        console.log(`✅ Synchronisation Écolage initialisée: ${ecolageResult.syncedRecords} enregistrement(s)`);
      } catch (error: any) {
        errors.push(`Écolage: ${error.message}`);
      }

      // 2. Initialiser la synchronisation Salaires → Décaissements
      try {
        const salaryResult = await this.initializeSalarySync();
        totalSyncedRecords += salaryResult.syncedRecords;
        errors.push(...salaryResult.errors);
        
        this.syncStatus.salarySync = {
          active: salaryResult.success,
          recordsProcessed: salaryResult.syncedRecords
        };
        
        console.log(`✅ Synchronisation Salaires initialisée: ${salaryResult.syncedRecords} enregistrement(s)`);
      } catch (error: any) {
        errors.push(`Salaires: ${error.message}`);
      }

      // Mettre à jour le statut global
      this.syncStatus = {
        ...this.syncStatus,
        isActive: this.activeListeners.size > 0,
        activeListeners: this.activeListeners.size,
        lastSyncTime: new Date(),
        totalSyncedRecords,
        errors
      };

      console.log(`🎉 Synchronisation centralisée initialisée: ${totalSyncedRecords} enregistrement(s) total`);
      
      // Émettre un événement global
      window.dispatchEvent(new CustomEvent('centralizedFinancialSyncInitialized', {
        detail: this.syncStatus
      }));

      return {
        success: errors.length === 0,
        syncedRecords: totalSyncedRecords,
        errors
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'initialisation de la synchronisation centralisée:', error);
      return {
        success: false,
        syncedRecords: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Initialiser la synchronisation Écolage → Encaissements
   */
  private static async initializeEcolageSync(): Promise<CentralizedSyncResult> {
    try {
      console.log('🔄 Initialisation de la synchronisation Écolage → Encaissements');
      
      const collectionRef = feesService.getCollectionRef();
      
      // Écouter tous les changements dans la collection fees
      const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
          console.log('📊 Changement détecté dans les paiements d\'écolage');
          
          snapshot.docChanges().forEach((change) => {
            const paymentData = { id: change.doc.id, ...change.doc.data() };
            
            if (change.type === 'added') {
              this.handleEcolageAdded(paymentData);
            } else if (change.type === 'modified') {
              this.handleEcolageModified(paymentData);
            } else if (change.type === 'removed') {
              this.handleEcolageRemoved(paymentData);
            }
          });

          this.syncStatus.lastSyncTime = new Date();
        },
        (error) => {
          console.error('❌ Erreur du listener écolage:', error);
          this.syncStatus.errors.push(`Écolage: ${error.message}`);
        }
      );

      // Stocker le listener
      this.activeListeners.set('ecolage_sync', unsubscribe);

      // Synchroniser les données existantes
      const existingPayments = await feesService.getAll();
      let syncedRecords = 0;
      const errors: string[] = [];

      for (const payment of existingPayments) {
        try {
          await this.createEncaissementFromEcolage(payment);
          syncedRecords++;
        } catch (error: any) {
          errors.push(`${payment.studentName}: ${error.message}`);
        }
      }

      return {
        success: errors.length === 0,
        syncedRecords,
        errors
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'initialisation de la synchronisation écolage:', error);
      return {
        success: false,
        syncedRecords: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Initialiser la synchronisation Salaires → Décaissements
   */
  private static async initializeSalarySync(): Promise<CentralizedSyncResult> {
    try {
      console.log('🔄 Initialisation de la synchronisation Salaires → Décaissements');
      
      const collectionRef = salariesService.getCollectionRef();
      
      // Écouter tous les changements dans la collection salaries
      const unsubscribe = onSnapshot(
        collectionRef,
        (snapshot) => {
          console.log('📊 Changement détecté dans les salaires');
          
          snapshot.docChanges().forEach((change) => {
            const salaryData = { id: change.doc.id, ...change.doc.data() };
            
            if (change.type === 'added') {
              this.handleSalaryAdded(salaryData);
            } else if (change.type === 'modified') {
              this.handleSalaryModified(salaryData);
            } else if (change.type === 'removed') {
              this.handleSalaryRemoved(salaryData);
            }
          });

          this.syncStatus.lastSyncTime = new Date();
        },
        (error) => {
          console.error('❌ Erreur du listener salaires:', error);
          this.syncStatus.errors.push(`Salaires: ${error.message}`);
        }
      );

      // Stocker le listener
      this.activeListeners.set('salary_sync', unsubscribe);

      // Synchroniser les données existantes
      const existingSalaries = await salariesService.getAll();
      let syncedRecords = 0;
      const errors: string[] = [];

      for (const salary of existingSalaries) {
        try {
          await this.createDecaissementFromSalary(salary);
          syncedRecords++;
        } catch (error: any) {
          errors.push(`${salary.employeeName}: ${error.message}`);
        }
      }

      return {
        success: errors.length === 0,
        syncedRecords,
        errors
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'initialisation de la synchronisation salaires:', error);
      return {
        success: false,
        syncedRecords: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Gérer l'ajout d'un nouveau paiement d'écolage
   */
  private static async handleEcolageAdded(paymentData: any): Promise<void> {
    console.log('➕ Nouveau paiement d\'écolage détecté:', paymentData.studentName);
    
    try {
      await this.createEncaissementFromEcolage(paymentData);
      this.syncStatus.ecolageSync.recordsProcessed++;
      
      // Émettre un événement de synchronisation
      window.dispatchEvent(new CustomEvent('ecolageToTransactionSync', {
        detail: {
          type: 'added',
          paymentId: paymentData.id,
          studentName: paymentData.studentName,
          amount: paymentData.amount,
          syncTime: new Date()
        }
      }));
      
      console.log(`✅ Encaissement créé automatiquement pour ${paymentData.studentName}`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la création d\'encaissement:', error);
      this.syncStatus.errors.push(`Écolage ${paymentData.studentName}: ${error.message}`);
    }
  }

  /**
   * Gérer la modification d'un paiement d'écolage
   */
  private static async handleEcolageModified(paymentData: any): Promise<void> {
    console.log('✏️ Paiement d\'écolage modifié:', paymentData.studentName);
    
    try {
      // Trouver la transaction liée et la mettre à jour
      await this.updateRelatedTransaction('ecolage', paymentData);
      
      console.log(`✅ Transaction d'encaissement mise à jour pour ${paymentData.studentName}`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour d\'encaissement:', error);
    }
  }

  /**
   * Gérer la suppression d'un paiement d'écolage
   */
  private static async handleEcolageRemoved(paymentData: any): Promise<void> {
    console.log('🗑️ Paiement d\'écolage supprimé:', paymentData.studentName);
    
    try {
      // Supprimer la transaction liée
      await this.deleteRelatedTransaction('ecolage', paymentData.id);
      
      console.log(`✅ Transaction d'encaissement supprimée pour ${paymentData.studentName}`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression d\'encaissement:', error);
    }
  }

  /**
   * Gérer l'ajout d'un nouveau salaire
   */
  private static async handleSalaryAdded(salaryData: any): Promise<void> {
    console.log('➕ Nouveau salaire détecté:', salaryData.employeeName);
    
    try {
      await this.createDecaissementFromSalary(salaryData);
      this.syncStatus.salarySync.recordsProcessed++;
      
      // Émettre un événement de synchronisation
      window.dispatchEvent(new CustomEvent('salaryToTransactionSync', {
        detail: {
          type: 'added',
          salaryId: salaryData.id,
          employeeName: salaryData.employeeName,
          amount: salaryData.netSalary,
          syncTime: new Date()
        }
      }));
      
      console.log(`✅ Décaissement créé automatiquement pour ${salaryData.employeeName}`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la création de décaissement:', error);
      this.syncStatus.errors.push(`Salaire ${salaryData.employeeName}: ${error.message}`);
    }
  }

  /**
   * Gérer la modification d'un salaire
   */
  private static async handleSalaryModified(salaryData: any): Promise<void> {
    console.log('✏️ Salaire modifié:', salaryData.employeeName);
    
    try {
      // Trouver la transaction liée et la mettre à jour
      await this.updateRelatedTransaction('salary', salaryData);
      
      console.log(`✅ Transaction de décaissement mise à jour pour ${salaryData.employeeName}`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour de décaissement:', error);
    }
  }

  /**
   * Gérer la suppression d'un salaire
   */
  private static async handleSalaryRemoved(salaryData: any): Promise<void> {
    console.log('🗑️ Salaire supprimé:', salaryData.employeeName);
    
    try {
      // Supprimer la transaction liée
      await this.deleteRelatedTransaction('salary', salaryData.id);
      
      console.log(`✅ Transaction de décaissement supprimée pour ${salaryData.employeeName}`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression de décaissement:', error);
    }
  }

  /**
   * Créer un encaissement automatique à partir d'un paiement d'écolage
   */
  private static async createEncaissementFromEcolage(paymentData: any): Promise<string | null> {
    try {
      // Vérifier si une transaction existe déjà pour ce paiement
      const existingTransactions = await transactionsService.getAll();
      const existingTransaction = existingTransactions.find(t => 
        t.relatedModule === 'ecolage' && 
        t.relatedId === paymentData.id
      );

      if (existingTransaction) {
        console.log(`ℹ️ Transaction déjà existante pour le paiement ${paymentData.id}`);
        return existingTransaction.id;
      }

      // Créer la transaction d'encaissement
      const transactionData = {
        type: 'Encaissement',
        category: 'Écolages',
        description: `Écolage ${paymentData.studentName} - ${paymentData.period}`,
        amount: paymentData.amount,
        date: paymentData.paymentDate,
        paymentMethod: this.mapPaymentMethod(paymentData.paymentMethod),
        status: this.mapPaymentStatus(paymentData.status),
        reference: paymentData.reference,
        relatedModule: 'ecolage',
        relatedId: paymentData.id,
        isManual: false,
        notes: `Synchronisation automatique - Classe: ${paymentData.class} - Créé: ${new Date().toLocaleString('fr-FR')}`
      };

      const transactionId = await transactionsService.create(transactionData);
      
      console.log(`✅ Encaissement créé: ${transactionId} pour ${paymentData.studentName}`);
      
      return transactionId;
    } catch (error: any) {
      console.error('❌ Erreur lors de la création d\'encaissement:', error);
      throw error;
    }
  }

  /**
   * Créer un décaissement automatique à partir d'un salaire
   */
  private static async createDecaissementFromSalary(salaryData: any): Promise<string | null> {
    try {
      // Vérifier si une transaction existe déjà pour ce salaire
      const existingTransactions = await transactionsService.getAll();
      const existingTransaction = existingTransactions.find(t => 
        t.relatedModule === 'salary' && 
        t.relatedId === salaryData.id
      );

      if (existingTransaction) {
        console.log(`ℹ️ Transaction déjà existante pour le salaire ${salaryData.id}`);
        return existingTransaction.id;
      }

      // Créer la transaction de décaissement
      const monthNames = [
        '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      
      const periodLabel = `${monthNames[salaryData.paymentMonth]} ${salaryData.paymentYear}`;
      
      const transactionData = {
        type: 'Décaissement',
        category: 'Salaires',
        description: `Salaire ${salaryData.employeeName} - ${periodLabel}`,
        amount: salaryData.netSalary,
        date: salaryData.effectiveDate,
        paymentMethod: 'Virement',
        status: this.mapSalaryStatus(salaryData.status),
        reference: `SAL-${salaryData.paymentYear}-${salaryData.employeeId?.substring(0, 4).toUpperCase() || 'EMP'}`,
        relatedModule: 'salary',
        relatedId: salaryData.id,
        isManual: false,
        notes: `Synchronisation automatique - Poste: ${salaryData.position} - Département: ${salaryData.department} - Créé: ${new Date().toLocaleString('fr-FR')}`
      };

      const transactionId = await transactionsService.create(transactionData);
      
      console.log(`✅ Décaissement créé: ${transactionId} pour ${salaryData.employeeName}`);
      
      return transactionId;
    } catch (error: any) {
      console.error('❌ Erreur lors de la création de décaissement:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une transaction liée lors de la modification du module source
   */
  private static async updateRelatedTransaction(module: 'ecolage' | 'salary', sourceData: any): Promise<void> {
    try {
      // Trouver la transaction liée
      const allTransactions = await transactionsService.getAll();
      const relatedTransaction = allTransactions.find(t => 
        t.relatedModule === module && 
        t.relatedId === sourceData.id
      );

      if (!relatedTransaction) {
        console.log(`ℹ️ Aucune transaction liée trouvée pour ${module} ${sourceData.id}, création d'une nouvelle`);
        
        if (module === 'ecolage') {
          await this.createEncaissementFromEcolage(sourceData);
        } else {
          await this.createDecaissementFromSalary(sourceData);
        }
        return;
      }

      // Préparer les données de mise à jour
      let updateData: any = {
        amount: module === 'ecolage' ? sourceData.amount : sourceData.netSalary,
        date: module === 'ecolage' ? sourceData.paymentDate : sourceData.effectiveDate,
        status: module === 'ecolage' ? 
          this.mapPaymentStatus(sourceData.status) : 
          this.mapSalaryStatus(sourceData.status),
        updatedAt: new Date(),
        notes: `Mis à jour automatiquement depuis ${module} - ${new Date().toLocaleString('fr-FR')}`
      };

      if (module === 'ecolage') {
        updateData.description = `Écolage ${sourceData.studentName} - ${sourceData.period}`;
        updateData.paymentMethod = this.mapPaymentMethod(sourceData.paymentMethod);
      } else {
        const monthNames = [
          '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        const periodLabel = `${monthNames[sourceData.paymentMonth]} ${sourceData.paymentYear}`;
        updateData.description = `Salaire ${sourceData.employeeName} - ${periodLabel}`;
      }

      await transactionsService.update(relatedTransaction.id, updateData);
      
      console.log(`✅ Transaction mise à jour: ${relatedTransaction.id}`);
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour de transaction:', error);
      throw error;
    }
  }

  /**
   * Supprimer une transaction liée lors de la suppression du module source
   */
  private static async deleteRelatedTransaction(module: 'ecolage' | 'salary', recordId: string): Promise<void> {
    try {
      // Trouver et supprimer la transaction liée
      const allTransactions = await transactionsService.getAll();
      const relatedTransaction = allTransactions.find(t => 
        t.relatedModule === module && 
        t.relatedId === recordId
      );

      if (relatedTransaction && relatedTransaction.id) {
        await transactionsService.delete(relatedTransaction.id);
        console.log(`✅ Transaction liée supprimée: ${relatedTransaction.id}`);
      } else {
        console.log(`ℹ️ Aucune transaction liée trouvée pour ${module} ${recordId}`);
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression de transaction liée:', error);
      throw error;
    }
  }

  /**
   * Mapper les méthodes de paiement
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
   * Mapper les statuts de paiement d'écolage
   */
  private static mapPaymentStatus(status: string): string {
    const mapping: { [key: string]: string } = {
      'paid': 'Validé',
      'pending': 'En attente',
      'overdue': 'En attente'
    };
    
    return mapping[status] || 'En attente';
  }

  /**
   * Mapper les statuts de salaire
   */
  private static mapSalaryStatus(status: string): string {
    const mapping: { [key: string]: string } = {
      'active': 'Validé',
      'pending': 'En attente',
      'inactive': 'Annulé'
    };
    
    return mapping[status] || 'En attente';
  }

  /**
   * Obtenir le statut de synchronisation centralisée
   */
  static getSyncStatus(): CentralizedSyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Synchroniser manuellement toutes les données existantes
   */
  static async syncAllExistingData(): Promise<{
    ecolagesSynced: number;
    salariesSynced: number;
    errors: string[];
  }> {
    try {
      console.log('🔄 Synchronisation manuelle de toutes les données existantes');
      
      let ecolagesSynced = 0;
      let salariesSynced = 0;
      const errors: string[] = [];

      // Synchroniser tous les paiements d'écolage
      const allPayments = await feesService.getAll();
      for (const payment of allPayments) {
        try {
          await this.createEncaissementFromEcolage(payment);
          ecolagesSynced++;
        } catch (error: any) {
          errors.push(`Écolage ${payment.studentName}: ${error.message}`);
        }
      }

      // Synchroniser tous les salaires
      const allSalaries = await salariesService.getAll();
      for (const salary of allSalaries) {
        try {
          await this.createDecaissementFromSalary(salary);
          salariesSynced++;
        } catch (error: any) {
          errors.push(`Salaire ${salary.employeeName}: ${error.message}`);
        }
      }

      console.log(`✅ Synchronisation manuelle terminée: ${ecolagesSynced} écolages, ${salariesSynced} salaires`);
      
      return { ecolagesSynced, salariesSynced, errors };
    } catch (error: any) {
      console.error('❌ Erreur lors de la synchronisation manuelle:', error);
      return {
        ecolagesSynced: 0,
        salariesSynced: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Valider la cohérence de la centralisation
   */
  static async validateCentralization(): Promise<{
    isConsistent: boolean;
    missingEcolageTransactions: number;
    missingSalaryTransactions: number;
    orphanedTransactions: number;
    issues: string[];
  }> {
    try {
      console.log('🔍 Validation de la cohérence de la centralisation');
      
      const allPayments = await feesService.getAll();
      const allSalaries = await salariesService.getAll();
      const allTransactions = await transactionsService.getAll();
      
      const issues: string[] = [];
      
      // Vérifier les paiements d'écolage sans transaction
      const missingEcolageTransactions = allPayments.filter(payment => {
        return !allTransactions.some(t => 
          t.relatedModule === 'ecolage' && 
          t.relatedId === payment.id
        );
      }).length;
      
      if (missingEcolageTransactions > 0) {
        issues.push(`${missingEcolageTransactions} paiement(s) d'écolage sans transaction d'encaissement`);
      }

      // Vérifier les salaires sans transaction
      const missingSalaryTransactions = allSalaries.filter(salary => {
        return !allTransactions.some(t => 
          t.relatedModule === 'salary' && 
          t.relatedId === salary.id
        );
      }).length;
      
      if (missingSalaryTransactions > 0) {
        issues.push(`${missingSalaryTransactions} salaire(s) sans transaction de décaissement`);
      }

      // Vérifier les transactions orphelines
      const orphanedTransactions = allTransactions.filter(transaction => {
        if (!transaction.relatedModule || !transaction.relatedId) return false;
        
        if (transaction.relatedModule === 'ecolage') {
          return !allPayments.some(p => p.id === transaction.relatedId);
        } else if (transaction.relatedModule === 'salary') {
          return !allSalaries.some(s => s.id === transaction.relatedId);
        }
        
        return false;
      }).length;
      
      if (orphanedTransactions > 0) {
        issues.push(`${orphanedTransactions} transaction(s) orpheline(s) sans module source`);
      }

      return {
        isConsistent: issues.length === 0,
        missingEcolageTransactions,
        missingSalaryTransactions,
        orphanedTransactions,
        issues
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de la validation:', error);
      return {
        isConsistent: false,
        missingEcolageTransactions: 0,
        missingSalaryTransactions: 0,
        orphanedTransactions: 0,
        issues: [error.message]
      };
    }
  }

  /**
   * Réparer automatiquement les incohérences de centralisation
   */
  static async repairCentralization(): Promise<{
    ecolagesRepaired: number;
    salariesRepaired: number;
    orphansRemoved: number;
    errors: string[];
  }> {
    try {
      console.log('🔧 Réparation automatique de la centralisation');
      
      let ecolagesRepaired = 0;
      let salariesRepaired = 0;
      let orphansRemoved = 0;
      const errors: string[] = [];

      const allPayments = await feesService.getAll();
      const allSalaries = await salariesService.getAll();
      const allTransactions = await transactionsService.getAll();

      // Réparer les paiements d'écolage manquants
      for (const payment of allPayments) {
        const hasTransaction = allTransactions.some(t => 
          t.relatedModule === 'ecolage' && 
          t.relatedId === payment.id
        );
        
        if (!hasTransaction && payment.status === 'paid') {
          try {
            await this.createEncaissementFromEcolage(payment);
            ecolagesRepaired++;
          } catch (error: any) {
            errors.push(`Écolage ${payment.studentName}: ${error.message}`);
          }
        }
      }

      // Réparer les salaires manquants
      for (const salary of allSalaries) {
        const hasTransaction = allTransactions.some(t => 
          t.relatedModule === 'salary' && 
          t.relatedId === salary.id
        );
        
        if (!hasTransaction && salary.status === 'active') {
          try {
            await this.createDecaissementFromSalary(salary);
            salariesRepaired++;
          } catch (error: any) {
            errors.push(`Salaire ${salary.employeeName}: ${error.message}`);
          }
        }
      }

      // Supprimer les transactions orphelines
      const orphanedTransactions = allTransactions.filter(transaction => {
        if (!transaction.relatedModule || !transaction.relatedId) return false;
        
        if (transaction.relatedModule === 'ecolage') {
          return !allPayments.some(p => p.id === transaction.relatedId);
        } else if (transaction.relatedModule === 'salary') {
          return !allSalaries.some(s => s.id === transaction.relatedId);
        }
        
        return false;
      });

      for (const orphan of orphanedTransactions) {
        try {
          if (orphan.id) {
            await transactionsService.delete(orphan.id);
            orphansRemoved++;
          }
        } catch (error: any) {
          errors.push(`Orphelin ${orphan.id}: ${error.message}`);
        }
      }

      console.log(`✅ Réparation terminée: ${ecolagesRepaired} écolages, ${salariesRepaired} salaires, ${orphansRemoved} orphelins supprimés`);
      
      return { ecolagesRepaired, salariesRepaired, orphansRemoved, errors };
    } catch (error: any) {
      console.error('❌ Erreur lors de la réparation:', error);
      return {
        ecolagesRepaired: 0,
        salariesRepaired: 0,
        orphansRemoved: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Obtenir les statistiques de centralisation
   */
  static async getCentralizationStats(): Promise<{
    totalTransactions: number;
    ecolageTransactions: number;
    salaryTransactions: number;
    manualTransactions: number;
    totalEncaissements: number;
    totalDecaissements: number;
    soldeNet: number;
  }> {
    try {
      const allTransactions = await transactionsService.getAll();
      
      const ecolageTransactions = allTransactions.filter(t => t.relatedModule === 'ecolage').length;
      const salaryTransactions = allTransactions.filter(t => t.relatedModule === 'salary').length;
      const manualTransactions = allTransactions.filter(t => t.isManual === true || !t.relatedModule).length;
      
      const totalEncaissements = allTransactions
        .filter(t => t.type === 'Encaissement' && t.status === 'Validé')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalDecaissements = allTransactions
        .filter(t => t.type === 'Décaissement' && t.status === 'Validé')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        totalTransactions: allTransactions.length,
        ecolageTransactions,
        salaryTransactions,
        manualTransactions,
        totalEncaissements,
        totalDecaissements,
        soldeNet: totalEncaissements - totalDecaissements
      };
    } catch (error) {
      console.error('❌ Erreur lors du calcul des statistiques:', error);
      return {
        totalTransactions: 0,
        ecolageTransactions: 0,
        salaryTransactions: 0,
        manualTransactions: 0,
        totalEncaissements: 0,
        totalDecaissements: 0,
        soldeNet: 0
      };
    }
  }

  /**
   * Nettoyer tous les listeners
   */
  static cleanup(): void {
    console.log('🧹 Nettoyage des listeners de synchronisation centralisée');
    
    this.activeListeners.forEach((unsubscribe, key) => {
      unsubscribe();
      console.log(`🔌 Listener supprimé: ${key}`);
    });
    
    this.activeListeners.clear();
    
    this.syncStatus = {
      isActive: false,
      activeListeners: 0,
      lastSyncTime: new Date(),
      totalSyncedRecords: 0,
      ecolageSync: {
        active: false,
        recordsProcessed: 0
      },
      salarySync: {
        active: false,
        recordsProcessed: 0
      },
      errors: []
    };
  }

  /**
   * Redémarrer la synchronisation centralisée
   */
  static async restart(): Promise<void> {
    console.log('🔄 Redémarrage de la synchronisation centralisée');
    
    this.cleanup();
    await this.initializeCentralizedSync();
  }

  /**
   * Vérifier la santé de la synchronisation centralisée
   */
  static healthCheck(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!this.syncStatus.isActive) {
      issues.push('Synchronisation centralisée inactive');
      recommendations.push('Redémarrer la synchronisation centralisée');
    }

    if (!this.syncStatus.ecolageSync.active) {
      issues.push('Synchronisation écolage inactive');
      recommendations.push('Vérifier la connexion au module écolage');
    }

    if (!this.syncStatus.salarySync.active) {
      issues.push('Synchronisation salaires inactive');
      recommendations.push('Vérifier la connexion au module salaires');
    }

    if (this.syncStatus.errors.length > 0) {
      issues.push(`${this.syncStatus.errors.length} erreur(s) de synchronisation`);
      recommendations.push('Consulter les logs d\'erreur et redémarrer');
    }

    if (this.syncStatus.activeListeners === 0) {
      issues.push('Aucun listener actif');
      recommendations.push('Redémarrer tous les listeners');
    }

    const timeSinceLastSync = Date.now() - this.syncStatus.lastSyncTime.getTime();
    if (timeSinceLastSync > 600000) { // 10 minutes
      issues.push('Dernière synchronisation trop ancienne');
      recommendations.push('Vérifier la connectivité et redémarrer');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations
    };
  }
}