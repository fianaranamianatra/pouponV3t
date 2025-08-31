import React, { useState, useEffect } from 'react';
import { School } from 'lucide-react';
import { LoginForm } from '../components/auth/LoginForm';
import { resetPassword } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const [authError, setAuthError] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Rediriger si déjà connecté
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLoginSuccess = () => {
    setAuthError(null);
    navigate('/');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    console.log('Début de la procédure de réinitialisation pour:', resetEmail);
    
    setIsResetting(true);
    try {
      console.log('Appel de la fonction resetPassword');
      await resetPassword(resetEmail);
      console.log('Réinitialisation demandée avec succès');
      setResetSent(true);
      setAuthError(null);
    } catch (error: any) {
      console.error('Erreur de réinitialisation:', error);
      setAuthError(error.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 ${isMobile ? 'p-4' : 'p-4'}`}>
      <div className={`${isMobile ? 'max-w-full w-full' : 'max-w-md w-full'} space-y-8`}>
        <div className="text-center">
          <div className={`${isMobile ? 'w-20 h-20' : 'w-16 h-16'} bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <School className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'} text-white`} />
          </div>
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>LES POUPONS</h2>
          <p className={`${isMobile ? 'text-sm' : ''} text-gray-600 mt-2`}>Système de gestion scolaire</p>
        </div>

        <div className={`bg-white ${isMobile ? 'rounded-lg p-6' : 'rounded-xl shadow-lg p-8'}`}>
          {!showResetForm ? (
            <>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 ${isMobile ? 'mb-4' : 'mb-6'} text-center`}>
                Connexion
              </h3>
              
              {authError && (
                <div className={`${isMobile ? 'mb-3 p-3' : 'mb-4 p-3'} bg-red-50 border border-red-200 rounded-lg`}>
                  <p className={`text-red-600 ${isMobile ? 'text-sm' : 'text-sm'}`}>{authError}</p>
                </div>
              )}

              <LoginForm
                onSuccess={handleLoginSuccess}
                onError={setAuthError}
              />
              
              <div className={`${isMobile ? 'mt-3' : 'mt-4'} text-center`}>
                <button 
                  onClick={() => setShowResetForm(true)}
                  className={`${isMobile ? 'text-base' : 'text-sm'} text-blue-600 hover:text-blue-800`}
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 ${isMobile ? 'mb-4' : 'mb-6'} text-center`}>
                Réinitialisation du mot de passe
              </h3>
              
              {authError && (
                <div className={`${isMobile ? 'mb-3 p-3' : 'mb-4 p-3'} bg-red-50 border border-red-200 rounded-lg`}>
                  <p className={`text-red-600 ${isMobile ? 'text-sm' : 'text-sm'}`}>{authError}</p>
                </div>
              )}
              
              {resetSent ? (
                <div className={`${isMobile ? 'mb-3 p-3' : 'mb-4 p-3'} bg-green-50 border border-green-200 rounded-lg`}>
                  <p className={`text-green-600 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                    Un email de réinitialisation a été envoyé à {resetEmail}.
                    Veuillez vérifier votre boîte de réception.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                      Adresse email
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      placeholder="votre@email.com"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isResetting}
                    className={`w-full flex items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    {isResetting ? (
                      <div className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} border-2 border-white border-t-transparent rounded-full animate-spin`} />
                    ) : (
                      'Envoyer le lien de réinitialisation'
                    )}
                  </button>
                </form>
              )}
              
              <div className={`${isMobile ? 'mt-3' : 'mt-4'} text-center`}>
                <button 
                  onClick={() => {
                    setShowResetForm(false);
                    setResetSent(false);
                    setResetEmail('');
                    setAuthError(null);
                  }}
                  className={`${isMobile ? 'text-base' : 'text-sm'} text-blue-600 hover:text-blue-800`}
                >
                  Retour à la connexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}