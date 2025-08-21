import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query,
  orderBy,
  where,
  CollectionReference,
  DocumentReference
} from 'firebase/firestore';
import { db } from './firebase';

// Generic Firebase service class
class FirebaseService<T> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  getCollectionRef(): CollectionReference {
    return collection(db, this.collectionName);
  }

  getDocRef(id: string): DocumentReference {
    return doc(db, this.collectionName, id);
  }

  async create(data: Omit<T, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(this.getCollectionRef(), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Document created in ${this.collectionName} with ID:`, docRef.id);
      return docRef.id;
    } catch (error) {
      console.error(`❌ Error creating document in ${this.collectionName}:`, error);
      throw error;
    }
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = this.getDocRef(id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
      console.log(`✅ Document updated in ${this.collectionName} with ID:`, id);
    } catch (error) {
      console.error(`❌ Error updating document in ${this.collectionName}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = this.getDocRef(id);
      await deleteDoc(docRef);
      console.log(`✅ Document deleted from ${this.collectionName} with ID:`, id);
    } catch (error) {
      console.error(`❌ Error deleting document from ${this.collectionName}:`, error);
      throw error;
    }
  }

  async getAll(): Promise<T[]> {
    try {
      const querySnapshot = await getDocs(this.getCollectionRef());
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      console.log(`✅ Retrieved ${items.length} documents from ${this.collectionName}`);
      return items;
    } catch (error) {
      console.error(`❌ Error getting documents from ${this.collectionName}:`, error);
      throw error;
    }
  }

  async getById(id: string): Promise<T | null> {
    try {
      const docRef = this.getDocRef(id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as T;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`❌ Error getting document from ${this.collectionName}:`, error);
      throw error;
    }
  }
}

// Service instances
export const studentsService = new FirebaseService('students');
export const teachersService = new FirebaseService('teachers');
export const classesService = new FirebaseService('classes');
export const subjectsService = new FirebaseService('subjects');
export const gradesService = new FirebaseService('grades');
export const feesService = new FirebaseService('fees');
export const schedulesService = new FirebaseService('schedules');
export const financesService = new FirebaseService('finances');
export const hierarchyService = new FirebaseService('hierarchy');
export const communicationsService = new FirebaseService('communications');
export const reportsService = new FirebaseService('reports');