import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Building, DollarSign, FileText, Users, Briefcase, Calculator } from 'lucide-react';
import { useFirebaseCollection } from '../../hooks/useFirebaseCollection';
import { teachersService } from '../../lib/firebase/firebaseService';

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
  // Hook Firebase pour charger les enseignants
  const { data: teachers, loading: teachersLoading } = useFirebaseCollection(teachersService, true);
  
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
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [showTeacherSelector, setShowTeacherSelector] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [calculatedExperience, setCalculatedExperience] = useState(0);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Effet pour afficher/masquer le sélecteur d'enseignant
  useEffect(() => {
    const shouldShowTeacherSelector = formData.department === 'Enseignement';
    setShowTeacherSelector(shouldShowTeacherSelector);
    
    // Réinitialiser la sélection si on change de département
    if (!shouldShowTeacherSelector) {
      setSelectedTeacherId('');
    }
  }, [formData.department]);

  // Effet pour remplir automatiquement le formulaire quand un enseignant est sélectionné
  useEffect(() => {
    if (selectedTeacherId && teachers.length > 0) {
      const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
      if (selectedTeacher) {
        console.log('🎓 Enseignant sélectionné:', selectedTeacher);
        
        // Remplir automatiquement les champs avec les données de l'enseignant
        setFormData(prev => ({
          ...prev,
          firstName: selectedTeacher.firstName || prev.firstName,
          lastName: selectedTeacher.lastName || prev.lastName,
          dateOfBirth: selectedTeacher.dateOfBirth || prev.dateOfBirth,
          email: selectedTeacher.email || prev.email,
          phone: selectedTeacher.phone || prev.phone,
          position: selectedTeacher.subject ? `Enseignant(e) ${selectedTeacher.subject}` : 'Enseignant(e)',
          department: 'Enseignement',
          entryDate: selectedTeacher.entryDate || prev.entryDate,
          contractType: selectedTeacher.status || prev.contractType
        }));
        
        console.log('✅ Formulaire rempli automatiquement avec les données de l\'enseignant');
      }
    }
  }, [selectedTeacherId, teachers]);

  // Effet pour calculer automatiquement l'expérience à partir de la date d'entrée
  useEffect(() => {
    if (formData.entryDate) {
      const experience = calculateExperience(formData.entryDate);
      setCalculatedExperience(experience);
      
      // Mettre à jour automatiquement le champ expérience dans formData
      setFormData(prev => ({
        ...prev,
        experience: experience.toString()
      }));
      
      console.log(`🧮 Expérience calculée automatiquement: ${experience} ans`);
    } else {
      setCalculatedExperience(0);
      setFormData(prev => ({
        ...prev,
        experience: '0'
      }));
    }
  }, [formData.entryDate]);

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
          {selectedTeacherId && (
            <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Depuis Module Enseignants
            </span>
          )}
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
            {selectedTeacherId && (
              <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-blue-600`}>
                ✅ Poste généré automatiquement depuis les données enseignant
              </p>
            )}
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

          {/* Affichage des informations de l'enseignant sélectionné */}
          {selectedTeacherId && teachers.length > 0 && (
            <div className="md:col-span-2">
              {(() => {
                const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
                if (!selectedTeacher) return null;
                
                return (
                  <div className="bg-white border border-green-200 rounded-lg p-4">
                    <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-green-800 mb-3 flex items-center`}>
                      <Users className="w-4 h-4 mr-2" />
                      Données Enseignant Importées
                    </h4>
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 md:grid-cols-3 gap-3'} ${isMobile ? 'text-sm' : 'text-sm'}`}>
                      <div>
                        <span className="font-medium text-gray-700">Matière:</span>
                        <p className="text-green-700">{selectedTeacher.subject}</p>
                      </div>
                      {selectedTeacher.experience && (
                        <div>
                          <span className="font-medium text-gray-700">Expérience:</span>
                          <p className="text-green-700">{selectedTeacher.experience} ans</p>
                        </div>
                      )}
                      {selectedTeacher.status && (
                        <div>
                          <span className="font-medium text-gray-700">Statut:</span>
                          <p className="text-green-700">{selectedTeacher.status}</p>
                        </div>
                      )}
                      {selectedTeacher.classes && selectedTeacher.classes.length > 0 && (
                        <div className="md:col-span-3">
                          <span className="font-medium text-gray-700">Classes assignées:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedTeacher.classes.map((className, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                {className}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                      <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-green-700`}>
                        <strong>ℹ️ Note :</strong> Les informations ci-dessus ont été automatiquement importées 
                        depuis le module Enseignants. Vous pouvez les modifier dans les champs du formulaire si nécessaire.
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Sélecteur d'enseignant (affiché seulement si département = Enseignement) */}
          {showTeacherSelector && (
            <div className="md:col-span-2">
              <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
                <Users className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
                Sélectionner un enseignant existant (optionnel)
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              >
                <option value="">-- Saisie manuelle ou sélectionner un enseignant --</option>
                {teachersLoading ? (
                  <option disabled>Chargement des enseignants...</option>
                ) : (
                  teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} - {teacher.subject} 
                      {teacher.experience ? ` (${teacher.experience} ans d'exp.)` : ''}
                    </option>
                  ))
                )}
              </select>
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-blue-700`}>
                  <strong>💡 Astuce :</strong> Sélectionnez un enseignant existant pour remplir automatiquement 
                  toutes les informations (nom, date de naissance, email, téléphone, poste, date d'entrée, type de contrat). 
                  Vous pourrez ensuite les modifier si nécessaire.
                </p>
                {selectedTeacherId && (
                  <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-green-700 mt-1`}>
                    ✅ Formulaire rempli automatiquement avec les données de l'enseignant sélectionné
                  </p>
                )}
              </div>
            </div>
          )}

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
            {calculatedExperience > 0 && (
              <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-green-600`}>
                <Calculator className="w-3 h-3 inline mr-1" />
                Expérience calculée automatiquement: {calculatedExperience} ans
              </p>
            )}
            {selectedTeacherId && (
              <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-blue-600`}>
                ✅ Date d'entrée importée depuis les données enseignant
              </p>
            )}
          </div>

          <div>
            <label className={`block ${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700 mb-2`}>
              <Calculator className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} inline mr-2`} />
              Années d'expérience (calculé automatiquement)
            </label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              readOnly
              className={`w-full ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed`}
              placeholder="Calculé automatiquement"
            />
            <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-gray-500`}>
              Calculé automatiquement à partir de la date d'entrée (Date actuelle - Date d'entrée)
            </p>
            {selectedTeacherId && (
              <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-blue-600`}>
                ✅ Expérience recalculée automatiquement depuis la date d'entrée
              </p>
            )}
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
            {selectedTeacherId && (
              <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-blue-600`}>
                ✅ Type de contrat importé depuis les données enseignant
              </p>
            )}
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
            {selectedTeacherId && (
              <p className={`mt-1 ${isMobile ? 'text-sm' : 'text-xs'} text-blue-600`}>
                ✅ Statut importé depuis les données enseignant
              </p>
            )}
          </div>
        </div>
        
        {/* Bouton pour réinitialiser la sélection d'enseignant */}
        {selectedTeacherId && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <button
              type="button"
              onClick={() => {
                setSelectedTeacherId('');
                // Optionnel: réinitialiser certains champs
                if (confirm('Voulez-vous effacer les données importées de l\'enseignant ?')) {
                  setFormData(prev => ({
                    ...prev,
                    firstName: '',
                    lastName: '',
                    dateOfBirth: '',
                    email: '',
                    phone: '',
                    position: '',
                    entryDate: '',
                    contractType: '',
                    experience: '0'
                  }));
                  setCalculatedExperience(0);
                }
              }}
              className={`inline-flex items-center ${isMobile ? 'px-4 py-2 text-sm' : 'px-3 py-2 text-xs'} border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors`}
            >
              <Users className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'} mr-2`} />
              Désélectionner l'enseignant
            </button>
          </div>
        )}
      </div>

      {/* Informations Calculées */}
      {(age > 0 || calculatedExperience > 0 || retirementDate) && (
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
                {selectedTeacherId && (
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-blue-600 mt-1`}>Depuis enseignant</p>
                )}
              </div>
            )}
            
            {calculatedExperience > 0 && (
              <div className="bg-white border border-purple-200 rounded-lg p-3">
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-purple-600 font-medium`}>Expérience</p>
                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-purple-800`}>{calculatedExperience} ans</p>
                <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-green-600 mt-1`}>
                  <Calculator className="w-3 h-3 inline mr-1" />
                  Calculé automatiquement
                </p>
              </div>
            )}
            
            {retirementDate && (
              <div className="bg-white border border-purple-200 rounded-lg p-3">
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-purple-600 font-medium`}>Retraite Prévue</p>
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} font-bold text-purple-800`}>
                  {new Date(retirementDate).toLocaleDateString('fr-FR')}
                </p>
                {selectedTeacherId && (
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-blue-600 mt-1`}>Calculé depuis enseignant</p>
                )}
              </div>
            )}
          </div>
          
          {/* Informations supplémentaires de l'enseignant */}
          {selectedTeacherId && teachers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-purple-200">
              {(() => {
                const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);
                if (!selectedTeacher) return null;
                
                return (
                  <div className="bg-white border border-purple-200 rounded-lg p-4">
                    <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-purple-800 mb-3`}>
                      📚 Informations Pédagogiques Importées
                    </h4>
                    <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 gap-3'} ${isMobile ? 'text-sm' : 'text-sm'}`}>
                      <div>
                        <span className="font-medium text-gray-700">Matière principale:</span>
                        <p className="text-purple-700">{selectedTeacher.subject}</p>
                      </div>
                      {selectedTeacher.classes && selectedTeacher.classes.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Classes:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedTeacher.classes.slice(0, 3).map((className, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                {className}
                              </span>
                            ))}
                            {selectedTeacher.classes.length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                +{selectedTeacher.classes.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <h5 className="font-medium text-green-800 text-sm mb-2">✅ Données Automatiquement Remplies</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs text-green-700">
                            <div>• Nom et prénom</div>
                            <div>• Date de naissance</div>
                            <div>• Email</div>
                            <div>• Téléphone</div>
                            <div>• Poste (généré)</div>
                            <div>• Date d'entrée</div>
                            <div>• Type de contrat</div>
                            <div>• Statut</div>
                          </div>
                          <p className="text-green-600 text-xs mt-2 font-medium">
                            L'expérience est recalculée automatiquement à partir de la date d'entrée.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
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