// Service de gestion des montants d'écolage par classe
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ClassEcolageAmount {
  id?: string;
  className: string;
  level: string;
  monthlyAmount: number;
  annualAmount: number;
  registrationFee?: number;
  examFee?: number;
  isActive: boolean;
  effectiveDate: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EcolageSettings {
  id?: string;
  defaultMonthlyAmount: number;
  defaultRegistrationFee: number;
  defaultExamFee: number;
  academicYear: string;
  paymentSchedule: {
    startMonth: number;
    endMonth: number;
    totalMonths: number;
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ClassEcolageService {
  private static readonly COLLECTION_NAME = 'class_ecolage_amounts';
  private static readonly SETTINGS_COLLECTION = 'ecolage_settings';
  
  /**
   * Obtenir les montants d'écolage pour toutes les classes
   */
  static async getAllClassAmounts(): Promise<ClassEcolageAmount[]> {
    try {
      const collectionRef = collection(db, this.COLLECTION_NAME);
      const snapshot = await getDocs(collectionRef);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as ClassEcolageAmount[];
    } catch (error) {
      console.error('Erreur lors de la récupération des montants par classe:', error);
      return [];
    }
  }

  /**
   * Obtenir le montant d'écolage pour une classe spécifique
   */
  static async getClassAmount(className: string): Promise<ClassEcolageAmount | null> {
    try {
      const allAmounts = await this.getAllClassAmounts();
      return allAmounts.find(amount => amount.className === className) || null;
    } catch (error) {
      console.error(`Erreur lors de la récupération du montant pour ${className}:`, error);
      return null;
    }
  }

  /**
   * Définir ou mettre à jour le montant d'écolage pour une classe
   */
  static async setClassAmount(classAmount: Omit<ClassEcolageAmount, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docId = `class_${classAmount.className.replace(/\s+/g, '_').toLowerCase()}`;
      const docRef = doc(db, this.COLLECTION_NAME, docId);
      
      const dataToSave = {
        ...classAmount,
        annualAmount: classAmount.monthlyAmount * 10, // 10 mois d'école
        updatedAt: new Date(),
        createdAt: new Date() // Sera ignoré si le document existe déjà
      };
      
      await setDoc(docRef, dataToSave, { merge: true });
      
      console.log(`✅ Montant d'écolage défini pour ${classAmount.className}: ${classAmount.monthlyAmount.toLocaleString()} Ar/mois`);
      
      return docId;
    } catch (error) {
      console.error('Erreur lors de la définition du montant:', error);
      throw error;
    }
  }

  /**
   * Obtenir les paramètres généraux d'écolage
   */
  static async getEcolageSettings(): Promise<EcolageSettings | null> {
    try {
      const docRef = doc(db, this.SETTINGS_COLLECTION, 'current');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate()
        } as EcolageSettings;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      return null;
    }
  }

  /**
   * Mettre à jour les paramètres généraux d'écolage
   */
  static async updateEcolageSettings(settings: Omit<EcolageSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    try {
      const docRef = doc(db, this.SETTINGS_COLLECTION, 'current');
      
      const dataToSave = {
        ...settings,
        updatedAt: new Date(),
        createdAt: new Date() // Sera ignoré si le document existe déjà
      };
      
      await setDoc(docRef, dataToSave, { merge: true });
      
      console.log('✅ Paramètres d\'écolage mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
      throw error;
    }
  }

  /**
   * Initialiser les montants par défaut pour toutes les classes
   */
  static async initializeDefaultAmounts(classes: any[]): Promise<void> {
    try {
      console.log('🚀 Initialisation des montants d\'écolage par défaut');
      
      const defaultAmounts: { [key: string]: number } = {
        // Maternelle
        'TPSA': 120000, 'TPSB': 120000,
        'PSA': 130000, 'PSB': 130000, 'PSC': 130000,
        'MS_A': 140000, 'MSB': 140000,
        'GSA': 150000, 'GSB': 150000, 'GSC': 150000,
        
        // Primaire
        '11_A': 160000, '11B': 160000,
        '10_A': 170000, '10_B': 170000,
        '9A': 180000, '9_B': 180000,
        '8': 190000, '7': 200000,
        
        // Spécialisé
        'CS': 110000, 'GARDERIE': 100000
      };

      for (const classItem of classes) {
        const monthlyAmount = defaultAmounts[classItem.name] || 150000;
        
        await this.setClassAmount({
          className: classItem.name,
          level: classItem.level,
          monthlyAmount,
          annualAmount: monthlyAmount * 10,
          registrationFee: 50000,
          examFee: 25000,
          isActive: true,
          effectiveDate: new Date().toISOString().split('T')[0],
          notes: 'Montant initialisé automatiquement'
        });
      }
      
      console.log(`✅ Montants initialisés pour ${classes.length} classe(s)`);
    } catch (error) {
      console.error('Erreur lors de l\'initialisation:', error);
      throw error;
    }
  }

  /**
   * Écouter les changements en temps réel
   */
  static onClassAmountsChange(callback: (amounts: ClassEcolageAmount[]) => void): Unsubscribe {
    const collectionRef = collection(db, this.COLLECTION_NAME);
    
    return onSnapshot(collectionRef, (snapshot) => {
      const amounts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as ClassEcolageAmount[];
      
      callback(amounts);
    });
  }

  /**
   * Obtenir le montant suggéré pour une classe (avec fallback)
   */
  static async getSuggestedAmount(className: string, level: string): Promise<{
    monthlyAmount: number;
    registrationFee: number;
    examFee: number;
    source: 'configured' | 'default';
  }> {
    try {
      // Essayer d'obtenir le montant configuré
      const classAmount = await this.getClassAmount(className);
      
      if (classAmount && classAmount.isActive) {
        return {
          monthlyAmount: classAmount.monthlyAmount,
          registrationFee: classAmount.registrationFee || 50000,
          examFee: classAmount.examFee || 25000,
          source: 'configured'
        };
      }
      
      // Fallback vers les montants par défaut
      const defaultAmounts: { [key: string]: number } = {
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
      
      const monthlyAmount = defaultAmounts[className] || 150000;
      
      return {
        monthlyAmount,
        registrationFee: 50000,
        examFee: 25000,
        source: 'default'
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du montant suggéré:', error);
      return {
        monthlyAmount: 150000,
        registrationFee: 50000,
        examFee: 25000,
        source: 'default'
      };
    }
  }

  /**
   * Supprimer le montant d'une classe
   */
  static async deleteClassAmount(className: string): Promise<void> {
    try {
      const docId = `class_${className.replace(/\s+/g, '_').toLowerCase()}`;
      const docRef = doc(db, this.COLLECTION_NAME, docId);
      
      await setDoc(docRef, { isActive: false, updatedAt: new Date() }, { merge: true });
      
      console.log(`✅ Montant désactivé pour ${className}`);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }
}