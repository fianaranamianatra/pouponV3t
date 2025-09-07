import React, { useState } from 'react';
import { User, Mail, Phone, BookOpen, Calendar, Users, Calculator } from 'lucide-react';
import { useFirebaseCollection } from '../../hooks/useFirebaseCollection';
import { subjectsService, classesService } from '../../lib/firebase/firebaseService';
import { validateData, teacherValidationSchema } from '../../lib/validation';

interface TeacherFormFirebaseProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function TeacherFormFirebase({ onSubmit, onCancel, initialData }: TeacherFormFirebaseProps) {
  // Hook Firebase pour charger les matières en temps réel
  const { data: subjects, loading: subjectsLoading } = useFirebaseCollection(subjectsService, true);
  // Hook Firebase pour charger les classes en temps réel
  const { data: classes, loading: classesLoading } = useFirebaseCollection(classesService, true);

  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    subject: initialData?.subject || '',
    classes: initialData?.classes || [],
    experience: initialData?.experience || '',
    status: initialData?.status || 'CDI',
    entryDate: initialData?.entryDate || '',
    retirementDate: initialData?.retirementDate || ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState({
    age: 0,
    calculatedExperience: 0,
    calculatedRetirementDate: ''
  });

  // Fonction pour calculer l'âge
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Fonction pour calculer l'expérience
  const calculateExperience = (entryDate: string): number => {
    if (!entryDate) return 0;
    const today = new Date();
    const entry = new Date(entryDate);
    let experience = today.getFullYear() - entry.getFullYear();
    const monthDiff = today.getMonth() - entry.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < entry.getDate())) {
      experience--;
    }
    return Math.max(0, experience);
  };

  // Fonction pour calculer la date de retraite
  const calculateRetirementDate = (dateOfBirth: string, status: string): string => {
    if (!dateOfBirth) return '';
    
    const birthDate = new Date(dateOfBirth);
    let retirementAge = 60; // Âge de retraite par défaut
    
    // Règles de retraite selon le statut
    switch (status) {
      case 'FRAM':
        retirementAge = 60; // Fonctionnaires : 60 ans
        break;
      case 'CDI':
        retirementAge = 62; // CDI : 62 ans
        break;
      case 'CDD':
        retirementAge = 65; // CDD : 65 ans (plus flexible)
        break;
      default:
        retirementAge = 60;
    }
    
    const retirementDate = new Date(birthDate);
    retirementDate.setFullYear(birthDate.getFullYear() + retirementAge);
    
    return retirementDate.toISOString().split('T')[0];
  };

  // Effet pour recalculer automatiquement les valeurs
  React.useEffect(() => {
    const age = calculateAge(formData.dateOfBirth);
    const calculatedExperience = calculateExperience(formData.entryDate);
    const calculatedRetirementDate = calculateRetirementDate(formData.dateOfBirth, formData.status);
    
    setCalculatedValues({
      age,
      calculatedExperience,
      calculatedRetirementDate
    });
    
    // Mettre à jour automatiquement l'expérience et la date de retraite dans le formulaire
    setFormData(prev => ({
      ...prev,
      experience: calculatedExperience.toString(),
      retirementDate: calculatedRetirementDate
    }));
  }, [formData.dateOfBirth, formData.entryDate, formData.status]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📝 Données du formulaire enseignant:', formData);
    
    // Validation côté client
    const validation = validateData(formData, teacherValidationSchema);
    
    if (!validation.isValid) {
      console.error('❌ Erreurs de validation:', validation.errors);
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('🚀 Envoi des données enseignant à Firebase...');
      await onSubmit(formData);
      console.log('✅ Enseignant ajouté avec succès');
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ajout de l\'enseignant:', error);
      setErrors({ submit: error.message || 'Erreur lors de la soumission' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`📝 Champ modifié: ${name} = ${value}`);
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Fonction pour gérer la sélection multiple des classes
  const handleClassSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, classes: selectedOptions }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Prénom *
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Prénom de l'enseignant"
          />
          {errors.firstName && (
            <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Nom *
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
              errors.lastName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Nom de famille"
          />
          {errors.lastName && (
            <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Date de naissance *
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
              errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.dateOfBirth && (
            <p className="text-red-600 text-xs mt-1">{errors.dateOfBirth}</p>
          )}
          {calculatedValues.age > 0 && (
            <p className="text-emerald-600 text-xs mt-1">
              <Calculator className="w-3 h-3 inline mr-1" />
              Âge calculé: {calculatedValues.age} ans
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email (optionnel)
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="email@exemple.com"
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Téléphone (optionnel)
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
              errors.phone ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="+261 34 12 345 67"
          />
          {errors.phone && (
            <p className="text-red-600 text-xs mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <BookOpen className="w-4 h-4 inline mr-2" />
            Matière principale *
          </label>
          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
              errors.subject ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Sélectionner une matière</option>
            {subjectsLoading ? (
              <option disabled>Chargement des matières...</option>
            ) : (
              subjects.map(subject => (
                <option key={subject.id} value={subject.name}>
                  {subject.name} ({subject.code})
                </option>
              ))
            )}
          </select>
          {errors.subject && (
            <p className="text-red-600 text-xs mt-1">{errors.subject}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-2" />
            Classes assignées
          </label>
          <select
            multiple
            value={formData.classes}
            onChange={handleClassSelection}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent h-32"
          >
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
          <p className="text-xs text-gray-500 mt-1">
            Maintenez Ctrl (ou Cmd) pour sélectionner plusieurs classes
          </p>
          {formData.classes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {formData.classes.map((className, index) => (
                <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                  {className}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Date d'entrée
          </label>
          <input
            type="date"
            name="entryDate"
            value={formData.entryDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
              errors.entryDate ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.entryDate && (
            <p className="text-red-600 text-xs mt-1">{errors.entryDate}</p>
          )}
          {calculatedValues.calculatedExperience > 0 && (
            <p className="text-emerald-600 text-xs mt-1">
              <Calculator className="w-3 h-3 inline mr-1" />
              Expérience calculée: {calculatedValues.calculatedExperience} ans
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Années d'expérience (calculé automatiquement)
          </label>
          <input
            type="number"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            min="0"
            max="50"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            readOnly
          />
          <p className="text-xs text-gray-500 mt-1">
            Calculé automatiquement à partir de la date d'entrée
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de contrat
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            <option value="CDI">CDI - Contrat à Durée Indéterminée</option>
            <option value="CDD">CDD - Contrat à Durée Déterminée</option>
            <option value="FRAM">FRAM - Fonctionnaire</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Le type de contrat influence l'âge de retraite (FRAM: 60 ans, CDI: 62 ans, CDD: 65 ans)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Date de retraite (calculée automatiquement)
          </label>
          <input
            type="date"
            name="retirementDate"
            value={formData.retirementDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            readOnly
          />
          <p className="text-xs text-gray-500 mt-1">
            Calculée automatiquement selon l'âge de retraite du type de contrat
          </p>
          {calculatedValues.calculatedRetirementDate && (
            <p className="text-emerald-600 text-xs mt-1">
              <Calculator className="w-3 h-3 inline mr-1" />
              Retraite prévue: {new Date(calculatedValues.calculatedRetirementDate).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </div>

      {/* Résumé des calculs */}
      {(calculatedValues.age > 0 || calculatedValues.calculatedExperience > 0) && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h4 className="font-medium text-emerald-800 mb-2 flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Calculs automatiques
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-emerald-700">
            <div>
              <span className="font-medium">Âge actuel:</span><br />
              {calculatedValues.age} ans
            </div>
            <div>
              <span className="font-medium">Expérience:</span><br />
              {calculatedValues.calculatedExperience} ans
            </div>
            <div>
              <span className="font-medium">Retraite prévue:</span><br />
              {calculatedValues.calculatedRetirementDate ? 
                new Date(calculatedValues.calculatedRetirementDate).toLocaleDateString('fr-FR') : 
                'Non calculée'
              }
            </div>
          </div>
        </div>
      )}

      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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