import React, { useState } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Eye, Users, DollarSign, UserCheck, Building, User, Calendar, Briefcase, Clock, Calculator, Phone, Mail, MapPin } from 'lucide-react';
import { Modal } from '../components/Modal';
import EmployeeForm from '../components/forms/EmployeeForm';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { hierarchyService } from '../lib/firebase/firebaseService';
import { Avatar } from '../components/Avatar';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  position: string;
  department: string;
  salary: number;
  status: 'Actif' | 'Inactif';
  entryDate?: string;
  contractType?: string;
  experience?: string;
  retirementDate?: string;
  email: string;
  phone: string;
}

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
const calculateExperience = (entryDate: string): string => {
  if (!entryDate) return 'Non renseigné';
  
  const today = new Date();
  const entry = new Date(entryDate);
  
  let years = today.getFullYear() - entry.getFullYear();
  let months = today.getMonth() - entry.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  if (today.getDate() < entry.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  
  if (years > 0 && months > 0) {
    return `${years} an${years > 1 ? 's' : ''} ${months} mois`;
  } else if (years > 0) {
    return `${years} an${years > 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} mois`;
  } else {
    return 'Moins d\'un mois';
  }
};

export function HumanResources() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hook Firebase avec synchronisation temps réel
  const {
    data: employees,
    loading,
    error,
    creating,
    updating,
    deleting,
    create,
    update,
    remove
  } = useFirebaseCollection<Employee>(hierarchyService, true);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === '' || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(employees.map(e => e.department))];
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const totalSalary = employees.reduce((acc, e) => acc + e.salary, 0);

  const handleAddEmployee = async (data: any) => {
    try {
      console.log('🚀 Ajout d\'employé - Données reçues:', data);
      
      // Préparer les données pour Firebase
      const employeeData = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth || '',
        email: data.email,
        phone: data.phone,
        position: data.position,
        department: data.department,
        level: parseInt(data.level) || 1,
        parentId: data.parentId || '',
        salary: parseFloat(data.salary) || 0,
        hireDate: data.entryDate || new Date().toISOString().split('T')[0],
        status: data.status || 'active',
        contractType: data.contractType || '',
        experience: data.experience || '',
        entryDate: data.entryDate || '',
        retirementDate: data.retirementDate || ''
      };
      
      console.log('📝 Données formatées pour Firebase:', employeeData);
      
      const employeeId = await create(employeeData);
      console.log('✅ Employé créé avec l\'ID:', employeeId);
      
      setShowAddForm(false);
      
      // Message de succès
      alert('✅ Employé ajouté avec succès !');
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ajout de l\'employé:', error);
      alert('❌ Erreur lors de l\'ajout de l\'employé: ' + error.message);
    }
  };

  const handleEditEmployee = async (data: any) => {
    if (selectedEmployee?.id) {
      try {
        console.log('🔄 Modification d\'employé - Données:', data);
        
        const updateData = {
          ...data,
          salary: parseFloat(data.salary) || 0,
          level: parseInt(data.level) || 1
        };
        
        await update(selectedEmployee.id, updateData);
        console.log('✅ Employé modifié avec succès');
        
        setShowEditForm(false);
        setSelectedEmployee(null);
        
        alert('✅ Employé modifié avec succès !');
        
      } catch (error: any) {
        console.error('❌ Erreur lors de la modification:', error);
        alert('❌ Erreur lors de la modification: ' + error.message);
      }
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      try {
        console.log('🗑️ Suppression de l\'employé ID:', id);
        await remove(id);
        console.log('✅ Employé supprimé avec succès');
        alert('✅ Employé supprimé avec succès !');
      } catch (error: any) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert('❌ Erreur lors de la suppression: ' + error.message);
      }
    }
  };

  const handleViewEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowViewModal(true);
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des employés...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erreur: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col sm:flex-row sm:items-center sm:justify-between gap-4'}`}>
        <div>
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>Gestion des Employés</h1>
          <p className={`${isMobile ? 'text-sm' : ''} text-gray-600`}>Gérez le personnel et les ressources humaines de l'école</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          disabled={creating}
          className={`inline-flex items-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50`}
        >
          {creating ? (
            <div className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} border-2 border-white border-t-transparent rounded-full animate-spin mr-2`}></div>
          ) : (
            <Plus className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
          )}
          Ajouter Employé
        </button>
      </div>

      {/* Filters and Search */}
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col sm:flex-row gap-4'}`}>
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
              <input
                type="text"
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isMobile ? 'pl-12 pr-4 py-3 text-base' : 'pl-10 pr-4 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="">Tous les départements</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            
            <button className={`${isMobile ? 'hidden sm:inline-flex' : 'inline-flex'} items-center ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}>
              <Filter className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
              Filtres
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-3 gap-6'}`}>
        <div className="bg-white rounded-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Total Employés</p>
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-blue-600`}>{totalEmployees}</p>
            </div>
            <Users className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} text-blue-600`} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Employés Actifs</p>
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>{activeEmployees}</p>
            </div>
            <UserCheck className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} text-green-600`} />
          </div>
        </div>
        
        <div className={`bg-white rounded-lg p-6 border border-gray-100 ${isMobile ? 'col-span-2' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Masse Salariale Totale</p>
              <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-purple-600`}>{totalSalary.toLocaleString()} MGA</p>
            </div>
            <DollarSign className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} text-purple-600`} />
          </div>
        </div>
      </div>

      {/* Employees Grid */}
      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}`}>
        {employees.length === 0 ? (
          <div className={`col-span-full text-center ${isMobile ? 'py-8' : 'py-12'}`}>
            <Users className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-gray-300 mx-auto mb-4`} />
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>Aucun employé enregistré</h3>
            <p className={`${isMobile ? 'text-sm' : ''} text-gray-500 mb-6`}>Commencez par ajouter votre premier employé à l'école.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className={`inline-flex items-center ${isMobile ? 'px-6 py-3 text-base' : 'px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors`}
            >
              <Plus className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
              Ajouter Employé
            </button>
          </div>
        ) : (
          filteredEmployees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header avec avatar et nom */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <Avatar 
                    firstName={employee.firstName} 
                    lastName={employee.lastName} 
                    size="lg" 
                    showPhoto={true}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-blue-600 font-medium">{employee.position}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        employee.department === 'Administration' 
                          ? 'bg-blue-100 text-blue-800' 
                          : employee.department === 'Enseignement'
                          ? 'bg-green-100 text-green-800'
                          : employee.department === 'Direction'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {employee.department}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        employee.status === 'Actif' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contenu de la carte */}
              <div className="p-6 space-y-4">
                {/* Informations personnelles */}
                <div className="space-y-3">
                  {employee.dateOfBirth && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Âge</p>
                        <p className="text-sm text-gray-900">{calculateAge(employee.dateOfBirth)} ans</p>
                      </div>
                    </div>
                  )}
                  
                  {employee.entryDate && (
                    <div className="flex items-center space-x-3">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Expérience</p>
                        <p className="text-sm text-gray-900">{calculateExperience(employee.entryDate)}</p>
                      </div>
                    </div>
                  )}

                  {employee.contractType && (
                    <div className="flex items-center space-x-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Contrat</p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          employee.contractType === 'FRAM' 
                            ? 'bg-blue-100 text-blue-800' 
                            : employee.contractType === 'CDI'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {employee.contractType}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Téléphone</p>
                      <p className="text-sm text-gray-900">{employee.phone}</p>
                    </div>
                  </div>

                  {employee.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-sm text-gray-900">{employee.email}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Salaire */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">Salaire</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">{employee.salary.toLocaleString()} Ar</p>
                      <p className="text-xs text-gray-500">Salaire mensuel</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleViewEmployee(employee)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEditClick(employee)}
                      disabled={updating}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteEmployee(employee.id)}
                      disabled={deleting}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      alert(`Génération du bulletin de paie pour ${employee.firstName} ${employee.lastName}...`);
                    }}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Bulletin
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Ajouter un Employé"
        size="lg"
      >
        <EmployeeForm
          onSubmit={handleAddEmployee}
          onCancel={() => setShowAddForm(false)}
        />
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedEmployee(null);
        }}
        title="Modifier l'Employé"
        size="lg"
      >
        {selectedEmployee && (
          <EmployeeForm
            onSubmit={handleEditEmployee}
            onCancel={() => {
              setShowEditForm(false);
              setSelectedEmployee(null);
            }}
            initialData={selectedEmployee}
          />
        )}
      </Modal>

      {/* View Employee Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedEmployee(null);
        }}
        title="Détails de l'Employé"
        size="lg"
      >
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar 
                firstName={selectedEmployee.firstName} 
                lastName={selectedEmployee.lastName} 
                size="lg" 
                showPhoto={true}
              />
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </h3>
                <p className="text-gray-600">{selectedEmployee.position}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedEmployee.department === 'Administration' 
                    ? 'bg-blue-100 text-blue-800' 
                    : selectedEmployee.department === 'Enseignement'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {selectedEmployee.department}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations Personnelles */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Informations Personnelles</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Nom complet</p>
                      <p className="text-sm text-gray-900">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                    </div>
                  </div>
                  
                  {selectedEmployee.dateOfBirth && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Date de naissance</p>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedEmployee.dateOfBirth).toLocaleDateString('fr-FR')} 
                          <span className="text-gray-500 ml-2">({calculateAge(selectedEmployee.dateOfBirth)} ans)</span>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedEmployee.entryDate && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Date d'entrée</p>
                        <p className="text-sm text-gray-900">
                          {new Date(selectedEmployee.entryDate).toLocaleDateString('fr-FR')}
                          <span className="text-gray-500 ml-2">({calculateExperience(selectedEmployee.entryDate)})</span>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Téléphone</p>
                      <p className="text-sm text-gray-900">{selectedEmployee.phone}</p>
                    </div>
                  </div>

                  {selectedEmployee.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-sm text-gray-900">{selectedEmployee.email}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 flex items-center justify-center">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedEmployee.status === 'Actif' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Statut</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        selectedEmployee.status === 'Actif' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedEmployee.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Informations Professionnelles */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Informations Professionnelles</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Poste</p>
                      <p className="text-sm text-gray-900">{selectedEmployee.position}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Building className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Département</p>
                      <p className="text-sm text-gray-900">{selectedEmployee.department}</p>
                    </div>
                  </div>
                  
                  {selectedEmployee.contractType && (
                    <div className="flex items-center space-x-3">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Type de contrat</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          selectedEmployee.contractType === 'FRAM' 
                            ? 'bg-blue-100 text-blue-800' 
                            : selectedEmployee.contractType === 'CDI'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {selectedEmployee.contractType}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {selectedEmployee.retirementDate && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Date de retraite prévue</p>
                        <p className="text-sm text-gray-900">{new Date(selectedEmployee.retirementDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Informations Salariales */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Informations Salariales</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Salaire de base:</span>
                  <span className="text-lg font-bold text-blue-600">{selectedEmployee.salary.toLocaleString()} Ar</span>
                </div>
                
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-xs font-medium text-gray-600 mb-2">COTISATIONS SOCIALES</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">CNAPS (13%):</span>
                  <span className="text-sm font-medium text-red-600">-{Math.round(selectedEmployee.salary * 0.13).toLocaleString()} Ar</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">OSTIE (5%):</span>
                  <span className="text-sm font-medium text-red-600">-{Math.round(selectedEmployee.salary * 0.05).toLocaleString()} Ar</span>
                </div>
                
                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Salaire imposable:</span>
                    <span className="text-sm font-bold text-gray-900">
                      {Math.round(selectedEmployee.salary * 0.82).toLocaleString()} Ar
                    </span>
                  </div>
                </div>
                
                <div className="border-t border-gray-300 pt-2">
                  <p className="text-xs font-medium text-gray-600 mb-2">IMPÔTS</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">IRSA (Impôt sur revenus):</span>
                  <span className="text-sm font-medium text-red-600">
                    -{(() => {
                      const salaireImposable = Math.round(selectedEmployee.salary * 0.82);
                      // Calcul IRSA simplifié pour l'affichage
                      let irsa = 0;
                      if (salaireImposable > 350000) {
                        if (salaireImposable <= 400000) {
                          irsa = Math.round((salaireImposable - 350000) * 0.05);
                        } else if (salaireImposable <= 500000) {
                          irsa = Math.round(50000 * 0.05 + (salaireImposable - 400000) * 0.10);
                        } else if (salaireImposable <= 600000) {
                          irsa = Math.round(50000 * 0.05 + 100000 * 0.10 + (salaireImposable - 500000) * 0.15);
                        } else {
                          irsa = Math.round(50000 * 0.05 + 100000 * 0.10 + 100000 * 0.15 + (salaireImposable - 600000) * 0.20);
                        }
                      }
                      return irsa.toLocaleString();
                    })()} MGA
                  </span>
                </div>
                
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Salaire net:</span>
                    <span className="text-xl font-bold text-green-600">
                      {(() => {
                        const salaireImposable = Math.round(selectedEmployee.salary * 0.82);
                        let irsa = 0;
                        if (salaireImposable > 350000) {
                          if (salaireImposable <= 400000) {
                            irsa = Math.round((salaireImposable - 350000) * 0.05);
                          } else if (salaireImposable <= 500000) {
                            irsa = Math.round(50000 * 0.05 + (salaireImposable - 400000) * 0.10);
                          } else if (salaireImposable <= 600000) {
                            irsa = Math.round(50000 * 0.05 + 100000 * 0.10 + (salaireImposable - 500000) * 0.15);
                          } else {
                            irsa = Math.round(50000 * 0.05 + 100000 * 0.10 + 100000 * 0.15 + (salaireImposable - 600000) * 0.20);
                          }
                        }
                        return (salaireImposable - irsa).toLocaleString();
                      })()} Ar
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  alert(`Génération du bulletin de paie pour ${selectedEmployee.firstName} ${selectedEmployee.lastName}...`);
                }}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Générer Bulletin
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditClick(selectedEmployee);
                }}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier Informations
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}