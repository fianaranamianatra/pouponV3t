import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { USER_ROLES, PERMISSIONS } from "./roles";

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions?: string[];
  createdAt: Date;
  lastLogin?: Date;
  avatar?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
}

// Connexion utilisateur
export const signIn = async (email: string, password: string) => {
  try {
    console.log('Tentative de connexion pour:', email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Mettre à jour la dernière connexion
    try {
      console.log('Mise à jour de la dernière connexion');
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        lastLogin: new Date()
      }, { merge: true });
    } catch (firestoreError) {
      console.error("Erreur lors de la mise à jour Firestore:", firestoreError);
    }
    
    console.log('Connexion réussie pour:', email);
    return userCredential.user;
  } catch (error: any) {
    console.error('Erreur de connexion:', error.code, error.message);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Inscription utilisateur
export const signUp = async (
  email: string, 
  password: string, 
  firstName: string, 
  lastName: string,
  role: string = USER_ROLES.PARENT
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Mettre à jour le profil
    await updateProfile(userCredential.user, {
      displayName: `${firstName} ${lastName}`
    });
    
    // Créer le profil utilisateur dans Firestore
    const userProfile: UserProfile = {
      uid: userCredential.user.uid,
      email,
      firstName,
      lastName,
      role,
      permissions: PERMISSIONS[role],
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date()
    };
    
    try {
      await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
    } catch (firestoreError) {
      console.log("Erreur lors de la création du profil Firestore (mode hors ligne possible)");
    }
    
    return userCredential.user;
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Déconnexion
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("Déconnexion réussie");
    // Forcer le rechargement de la page pour réinitialiser l'état
    window.location.href = '/login';
  } catch (error: any) {
    console.error("Erreur lors de la déconnexion:", error);
    throw new Error("Erreur lors de la déconnexion");
  }
};

// Récupérer le profil utilisateur
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const PROFILE_TIMEOUT = 8000; // 8 secondes
  
  try {
    console.log('🔄 Récupération du profil utilisateur avec timeout:', uid);
    
    // Créer une promesse avec timeout
    const profilePromise = new Promise<UserProfile | null>(async (resolve, reject) => {
      try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Check if user is active
          if (data.isActive === false) {
            reject(new Error("USER_ACCOUNT_DISABLED"));
            return;
          }
          
          resolve({
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastLogin: data.lastLogin?.toDate()
          } as UserProfile);
        } else {
          resolve(null);
        }
      } catch (error) {
        reject(error);
      }
    });
    
    // Promesse de timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('PROFILE_FETCH_TIMEOUT'));
      }, PROFILE_TIMEOUT);
    });
    
    // Course entre la récupération et le timeout
    const result = await Promise.race([profilePromise, timeoutPromise]);
    
    console.log('✅ Profil utilisateur récupéré avec succès');
    return result;
    
  } catch (error: any) {
    console.error("Erreur lors de la récupération du profil:", error);
    
    // Gestion spécifique du timeout
    if (error.message === 'PROFILE_FETCH_TIMEOUT') {
      console.warn("⏰ Timeout lors de la récupération du profil utilisateur");
      throw new Error("timeout: La récupération du profil utilisateur a pris trop de temps");
    }
    
    // Gestion spécifique des erreurs de connectivité
    if (error.code === 'unavailable' || error.message.includes('offline')) {
      console.warn("Mode hors ligne détecté, création d'un profil temporaire");
      // Retourner un profil temporaire en mode hors ligne
      return {
        uid,
        email: 'offline@user.local',
        firstName: 'Utilisateur',
        lastName: 'Hors ligne',
        role: 'admin', // Rôle par défaut en mode hors ligne
        permissions: ['all_data_access'],
        isActive: true,
        createdAt: new Date(),
        lastLogin: new Date()
      } as UserProfile;
    }
    
    // Si c'est une erreur de permissions, on lance une erreur spécifique
    if (error.code === 'permission-denied') {
      throw new Error("FIRESTORE_PERMISSION_DENIED");
    }
    
    // Autres erreurs Firebase
    if (error.code === 'failed-precondition') {
      console.warn("Firestore en mode hors ligne, tentative de récupération...");
      return null;
    }
    
    // Erreurs réseau
    if (error.code === 'network-request-failed' || error.message.includes('network')) {
      throw new Error("network: Erreur de connectivité réseau");
    }
    
    return null;
  }
};

// Version alternative avec retry automatique
export const getUserProfileWithRetry = async (uid: string, maxRetries: number = 3): Promise<UserProfile | null> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentative ${attempt}/${maxRetries} de récupération du profil`);
      const profile = await getUserProfile(uid);
      return profile;
    } catch (error: any) {
      lastError = error;
      console.warn(`❌ Tentative ${attempt} échouée:`, error.message);
      
      // Ne pas retry sur certaines erreurs
      if (error.message.includes('USER_ACCOUNT_DISABLED') || 
          error.message.includes('FIRESTORE_PERMISSION_DENIED')) {
        throw error;
      }
      
      // Attendre avant le prochain retry (sauf pour la dernière tentative)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  // Si toutes les tentatives ont échoué, lancer la dernière erreur
  throw lastError;
};

// Mettre à jour le profil utilisateur
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
  try {
    await setDoc(doc(db, 'users', uid), updates, { merge: true });
  } catch (error) {
    throw new Error("Erreur lors de la mise à jour du profil");
  }
};

// Réinitialiser le mot de passe
export const resetPassword = async (email: string) => {
  try {
    // Configurer les options de réinitialisation
    const actionCodeSettings = {
      url: window.location.origin + '/login',
      handleCodeInApp: false
    };
    
    console.log('Envoi d\'un email de réinitialisation à:', email, 'avec URL de redirection:', actionCodeSettings.url);
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    console.log('Email de réinitialisation envoyé avec succès');
    return true;
  } catch (error: any) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Changer le mot de passe
export const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error("Utilisateur non connecté");
    }
    
    // Ré-authentifier l'utilisateur
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Mettre à jour le mot de passe
    await updatePassword(user, newPassword);
  } catch (error: any) {
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Observer l'état d'authentification
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Réinitialiser le mot de passe pour un utilisateur (admin)
export const adminResetPassword = async (email: string) => {
  try {
    // Configuration pour la réinitialisation
    const actionCodeSettings = {
      url: window.location.origin + '/login',
      handleCodeInApp: false
    };
    
    console.log('Admin: Envoi d\'un email de réinitialisation à:', email);
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    console.log('Email de réinitialisation envoyé avec succès par l\'admin');
    return true;
  } catch (error: any) {
    console.error('Erreur lors de la réinitialisation du mot de passe par l\'admin:', error);
    throw new Error(getAuthErrorMessage(error.code));
  }
};

// Messages d'erreur en français
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Aucun utilisateur trouvé avec cette adresse email';
    case 'auth/wrong-password':
      return 'Mot de passe incorrect';
    case 'auth/email-already-in-use':
      return 'Cette adresse email est déjà utilisée';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères';
    case 'auth/invalid-email':
      return 'Adresse email invalide';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Veuillez réessayer plus tard';
    case 'auth/network-request-failed':
      return 'Erreur de connexion réseau';
    case 'USER_ACCOUNT_DISABLED':
      return 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.';
    default:
      return 'Une erreur est survenue lors de l\'authentification';
  }
};