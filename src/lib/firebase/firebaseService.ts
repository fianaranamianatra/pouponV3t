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
}

export default FirebaseService;