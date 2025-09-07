import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Users, DollarSign, TrendingUp, Calendar, Trash2, Calculator, User, Wallet, Settings, Eye, Edit, CheckCircle, AlertTriangle } from 'lucide-react';
import { FinancialDataCleanup } from '../components/admin/FinancialDataCleanup';
import { SalaryCalculationForm } from '../components/forms/SalaryCalculationForm';
import { SalaryListView } from '../components/salary/SalaryListView';
import { SalaryDetailsModal } from '../components/salary/SalaryDetailsModal';
import { Modal } from '../components/Modal';
import { hierarchyService, salariesService, teachersService } from '../lib/firebase/firebaseService';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { PayrollSalarySyncPanel } from '../components/payroll/PayrollSalarySyncPanel';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  salary: number;
  status: 'active' | 'inactive';
  contractType?: string;
  entryDate?: string;
}

interface SalaryRecord {
  id?: string;
  employeeId: string;
  employeeName: string;
  employeeType: 'teacher' | 'staff';
  position: string;
  department: string;
  paymentMonth: number;
  paymentYear: number;
  baseSalary: number;
  allowances: {
    transport?: number;
    housing?: number;
    meal?: number;
    performance?: number;
    other?: number;
  };
  totalGross: number;
  cnaps: number;
  ostie: number;
  irsa: number;
  totalDeductions: number;
  netSalary: number;
  effectiveDate: string;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export function SalaryManagement() {
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState<SalaryRecord | null>(null);
  const [selectedSalary, setSelectedSalary] = useState<SalaryRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks Firebase pour charger les données en temps réel
  const { data: employees, loading: employeesLoading } = useFirebaseCollection<Employee>(hierarchyService, true);
  const { data: teachers, loading: teachersLoading } = useFirebaseCollection(teachersService, true);
  const { data: salaries, loading: salariesLoading, create: createSalary, update: updateSalary, remove: deleteSalary } = useFirebaseCollection<SalaryRecord>(salariesService, true);

  // Combiner employés et enseignants
  const allEmployees = [
    ...employees.filter(emp => emp.status === 'active'),
    ...teachers.filter(teacher => teacher.status && teacher.status !== 'inactive').map(teacher => ({
      id: teacher.id!,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      position: teacher.subject || 'Enseignant',
      department: 'Enseignement',
      salary: 800000, // Salaire par défaut pour les enseignants
      status: 'active' as const,
      contractType: teacher.status,
      entryDate: teacher.entryDate
    }))
  ];

  // Filtrer les salaires
  const filteredSalaries = salaries.filter(salary => {
    const matchesSearch = salary.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         salary.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === '' || salary.department === selectedDepartment;
    const matchesYear = selectedYear === '' || salary.paymentYear.toString() === selectedYear;
    const matchesMonth = selectedMonth === '' || salary.paymentMonth.toString() === selectedMonth;
    return matchesSearch && matchesDepartment && matchesYear && matchesMonth;
  });

  const departments = [...new Set(allEmployees.map(e => e.department))];
  const years = [2023, 2024, 2025];
  const months = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' }
  ];

  const handleAddSalary = () => {
    setEditingSalary(null);
    setShowSalaryForm(true);
  };

  const handleEditSalary = (salary: SalaryRecord) => {
    setEditingSalary(salary);
    setShowSalaryForm(true);
  };

  const handleViewSalary = (salary: SalaryRecord) => {
    setSelectedSalary(salary);
    setShowDetailsModal(true);
  };

  const handleSalarySubmit = async (salaryData: any) => {
    try {
      setIsSubmitting(true);
      
      if (editingSalary) {
        // Mettre à jour le salaire existant
        await updateSalary(editingSalary.id!, salaryData);
        console.log('✅ Salaire mis à jour avec succès');
      } else {
        // Créer un nouveau salaire
        await createSalary(salaryData);
        console.log('✅ Nouveau salaire créé avec succès');
      }
      
      setShowSalaryForm(false);
      setEditingSalary(null);
      
      alert('✅ Salaire enregistré avec succès !');
    } catch (error: any) {
      console.error('❌ Erreur lors de la sauvegarde du salaire:', error);
      alert('❌ Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSalary = async (salaryId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce salaire ?')) {
      try {
        await deleteSalary(salaryId);
        alert('✅ Salaire supprimé avec succès !');
      } catch (error: any) {
        alert('❌ Erreur lors de la suppression: ' + error.message);
      }
    }
  };

  const handleCancel = () => {
    setShowSalaryForm(false);
    setEditingSalary(null);
  };

  // Calculer les statistiques
  const totalEmployees = allEmployees.length;
  const activeSalaries = salaries.filter(s => s.status === 'active').length;
  const totalGrossSalary = salaries.reduce((total, s) => total + (s.totalGross || 0), 0);
  const totalNetSalary = salaries.reduce((total, s) => total + (s.netSalary || 0), 0);
  const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  if (employeesLoading || teachersLoading || salariesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Salaires</h1>
          <p className="text-gray-600">Calcul et gestion des salaires avec déductions légales</p>
        </div>
        <button
          onClick={handleAddSalary}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Calcul de Salaire
        </button>
      </div>

      {/* Panneau de Synchronisation Paie ↔ Salaires */}
      <PayrollSalarySyncPanel />

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Employés</p>
              <p className="text-xl font-bold text-gray-900">{totalEmployees}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Salaires Actifs</p>
              <p className="text-xl font-bold text-gray-900">{activeSalaries}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Masse Salariale Brute</p>
              <p className="text-xl font-bold text-gray-900">
                {(totalGrossSalary / 1000000).toFixed(1)}M Ar
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <Wallet className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Masse Salariale Nette</p>
              <p className="text-xl font-bold text-gray-900">
                {(totalNetSalary / 1000000).toFixed(1)}M Ar
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Période Actuelle</p>
              <p className="text-sm font-bold text-gray-900">{currentMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et Recherche */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Tous les départements</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Toutes les années</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Tous les mois</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
            
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </button>
          </div>
        </div>
      </div>

      {/* Liste des Salaires */}
      <SalaryListView
        salaries={filteredSalaries}
        employees={allEmployees}
        onView={handleViewSalary}
        onEdit={handleEditSalary}
        onDelete={handleDeleteSalary}
        loading={salariesLoading}
      />

      {/* Nettoyage des Données Financières - Section Admin */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Trash2 className="w-5 h-5 mr-2 text-red-600" />
          Administration - Nettoyage des Données
        </h2>
        <FinancialDataCleanup />
      </div>

      {/* Formulaire de Calcul de Salaire */}
      <Modal
        isOpen={showSalaryForm}
        onClose={handleCancel}
        title={editingSalary ? 'Modifier le Calcul de Salaire' : 'Nouveau Calcul de Salaire'}
        size="xl"
      >
        <SalaryCalculationForm
          onSubmit={handleSalarySubmit}
          onCancel={handleCancel}
          initialData={editingSalary}
          employees={allEmployees}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Modal de Détails du Salaire */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedSalary(null);
        }}
        title="Détails du Salaire"
        size="xl"
      >
        {selectedSalary && (
          <SalaryDetailsModal
            salary={selectedSalary}
            employee={allEmployees.find(e => e.id === selectedSalary.employeeId)}
            onEdit={() => {
              setShowDetailsModal(false);
              handleEditSalary(selectedSalary);
            }}
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedSalary(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}