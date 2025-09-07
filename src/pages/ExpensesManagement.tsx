import React, { useState } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Eye, TrendingUp, TrendingDown, Calendar, Tag, AlertTriangle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Modal } from '../components/Modal';
import { ExpenseForm } from '../components/forms/ExpenseForm';
import { BudgetOverview } from '../components/budget/BudgetOverview';

interface Expense {
  id: string;
  category: string;
  subcategory: string;
  description: string;
  amount: number;
  type: 'fixed' | 'variable' | 'exceptional';
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  dueDate: string;
  paymentDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  supplier?: string;
  reference: string;
  budget: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BudgetCategory {
  name: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  status: 'good' | 'warning' | 'danger';
}

const mockExpenses: Expense[] = [];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const statusLabels = {
  pending: 'En attente',
  paid: 'Payé',
  overdue: 'En retard',
  cancelled: 'Annulé'
};

const typeColors = {
  fixed: 'bg-blue-100 text-blue-800',
  variable: 'bg-orange-100 text-orange-800',
  exceptional: 'bg-purple-100 text-purple-800'
};

const typeLabels = {
  fixed: 'Fixe',
  variable: 'Variable',
  exceptional: 'Exceptionnel'
};

export function ExpensesManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || expense.category === selectedCategory;
    const matchesType = selectedType === '' || expense.type === selectedType;
    const matchesStatus = selectedStatus === '' || expense.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  const categories = [...new Set(expenses.map(e => e.category))];
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const paidExpenses = expenses.filter(e => e.status === 'paid').reduce((acc, e) => acc + e.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'pending').reduce((acc, e) => acc + e.amount, 0);
  const overdueCount = expenses.filter(e => e.status === 'overdue').length;

  // Calculate budget overview
  const budgetCategories: BudgetCategory[] = categories.map(category => {
    const categoryExpenses = expenses.filter(e => e.category === category);
    const budgetAmount = categoryExpenses.reduce((acc, e) => acc + e.budget, 0);
    const spentAmount = categoryExpenses.filter(e => e.status === 'paid').reduce((acc, e) => acc + e.amount, 0);
    const percentage = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
    
    let status: 'good' | 'warning' | 'danger' = 'good';
    if (percentage > 90) status = 'danger';
    else if (percentage > 75) status = 'warning';
    
    return {
      name: category,
      budgetAmount,
      spentAmount,
      percentage,
      status
    };
  });

  const handleAddExpense = (data: any) => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      category: data.category,
      subcategory: data.subcategory,
      description: data.description,
      amount: parseFloat(data.amount) || 0,
      type: data.type,
      frequency: data.frequency,
      dueDate: data.dueDate,
      paymentDate: data.paymentDate,
      status: data.status || 'pending',
      supplier: data.supplier,
      reference: data.reference || `EXP-${Date.now()}`,
      budget: parseFloat(data.budget) || 0,
      notes: data.notes
    };
    setExpenses([...expenses, newExpense]);
    setShowAddForm(false);
  };

  const handleEditExpense = (data: any) => {
    if (selectedExpense) {
      setExpenses(expenses.map(e => 
        e.id === selectedExpense.id ? { 
          ...e, 
          ...data, 
          amount: parseFloat(data.amount) || 0,
          budget: parseFloat(data.budget) || 0
        } : e
      ));
      setShowEditForm(false);
      setSelectedExpense(null);
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowViewModal(true);
  };

  const handleEditClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setShowEditForm(true);
  };

  const handleMarkAsPaid = (id: string) => {
    setExpenses(expenses.map(e => 
      e.id === id ? { 
        ...e, 
        status: 'paid', 
        paymentDate: new Date().toISOString().split('T')[0] 
      } : e
    ));
  };

  const handleExport = () => {
    alert('Export des charges et dépenses en cours...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Charges et Dépenses</h1>
          <p className="text-gray-600">Gestion du budget et suivi des dépenses de l'école</p>
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
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Dépense
          </button>
        </div>
      </div>

      {/* Budget Overview */}
      <BudgetOverview categories={budgetCategories} />

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une dépense..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Tous les types</option>
              <option value="fixed">Charges Fixes</option>
              <option value="variable">Charges Variables</option>
              <option value="exceptional">Charges Exceptionnelles</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="paid">Payé</option>
              <option value="overdue">En retard</option>
              <option value="cancelled">Annulé</option>
            </select>
            
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </button>
          </div>
        </div>
      </div>

      {/* Expense Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Dépenses</p>
              <p className="text-2xl font-bold text-gray-900">{totalExpenses.toLocaleString()} Ar</p>
            </div>
            <DollarSign className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dépenses Payées</p>
              <p className="text-2xl font-bold text-green-600">{paidExpenses.toLocaleString()} Ar</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingExpenses.toLocaleString()} Ar</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Retard</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <TrendingDown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune dépense enregistrée</h3>
            <p className="text-gray-500 mb-6">Commencez par ajouter vos premières charges et dépenses.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Dépense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Description</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Catégorie</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Type</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Montant</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Budget</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Échéance</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Statut</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenses.map((expense) => {
                  const budgetUsage = expense.budget > 0 ? (expense.amount / expense.budget) * 100 : 0;
                  
                  return (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{expense.description}</p>
                          <p className="text-sm text-gray-500">{expense.subcategory}</p>
                          {expense.supplier && (
                            <p className="text-xs text-gray-400">Fournisseur: {expense.supplier}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[expense.type]}`}>
                          {typeLabels[expense.type]}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-lg font-bold text-red-600">{expense.amount.toLocaleString()} Ar</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900">{expense.budget.toLocaleString()} Ar</p>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                budgetUsage > 90 ? 'bg-red-500' : 
                                budgetUsage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(budgetUsage, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500">{budgetUsage.toFixed(1)}% utilisé</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {new Date(expense.dueDate).toLocaleDateString('fr-FR')}
                        </div>
                        {expense.paymentDate && (
                          <p className="text-xs text-green-600">
                            Payé le {new Date(expense.paymentDate).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[expense.status]}`}>
                          {statusLabels[expense.status]}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => handleViewExpense(expense)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditClick(expense)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {expense.status === 'pending' && (
                            <button 
                              onClick={() => handleMarkAsPaid(expense.id)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Marquer comme payé"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteExpense(expense.id)}
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

      {/* Add Expense Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Nouvelle Dépense"
        size="xl"
      >
        <ExpenseForm
          onSubmit={handleAddExpense}
          onCancel={() => setShowAddForm(false)}
        />
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedExpense(null);
        }}
        title="Modifier la Dépense"
        size="xl"
      >
        {selectedExpense && (
          <ExpenseForm
            onSubmit={handleEditExpense}
            onCancel={() => {
              setShowEditForm(false);
              setSelectedExpense(null);
            }}
            initialData={selectedExpense}
          />
        )}
      </Modal>

      {/* View Expense Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedExpense(null);
        }}
        title="Détails de la Dépense"
        size="lg"
      >
        {selectedExpense && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                selectedExpense.type === 'fixed' ? 'bg-gradient-to-br from-blue-400 to-blue-500' :
                selectedExpense.type === 'variable' ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                'bg-gradient-to-br from-purple-400 to-purple-500'
              }`}>
                <TrendingDown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedExpense.reference}</h3>
                <p className="text-gray-600">{selectedExpense.description}</p>
                <p className="text-sm text-gray-500">{selectedExpense.category} - {selectedExpense.subcategory}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informations financières</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Montant:</span> {selectedExpense.amount.toLocaleString()} Ar</p>
                  <p><span className="font-medium">Budget alloué:</span> {selectedExpense.budget.toLocaleString()} Ar</p>
                  <p><span className="font-medium">Utilisation budget:</span> 
                    <span className={`ml-2 ${
                      (selectedExpense.amount / selectedExpense.budget) * 100 > 90 ? 'text-red-600' :
                      (selectedExpense.amount / selectedExpense.budget) * 100 > 75 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {selectedExpense.budget > 0 ? ((selectedExpense.amount / selectedExpense.budget) * 100).toFixed(1) : 0}%
                    </span>
                  </p>
                  <p><span className="font-medium">Type:</span> {typeLabels[selectedExpense.type]}</p>
                  <p><span className="font-medium">Fréquence:</span> {selectedExpense.frequency}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informations de paiement</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Échéance:</span> {new Date(selectedExpense.dueDate).toLocaleDateString('fr-FR')}</p>
                  {selectedExpense.paymentDate && (
                    <p><span className="font-medium">Date de paiement:</span> {new Date(selectedExpense.paymentDate).toLocaleDateString('fr-FR')}</p>
                  )}
                  <p><span className="font-medium">Statut:</span> 
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[selectedExpense.status]}`}>
                      {statusLabels[selectedExpense.status]}
                    </span>
                  </p>
                  {selectedExpense.supplier && (
                    <p><span className="font-medium">Fournisseur:</span> {selectedExpense.supplier}</p>
                  )}
                  <p><span className="font-medium">Référence:</span> {selectedExpense.reference}</p>
                </div>
              </div>
            </div>

            {selectedExpense.notes && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedExpense.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              {selectedExpense.status === 'pending' && (
                <button
                  onClick={() => {
                    handleMarkAsPaid(selectedExpense.id);
                    setShowViewModal(false);
                  }}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marquer comme Payé
                </button>
              )}
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditClick(selectedExpense);
                }}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}