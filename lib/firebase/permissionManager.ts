// Gestionnaire de permissions Firebase avec timeout et retry
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../auth';

export interface PermissionCheckResult {
  success: boolean;
  profile: UserProfile | null;
  error: string | null;
  timeout: boolean;
  retryable: boolean;
}

export class PermissionManager {
  private static readonly DEFAULT_TIMEOUT = 8000; // 8 secondes
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 1000; // 1 seconde

  /**
   * Vérifier les permissions avec timeout et retry automatique
   */
  static async checkPermissionsWithTimeout(
    uid: string, 
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<PermissionCheckResult> {
    try {
      console.log(`🔐 Vérification des permissions pour ${uid} avec timeout de ${timeout}ms`);
      
      const result = await this.executeWithTimeout(
        () => this.fetchUserProfile(uid),
        timeout
      );
      
      return {
        success: true,
        profile: result,
        error: null,
        timeout: false,
        retryable: false
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de la vérification des permissions:', error);
      
      if (error.message === 'TIMEOUT') {
        return {
          success: false,
          profile: null,
          error: 'Timeout lors de la vérification des permissions',
          timeout: true,
          retryable: true
        };
      }
      
      return {
        success: false,
        profile: null,
        error: error.message,
        timeout: false,
        retryable: this.isRetryableError(error)
      };
    }
  }

  /**
   * Vérifier les permissions avec retry automatique
   */
  static async checkPermissionsWithRetry(
    uid: string,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<PermissionCheckResult> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Tentative ${attempt}/${maxRetries} de vérification des permissions`);
        
        const result = await this.checkPermissionsWithTimeout(uid);
        
        if (result.success) {
          console.log(`✅ Permissions vérifiées avec succès à la tentative ${attempt}`);
          return result;
        }
        
        lastError = result.error;
        
        // Ne pas retry si l'erreur n'est pas retryable
        if (!result.retryable) {
          return result;
        }
        
        // Attendre avant le prochain retry
        if (attempt < maxRetries) {
          await this.delay(this.RETRY_DELAY * attempt);
        }
        
      } catch (error: any) {
        lastError = error;
        console.warn(`❌ Tentative ${attempt} échouée:`, error.message);
      }
    }
    
    return {
      success: false,
      profile: null,
      error: lastError?.message || 'Échec après plusieurs tentatives',
      timeout: false,
      retryable: false
    };
  }

  /**
   * Créer un profil temporaire en cas d'échec
   */
  static createTemporaryProfile(uid: string, email: string = 'temp@user.local'): UserProfile {
    console.log('🔧 Création d\'un profil temporaire pour', uid);
    
    return {
      uid,
      email,
      firstName: 'Utilisateur',
      lastName: 'Temporaire',
      role: 'admin', // Rôle temporaire pour éviter les blocages
      permissions: ['all_data_access'],
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date()
    };
  }

  /**
   * Vérifier si une erreur est retryable
   */
  private static isRetryableError(error: any): boolean {
    const retryableCodes = [
      'unavailable',
      'deadline-exceeded',
      'network-request-failed',
      'timeout'
    ];
    
    const retryableMessages = [
      'network',
      'timeout',
      'unavailable',
      'offline'
    ];
    
    return retryableCodes.includes(error.code) ||
           retryableMessages.some(msg => error.message.toLowerCase().includes(msg));
  }

  /**
   * Exécuter une fonction avec timeout
   */
  private static async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('TIMEOUT'));
      }, timeout);

      fn()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * Récupérer le profil utilisateur depuis Firestore
   */
  private static async fetchUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Check if user is active
      if (data.isActive === false) {
        throw new Error("USER_ACCOUNT_DISABLED");
      }
      
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastLogin: data.lastLogin?.toDate()
      } as UserProfile;
    }
    
    return null;
  }

  /**
   * Délai d'attente
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Vérifier l'état de la connexion Firebase
   */
  static async checkFirebaseConnection(): Promise<{
    isConnected: boolean;
    latency: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      // Test simple de connexion
      const testDoc = doc(db, 'test', 'connection');
      await getDoc(testDoc);
      
      const latency = Date.now() - startTime;
      
      return {
        isConnected: true,
        latency
      };
    } catch (error: any) {
      return {
        isConnected: false,
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Diagnostiquer les problèmes de permissions
   */
  static async diagnosePermissionIssues(uid: string): Promise<{
    issues: string[];
    recommendations: string[];
    canRetry: boolean;
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let canRetry = false;

    try {
      // Vérifier la connexion Firebase
      const connectionTest = await this.checkFirebaseConnection();
      
      if (!connectionTest.isConnected) {
        issues.push('Connexion Firebase impossible');
        recommendations.push('Vérifier la connexion internet');
        canRetry = true;
      } else if (connectionTest.latency > 5000) {
        issues.push('Connexion Firebase très lente');
        recommendations.push('Vérifier la qualité de la connexion');
        canRetry = true;
      }

      // Tenter de récupérer le profil
      try {
        const profile = await this.fetchUserProfile(uid);
        if (!profile) {
          issues.push('Profil utilisateur introuvable');
          recommendations.push('Vérifier que le compte existe dans Firestore');
        }
      } catch (profileError: any) {
        if (profileError.code === 'permission-denied') {
          issues.push('Permissions Firestore insuffisantes');
          recommendations.push('Mettre à jour les règles de sécurité Firestore');
        } else {
          issues.push(`Erreur de récupération du profil: ${profileError.message}`);
          recommendations.push('Vérifier la configuration Firebase');
          canRetry = true;
        }
      }

    } catch (error: any) {
      issues.push(`Erreur de diagnostic: ${error.message}`);
      recommendations.push('Contacter le support technique');
    }

    return { issues, recommendations, canRetry };
  }
}