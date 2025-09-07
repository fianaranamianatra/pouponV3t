import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, getUserProfile, UserProfile } from '../lib/auth';

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  permissionTimeout: boolean;
  lastAttempt: Date | null;
}

interface AuthContextType extends AuthState {
  // Add any additional auth methods here if needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null,
    permissionTimeout: false,
    lastAttempt: null
  });

  // Timeout pour la vérification des permissions
  const PERMISSION_TIMEOUT = 8000; // 8 secondes

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isComponentMounted = true;

    const unsubscribe = onAuthStateChange(async (user) => {
      // Réinitialiser les états de timeout
      if (timeoutId) clearTimeout(timeoutId);
      
      if (user) {
        // Démarrer le timeout
        timeoutId = setTimeout(() => {
          if (isComponentMounted) {
            console.warn('⏰ Timeout lors de la récupération du profil utilisateur');
            setAuthState(prev => ({
              ...prev,
              loading: false,
              permissionTimeout: true,
              error: 'Timeout lors de la vérification des permissions. Connexion Firebase lente.',
              lastAttempt: new Date()
            }));
          }
        }, PERMISSION_TIMEOUT);

        try {
          console.log('🔄 Récupération du profil utilisateur...');
          const profile = await getUserProfile(user.uid);
          
          // Annuler le timeout si la récupération réussit
          if (timeoutId) clearTimeout(timeoutId);
          
          if (isComponentMounted) {
            setAuthState({
              user,
              profile,
              loading: false,
              error: null,
              permissionTimeout: false,
              lastAttempt: new Date()
            });
          }
        } catch (error) {
          // Annuler le timeout
          if (timeoutId) clearTimeout(timeoutId);
          
          if (!isComponentMounted) return;
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          console.error('❌ Erreur lors de la récupération du profil:', errorMessage);
          
          if (errorMessage === "FIRESTORE_PERMISSION_DENIED") {
            console.warn("Permissions Firestore insuffisantes. Configuration requise.");
            setAuthState({
              user,
              profile: null,
              loading: false,
              error: "Configuration Firebase requise: Les règles de sécurité Firestore doivent être mises à jour.",
              permissionTimeout: false,
              lastAttempt: new Date()
            });
          } else if (errorMessage === "USER_ACCOUNT_DISABLED") {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              error: "Votre compte a été désactivé. Veuillez contacter l'administrateur.",
              permissionTimeout: false,
              lastAttempt: new Date()
            });
          } else if (errorMessage.includes('offline') || errorMessage.includes('unavailable')) {
            console.warn("Mode hors ligne détecté, création du profil temporaire");
            // Créer un profil temporaire pour le mode hors ligne
            const offlineProfile = {
              uid: user.uid,
              email: user.email || 'offline@user.local',
              firstName: 'Utilisateur',
              lastName: 'Hors ligne',
              role: 'admin',
              permissions: ['all_data_access'],
              isActive: true,
              createdAt: new Date(),
              lastLogin: new Date()
            };
            
            setAuthState({
              user,
              profile: offlineProfile,
              loading: false,
              error: "Mode hors ligne: Certaines fonctionnalités peuvent être limitées.",
              permissionTimeout: false,
              lastAttempt: new Date()
            });
          } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
            // Gestion spécifique des timeouts réseau
            console.warn("Timeout réseau détecté, création d'un profil temporaire");
            const tempProfile = {
              uid: user.uid,
              email: user.email || 'temp@user.local',
              firstName: 'Utilisateur',
              lastName: 'Temporaire',
              role: 'admin', // Rôle temporaire pour éviter les blocages
              permissions: ['all_data_access'],
              isActive: true,
              createdAt: new Date(),
              lastLogin: new Date()
            };
            
            setAuthState({
              user,
              profile: tempProfile,
              loading: false,
              error: "Connexion lente détectée. Profil temporaire activé.",
              permissionTimeout: true,
              lastAttempt: new Date()
            });
          } else {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              error: "Erreur de connectivité. Veuillez réessayer.",
              permissionTimeout: false,
              lastAttempt: new Date()
            });
          }
        }
      } else {
        // Annuler le timeout si pas d'utilisateur
        if (timeoutId) clearTimeout(timeoutId);
        
        if (isComponentMounted) {
          setAuthState({
            user: null,
            profile: null,
            loading: false,
            error: null,
            permissionTimeout: false,
            lastAttempt: new Date()
          });
        }
      }
    });

    return () => {
      isComponentMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};