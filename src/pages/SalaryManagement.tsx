import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Eye, Users, DollarSign, TrendingUp, Calendar, History, Calculator, Wallet, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/Modal';
import { SalaryForm } from '../components/forms/SalaryForm';
import { SalaryHistoryModal } from '../components/modals/SalaryHistoryModal';
import { Avatar } from '../components/Avatar';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { hierarchyService, teachersService } from '../lib/firebase/firebaseService';

interface SalaryRecord {
  id?: string;
  employeeId: string;
  employeeName: string;
  employeeType: 'teacher' | 'staff';
  position: string;
  department: string;
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

interface SalaryHistory {
  id: string;
  employeeId: string;
  previousSalary: number;
  newSalary: number;
  changeReason: string;
  effectiveDate: string;
  modifiedBy: string;
  createdAt: Date;
}

const mockSalaryRecords: SalaryRecord[] = [
  {
    id: '1',
    employeeId: 'emp1',
    employeeName: 'Marie Rakoto',
    employeeType: 'staff',
    position: 'Directrice',
    department: 'Direction',
    baseSalary: 800000,
    allowances: {
      transport: 50000,
      housing: 100000,
      performance: 80000
    },
    totalGross: 1030000,
    cnaps: 10300,
    ostie: 10300,
    irsa: 136000,
    totalDeductions: 156600,
    netSalary: 873400,
    effectiveDate: '2024-01-01',
    status: 'active'
  },
  {
    id: '2',
    employeeId: 'emp2',
    employeeName: 'Jean Rabe',
    employeeType: 'teacher',
    position: 'Professeur de Mathématiques',
    department: 'Enseignement',
    baseSalary: 450000,
    allowances: {
      transport: 30000,
      meal: 20000
    },
    totalGross: 500000,
    cnaps: 5000,
    ostie: 5000,
    irsa: 25000,
    totalDeductions: 35000,
    netSalary: 465000,
    effectiveDate: '2024-01-01',
    status: 'active'
  }
];

const mockSalaryHistory: SalaryHistory[] = [
  {
    id: '1',
    employeeId: 'emp1',
    previousSalary: 750000,
    newSalary: 800000,
    changeReason: 'Augmentation annuelle',
    effectiveDate: '2024-01-01',
    modifiedBy: 'Admin LES POUPONS',
    createdAt: new Date('2024-01-01')
  }
];

export function SalaryManagement() {
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>(mockSalaryRecords);
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistory[]>(mockSalaryHistory);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null);

  // Hook Firebase pour charger les employés
  const { data: employees, loading: employeesLoading } = useFirebaseCollection(hierarchyService, true);
  const { data: teachers, loading: teachersLoading } = useFirebaseCollection(teachersService, true);

  const filteredRecords = salaryRecords.filter(record => {
    const matchesSearch = record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === '' || record.department === selectedDepartment;
    const matchesType = selectedType === '' || record.employeeType === selectedType;
    return matchesSearch && matchesDepartment && matchesType;
  });

  const departments = [...new Set(salaryRecords.map(r => r.department))];
  const totalGrossSalaries = salaryRecords.reduce((acc, r) => acc + r.totalGross, 0);
  const totalNetSalaries = salaryRecords.reduce((acc, r) => acc + r.netSalary, 0);
  const totalDeductions = salaryRecords.reduce((acc, r) => acc + r.totalDeductions, 0);
  const averageSalary = salaryRecords.length > 0 ? totalNetSalaries / salaryRecords.length : 0;

  const handleAddSalary = (data: any) => {
    const newRecord: SalaryRecord = {
      id: Date.now().toString(),
      employeeId: data.employeeId || 'emp' + Date.now(),
      employeeName: data.employeeName,
      employeeType: data.employeeType,
      position: data.position,
      department: data.department,
      baseSalary: parseFloat(data.baseSalary) || 0,
      allowances: {
        transport: parseFloat(data.transportAllowance) || 0,
        housing: parseFloat(data.housingAllowance) || 0,
        meal: parseFloat(data.mealAllowance) || 0,
        performance: parseFloat(data.performanceAllowance) || 0,
        other: parseFloat(data.otherAllowance) || 0
      },
      totalGross: 0, // Will be calculated
      cnaps: 0,
      ostie: 0,
      irsa: 0,
      totalDeductions: 0,
      netSalary: 0,
      effectiveDate: data.effectiveDate,
      status: data.status || 'active',
      notes: data.notes
    };

    // Calculate totals
    const totalAllowances = Object.values(newRecord.allowances).reduce((sum, val) => sum + (val || 0), 0);
    newRecord.totalGross = newRecord.baseSalary + totalAllowances;
    newRecord.cnaps = Math.round(newRecord.totalGross * 0.01);
    newRecord.ostie = Math.round(newRecord.totalGross * 0.01);
    
    // Simple IRSA calculation
    const taxableIncome = newRecord.totalGross - newRecord.cnaps - newRecord.ostie;
    if (taxableIncome > 350000) {
      if (taxableIncome <= 400000) {
        newRecord.irsa = Math.round((taxableIncome - 350000) * 0.05);
      } else if (taxableIncome <= 500000) {
        newRecord.irsa = Math.round(50000 * 0.05 + (taxableIncome - 400000) * 0.10);
      } else {
        newRecord.irsa = Math.round(50000 * 0.05 + 100000 * 0.10 + (taxableIncome - 500000) * 0.15);
      }
    }
    
    newRecord.totalDeductions = newRecord.cnaps + newRecord.ostie + newRecord.irsa;
    newRecord.netSalary = newRecord.totalGross - newRecord.totalDeductions;

    setSalaryRecords([...salaryRecords, newRecord]);
    setShowAddForm(false);
  };

  const handleEditSalary = (data: any) => {
    if (selectedRecord) {
      // Add to history
      const historyEntry: SalaryHistory = {
        id: Date.now().toString(),
        employeeId: selectedRecord.employeeId,
        previousSalary: selectedRecord.baseSalary,
        newSalary: parseFloat(data.baseSalary),
        changeReason: data.changeReason || 'Modification manuelle',
        effectiveDate: data.effectiveDate,
        modifiedBy: 'Admin LES POUPONS',
        createdAt: new Date()
      };
      setSalaryHistory([historyEntry, ...salaryHistory]);

      // Update record
      const updatedRecord = { ...selectedRecord, ...data };
      setSalaryRecords(salaryRecords.map(r => r.id === selectedRecord.id ? updatedRecord : r));
      setShowEditForm(false);
      setSelectedRecord(null);
    }
  };

  const handleDeleteRecord = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement salarial ?')) {
      setSalaryRecords(salaryRecords.filter(r => r.id !== id));
    }
  };

  const handleViewRecord = (record: SalaryRecord) => {
    setSelectedRecord(record);
    setShowViewModal(true);
  };

  const handleEditClick = (record: SalaryRecord) => {
    setSelectedRecord(record);
    setShowEditForm(true);
  };

  const handleViewHistory = (record: SalaryRecord) => {
    setSelectedRecord(record);
    setShowHistoryModal(true);
  };

  const handleExport = () => {
    alert('Export des données salariales en cours...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Salaires</h1>
          <p className="text-gray-600">Gérez les salaires et indemnités du personnel</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Exporter
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Salaire
          </button>
        </div>
      </div>

      {/* Filters and Search */}
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
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Tous les types</option>
              <option value="teacher">Enseignants</option>
              <option value="staff">Personnel</option>
            </select>
            
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </button>
          </div>
        </div>
      </div>

      {/* Salary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Masse Salariale Brute</p>
              <p className="text-2xl font-bold text-gray-900">{totalGrossSalaries.toLocaleString()} Ar</p>
            </div>
            <Wallet className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Masse Salariale Nette</p>
              <p className="text-2xl font-bold text-blue-600">{totalNetSalaries.toLocaleString()} Ar</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Déductions</p>
              <p className="text-2xl font-bold text-red-600">{totalDeductions.toLocaleString()} Ar</p>
            </div>
            <Calculator className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Salaire Moyen</p>
              <p className="text-2xl font-bold text-purple-600">{averageSalary.toLocaleString()} Ar</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Salary Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {salaryRecords.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun salaire configuré</h3>
            <p className="text-gray-500 mb-6">Commencez par configurer les salaires de vos employés.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Salaire
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Employé</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Type</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Salaire de Base</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Indemnités</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Salaire Brut</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Déductions</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Salaire Net</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Statut</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.map((record) => {
                  const totalAllowances = Object.values(record.allowances).reduce((sum, val) => sum + (val || 0), 0);
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <Avatar 
                            firstName={record.employeeName.split(' ')[0] || ''} 
                            lastName={record.employeeName.split(' ')[1] || ''} 
                            size="md" 
                            showPhoto={true}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{record.employeeName}</p>
                            <p className="text-sm text-gray-500">{record.position}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.employeeType === 'teacher' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {record.employeeType === 'teacher' ? 'Enseignant' : 'Personnel'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-lg font-bold text-gray-900">{record.baseSalary.toLocaleString()} Ar</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium text-green-600">+{totalAllowances.toLocaleString()} Ar</p>
                        <p className="text-xs text-gray-500">
                          {Object.entries(record.allowances).filter(([_, val]) => val && val > 0).length} indemnité(s)
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-lg font-bold text-blue-600">{record.totalGross.toLocaleString()} Ar</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-xs space-y-1">
                          <div className="text-red-600">CNAPS: -{record.cnaps.toLocaleString()}</div>
                          <div className="text-red-600">OSTIE: -{record.ostie.toLocaleString()}</div>
                          <div className="text-red-600">IRSA: -{record.irsa.toLocaleString()}</div>
                          <div className="font-medium text-red-700 border-t border-gray-300 pt-1">
                            Total: -{record.totalDeductions.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-lg font-bold text-green-600">{record.netSalary.toLocaleString()} Ar</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : record.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status === 'active' ? 'Actif' : record.status === 'pending' ? 'En attente' : 'Inactif'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewRecord(record)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditClick(record)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleViewHistory(record)}
                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Historique"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => record.id && handleDeleteRecord(record.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Salary Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Nouveau Salaire"
        size="xl"
      >
        <SalaryForm
          onSubmit={handleAddSalary}
          onCancel={() => setShowAddForm(false)}
          employees={employees}
          teachers={teachers}
        />
      </Modal>

      {/* Edit Salary Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedRecord(null);
        }}
        title="Modifier le Salaire"
        size="xl"
      >
        {selectedRecord && (
          <SalaryForm
            onSubmit={handleEditSalary}
            onCancel={() => {
              setShowEditForm(false);
              setSelectedRecord(null);
            }}
            initialData={selectedRecord}
            employees={employees}
            teachers={teachers}
          />
        )}
      </Modal>

      {/* View Salary Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedRecord(null);
        }}
        title="Détails du Salaire"
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar 
                firstName={selectedRecord.employeeName.split(' ')[0] || ''} 
                lastName={selectedRecord.employeeName.split(' ')[1] || ''} 
                size="lg" 
                showPhoto={true}
              />
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedRecord.employeeName}</h3>
                <p className="text-gray-600">{selectedRecord.position} - {selectedRecord.department}</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  selectedRecord.employeeType === 'teacher' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {selectedRecord.employeeType === 'teacher' ? 'Enseignant' : 'Personnel'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Salary Breakdown */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Composition du Salaire</h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Salaire de Base</span>
                      <span className="text-lg font-bold text-gray-900">{selectedRecord.baseSalary.toLocaleString()} Ar</span>
                    </div>
                  </div>
                  
                  {Object.entries(selectedRecord.allowances).map(([key, value]) => {
                    if (!value || value === 0) return null;
                    const labels = {
                      transport: 'Indemnité Transport',
                      housing: 'Indemnité Logement',
                      meal: 'Indemnité Repas',
                      performance: 'Prime Performance',
                      other: 'Autres Indemnités'
                    };
                    
                    return (
                      <div key={key} className="bg-green-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-green-700">{labels[key as keyof typeof labels]}</span>
                          <span className="font-bold text-green-600">+{value.toLocaleString()} Ar</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-800">Salaire Brut Total</span>
                      <span className="text-xl font-bold text-blue-600">{selectedRecord.totalGross.toLocaleString()} Ar</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Déductions</h4>
                <div className="space-y-3">
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-red-700">CNAPS (1%)</span>
                      <span className="font-bold text-red-600">-{selectedRecord.cnaps.toLocaleString()} Ar</span>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-red-700">OSTIE (1%)</span>
                      <span className="font-bold text-red-600">-{selectedRecord.ostie.toLocaleString()} Ar</span>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-red-700">IRSA (Impôt)</span>
                      <span className="font-bold text-red-600">-{selectedRecord.irsa.toLocaleString()} Ar</span>
                    </div>
                  </div>
                  
                  <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-red-800">Total Déductions</span>
                      <span className="text-xl font-bold text-red-600">-{selectedRecord.totalDeductions.toLocaleString()} Ar</span>
                    </div>
                  </div>
                  
                  <div className="bg-green-100 border border-green-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-green-800">Salaire Net</span>
                      <span className="text-2xl font-bold text-green-600">{selectedRecord.netSalary.toLocaleString()} Ar</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><span className="font-medium">Date d'effet:</span> {new Date(selectedRecord.effectiveDate).toLocaleDateString('fr-FR')}</p>
                  <p><span className="font-medium">Statut:</span> 
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      selectedRecord.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : selectedRecord.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedRecord.status === 'active' ? 'Actif' : selectedRecord.status === 'pending' ? 'En attente' : 'Inactif'}
                    </span>
                  </p>
                </div>
                <div>
                  {selectedRecord.notes && (
                    <p><span className="font-medium">Notes:</span> {selectedRecord.notes}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleViewHistory(selectedRecord);
                }}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <History className="w-4 h-4 mr-2" />
                Voir l'Historique
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditClick(selectedRecord);
                }}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Salary History Modal */}
      {selectedRecord && (
        <SalaryHistoryModal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedRecord(null);
          }}
          employee={selectedRecord}
          history={salaryHistory.filter(h => h.employeeId === selectedRecord.employeeId)}
        />
      )}
    </div>
  );
}