import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
} from "firebase/firestore";
import { db } from "../firebase";

class FirebaseService {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.collectionRef = collection(db, collectionName);
  }

  getCollectionRef() {
    return this.collectionRef;
  }

  async create(data) {
    try {
      // 🤖 PRÉVENTION AUTOMATIQUE DES DOUBLONS
      if (this.collectionName === 'transactions') {
        try {
          const { TransactionDeduplicationService } = await import('../services/transactionDeduplicationService');
          const preventionResult = await TransactionDeduplicationService.preventDuplicateOnCreate(data);
          
          if (!preventionResult.shouldCreate) {
            console.log('🚫 DOUBLON EMPÊCHÉ - Réutilisation de la transaction existante:', preventionResult.existingTransactionId);
            return preventionResult.existingTransactionId;
          }
          
          console.log('✅ VÉRIFICATION PASSÉE - Création autorisée:', preventionResult.message);
        } catch (deduplicationError) {
          console.warn('⚠️ Erreur de vérification de doublon, création autorisée par sécurité:', deduplicationError);
          // Continuer avec la création normale en cas d'erreur de vérification
        }
      }
      
      // Ajouter un timestamp de création pour éviter les doublons
      const dataWithTimestamp = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Ajouter un identifiant unique pour cette session
        sessionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      const docRef = await addDoc(this.collectionRef, dataWithTimestamp);
      console.log(`✅ Document créé avec ID: ${docRef.id} dans collection: ${this.collectionName}`);
      
      // Déclencher une vérification de déduplication après création (pour nettoyer d'éventuels doublons résiduels)
      if (this.collectionName === 'transactions') {
        setTimeout(async () => {
          try {
            const { AutomaticDeduplicationService } = await import('../services/automaticDeduplication');
            await AutomaticDeduplicationService.forceCheck();
          } catch (error) {
            console.warn('Erreur lors de la vérification post-création:', error);
          }
        }, 1000); // Délai de 1 seconde pour permettre la propagation
      }
      
      return docRef.id;
    } catch (error) {
      console.error(`❌ Erreur lors de l'ajout dans ${this.collectionName}:`, error);
      throw error;
    }
  }

  async createWithoutDuplicationCheck(data) {
    try {
      // Création directe sans vérification de doublon (pour les cas spéciaux)
      const dataWithTimestamp = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(this.collectionRef, dataWithTimestamp);
      console.log(`✅ Document créé sans vérification: ${docRef.id} dans collection: ${this.collectionName}`);
      return docRef.id;
    } catch (error) {
      console.error(`❌ Erreur lors de l'ajout direct dans ${this.collectionName}:`, error);
      throw error;
    }
  }

  async createSafe(data) {
    try {
      // Version ultra-sécurisée avec vérifications multiples
      if (this.collectionName === 'transactions') {
        // Vérification 1: Doublon exact
        const { TransactionDeduplicationService } = await import('../services/transactionDeduplicationService');
        const duplicateCheck = await TransactionDeduplicationService.checkForDuplicate(data);
        
        if (duplicateCheck.isDuplicate) {
          console.log('🚫 DOUBLON DÉTECTÉ - Réutilisation:', duplicateCheck.existingTransaction?.id);
          return duplicateCheck.existingTransaction.id;
        }
        
        // Vérification 2: Transactions très similaires (même montant, même date, même type)
        const allTransactions = await this.getAll();
        const similarTransaction = allTransactions.find(t => 
          t.type === data.type &&
          t.amount === data.amount &&
          t.date === data.date &&
          Math.abs(new Date(t.createdAt || t.date).getTime() - Date.now()) < 60000 // Créé dans la dernière minute
        );
        
        if (similarTransaction) {
          console.log('🚫 TRANSACTION SIMILAIRE RÉCENTE DÉTECTÉE - Réutilisation:', similarTransaction.id);
          return similarTransaction.id;
        }
      }
      
      // Création sécurisée avec métadonnées anti-doublon
      const dataWithTimestamp = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        creationSource: 'safe_create'
      };
      
      const docRef = await addDoc(this.collectionRef, dataWithTimestamp);
      console.log(`✅ Document créé de manière sécurisée: ${docRef.id} dans collection: ${this.collectionName}`);
      return docRef.id;
    } catch (error) {
      console.error(`❌ Erreur lors de l'ajout sécurisé dans ${this.collectionName}:`, error);
      throw error;
    }
  }

  async getAll() {
    try {
      const querySnapshot = await getDocs(this.collectionRef);
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({ id: doc.id, ...doc.data() });
      });
      return documents;
    } catch (error) {
      console.error("Error getting documents: ", error);
      throw error;
    }
  }

  async getById(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error getting document: ", error);
      throw error;
    }
  }

  async update(id, data) {
    try {
      const docRef = doc(db, this.collectionName, id);
      // Ajouter un timestamp de mise à jour
      const dataWithTimestamp = {
        ...data,
        updatedAt: new Date()
      };
      
      await updateDoc(docRef, dataWithTimestamp);
      console.log(`✅ Document mis à jour avec ID: ${id} dans collection: ${this.collectionName}`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur lors de la mise à jour dans ${this.collectionName}:`, error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error("Error deleting document: ", error);
      throw error;
    }
  }

  async generateGradesReport(filters) {
    try {
      // Implementation for generating grades report
      const documents = await this.getAll();
      return documents.filter(doc => {
        // Apply filters if provided
        if (filters) {
          // Add filtering logic based on the filters parameter
          return true; // Placeholder logic
        }
        return true;
      });
    } catch (error) {
      console.error("Error generating grades report: ", error);
      throw error;
    }
  }
}

// Create and export service instances for each collection
export const studentsService = new FirebaseService('students');
export const teachersService = new FirebaseService('teachers');
export const classesService = new FirebaseService('classes');
export const subjectsService = new FirebaseService('subjects');
export const feesService = new FirebaseService('fees');
export const reportsService = new FirebaseService('reports');
export const hierarchyService = new FirebaseService('hierarchy');

// Service pour la gestion des salaires
export const salariesService = new FirebaseService('salaries');

// Service pour la gestion des transactions financières
export const transactionsService = new FirebaseService('transactions');

// Service pour les paramètres d'intégration financière
export const financialSettingsService = new FirebaseService('financial_settings');

// Service pour les logs d'intégration
export const integrationLogsService = new FirebaseService('integration_logs');

export default FirebaseService;