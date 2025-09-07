import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Building, DollarSign, FileText, Users, Briefcase } from 'lucide-react';

interface Employee {
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  entryDate?: string;
  contractType?: string;
  experience?: string;
  retirementDate?: string;
  status?: string;
}

interface EmployeeFormProps {
  onSubmit: (employee: any) => void;
  onCancel: () => void;
  initialData?: Employee;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    position: initialData?.position || '',
    department: initialData?.department || '',
    salary: initialData?.salary || 0,
    entryDate: initialData?.entryDate || '',
    contractType: initialData?.contractType || '',
    experience: initialData?.experience || '',
    retirementDate: initialData?.retirementDate || '',
    status: initialData?.status || 'Actif'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate age from date of birth
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

  // Calculate years of experience
  const calculateExperience = (entryDate: string): number => {
    if (!entryDate) return 0;
    const today = new Date();
    const entry = new Date(entryDate);
    let years = today.getFullYear() - entry.getFullYear();
    const monthDiff = today.getMonth() - entry.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < entry.getDate())) {
      years--;
    }
    return Math.max(0, years);
  };

  // Calculate retirement date (assuming retirement at 65)
  const calculateRetirementDate = (dateOfBirth: string): string => {
    if (!dateOfBirth) return '';
    const birthDate = new Date(dateOfBirth);
    const retirementDate = new Date(birthDate);
    retirementDate.setFullYear(birthDate.getFullYear() + 65);
    return retirementDate.toISOString().split('T')[0];
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'salary' ? parseFloat(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.email.trim()) newErrors.email = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'L\'email n\'est pas valide';
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est requis';
    if (!formData.position.trim()) newErrors.position = 'Le poste est requis';
    if (!formData.department.trim()) newErrors.department = 'Le département est requis';
    if (formData.salary <= 0) newErrors.salary = 'Le salaire doit être supérieur à 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const age = calculateAge(formData.dateOfBirth);
  const experience = calculateExperience(formData.entryDate);
  const retirementDate = calculateRetirementDate(formData.dateOfBirth);

  return (
    <form onSubmit={handleSubmit} className={`${isMobile ? 'space-y-4' : 'space-y-6'}`}>
      {/* Informations Personnelles */}
      <div className={`bg-blue-50 border border-blue-200 rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-blue-900 mb-4 flex items-center`}>
          <User className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} mr-2`} />
          Informations Personnelles
        </h3>
        
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <div>
            <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              Prénom *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.firstName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Prénom"
            />
            {errors.firstName && <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-red-600`}>{errors.firstName}</p>}
          </div>

          <div>
            <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              Nom *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.lastName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Nom de famille"
            />
            {errors.lastName && <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-red-600`}>{errors.lastName}</p>}
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
              onChange={handleInputChange}
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {age > 0 && <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-blue-600`}>Âge: {age} ans</p>}
          </div>

          <div>
            <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              <Mail className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="email@exemple.com"
            />
            {errors.email && <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-red-600`}>{errors.email}</p>}
          </div>

          <div>
            <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              <Phone className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
              Téléphone *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="+261 34 12 345 67"
            />
            {errors.phone && <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-red-600`}>{errors.phone}</p>}
          </div>
        </div>
      </div>

      {/* Informations Professionnelles */}
      <div className={`bg-green-50 border border-green-200 rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
        <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-green-900 mb-4 flex items-center`}>
          <Briefcase className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} mr-2`} />
          Informations Professionnelles
        </h3>
        
        <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
          <div>
            <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              Poste *
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.position ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="ex: Directeur, Enseignant, Secrétaire"
            />
            {errors.position && <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-red-600`}>{errors.position}</p>}
          </div>

          <div>
            <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              <Building className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
              Département *
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.department ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Sélectionner un département</option>
              <option value="Direction">Direction</option>
              <option value="Administration">Administration</option>
              <option value="Enseignement">Enseignement</option>
              <option value="Service">Service</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Sécurité">Sécurité</option>
            </select>
            {errors.department && <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-red-600`}>{errors.department}</p>}
          </div>

          <div>
            <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              <DollarSign className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
              Salaire (Ariary) *
            </label>
            <input
              type="number"
              name="salary"
              value={formData.salary}
              onChange={handleInputChange}
              min="0"
              step="1000"
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                errors.salary ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="ex: 1500000"
            />
            {errors.salary && <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-red-600`}>{errors.salary}</p>}
          </div>

          <div>
            <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              <Calendar className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
              Date d'entrée
            </label>
            <input
              type="date"
              name="entryDate"
              value={formData.entryDate}
              onChange={handleInputChange}
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            />
            {experience > 0 && <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-green-600`}>Expérience: {experience} ans</p>}
          </div>

          <div>
            <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              <FileText className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
              Type de contrat
            </label>
            <select
              name="contractType"
              value={formData.contractType}
              onChange={handleInputChange}
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="">Sélectionner un type</option>
              <option value="CDI">CDI - Contrat à Durée Indéterminée</option>
              <option value="CDD">CDD - Contrat à Durée Déterminée</option>
              <option value="FRAM">FRAM - Fonctionnaire</option>
              <option value="Stagiaire">Stagiaire</option>
              <option value="Consultant">Consultant</option>
            </select>
          </div>

          <div>
            <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              Statut
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
              <option value="En congé">En congé</option>
              <option value="Suspendu">Suspendu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Informations Calculées */}
      {(age > 0 || experience > 0 || retirementDate) && (
        <div className={`bg-purple-50 border border-purple-200 rounded-lg ${isMobile ? 'p-4' : 'p-6'}`}>
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-purple-900 mb-4 flex items-center`}>
            <Users className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} mr-2`} />
            Informations Calculées
          </h3>
          
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
            {age > 0 && (
              <div className="bg-white border border-purple-200 rounded-lg p-3">
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-purple-600 font-medium`}>Âge Actuel</p>
                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-purple-800`}>{age} ans</p>
              </div>
            )}
            
            {experience > 0 && (
              <div className="bg-white border border-purple-200 rounded-lg p-3">
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-purple-600 font-medium`}>Expérience</p>
                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-purple-800`}>{experience} ans</p>
              </div>
            )}
            
            {retirementDate && (
              <div className="bg-white border border-purple-200 rounded-lg p-3">
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-purple-600 font-medium`}>Retraite Prévue</p>
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} font-bold text-purple-800`}>
                  {new Date(retirementDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={`flex ${isMobile ? 'flex-col gap-3 pt-4' : 'justify-end space-x-3 pt-6'} border-t border-gray-200`}>
        <button
          type="button"
          onClick={onCancel}
          className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'px-6 py-2'} border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors`}
        >
          Annuler
        </button>
        <button
          type="submit"
          className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'px-6 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors`}
        >
          {initialData ? 'Modifier l\'Employé' : 'Ajouter l\'Employé'}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;