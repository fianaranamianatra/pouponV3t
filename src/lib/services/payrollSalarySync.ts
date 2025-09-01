// Service de synchronisation bidirectionnelle entre Gestion de Paie et Gestion des Salaires
import { onSnapshot, query, where } from 'firebase/firestore';
import { salariesService, hierarchyService } from '../firebase/firebaseService';
import { PayrollService, PayrollCalculation } from './payrollService';
import { FinancialIntegrationService } from './financialIntegrationService';

export interface PayrollSalarySyncResult {
  success: boolean;
  syncedRecords: number;
  errors: string[];
}

export interface SyncStatus {
  isActive: boolean;
  activeConnections: number;
  lastSyncTime: Date;
  totalSyncedRecords: number;
  errors: string[];
}

export class PayrollSalarySyncService {
  private static activeListeners: Map<string, () => void> = new Map();
  private static syncStatus: SyncStatus = {
    isActive: false,
    activeConnections: 0,
    lastSyncTime: new Date(),
    totalSyncedRecords: 0,
    errors: []
  };

  /**
   * Initialiser la synchronisation bidirectionnelle pour tous les employés
   */
  static async initializeGlobalSync(): Promise<PayrollSalarySyncResult> {
    try {
      console.log('🚀 Initialisation de la synchronisation Paie ↔ Salaires');
      
      // Charger tous les employés
      const employees = await hierarchyService.getAll();
      const salaryRecords = await salariesService.getAll();
      
      let syncedRecords = 0;
      const errors: string[] = [];

      // Initialiser la synchronisation pour chaque employé
      for (const employee of employees) {
        try {
          await this.initializeEmployeeSync(employee);
          syncedRecords++;
        } catch (error: any) {
          errors.push(`${employee.firstName} ${employee.lastName}: ${error.message}`);
        }
      }

      // Écouter les changements dans la collection des salaires
      this.initializeSalaryCollectionListener();

      this.syncStatus = {
        isActive: true,
        activeConnections: syncedRecords + 1, // +1 pour le listener global
        lastSyncTime: new Date(),
        totalSyncedRecords: syncedRecords,
        errors
      };

      console.log(`✅ Synchronisation initialisée pour ${syncedRecords} employé(s)`);
      
      // Émettre un événement global
      window.dispatchEvent(new CustomEvent('payrollSalarySyncInitialized', {
        detail: this.syncStatus
      }));

      return {
        success: errors.length === 0,
        syncedRecords,
        errors
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'initialisation de la synchronisation:', error);
      return {
        success: false,
        syncedRecords: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Initialiser la synchronisation pour un employé spécifique
   */
  private static async initializeEmployeeSync(employee: any): Promise<void> {
    const employeeId = employee.id;
    const employeeName = `${employee.firstName} ${employee.lastName}`;
    
    console.log(`🔄 Initialisation sync pour ${employeeName}`);

    // Nettoyer l'ancien listener s'il existe
    const existingListener = this.activeListeners.get(employeeId);
    if (existingListener) {
      existingListener();
    }

    // Créer une requête pour les salaires de cet employé
    const collectionRef = salariesService.getCollectionRef();
    const employeeQuery = query(
      collectionRef,
      where('employeeId', '==', employeeId)
    );

    // Écouter les changements en temps réel
    const unsubscribe = onSnapshot(
      employeeQuery,
      (snapshot) => {
        console.log(`📊 Changement détecté dans les salaires de ${employeeName}`);
        
        const salaryRecords = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Synchroniser avec la gestion de paie
        this.syncEmployeeWithPayroll(employee, salaryRecords);
      },
      (error) => {
        console.error(`❌ Erreur de synchronisation pour ${employeeName}:`, error);
        this.syncStatus.errors.push(`${employeeName}: ${error.message}`);
      }
    );

    // Stocker le listener
    this.activeListeners.set(employeeId, unsubscribe);
  }

  /**
   * Écouter les changements globaux dans la collection des salaires
   */
  private static initializeSalaryCollectionListener(): void {
    console.log('🔄 Initialisation du listener global des salaires');

    const collectionRef = salariesService.getCollectionRef();
    
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot) => {
        console.log('📊 Changement global détecté dans les salaires');
        
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
        console.error('❌ Erreur du listener global des salaires:', error);
        this.syncStatus.errors.push(`Listener global: ${error.message}`);
      }
    );

    // Stocker le listener global
    this.activeListeners.set('global_salary_listener', unsubscribe);
  }

  /**
   * Synchroniser un employé avec la gestion de paie
   */
  private static async syncEmployeeWithPayroll(employee: any, salaryRecords: any[]): Promise<void> {
    try {
      const employeeName = `${employee.firstName} ${employee.lastName}`;
      
      // Obtenir le dernier enregistrement de salaire
      const latestSalary = salaryRecords
        .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())[0];

      if (latestSalary) {
        // Recalculer la paie avec les nouvelles données
        const payrollCalculation = await PayrollService.calculatePayroll(
          employee.id, 
          latestSalary.baseSalary
        );

        console.log(`💰 Paie recalculée pour ${employeeName}:`, {
          salaireBrut: payrollCalculation.grossSalary,
          salaireNet: payrollCalculation.netSalary
        });

        // Émettre un événement pour notifier les composants
        window.dispatchEvent(new CustomEvent('payrollSalarySync', {
          detail: {
            employeeId: employee.id,
            employeeName,
            salaryRecord: latestSalary,
            payrollCalculation,
            syncTime: new Date()
          }
        }));

        // Créer automatiquement une transaction financière si nécessaire
        try {
          const result = await FinancialIntegrationService.createSalaryTransaction(latestSalary);
          if (result.success) {
            console.log(`✅ Transaction financière synchronisée pour ${employeeName}`);
          }
        } catch (transactionError) {
          console.warn(`⚠️ Erreur transaction pour ${employeeName}:`, transactionError);
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation employé-paie:', error);
    }
  }

  /**
   * Gérer l'ajout d'un nouveau salaire
   */
  private static async handleSalaryAdded(salaryData: any): Promise<void> {
    console.log('➕ Nouveau salaire ajouté:', salaryData.employeeName);
    
    try {
      // Charger les données de l'employé
      const employee = await hierarchyService.getById(salaryData.employeeId);
      if (employee) {
        await this.syncEmployeeWithPayroll(employee, [salaryData]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du traitement du nouveau salaire:', error);
    }
  }

  /**
   * Gérer la modification d'un salaire
   */
  private static async handleSalaryModified(salaryData: any): Promise<void> {
    console.log('✏️ Salaire modifié:', salaryData.employeeName);
    
    try {
      // Charger les données de l'employé
      const employee = await hierarchyService.getById(salaryData.employeeId);
      if (employee) {
        await this.syncEmployeeWithPayroll(employee, [salaryData]);
      }
    } catch (error) {
      console.error('❌ Erreur lors du traitement de la modification:', error);
    }
  }

  /**
   * Gérer la suppression d'un salaire
   */
  private static async handleSalaryRemoved(salaryData: any): Promise<void> {
    console.log('🗑️ Salaire supprimé:', salaryData.employeeName);
    
    try {
      // Supprimer les transactions liées
      await FinancialIntegrationService.deleteRelatedTransactions('salary', salaryData.id);
      
      // Émettre un événement de suppression
      window.dispatchEvent(new CustomEvent('payrollSalaryRemoved', {
        detail: {
          employeeId: salaryData.employeeId,
          employeeName: salaryData.employeeName,
          removedSalary: salaryData
        }
      }));
    } catch (error) {
      console.error('❌ Erreur lors du traitement de la suppression:', error);
    }
  }

  /**
   * Synchroniser manuellement un employé spécifique
   */
  static async syncSpecificEmployee(employeeId: string): Promise<void> {
    try {
      console.log(`🔄 Synchronisation manuelle pour l'employé ${employeeId}`);
      
      const employee = await hierarchyService.getById(employeeId);
      if (!employee) {
        throw new Error('Employé non trouvé');
      }

      // Charger tous les salaires de cet employé
      const allSalaries = await salariesService.getAll();
      const employeeSalaries = allSalaries.filter(s => s.employeeId === employeeId);

      await this.syncEmployeeWithPayroll(employee, employeeSalaries);
      
      console.log(`✅ Synchronisation manuelle terminée pour ${employee.firstName} ${employee.lastName}`);
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation manuelle:', error);
      throw error;
    }
  }

  /**
   * Calculer et synchroniser la paie pour tous les employés
   */
  static async calculateAndSyncAllPayroll(): Promise<{
    calculated: number;
    synced: number;
    errors: string[];
  }> {
    try {
      console.log('🚀 Calcul et synchronisation globale de la paie');
      
      const employees = await hierarchyService.getAll();
      const activeEmployees = employees.filter(e => e.status === 'active');
      
      let calculated = 0;
      let synced = 0;
      const errors: string[] = [];

      for (const employee of activeEmployees) {
        try {
          // Calculer la paie
          const payrollCalculation = await PayrollService.calculatePayroll(
            employee.id, 
            employee.salary
          );

          // Créer ou mettre à jour l'enregistrement de salaire
          const salaryData = {
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            employeeType: employee.department === 'Enseignement' ? 'teacher' : 'staff',
            position: employee.position,
            department: employee.department,
            paymentMonth: new Date().getMonth() + 1,
            paymentYear: new Date().getFullYear(),
            baseSalary: employee.salary,
            allowances: {
              transport: 0,
              housing: 0,
              meal: 0,
              performance: 0,
              other: 0
            },
            totalGross: payrollCalculation.grossSalary,
            cnaps: payrollCalculation.cnaps.employeeContribution,
            ostie: payrollCalculation.ostie.employeeContribution,
            irsa: payrollCalculation.irsa.montant,
            totalDeductions: payrollCalculation.totalEmployeeContributions,
            netSalary: payrollCalculation.netSalary,
            effectiveDate: new Date().toISOString().split('T')[0],
            status: 'active'
          };

          // Vérifier si un salaire existe déjà pour ce mois
          const existingSalaries = await salariesService.getAll();
          const existingSalary = existingSalaries.find(s => 
            s.employeeId === employee.id && 
            s.paymentMonth === salaryData.paymentMonth &&
            s.paymentYear === salaryData.paymentYear
          );

          if (existingSalary) {
            // Mettre à jour le salaire existant
            await salariesService.update(existingSalary.id!, salaryData);
            console.log(`✅ Salaire mis à jour pour ${employee.firstName} ${employee.lastName}`);
          } else {
            // Créer un nouveau salaire
            await salariesService.create(salaryData);
            console.log(`✅ Nouveau salaire créé pour ${employee.firstName} ${employee.lastName}`);
          }

          calculated++;
          synced++;
        } catch (error: any) {
          errors.push(`${employee.firstName} ${employee.lastName}: ${error.message}`);
        }
      }

      console.log(`✅ Synchronisation globale terminée: ${calculated} calculé(s), ${synced} synchronisé(s)`);
      
      return { calculated, synced, errors };
    } catch (error: any) {
      console.error('❌ Erreur lors de la synchronisation globale:', error);
      return {
        calculated: 0,
        synced: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Synchroniser les modifications de la hiérarchie avec les salaires
   */
  static async syncHierarchyChanges(): Promise<void> {
    console.log('🔄 Synchronisation des changements de hiérarchie');

    const hierarchyCollectionRef = hierarchyService.getCollectionRef();
    
    const unsubscribe = onSnapshot(
      hierarchyCollectionRef,
      (snapshot) => {
        console.log('📊 Changement détecté dans la hiérarchie');
        
        snapshot.docChanges().forEach(async (change) => {
          const employeeData = { id: change.doc.id, ...change.doc.data() };
          
          if (change.type === 'modified') {
            // Vérifier si le salaire a changé
            const oldData = change.doc.metadata.fromCache ? null : change.doc.data();
            if (oldData && oldData.salary !== employeeData.salary) {
              console.log(`💰 Salaire modifié pour ${employeeData.firstName} ${employeeData.lastName}`);
              await this.handleSalaryChangeFromHierarchy(employeeData);
            }
          }
        });
      },
      (error) => {
        console.error('❌ Erreur du listener hiérarchie:', error);
      }
    );

    this.activeListeners.set('hierarchy_listener', unsubscribe);
  }

  /**
   * Gérer les changements de salaire depuis la hiérarchie
   */
  private static async handleSalaryChangeFromHierarchy(employee: any): Promise<void> {
    try {
      console.log(`🔄 Mise à jour du salaire depuis la hiérarchie: ${employee.firstName} ${employee.lastName}`);
      
      // Recalculer la paie avec le nouveau salaire
      const payrollCalculation = await PayrollService.calculatePayroll(
        employee.id, 
        employee.salary
      );

      // Mettre à jour ou créer l'enregistrement de salaire
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const salaryData = {
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        employeeType: employee.department === 'Enseignement' ? 'teacher' : 'staff',
        position: employee.position,
        department: employee.department,
        paymentMonth: currentMonth,
        paymentYear: currentYear,
        baseSalary: employee.salary,
        allowances: {
          transport: 0,
          housing: 0,
          meal: 0,
          performance: 0,
          other: 0
        },
        totalGross: payrollCalculation.grossSalary,
        cnaps: payrollCalculation.cnaps.employeeContribution,
        ostie: payrollCalculation.ostie.employeeContribution,
        irsa: payrollCalculation.irsa.montant,
        totalDeductions: payrollCalculation.totalEmployeeContributions,
        netSalary: payrollCalculation.netSalary,
        effectiveDate: new Date().toISOString().split('T')[0],
        status: 'active',
        notes: 'Mis à jour automatiquement depuis la hiérarchie'
      };

      // Vérifier si un salaire existe déjà pour ce mois
      const existingSalaries = await salariesService.getAll();
      const existingSalary = existingSalaries.find(s => 
        s.employeeId === employee.id && 
        s.paymentMonth === currentMonth &&
        s.paymentYear === currentYear
      );

      if (existingSalary) {
        await salariesService.update(existingSalary.id!, salaryData);
        console.log(`✅ Salaire mis à jour automatiquement`);
      } else {
        await salariesService.create(salaryData);
        console.log(`✅ Nouveau salaire créé automatiquement`);
      }

      // Émettre un événement de synchronisation
      window.dispatchEvent(new CustomEvent('hierarchySalarySync', {
        detail: {
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          newSalary: employee.salary,
          payrollCalculation
        }
      }));

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation hiérarchie → salaire:', error);
    }
  }

  /**
   * Obtenir le statut de synchronisation
   */
  static getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Nettoyer tous les listeners
   */
  static cleanup(): void {
    console.log('🧹 Nettoyage des listeners de synchronisation Paie ↔ Salaires');
    
    this.activeListeners.forEach((unsubscribe, key) => {
      unsubscribe();
      console.log(`🔌 Listener supprimé: ${key}`);
    });
    
    this.activeListeners.clear();
    
    this.syncStatus = {
      isActive: false,
      activeConnections: 0,
      lastSyncTime: new Date(),
      totalSyncedRecords: 0,
      errors: []
    };
  }

  /**
   * Redémarrer la synchronisation
   */
  static async restart(): Promise<void> {
    console.log('🔄 Redémarrage de la synchronisation Paie ↔ Salaires');
    
    this.cleanup();
    await this.initializeGlobalSync();
    await this.syncHierarchyChanges();
  }

  /**
   * Vérifier la santé de la synchronisation
   */
  static healthCheck(): {
    isHealthy: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!this.syncStatus.isActive) {
      issues.push('Synchronisation inactive');
      recommendations.push('Redémarrer la synchronisation');
    }

    if (this.syncStatus.errors.length > 0) {
      issues.push(`${this.syncStatus.errors.length} erreur(s) détectée(s)`);
      recommendations.push('Vérifier les logs d\'erreur');
    }

    if (this.syncStatus.activeConnections === 0) {
      issues.push('Aucune connexion active');
      recommendations.push('Vérifier la connectivité Firebase');
    }

    const timeSinceLastSync = Date.now() - this.syncStatus.lastSyncTime.getTime();
    if (timeSinceLastSync > 300000) { // 5 minutes
      issues.push('Dernière synchronisation trop ancienne');
      recommendations.push('Redémarrer la synchronisation');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Forcer la synchronisation complète
   */
  static async forceSyncAll(): Promise<void> {
    try {
      console.log('🔄 Synchronisation forcée de tous les employés');
      
      const employees = await hierarchyService.getAll();
      const salaries = await salariesService.getAll();
      
      for (const employee of employees) {
        const employeeSalaries = salaries.filter(s => s.employeeId === employee.id);
        await this.syncEmployeeWithPayroll(employee, employeeSalaries);
      }
      
      console.log('✅ Synchronisation forcée terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation forcée:', error);
      throw error;
    }
  }
}