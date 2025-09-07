import React, { useState } from 'react';
import { User, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { useFirebaseCollection } from '../../hooks/useFirebaseCollection';
import { classesService } from '../../lib/firebase/firebaseService';
import { validateData, studentValidationSchema } from '../../lib/validation';

interface StudentFormFirebaseProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function StudentFormFirebase({ onSubmit, onCancel, initialData }: StudentFormFirebaseProps) {
  // Hook Firebase pour charger les classes en temps réel
  const { data: classes, loading: classesLoading } = useFirebaseCollection(classesService, true);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    class: initialData?.class || '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    parentName: initialData?.parentName || '',
    parentEmail: initialData?.parentEmail || '',
    status: initialData?.status || 'active'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation côté client
    const validation = validateData(formData, studentValidationSchema);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(formData);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Erreur lors de la soumission' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
      {errors.submit && (
        <div className={`${isMobile ? 'p-3' : 'p-3'} bg-red-50 border border-red-200 rounded-lg`}>
          <p className={`text-red-600 ${isMobile ? 'text-sm' : 'text-sm'}`}>{errors.submit}</p>
        </div>
      )}

      <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            <User className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
            Prénom
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Prénom de l'élève"
          />
          {errors.firstName && (
            <p className={`text-red-600 ${isMobile ? 'text-sm' : 'text-xs'} mt-1`}>{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            <User className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
            Nom *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.lastName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Nom de famille"
            required
          />
          {errors.lastName && (
            <p className={`text-red-600 ${isMobile ? 'text-sm' : 'text-xs'} mt-1`}>{errors.lastName}</p>
          )}
        </div>

        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            <Calendar className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
            Date de naissance
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.dateOfBirth && (
            <p className={`text-red-600 ${isMobile ? 'text-sm' : 'text-xs'} mt-1`}>{errors.dateOfBirth}</p>
          )}
        </div>

        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            Classe
          </label>
          <select
            name="class"
            value={formData.class}
            onChange={handleChange}
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.class ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Sélectionner une classe</option>
            {classesLoading ? (
              <option disabled>Chargement des classes...</option>
            ) : (
              classes.map(classItem => (
                <option key={classItem.id} value={classItem.name}>
                  {classItem.name} - {classItem.level}
                </option>
              ))
            )}
          </select>
          {errors.class && (
            <p className={`text-red-600 ${isMobile ? 'text-sm' : 'text-xs'} mt-1`}>{errors.class}</p>
          )}
        </div>

        <div className={`${isMobile ? '' : 'md:col-span-2'}`}>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            <MapPin className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
            Adresse
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.address ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Adresse complète"
          />
          {errors.address && (
            <p className={`text-red-600 ${isMobile ? 'text-sm' : 'text-xs'} mt-1`}>{errors.address}</p>
          )}
        </div>

        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            <Phone className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
            Téléphone
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="+261 34 12 345 67"
          />
          {errors.phone && (
            <p className={`text-red-600 ${isMobile ? 'text-sm' : 'text-xs'} mt-1`}>{errors.phone}</p>
          )}
        </div>

        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            Nom du parent/tuteur
          </label>
          <input
            type="text"
            name="parentName"
            value={formData.parentName}
            onChange={handleChange}
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.parentName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Nom complet du parent"
          />
          {errors.parentName && (
            <p className={`text-red-600 ${isMobile ? 'text-sm' : 'text-xs'} mt-1`}>{errors.parentName}</p>
          )}
        </div>

        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            <Mail className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
            Email du parent
          </label>
          <input
            type="email"
            name="parentEmail"
            value={formData.parentEmail}
            onChange={handleChange}
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.parentEmail ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="email@exemple.com"
          />
          {errors.parentEmail && (
            <p className={`text-red-600 ${isMobile ? 'text-sm' : 'text-xs'} mt-1`}>{errors.parentEmail}</p>
          )}
        </div>

        <div>
          <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
            Statut
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
      </div>

      <div className={`flex ${isMobile ? 'flex-col gap-3 pt-4' : 'space-x-3 pt-4'}`}>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'flex-1 px-4 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50`}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'flex-1 px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} border-2 border-white border-t-transparent rounded-full animate-spin mr-2`}></div>
              {initialData ? 'Modification...' : 'Ajout...'}
            </div>
          ) : (
            initialData ? 'Modifier' : 'Ajouter'
          )}
        </button>
      </div>
    </form>
  );
}