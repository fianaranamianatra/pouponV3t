import React, { useState } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Eye, Users, DollarSign, UserCheck, Building, User, Calendar, Briefcase, Clock, Calculator } from 'lucide-react';
import { Modal } from '../components/Modal';
import { EmployeeForm } from '../components/forms/EmployeeForm';
import { Avatar } from '../components/Avatar';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  baseSalary: number;
  status: 'Actif' | 'Inactif';
  hireDate: string;
  email: string;
  phone: string;
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    firstName: 'Marie',
    lastName: 'Rakoto',
    position: 'Directrice',
    department: 'Administration',
    baseSalary: 800000,
    status: 'Actif',
    hireDate: '2020-01-15',
    email: 'marie.rakoto@lespoupons.mg',
    phone: '+261 34 12 345 67'
  },
  {
    id: '2',
    firstName: 'Jean',
    lastName: 'Rabe',
    position: 'Professeur de Mathématiques',
    department: 'Enseignement',
    baseSalary: 450000,
    status: 'Actif',
    hireDate: '2021-09-01',
    email: 'jean.rabe@lespoupons.mg',
    phone: '+261 34 23 456 78'
  },
  {
    id: '3',
    firstName: 'Sophie',
    lastName: 'Andry',
    position: 'Secrétaire',
    department: 'Administration',
    baseSalary: 320000,
    status: 'Actif',
    hireDate: '2019-03-20',
    email: 'sophie.andry@lespoupons.mg',
    phone: '+261 34 34 567 89'
  }
];

export function HumanResources() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === '' || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(employees.map(e => e.department))];
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Actif').length;
  const totalSalary = employees.reduce((acc, e) => acc + e.baseSalary, 0);

  const handleAddEmployee = (data: any) => {
    const newEmployee: Employee = {
      id: Date.now().toString(),
      firstName: data.firstName || 'Prénom',
      lastName: data.lastName || 'Nom',
      position: data.position || 'Poste',
      department: data.department || 'Administration',
      baseSalary: parseFloat(data.baseSalary) || 0,
      status: data.status || 'Actif',
      hireDate: data.hireDate || new Date().toISOString().split('T')[0],
      email: data.email || 'email@lespoupons.mg',
      phone: data.phone || '+261 34 00 000 00'
    };
    setEmployees([...employees, newEmployee]);
    setShowAddForm(false);
  };

  const handleEditEmployee = (data: any) => {
    if (selectedEmployee) {
      setEmployees(employees.map(e => 
        e.id === selectedEmployee.id ? { 
          ...e, 
          ...data, 
          baseSalary: parseFloat(data.baseSalary) || 0 
        } : e
      ));
      setShowEditForm(false);
      setSelectedEmployee(null);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      setEmployees(employees.filter(e => e.id !== id));
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Employés</h1>
          <p className="text-gray-600">Gérez le personnel et les ressources humaines de l'école</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter Employé
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les départements</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900">EMPLOYÉ</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">POSTE</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">DÉPARTEMENT</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">SALAIRE DE BASE</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">STATUT</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium text-sm">
                          {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</p>
                        <p className="text-sm text-gray-500">Depuis le {new Date(employee.hireDate).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm text-gray-900">{employee.position}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.department === 'Administration' 
                        ? 'bg-blue-100 text-blue-800' 
                        : employee.department === 'Enseignement'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {employee.department}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-lg font-bold text-gray-900">{employee.baseSalary.toLocaleString()} MGA</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.status === 'Actif' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewEmployee(employee)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditClick(employee)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employés</p>
              <p className="text-3xl font-bold text-blue-600">{totalEmployees}</p>
            </div>
            <Users className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Employés Actifs</p>
              <p className="text-3xl font-bold text-green-600">{activeEmployees}</p>
            </div>
            <UserCheck className="w-12 h-12 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Masse Salariale Totale</p>
              <p className="text-3xl font-bold text-purple-600">{totalSalary.toLocaleString()} MGA</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-600" />
          </div>
        </div>
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
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Date d'embauche</p>
                      <p className="text-sm text-gray-900">{new Date(selectedEmployee.hireDate).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  
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
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Ancienneté</p>
                      <p className="text-sm text-gray-900">
                        {(() => {
                          const hireDate = new Date(selectedEmployee.hireDate);
                          const now = new Date();
                          const years = now.getFullYear() - hireDate.getFullYear();
                          const months = now.getMonth() - hireDate.getMonth();
                          const totalMonths = years * 12 + months;
                          
                          if (totalMonths < 12) {
                            return `${totalMonths} mois`;
                          } else {
                            const fullYears = Math.floor(totalMonths / 12);
                            const remainingMonths = totalMonths % 12;
                            return remainingMonths > 0 ? `${fullYears} ans ${remainingMonths} mois` : `${fullYears} ans`;
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Informations Salariales */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4 pb-2 border-b border-gray-200">Informations Salariales</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Salaire de base:</span>
                  <span className="text-lg font-bold text-blue-600">{selectedEmployee.baseSalary.toLocaleString()} MGA</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">CNAPS (13%):</span>
                  <span className="text-sm font-medium text-red-600">-{Math.round(selectedEmployee.baseSalary * 0.13).toLocaleString()} MGA</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">OSTIE (5%):</span>
                  <span className="text-sm font-medium text-red-600">-{Math.round(selectedEmployee.baseSalary * 0.05).toLocaleString()} MGA</span>
                </div>
                
                <div className="border-t border-gray-300 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-900">Salaire net:</span>
                    <span className="text-xl font-bold text-green-600">
                      {Math.round(selectedEmployee.baseSalary * 0.82).toLocaleString()} MGA
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