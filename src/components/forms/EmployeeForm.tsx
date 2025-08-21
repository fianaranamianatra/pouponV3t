import React, { useState } from 'react';
import { User, Mail, Phone, Briefcase, Building, Users, DollarSign, Calendar, Shield } from 'lucide-react';
import { useFirebaseCollection } from '../../hooks/useFirebaseCollection';
import { hierarchyService } from '../../lib/firebase/firebaseService';

interface EmployeeFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function EmployeeForm({ onSubmit, onCancel, initialData }: EmployeeFormProps) {
  // Hook Firebase pour charger les employés existants (pour la liste des superviseurs)
  const { data: employees, loading: employeesLoading } = useFirebaseCollection(hierarchyService, true);

  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    position: initialData?.position || '',
    department: initialData?.department || '',
    level: initialData?.level || 1,
    parentId: initialData?.parentId || '',
    salary: initialData?.salary || '',
    hireDate: initialData?.hireDate || new Date().toISOString().split('T')[0],
    status: initialData?.status || 'active'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Options prédéfinies pour les postes
  const positionOptions = [
    // Direction
    { value: 'Directeur Général', label: 'Directeur Général', department: 'Direction', level: 1 },
    { value: 'Directrice Pédagogique', label: 'Directrice Pédagogique', department: 'Direction', level: 2 },
    { value: 'Sous-Directeur', label: 'Sous-Directeur', department: 'Direction', level: 2 },
    
    // Administration
    { value: 'Comptable', label: 'Comptable', department: 'Administration', level: 3 },
    { value: 'Secrétaire Générale', label: 'Secrétaire Générale', department: 'Administration', level: 3 },
    { value: 'Assistant Administratif', label: 'Assistant Administratif', department: 'Administration', level: 4 },
    { value: 'Responsable Financier', label: 'Responsable Financier', department: 'Administration', level: 3 },
    
    // Enseignement - Maternelle
    { value: 'Institutrice TPSA', label: 'Institutrice TPSA (Très Petite Section A)', department: 'Enseignement', level: 3 },
    { value: 'Institutrice TPSB', label: 'Institutrice TPSB (Très Petite Section B)', department: 'Enseignement', level: 3 },
    { value: 'Institutrice PSA', label: 'Institutrice PSA (Petite Section A)', department: 'Enseignement', level: 3 },
    { value: 'Institutrice PSB', label: 'Institutrice PSB (Petite Section B)', department: 'Enseignement', level: 3 },
    { value: 'Institutrice PSC', label: 'Institutrice PSC (Petite Section C)', department: 'Enseignement', level: 3 },
    { value: 'Institutrice MS_A', label: 'Institutrice MS_A (Moyenne Section A)', department: 'Enseignement', level: 3 },
    { value: 'Institutrice MSB', label: 'Institutrice MSB (Moyenne Section B)', department: 'Enseignement', level: 3 },
    { value: 'Institutrice GSA', label: 'Institutrice GSA (Grande Section A)', department: 'Enseignement', level: 3 },
    { value: 'Institutrice GSB', label: 'Institutrice GSB (Grande Section B)', department: 'Enseignement', level: 3 },
    { value: 'Institutrice GSC', label: 'Institutrice GSC (Grande Section C)', department: 'Enseignement', level: 3 },
    
    // Enseignement - Primaire
    { value: 'Instituteur 11_A (CP)', label: 'Instituteur 11_A (CP)', department: 'Enseignement', level: 3 },
    { value: 'Instituteur 11B (CP)', label: 'Instituteur 11B (CP)', department: 'Enseignement', level: 3 },
    { value: 'Institutrice 10_A (CE1)', label: 'Institutrice 10_A (CE1)', department: 'Enseignement', level: 3 },
    { value: 'Institutrice 10_B (CE1)', label: 'Institutrice 10_B (CE1)', department: 'Enseignement', level: 3 },
    { value: 'Instituteur 9A (CE2)', label: 'Instituteur 9A (CE2)', department: 'Enseignement', level: 3 },
    { value: 'Institutrice 9_B (CE2)', label: 'Institutrice 9_B (CE2)', department: 'Enseignement', level: 3 },
    { value: 'Instituteur 8 (CM1)', label: 'Instituteur 8 (CM1)', department: 'Enseignement', level: 3 },
    { value: 'Institutrice 7 (CM2)', label: 'Institutrice 7 (CM2)', department: 'Enseignement', level: 3 },
    
    // Enseignement - Spécialisé
    { value: 'Éducatrice Spécialisée CS', label: 'Éducatrice Spécialisée CS', department: 'Enseignement', level: 3 },
    { value: 'Responsable Garderie', label: 'Responsable Garderie', department: 'Enseignement', level: 3 },
    { value: 'Professeur d\'Anglais', label: 'Professeur d\'Anglais', department: 'Enseignement', level: 3 },
    { value: 'Professeur d\'Éducation Physique', label: 'Professeur d\'Éducation Physique', department: 'Enseignement', level: 3 },
    { value: 'Professeur d\'Arts Plastiques', label: 'Professeur d\'Arts Plastiques', department: 'Enseignement', level: 3 },
    { value: 'Professeur de Musique', label: 'Professeur de Musique', department: 'Enseignement', level: 3 },
    
    // Service
    { value: 'Gardien Principal', label: 'Gardien Principal', department: 'Service', level: 4 },
    { value: 'Gardien de Nuit', label: 'Gardien de Nuit', department: 'Service', level: 4 },
    { value: 'Femme de Ménage Principal', label: 'Femme de Ménage Principal', department: 'Service', level: 4 },
    { value: 'Femme de Ménage', label: 'Femme de Ménage', department: 'Service', level: 4 },
    { value: 'Agent de Maintenance', label: 'Agent de Maintenance', department: 'Service', level: 4 },
    { value: 'Cuisinière', label: 'Cuisinière', department: 'Service', level: 4 },
    { value: 'Aide Cuisinière', label: 'Aide Cuisinière', department: 'Service', level: 4 },
    { value: 'Chauffeur', label: 'Chauffeur', department: 'Service', level: 4 }
  ];

  // Options pour les départements
  const departmentOptions = [
    { value: 'Direction', label: 'Direction', icon: '👑' },
    { value: 'Administration', label: 'Administration', icon: '📋' },
    { value: 'Enseignement', label: 'Enseignement', icon: '🎓' },
    { value: 'Service', label: 'Service', icon: '🔧' }
  ];

  // Options pour les niveaux hiérarchiques
  const levelOptions = [
    { value: 1, label: 'Niveau 1 - Direction Générale', description: 'Directeur Général' },
    { value: 2, label: 'Niveau 2 - Direction Adjointe', description: 'Directeurs adjoints, Responsables de départements' },
    { value: 3, label: 'Niveau 3 - Personnel Qualifié', description: 'Enseignants, Comptables, Secrétaires' },
    { value: 4, label: 'Niveau 4 - Personnel de Service', description: 'Gardiens, Personnel de ménage, Assistants' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation de base
    const newErrors: { [key: string]: string } = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Un email valide est requis';
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';
    if (!formData.position) newErrors.position = 'Le poste est requis';
    if (!formData.department) newErrors.department = 'Le département est requis';
    if (!formData.salary || parseFloat(formData.salary) <= 0) newErrors.salary = 'Le salaire doit être supérieur à 0';
    if (!formData.hireDate) newErrors.hireDate = 'La date d\'embauche est requise';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('🚀 Soumission du formulaire employé:', formData);
      await onSubmit(formData);
    } catch (error: any) {
      setErrors({ submit: error.message || 'Erreur lors de la soumission du formulaire' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Si le poste change, mettre à jour automatiquement le département et le niveau
    if (name === 'position') {
      const selectedPosition = positionOptions.find(pos => pos.value === value);
      if (selectedPosition) {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          department: selectedPosition.department,
          level: selectedPosition.level
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Filtrer les employés pour la liste des superviseurs (exclure l'employé actuel en mode édition)
  const availableSupervisors = employees.filter(emp => 
    emp.id !== initialData?.id && // Exclure l'employé actuel
    emp.level < formData.level // Un superviseur doit être d'un niveau supérieur
  );

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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.firstName ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Prénom de l'employé"
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
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
            <Mail className="w-4 h-4 inline mr-2" />
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="email@lespoupons.mg"
          />
          {errors.email && (
            <p className="text-red-600 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Téléphone *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
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
            <Briefcase className="w-4 h-4 inline mr-2" />
            Poste *
          </label>
          <select
            name="position"
            value={formData.position}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.position ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Sélectionner un poste</option>
            <optgroup label="Direction">
              {positionOptions.filter(pos => pos.department === 'Direction').map(pos => (
                <option key={pos.value} value={pos.value}>{pos.label}</option>
              ))}
            </optgroup>
            <optgroup label="Administration">
              {positionOptions.filter(pos => pos.department === 'Administration').map(pos => (
                <option key={pos.value} value={pos.value}>{pos.label}</option>
              ))}
            </optgroup>
            <optgroup label="Enseignement">
              {positionOptions.filter(pos => pos.department === 'Enseignement').map(pos => (
                <option key={pos.value} value={pos.value}>{pos.label}</option>
              ))}
            </optgroup>
            <optgroup label="Service">
              {positionOptions.filter(pos => pos.department === 'Service').map(pos => (
                <option key={pos.value} value={pos.value}>{pos.label}</option>
              ))}
            </optgroup>
          </select>
          {errors.position && (
            <p className="text-red-600 text-xs mt-1">{errors.position}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="w-4 h-4 inline mr-2" />
            Département *
          </label>
          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.department ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Sélectionner un département</option>
            {departmentOptions.map(dept => (
              <option key={dept.value} value={dept.value}>
                {dept.icon} {dept.label}
              </option>
            ))}
          </select>
          {errors.department && (
            <p className="text-red-600 text-xs mt-1">{errors.department}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-2" />
            Niveau hiérarchique *
          </label>
          <select
            name="level"
            value={formData.level}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {levelOptions.map(level => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {levelOptions.find(l => l.value === parseInt(formData.level.toString()))?.description}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 inline mr-2" />
            Superviseur (optionnel)
          </label>
          <select
            name="parentId"
            value={formData.parentId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Aucun superviseur (poste de direction)</option>
            {employeesLoading ? (
              <option disabled>Chargement des employés...</option>
            ) : (
              availableSupervisors.map(emp => (
                <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`}>
                  {emp.firstName} {emp.lastName} - {emp.position}
                </option>
              ))
            )}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Seuls les employés de niveau supérieur peuvent être superviseurs
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-2" />
            Salaire mensuel (Ariary) *
          </label>
          <input
            type="number"
            name="salary"
            value={formData.salary}
            onChange={handleChange}
            min="0"
            step="1000"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.salary ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="ex: 1200000"
          />
          {errors.salary && (
            <p className="text-red-600 text-xs mt-1">{errors.salary}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Date d'embauche *
          </label>
          <input
            type="date"
            name="hireDate"
            value={formData.hireDate}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.hireDate ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.hireDate && (
            <p className="text-red-600 text-xs mt-1">{errors.hireDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Shield className="w-4 h-4 inline mr-2" />
            Statut
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
      </div>

      {/* Informations sur la hiérarchie */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Informations hiérarchiques</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>Département sélectionné :</strong> {formData.department || 'Aucun'}</p>
          <p><strong>Niveau hiérarchique :</strong> {formData.level}</p>
          <p><strong>Superviseur :</strong> {formData.parentId || 'Aucun (poste de direction)'}</p>
        </div>
      </div>

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
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              {initialData ? 'Modification...' : 'Ajout...'}
            </div>
          ) : (
            initialData ? 'Modifier l\'Employé' : 'Ajouter l\'Employé'
          )}
        </button>
      </div>
    </form>
  );
}