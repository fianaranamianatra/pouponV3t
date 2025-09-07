import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Calculator, Users, Download, Eye, Edit, Trash2, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Avatar } from '../components/Avatar';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { hierarchyService } from '../lib/firebase/firebaseService';
import { PayrollService, PayrollSummary, PayrollCalculation } from '../lib/services/payrollService';
import { FinancialSettingsService } from '../lib/services/financialSettingsService';
import { IRSAService } from '../lib/services/irsaService';
import { IRSACalculator } from '../components/IRSACalculator';
import { IRSABaremeDisplay } from '../components/IRSABaremeDisplay';
import { FinancialIntegrationService } from '../lib/services/financialIntegrationService';
import { PayrollSalarySyncPanel } from '../components/payroll/PayrollSalarySyncPanel';
import { PayrollSyncIndicator } from '../components/payroll/PayrollSyncIndicator';
import { usePayrollSalarySync } from '../hooks/usePayrollSalarySync';
import { FinancialDataCleanup } from '../components/admin/FinancialDataCleanup';
import type { FinancialSetting } from '../lib/firebase/collections';

interface Employee {
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  position: string;
  department: string;
  entryDate?: string;
  contractType?: string;
  experience?: string;
  retirementDate?: string;
  salary: number;
  status: 'active' | 'inactive';
}

export function PayrollManagement() {
  const payrollSyncData = usePayrollSalarySync();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [payrollCalculation, setPayrollCalculation] = useState<PayrollCalculation | null>(null);
  const [bulkPayroll, setBulkPayroll] = useState<PayrollSummary[]>([]);
  const [financialSettings, setFinancialSettings] = useState<FinancialSetting | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  // Hook Firebase pour charger les employés
  const {
    data: employees,
    loading,
    error
  } = useFirebaseCollection<Employee>(hierarchyService, true);

  // Charger les paramètres financiers
  useEffect(() => {
    const loadFinancialSettings = async () => {
      try {
        const settings = await FinancialSettingsService.get();
        setFinancialSettings(settings);
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres financiers:', error);
      }
    };
    
    loadFinancialSettings();
  }, []);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === '' || employee.department === selectedDepartment;
    return matchesSearch && matchesDepartment && employee.status === 'active';
  });

  const departments = [...new Set(employees.map(e => e.department))];
  const totalSalaries = employees.reduce((acc, e) => acc + e.salary, 0);
  const activeEmployees = employees.filter(e => e.status === 'active').length;

  const handleCalculateIndividual = async (employee: Employee) => {
    if (!employee.id) return;
    
    setCalculating(true);
    try {
      console.log(`🚀 Calcul individuel pour ${employee.firstName} ${employee.lastName}...`);
      const calculation = await PayrollService.calculatePayroll(employee.id, employee.salary);
      console.log('✅ Calcul individuel terminé');
      setPayrollCalculation(calculation);
      setSelectedEmployee(employee);
      setShowCalculationModal(true);
    } catch (error: any) {
      console.error('❌ Erreur lors du calcul individuel:', error);
      alert('Erreur lors du calcul: ' + error.message);
    } finally {
      setCalculating(false);
    }
  };

  const handleCalculateBulk = async () => {
    if (selectedEmployees.length === 0) {
      alert('Veuillez sélectionner au moins un employé');
      return;
    }

    setCalculating(true);
    try {
      console.log(`🚀 Début du calcul en lot pour ${selectedEmployees.length} employé(s)...`);
      
      const employeesToCalculate = employees
        .filter(e => selectedEmployees.includes(e.id!))
        .map(e => ({
          id: e.id!,
          name: `${e.firstName} ${e.lastName}`,
          position: e.position,
          department: e.department,
          salary: e.salary
        }));

      console.log('📊 Employés sélectionnés pour le calcul:', employeesToCalculate.map(e => e.name));
      
      const calculations = await PayrollService.calculateBulkPayroll(employeesToCalculate);
      console.log('✅ Calculs terminés avec succès');
      
      // Créer automatiquement les transactions financières pour chaque salaire
      try {
        for (const calculation of calculations) {
          const salaryRecord = {
            id: calculation.employeeId,
            employeeName: calculation.employeeName,
            position: calculation.position,
            department: calculation.department,
            netSalary: calculation.calculation.netSalary,
            employeeId: calculation.employeeId
          };
          
          const result = await FinancialIntegrationService.createSalaryTransaction(salaryRecord);
          if (result.success) {
            console.log(`✅ Transaction créée pour ${calculation.employeeName}: ${result.transactionId}`);
          } else {
            console.warn(`⚠️ Erreur transaction pour ${calculation.employeeName}: ${result.error}`);
          }
        }
        console.log('✅ Toutes les transactions de salaire ont été créées');
      } catch (transactionError) {
        console.warn('⚠️ Erreur lors de la création des transactions automatiques:', transactionError);
        // Ne pas bloquer le processus principal
      }
      
      setBulkPayroll(calculations);
      setShowBulkModal(true);
    } catch (error: any) {
      console.error('❌ Erreur lors du calcul en lot:', error);
      alert('Erreur lors du calcul en lot: ' + error.message);
    } finally {
      setCalculating(false);
      console.log('🏁 Fin du processus de calcul');
    }
  };

  const handleSelectEmployee = (id: string) => {
    setSelectedEmployees(prev => {
      if (prev.includes(id)) {
        return prev.filter(empId => empId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.filter(e => e.id).map(e => e.id!));
    }
  };

  const handlePrintPayslip = (summary: PayrollSummary) => {
    const payslipContent = PayrollService.formatPayslip(summary);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <html>
          <head>
            <title>Bulletin de Paie - ${summary.employeeName}</title>
            <style>
              body { font-family: monospace; margin: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${payslipContent}</pre>
          </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Attendre que le contenu soit chargé avant d'imprimer
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 100);
      };
      
      // Fallback au cas où onload ne se déclenche pas
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.print();
          printWindow.close();
        }
      }, 500);
    }
  };

  const handleExportPayroll = () => {
    if (bulkPayroll.length === 0) {
      alert('Aucune donnée de paie à exporter');
      return;
    }

    const csvContent = [
      'Employé,Poste,Département,Salaire Brut,CNAPS Salarié,CNAPS Employeur,OSTIE Salarié,OSTIE Employeur,Total Cotisations,Salaire Net,Coût Employeur',
      ...bulkPayroll.map(summary => [
        summary.employeeName,
        summary.position,
        summary.department,
        summary.calculation.grossSalary,
        summary.calculation.cnaps.employeeContribution,
        summary.calculation.cnaps.employerContribution,
        summary.calculation.ostie.employeeContribution,
        summary.calculation.ostie.employerContribution,
        summary.calculation.totalEmployeeContributions,
        summary.calculation.netSalary,
        summary.calculation.totalEmployerCost
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paie-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
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

  if (!financialSettings) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-8 h-8 text-yellow-600" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">Paramètres financiers requis</h3>
            <p className="text-yellow-700 mt-1">
              Vous devez d'abord configurer les paramètres OSTIE et CNAPS avant de pouvoir calculer les salaires.
            </p>
            <button
              onClick={() => window.location.href = '/#financial_settings'}
              className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Configurer les paramètres
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overlay de chargement */}
      {calculating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Calcul de la paie en cours...</h3>
              <p className="text-gray-600 mb-4">
                Traitement de {selectedEmployees.length} employé(s)
              </p>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  Calcul des cotisations CNAPS et OSTIE en cours. Veuillez patienter...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion de la Paie</h1>
          <p className="text-gray-600">Calcul des salaires avec cotisations OSTIE et CNAPS</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleExportPayroll}
            disabled={bulkPayroll.length === 0}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </button>
          <button
            onClick={handleCalculateBulk}
            disabled={selectedEmployees.length === 0 || calculating}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {calculating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Calculator className="w-4 h-4 mr-2" />
            )}
            Calculer la Paie ({selectedEmployees.length})
          </button>
        </div>
      </div>

      {/* Paramètres actuels */}
      {/* Panneau de Synchronisation Paie ↔ Salaires */}
      <PayrollSalarySyncPanel />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Paramètres de Cotisation Actuels</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-800 mb-2">CNAPS</h3>
            <div className="space-y-1 text-sm text-blue-700">
              <p>Salarié: {financialSettings.cnaps.employeeRate}% | Employeur: {financialSettings.cnaps.employerRate}%</p>
              <p>Plafond: {financialSettings.cnaps.ceiling.toLocaleString()} Ar</p>
              <p>Statut: {financialSettings.cnaps.isActive ? '✅ Actif' : '❌ Inactif'}</p>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-bold text-green-800 mb-2">OSTIE</h3>
            <div className="space-y-1 text-sm text-green-700">
              <p>Salarié: {financialSettings.ostie.employeeRate}% | Employeur: {financialSettings.ostie.employerRate}%</p>
              <p>Plafond: {financialSettings.ostie.ceiling.toLocaleString()} Ar</p>
              <p>Statut: {financialSettings.ostie.isActive ? '✅ Actif' : '❌ Inactif'}</p>
            </div>
          </div>
        </div>
        
        {/* Barème IRSA détaillé */}
        <div className="mt-6">
          <IRSABaremeDisplay />
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
            
            <button 
              onClick={handleSelectAll}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {selectedEmployees.length === filteredEmployees.length ? 'Désélectionner tout' : 'Sélectionner tout'}
            </button>
          </div>
        </div>
      </div>

      {/* Payroll Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Employés Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{activeEmployees}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Masse Salariale Brute</p>
              <p className="text-2xl font-bold text-green-600">{totalSalaries.toLocaleString()} Ar</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cotisations Estimées</p>
              <p className="text-2xl font-bold text-orange-600">
                {financialSettings ? 
                  Math.round(totalSalaries * (financialSettings.cnaps.employeeRate + financialSettings.ostie.employeeRate) / 100).toLocaleString() 
                  : '0'} Ar
              </p>
            </div>
            <Calculator className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Coût Employeur Total</p>
              <p className="text-2xl font-bold text-purple-600">
                {financialSettings ? 
                  Math.round(totalSalaries * (1 + (financialSettings.cnaps.employerRate + financialSettings.ostie.employerRate) / 100)).toLocaleString() 
                  : '0'} Ar
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {employees.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun employé trouvé</h3>
            <p className="text-gray-500 mb-6">Ajoutez des employés dans le plan hiérarchique pour calculer leur paie.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-2 font-medium text-gray-900 w-10">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Employé</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Poste</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Département</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Salaire Brut</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Cotisations Estimées</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Salaire Net Estimé</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((employee) => {
                  const estimatedContributions = financialSettings ? 
                    Math.round(employee.salary * (financialSettings.cnaps.employeeRate + financialSettings.ostie.employeeRate) / 100) : 0;
                  
                  // Estimation IRSA
                  const salaireImposableEstime = employee.salary - estimatedContributions;
                  const irsaEstime = IRSAService.calculerIRSA(salaireImposableEstime).montantTotal;
                  const totalDeductions = estimatedContributions + irsaEstime;
                  const estimatedNetSalary = employee.salary - totalDeductions;
                  
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={employee.id ? selectedEmployees.includes(employee.id) : false}
                          onChange={() => employee.id && handleSelectEmployee(employee.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <Avatar 
                            firstName={employee.firstName} 
                            lastName={employee.lastName} 
                            size="md" 
                            showPhoto={true}
                          />
                          <div>
                            <p className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</p>
                            <PayrollSyncIndicator
                              employeeId={employee.id!}
                              employeeName={`${employee.firstName} ${employee.lastName}`}
                              currentSalary={employee.salary}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-900">{employee.position}</p>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {employee.department}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-lg font-bold text-gray-900">{employee.salary.toLocaleString()} Ar</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-xs space-y-1">
                          <div className="text-blue-600">CNAPS+OSTIE: -{estimatedContributions.toLocaleString()}</div>
                          <div className="text-purple-600">IRSA: -{irsaEstime.toLocaleString()}</div>
                          <div className="font-medium text-red-600 border-t border-gray-300 pt-1 mt-1">
                            Total: -{totalDeductions.toLocaleString()}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Cotisations sociales + Impôt IRSA
                        </p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-lg font-bold text-green-600">{estimatedNetSalary.toLocaleString()} Ar</p>
                      </td>
                      <td className="py-4 px-6">
                        <button 
                          onClick={() => handleCalculateIndividual(employee)}
                          disabled={calculating}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          <Calculator className="w-4 h-4 mr-1" />
                          Calculer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Individual Calculation Modal */}
      <Modal
        isOpen={showCalculationModal}
        onClose={() => {
          setShowCalculationModal(false);
          setSelectedEmployee(null);
          setPayrollCalculation(null);
        }}
        title="Calcul de Paie Détaillé"
        size="xl"
      >
        {selectedEmployee && payrollCalculation && (
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
                <p className="text-gray-600">{selectedEmployee.position} - {selectedEmployee.department}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Salaire et cotisations */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Détail des Cotisations</h4>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Salaire Brut</span>
                    <span className="text-xl font-bold text-gray-900">
                      {payrollCalculation.grossSalary.toLocaleString()} Ar
                    </span>
                  </div>
                </div>

                {/* CNAPS */}
                {payrollCalculation.cnaps.isActive && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-800 mb-2">CNAPS</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Part salariale ({payrollCalculation.cnaps.rate.employee}%)</span>
                        <span className="font-medium text-red-600">-{payrollCalculation.cnaps.employeeContribution.toLocaleString()} Ar</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Part patronale ({payrollCalculation.cnaps.rate.employer}%)</span>
                        <span className="font-medium text-orange-600">+{payrollCalculation.cnaps.employerContribution.toLocaleString()} Ar</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* OSTIE */}
                {payrollCalculation.ostie.isActive && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h5 className="font-medium text-green-800 mb-2">OSTIE</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Part salariale ({payrollCalculation.ostie.rate.employee}%)</span>
                        <span className="font-medium text-red-600">-{payrollCalculation.ostie.employeeContribution.toLocaleString()} Ar</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Part patronale ({payrollCalculation.ostie.rate.employer}%)</span>
                        <span className="font-medium text-orange-600">+{payrollCalculation.ostie.employerContribution.toLocaleString()} Ar</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Résumé */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Résumé</h4>
                
                <div className="space-y-3">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-red-800">Total Cotisations Salariales</span>
                      <span className="text-xl font-bold text-red-600">
                        -{payrollCalculation.totalEmployeeContributions.toLocaleString()} Ar
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-green-800">Salaire Net</span>
                      <span className="text-2xl font-bold text-green-600">
                        {payrollCalculation.netSalary.toLocaleString()} Ar
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-orange-800">Charges Patronales</span>
                      <span className="text-xl font-bold text-orange-600">
                        +{payrollCalculation.totalEmployerContributions.toLocaleString()} Ar
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-purple-800">Coût Total Employeur</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {payrollCalculation.totalEmployerCost.toLocaleString()} Ar
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const summary: PayrollSummary = {
                      employeeId: selectedEmployee.id!,
                      employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
                      position: selectedEmployee.position,
                      department: selectedEmployee.department,
                      calculation: payrollCalculation,
                      status: 'draft'
                    };
                    handlePrintPayslip(summary);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Imprimer le Bulletin de Paie
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Financial Data Cleanup - Admin Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Trash2 className="w-5 h-5 mr-2 text-red-600" />
          Administration - Nettoyage des Données
        </h2>
        <FinancialDataCleanup />
      </div>

      {/* Bulk Calculation Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          setBulkPayroll([]);
        }}
        title="Calcul de Paie en Lot"
        size="xl"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">
              Résultats pour {bulkPayroll.length} employé(s)
            </h3>
            <button
              onClick={handleExportPayroll}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Employé</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Salaire Brut</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">CNAPS</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">OSTIE</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Salaire Net</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Coût Employeur</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bulkPayroll.map((summary, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <Avatar 
                          firstName={summary.employeeName.split(' ')[0] || ''} 
                          lastName={summary.employeeName.split(' ')[1] || ''} 
                          size="sm" 
                          showPhoto={true}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{summary.employeeName}</p>
                          <p className="text-xs text-gray-500">{summary.position}</p>
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-medium">
                      {summary.calculation.grossSalary.toLocaleString()} Ar
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <div className="text-xs space-y-1">
                        <div className="text-red-600">-{summary.calculation.cnaps.employeeContribution.toLocaleString()}</div>
                        <div className="text-orange-600">+{summary.calculation.cnaps.employerContribution.toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <div className="text-xs space-y-1">
                        <div className="text-red-600">-{summary.calculation.ostie.employeeContribution.toLocaleString()}</div>
                        <div className="text-orange-600">+{summary.calculation.ostie.employerContribution.toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-bold text-green-600">
                      {summary.calculation.netSalary.toLocaleString()} Ar
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-bold text-purple-600">
                      {summary.calculation.totalEmployerCost.toLocaleString()} Ar
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <button
                        onClick={() => handlePrintPayslip(summary)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Imprimer bulletin"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold">
                <tr>
                  <td className="border border-gray-300 px-4 py-2">TOTAL</td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {bulkPayroll.reduce((sum, s) => sum + s.calculation.grossSalary, 0).toLocaleString()} Ar
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {bulkPayroll.reduce((sum, s) => sum + s.calculation.cnaps.total, 0).toLocaleString()} Ar
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {bulkPayroll.reduce((sum, s) => sum + s.calculation.ostie.total, 0).toLocaleString()} Ar
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {bulkPayroll.reduce((sum, s) => sum + s.calculation.netSalary, 0).toLocaleString()} Ar
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {bulkPayroll.reduce((sum, s) => sum + s.calculation.totalEmployerCost, 0).toLocaleString()} Ar
                  </td>
                  <td className="border border-gray-300 px-4 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}