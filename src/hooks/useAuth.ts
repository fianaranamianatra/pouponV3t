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
          } else {
            setAuthState({
              user: null,
              profile: null,
              loading: false,
              error: "Erreur lors du chargement du profil utilisateur. Veuillez vous reconnecter."
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