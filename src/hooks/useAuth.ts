import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, getUserProfile, UserProfile } from '../lib/auth';

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setAuthState({
            user,
            profile,
            loading: false,
            error: null
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          if (errorMessage === "FIRESTORE_PERMISSION_DENIED") {
            console.warn("Permissions Firestore insuffisantes. Veuillez configurer les règles de sécurité.");
            setAuthState({
              user,
              profile: null,
              loading: false,
              error: "Configuration Firebase requise: Les règles de sécurité Firestore doivent être mises à jour pour permettre l'accès aux profils utilisateur."
            });
          } else if (errorMessage === "USER_ACCOUNT_DISABLED") {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              error: "Votre compte a été désactivé. Veuillez contacter l'administrateur."
            });
          } else if (errorMessage.includes('offline') || errorMessage.includes('unavailable')) {
            console.warn("Mode hors ligne détecté, utilisation du profil temporaire");
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
              error: "Mode hors ligne: Certaines fonctionnalités peuvent être limitées."
            });
          } else {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              error: "Erreur de connectivité. L'application fonctionne en mode hors ligne."
            });
          }
        }
      } else {
        setAuthState({
          user: null,
          profile: null,
          loading: false,
          error: null
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return authState;
};