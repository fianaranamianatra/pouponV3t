import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Eye, Users, DollarSign, TrendingUp, Calendar, History, Calculator, Wallet, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/Modal';
import { SalaryForm } from '../components/forms/SalaryForm';
import { SalaryHistoryModal } from '../components/modals/SalaryHistoryModal';
import { Avatar } from '../components/Avatar';
import { TransactionSyncIndicator } from '../components/financial/TransactionSyncIndicator';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { hierarchyService, teachersService, salariesService } from '../lib/firebase/firebaseService';
import { FinancialIntegrationService } from '../lib/services/financialIntegrationService';

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
  
  // Hook Firebase pour la gestion des salaires avec synchronisation temps réel
  const {
    data: salaryRecords,
    loading: salariesLoading,
    error: salariesError,
    creating,
    updating,
    deleting,
    create,
    update,
    remove
  } = useFirebaseCollection<SalaryRecord>(salariesService, true);

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

  const handleAddSalary = async (data: any) => {
    try {
      console.log('🚀 Ajout de salaire - Données reçues:', data);
      
      // Calculer les totaux
      const baseSalary = parseFloat(data.baseSalary) || 0;
      const allowances = {
        transport: parseFloat(data.transportAllowance) || 0,
        housing: parseFloat(data.housingAllowance) || 0,
        meal: parseFloat(data.mealAllowance) || 0,
        performance: parseFloat(data.performanceAllowance) || 0,
        other: parseFloat(data.otherAllowance) || 0
      };
      
      const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + val, 0);
      const totalGross = baseSalary + totalAllowances;
      const cnaps = Math.round(totalGross * 0.01);
      const ostie = Math.round(totalGross * 0.01);
      
      // Calcul IRSA
      const taxableIncome = totalGross - cnaps - ostie;
      let irsa = 0;
      if (taxableIncome > 350000) {
        if (taxableIncome <= 400000) {
          irsa = Math.round((taxableIncome - 350000) * 0.05);
        } else if (taxableIncome <= 500000) {
          irsa = Math.round(50000 * 0.05 + (taxableIncome - 400000) * 0.10);
        } else {
          irsa = Math.round(50000 * 0.05 + 100000 * 0.10 + (taxableIncome - 500000) * 0.15);
        }
      }
      
      const totalDeductions = cnaps + ostie + irsa;
      const netSalary = totalGross - totalDeductions;
      
      const newRecord = {
      employeeId: data.employeeId || 'emp' + Date.now(),
      employeeName: data.employeeName,
      employeeType: data.employeeType,
      position: data.position,
      department: data.department,
      baseSalary,
      allowances,
      totalGross,
      cnaps,
      ostie,
      irsa,
      totalDeductions,
      netSalary,
      effectiveDate: data.effectiveDate,
      status: data.status || 'active',
      notes: data.notes
      };
      
      console.log('📝 Données formatées pour Firebase:', newRecord);
      
      const salaryId = await create(newRecord);
      console.log('✅ Salaire créé avec l\'ID:', salaryId);
      
      // Créer automatiquement une transaction financière
      try {
        const result = await FinancialIntegrationService.createSalaryTransaction({
          ...newRecord,
          id: salaryId
        });
        
        if (result.success) {
          console.log('✅ Transaction de salaire créée automatiquement:', result.transactionId);
        } else {
          console.warn('⚠️ Erreur lors de la création de la transaction automatique:', result.error);
        }
      } catch (transactionError) {
        console.warn('⚠️ Erreur lors de la création de la transaction automatique:', transactionError);
        // Ne pas bloquer le processus principal
      }
      
      setShowAddForm(false);
      
      // Message de succès
      alert('✅ Salaire enregistré avec succès !');
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ajout du salaire:', error);
      alert('❌ Erreur lors de l\'ajout du salaire: ' + error.message);
    }
  };

  const handleEditSalary = async (data: any) => {
    if (selectedRecord?.id) {
      try {
        console.log('🔄 Modification de salaire - Données:', data);
        
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

        // Recalculer les totaux
        const baseSalary = parseFloat(data.baseSalary) || 0;
        const allowances = {
          transport: parseFloat(data.transportAllowance) || 0,
          housing: parseFloat(data.housingAllowance) || 0,
          meal: parseFloat(data.mealAllowance) || 0,
          performance: parseFloat(data.performanceAllowance) || 0,
          other: parseFloat(data.otherAllowance) || 0
        };
        
        const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + val, 0);
        const totalGross = baseSalary + totalAllowances;
        const cnaps = Math.round(totalGross * 0.01);
        const ostie = Math.round(totalGross * 0.01);
        
        // Calcul IRSA
        const taxableIncome = totalGross - cnaps - ostie;
        let irsa = 0;
        if (taxableIncome > 350000) {
          if (taxableIncome <= 400000) {
            irsa = Math.round((taxableIncome - 350000) * 0.05);
          } else if (taxableIncome <= 500000) {
            irsa = Math.round(50000 * 0.05 + (taxableIncome - 400000) * 0.10);
          } else {
            irsa = Math.round(50000 * 0.05 + 100000 * 0.10 + (taxableIncome - 500000) * 0.15);
          }
        }
        
        const totalDeductions = cnaps + ostie + irsa;
        const netSalary = totalGross - totalDeductions;
        
        const updateData = {
          ...data,
          baseSalary,
          allowances,
          totalGross,
          cnaps,
          ostie,
          irsa,
          totalDeductions,
          netSalary
        };
        
        await update(selectedRecord.id, updateData);
        console.log('✅ Salaire modifié avec succès');
        
        // Synchroniser avec les transactions financières si le salaire change
        try {
          if (updateData.netSalary !== selectedRecord.netSalary) {
            const result = await FinancialIntegrationService.createSalaryTransaction({
              ...updateData,
              id: selectedRecord.id
            });
            
            if (result.success) {
              console.log('✅ Transaction de salaire mise à jour automatiquement');
            }
          }
        } catch (syncError) {
          console.warn('⚠️ Erreur lors de la synchronisation:', syncError);
        }
        
      setShowEditForm(false);
      setSelectedRecord(null);
        
        alert('✅ Salaire modifié avec succès !');
        
      } catch (error: any) {
        console.error('❌ Erreur lors de la modification:', error);
        alert('❌ Erreur lors de la modification: ' + error.message);
      }
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet enregistrement salarial ?')) {
      try {
        console.log('🗑️ Suppression du salaire ID:', id);
        
        // Supprimer les transactions liées avant de supprimer le salaire
        try {
          await FinancialIntegrationService.deleteRelatedTransactions('salary', id);
          console.log('✅ Transactions liées supprimées');
        } catch (syncError) {
          console.warn('⚠️ Erreur lors de la suppression des transactions liées:', syncError);
        }
        
        await remove(id);
        console.log('✅ Salaire supprimé avec succès');
        alert('✅ Salaire supprimé avec succès !');
      } catch (error: any) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert('❌ Erreur lors de la suppression: ' + error.message);
      }
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

  // Afficher le loading pendant le chargement des salaires
  if (salariesLoading || employeesLoading || teachersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données salariales...</p>
        </div>
      </div>
    );
  }

  // Afficher les erreurs
  if (salariesError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erreur: {salariesError}</p>
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
            disabled={creating}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {creating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {creating ? 'Enregistrement...' : 'Nouveau Salaire'}
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
                            <TransactionSyncIndicator
                              module="salary"
                              recordId={record.id || ''}
                              recordName={record.employeeName}
                              className="mt-1"
                            />
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
                            disabled={updating}
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
                            disabled={deleting}
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
          isSubmitting={creating}
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
            isSubmitting={updating}
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