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
      const docRef = await addDoc(this.collectionRef, data);
      return docRef.id;
    } catch (error) {
      console.error("Error adding document: ", error);
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
      await updateDoc(docRef, data);
      return true;
    } catch (error) {
      console.error("Error updating document: ", error);
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