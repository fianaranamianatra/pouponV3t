import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Users, DollarSign, TrendingUp, Calendar, Trash2, Calculator, User, Wallet, Settings, Eye, Edit, CheckCircle, AlertTriangle, Building, Zap } from 'lucide-react';
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
  const [showSyncStatus, setShowSyncStatus] = useState(true);
  const [editingSalary, setEditingSalary] = useState<SalaryRecord | null>(null);
  const [selectedSalary, setSelectedSalary] = useState<SalaryRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hooks Firebase pour charger les données en temps réel
  const { data: employees, loading: employeesLoading } = useFirebaseCollection<Employee>(hierarchyService, true);
  const { data: teachers, loading: teachersLoading } = useFirebaseCollection(teachersService, true);
  const { data: salaries, loading: salariesLoading, create: createSalary, update: updateSalary, remove: deleteSalary } = useFirebaseCollection<SalaryRecord>(salariesService, true);

  // Utiliser EXCLUSIVEMENT les employés du module Ressources Humaines
  // Filtrer uniquement les employés actifs pour la liste déroulante
  const allEmployees = [
    ...employees.filter(emp => emp.status === 'active')
  ];

  console.log('📊 Employés chargés depuis Ressources Humaines:', {
    total: employees.length,
    actifs: allEmployees.length,
    parDepartement: allEmployees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number })
  });

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
      
      let salaryId: string;
      
      if (editingSalary) {
        // Mettre à jour le salaire existant
        await updateSalary(editingSalary.id!, salaryData);
        salaryId = editingSalary.id!;
        console.log('✅ Salaire mis à jour avec succès');
      } else {
        // Créer un nouveau salaire
        salaryId = await createSalary(salaryData);
        console.log('✅ Nouveau salaire créé avec succès');
      }
      
      // Créer ou mettre à jour la transaction financière UNIQUEMENT si c'est un nouveau salaire
      // ou si le montant a changé lors d'une modification
      try {
        const salaryRecord = {
          id: salaryId,
          employeeName: salaryData.employeeName,
          position: salaryData.position,
          department: salaryData.department,
          netSalary: salaryData.netSalary,
          employeeId: salaryData.employeeId
        };
        
        const result = await FinancialIntegrationService.createSalaryTransaction(salaryRecord);
        if (result.success) {
          console.log('✅ Transaction financière synchronisée:', result.transactionId);
        } else {
          console.warn('⚠️ Erreur lors de la synchronisation financière:', result.error);
        }
      } catch (transactionError) {
        console.warn('⚠️ Erreur lors de la création de la transaction automatique:', transactionError);
        // Ne pas bloquer le processus principal si la transaction échoue
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
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col sm:flex-row sm:items-center sm:justify-between gap-4'}`}>
        <div>
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>Gestion des Salaires</h1>
          <p className={`${isMobile ? 'text-sm' : ''} text-gray-600`}>Calcul automatisé des salaires avec déductions légales (CNAPS, OSTIE, IRSA)</p>
          <div className="flex items-center space-x-4 mt-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-600 font-medium">Synchronisé avec Ressources Humaines</span>
            <span className="text-xs text-blue-600 font-medium">
              {allEmployees.length} employé(s) actif(s) disponible(s)
            </span>
          </div>
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
          <button
            onClick={() => setShowSyncStatus(!showSyncStatus)}
            className={`inline-flex items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors`}
          >
            <Zap className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
            {showSyncStatus ? 'Masquer' : 'Afficher'} Sync
          </button>
          <button
            onClick={handleAddSalary}
            className={`inline-flex items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors`}
          >
            <Plus className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
            Nouveau Calcul
          </button>
        </div>
      </div>

      {/* Panneau de Synchronisation Paie ↔ Salaires */}
      {showSyncStatus && <PayrollSalarySyncPanel />}

      {/* Guide d'utilisation */}
      <div className={`bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'}`}>
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Calculator className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-blue-900 mb-2`}>
              Module de Calcul Automatisé des Salaires - Synchronisé avec RH
            </h3>
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-1 md:grid-cols-2 gap-4'} ${isMobile ? 'text-sm' : 'text-sm'} text-blue-800`}>
              <div>
                <h4 className="font-medium mb-1">✅ Fonctionnalités intégrées:</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• <strong>Synchronisation exclusive avec RH</strong></li>
                  <li>• Liste d'employés filtrée par statut actif</li>
                  <li>• Organisation par département</li>
                  <li>• Calcul CNAPS et OSTIE (1% chacun)</li>
                  <li>• Calcul IRSA selon barème officiel</li>
                  <li>• Gestion des indemnités variables</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-1">🔄 Processus automatisé:</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• <strong>Récupération exclusive depuis RH</strong></li>
                  <li>• Validation des employés actifs uniquement</li>
                  <li>• Calcul temps réel des déductions</li>
                  <li>• Application barème IRSA progressif</li>
                  <li>• Génération salaire net final</li>
                </ul>
              </div>
            </div>
            <div className="mt-3 p-3 bg-white border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>📋 Source des données :</strong> Module Ressources Humaines exclusivement • 
                <strong>Employés disponibles :</strong> {allEmployees.length} actif(s) • 
                <strong>Départements :</strong> {departments.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-5 gap-4'}`}>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <Users className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-blue-600`} />
            <div className="ml-3">
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Total Employés</p>
              <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>{totalEmployees}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center">
            <CheckCircle className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-green-600`} />
            <div className="ml-3">
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Salaires Calculés</p>
              <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>{activeSalaries}</p>
            </div>
          </div>
        </div>
        
        <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 ${isMobile ? 'col-span-2' : ''}`}>
          <div className="flex items-center">
            <DollarSign className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-purple-600`} />
            <div className="ml-3">
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-600`}>Masse Salariale Brute</p>
              <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>
                {(totalGrossSalary / 1000000).toFixed(1)}M Ar
              </p>
            </div>
          </div>
        </div>
        
        <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 ${isMobile ? 'hidden' : ''}`}>
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
        
        <div className={`bg-white p-4 rounded-lg shadow-sm border border-gray-100 ${isMobile ? 'hidden' : ''}`}>
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
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col lg:flex-row gap-4'}`}>
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
              <input
                type="text"
                placeholder="Rechercher un employé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isMobile ? 'pl-12 pr-4 py-3 text-base' : 'pl-10 pr-4 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              />
            </div>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="">Tous les départements</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="">Toutes les années</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="">Tous les mois</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
            
            <button className={`${isMobile ? 'hidden sm:inline-flex' : 'inline-flex'} items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}>
              <Filter className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
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
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-lg p-6'} shadow-sm border mt-6`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 ${isMobile ? 'mb-3' : 'mb-4'} flex items-center`}>
          <Trash2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2 text-red-600`} />
          Administration - Nettoyage des Données
        </h2>
        <FinancialDataCleanup />
      </div>

      {/* Formulaire de Calcul de Salaire */}
      <Modal
        isOpen={showSalaryForm}
        onClose={handleCancel}
        title={editingSalary ? 'Modifier le Calcul de Salaire' : 'Nouveau Calcul de Salaire'}
        size={isMobile ? "xl" : "xl"}
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
        size={isMobile ? "xl" : "xl"}
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