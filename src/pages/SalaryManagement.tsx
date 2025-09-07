import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Users, DollarSign, TrendingUp, Calendar, Trash2 } from 'lucide-react';
import { FinancialDataCleanup } from '../components/admin/FinancialDataCleanup';
import { SalaryForm } from '../components/forms/SalaryForm';
import { Modal } from '../components/Modal';
import { hierarchyService, salariesService } from '../lib/firebase/firebaseService';

export function SalaryManagement() {
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [editingSalary, setEditingSalary] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load employees and teachers data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load employees
        const employeesData = await hierarchyService.getEmployees();
        setEmployees(employeesData || []);
        
        // Load teachers
        const teachersData = await hierarchyService.getTeachers();
        setTeachers(teachersData || []);
        
        // Load existing salaries
        const salariesData = await salariesService.getSalaries();
        setSalaries(salariesData || []);
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleAddSalary = () => {
    setEditingSalary(null);
    setShowSalaryForm(true);
  };

  const handleEditSalary = (salary: any) => {
    setEditingSalary(salary);
    setShowSalaryForm(true);
  };

  const handleSalarySubmit = async (salaryData: any) => {
    try {
      setIsSubmitting(true);
      
      if (editingSalary) {
        // Update existing salary
        await salariesService.updateSalary(editingSalary.id, salaryData);
        setSalaries(prev => prev.map(s => s.id === editingSalary.id ? { ...s, ...salaryData } : s));
      } else {
        // Create new salary
        const newSalary = await salariesService.createSalary(salaryData);
        setSalaries(prev => [...prev, newSalary]);
      }
      
      setShowSalaryForm(false);
      setEditingSalary(null);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du salaire:', error);
      alert('Erreur lors de la sauvegarde du salaire');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowSalaryForm(false);
    setEditingSalary(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Salaires</h1>
          <p className="text-gray-600">Gérez les salaires et les bulletins de paie</p>
        </div>
        <button
          onClick={handleAddSalary}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Salaire
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employés</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length + teachers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Salaires Actifs</p>
              <p className="text-2xl font-bold text-gray-900">{salaries.filter(s => s.status === 'active').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Masse Salariale</p>
              <p className="text-2xl font-bold text-gray-900">
                {salaries.reduce((total, s) => total + (s.netSalary || 0), 0).toLocaleString()} Ar
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ce Mois</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Salary List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Liste des Salaires</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Poste
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salaire Brut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Salaire Net
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salaries.map((salary) => (
                <tr key={salary.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{salary.employeeName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{salary.position}</div>
                    <div className="text-sm text-gray-500">{salary.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {salary.totalGross?.toLocaleString()} Ar
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      {salary.netSalary?.toLocaleString()} Ar
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {salary.paymentMonth}/{salary.paymentYear}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      salary.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : salary.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {salary.status === 'active' ? 'Actif' : 
                       salary.status === 'pending' ? 'En attente' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditSalary(salary)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {salaries.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucun salaire enregistré</p>
            </div>
          )}
        </div>
      </div>

      {/* Financial Data Cleanup - Admin Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Trash2 className="w-5 h-5 mr-2 text-red-600" />
          Administration - Nettoyage des Données
        </h2>
        <FinancialDataCleanup />
      </div>

      {/* Salary Form Modal */}
      <Modal
        isOpen={showSalaryForm}
        onClose={handleCancel}
        title={editingSalary ? 'Modifier le Salaire' : 'Nouveau Salaire'}
        size="xl"
      >
        <SalaryForm
          onSubmit={handleSalarySubmit}
          onCancel={handleCancel}
          initialData={editingSalary}
          employees={employees}
          teachers={teachers}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  );
}