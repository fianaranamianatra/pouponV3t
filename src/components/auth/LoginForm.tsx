import React, { useState } from 'react';
import { signIn } from '../../lib/auth';
import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Tentative de connexion...');

    try {
      console.log('Appel de la fonction signIn avec:', formData.email);
      const user = await signIn(formData.email, formData.password);
      console.log('Connexion réussie, utilisateur:', user?.uid);
      
      // Redirection directe sans passer par onSuccess
      navigate('/');
    } catch (error: any) {
      console.error('Erreur dans LoginForm:', error);
      onError(error.message);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
      <div>
        <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
          <Mail className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
          Adresse email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="votre@email.com"
        />
      </div>

      <div>
        <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
          <Lock className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
          Mot de passe
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className={`w-full ${isMobile ? 'px-4 py-3 pr-12 text-base' : 'px-3 py-2 pr-10'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            placeholder="Votre mot de passe"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute ${isMobile ? 'right-4' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600`}
          >
            {showPassword ? <EyeOff className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} /> : <Eye className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full flex items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
      >
        <div className="flex items-center justify-center">
          {loading ? (
            <Loader2 className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} animate-spin mr-2`} />
          ) : (
            <LogIn className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
          )}
          {loading ? 'Connexion...' : 'Se connecter'}
        </div>
      </button>
      
      <div className={`text-center ${isMobile ? 'mt-3' : 'mt-4'}`}>
        <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-gray-600`}>
          Utilisez les identifiants fournis par l'administrateur
        </p>
      </div>
    </form>
  );
}