import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Eye, Edit, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Modal } from '../components/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { feesService, hierarchyService } from '../lib/firebase/firebaseService';

interface Transaction {
  id?: string;
  type: 'Encaissement' | 'Décaissement';
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  status: 'Validé' | 'En attente' | 'Annulé';
  reference?: string;
  relatedModule?: 'ecolage' | 'salary' | 'other';
  relatedId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'Encaissement',
    category: 'Écolages',
    description: 'Paiement écolage Marie Dubois - Août 2025',
    amount: 120000,
    date: '2025-08-15',
    paymentMethod: 'Espèces',
    status: 'Validé',
    reference: 'ECO-2025-001',
    relatedModule: 'ecolage'
  },
  {
    id: '2',
    type: 'Décaissement',
    category: 'Salaires',
    description: 'Salaire Jean Dupont - Août 2025',
    amount: 450000,
    date: '2025-08-30',
    paymentMethod: 'Virement',
    status: 'Validé',
    reference: 'SAL-2025-002',
    relatedModule: 'salary'
  },
  {
    id: '3',
    type: 'Décaissement',
    category: 'Fournitures',
    description: 'Achat matériel pédagogique',
    amount: 75000,
    date: '2025-08-20',
    paymentMethod: 'Chèque',
    status: 'En attente',
    reference: 'FOU-2025-003'
  },
  {
    id: '4',
    type: 'Encaissement',
    category: 'Frais d\'inscription',
    description: 'Inscription nouveaux élèves',
    amount: 200000,
    date: '2025-08-10',
    paymentMethod: 'Mobile Money',
    status: 'Validé',
    reference: 'INS-2025-004'
  },
  {
    id: '5',
    type: 'Décaissement',
    category: 'Charges',
    description: 'Facture électricité - Août 2025',
    amount: 85000,
    date: '2025-08-25',
    paymentMethod: 'Virement',
    status: 'Validé',
    reference: 'CHG-2025-005'
  }
];

const statusColors = {
  'Validé': 'bg-green-100 text-green-800',
  'En attente': 'bg-yellow-100 text-yellow-800',
  'Annulé': 'bg-red-100 text-red-800'
};

const typeColors = {
  'Encaissement': 'text-green-600',
  'Décaissement': 'text-red-600'
};

const paymentMethodLabels = {
  'cash': 'Espèces',
  'bank_transfer': 'Virement',
  'mobile_money': 'Mobile Money',
  'check': 'Chèque',
  'Espèces': 'Espèces',
  'Virement': 'Virement',
  'Mobile Money': 'Mobile Money',
  'Chèque': 'Chèque'
};

export function FinancialTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'all' | 'encaissements' | 'decaissements'>('all');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Hook Firebase pour synchroniser avec les paiements d'écolage
  const { data: ecolagePayments } = useFirebaseCollection(feesService, true);
  const { data: employees } = useFirebaseCollection(hierarchyService, true);

  // Synchroniser avec les données d'écolage et salaires
  useEffect(() => {
    const syncTransactions = () => {
      const syncedTransactions = [...mockTransactions];

      // Synchroniser avec les paiements d'écolage
      ecolagePayments.forEach(payment => {
        if (payment.status === 'paid') {
          const existingTransaction = syncedTransactions.find(t => 
            t.relatedModule === 'ecolage' && t.description.includes(payment.studentName)
          );
          
          if (!existingTransaction) {
            syncedTransactions.push({
              id: `eco-${payment.id}`,
              type: 'Encaissement',
              category: 'Écolages',
              description: `Paiement écolage ${payment.studentName} - ${payment.period}`,
              amount: payment.amount,
              date: payment.paymentDate,
              paymentMethod: paymentMethodLabels[payment.paymentMethod as keyof typeof paymentMethodLabels] || payment.paymentMethod,
              status: 'Validé',
              reference: payment.reference,
              relatedModule: 'ecolage',
              relatedId: payment.id
            });
          }
        }
      });

      // Synchroniser avec les salaires (simulation)
      employees.forEach(employee => {
        if (employee.status === 'active' && employee.salary) {
          const salaryTransaction = syncedTransactions.find(t => 
            t.relatedModule === 'salary' && t.description.includes(`${employee.firstName} ${employee.lastName}`)
          );
          
          if (!salaryTransaction) {
            syncedTransactions.push({
              id: `sal-${employee.id}`,
              type: 'Décaissement',
              category: 'Salaires',
              description: `Salaire ${employee.firstName} ${employee.lastName} - ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
              amount: employee.salary,
              date: new Date().toISOString().split('T')[0],
              paymentMethod: 'Virement',
              status: 'Validé',
              reference: `SAL-${new Date().getFullYear()}-${employee.id?.substring(0, 3)}`,
              relatedModule: 'salary',
              relatedId: employee.id
            });
          }
        }
      });

      setTransactions(syncedTransactions);
    };

    syncTransactions();
  }, [ecolagePayments, employees]);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTab = selectedTab === 'all' || 
                      (selectedTab === 'encaissements' && transaction.type === 'Encaissement') ||
                      (selectedTab === 'decaissements' && transaction.type === 'Décaissement');
    const matchesStatus = selectedStatus === '' || transaction.status === selectedStatus;
    const matchesCategory = selectedCategory === '' || transaction.category === selectedCategory;
    return matchesSearch && matchesTab && matchesStatus && matchesCategory;
  });

  // Calculs des totaux
  const totalEncaissements = transactions
    .filter(t => t.type === 'Encaissement' && t.status === 'Validé')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const totalDecaissements = transactions
    .filter(t => t.type === 'Décaissement' && t.status === 'Validé')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const solde = totalEncaissements - totalDecaissements;
  const transactionsCount = transactions.length;

  const categories = [...new Set(transactions.map(t => t.category))];

  const handleAddTransaction = (data: any) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: data.type,
      category: data.category,
      description: data.description,
      amount: parseFloat(data.amount),
      date: data.date,
      paymentMethod: data.paymentMethod,
      status: data.status || 'Validé',
      reference: data.reference || `TXN-${Date.now()}`,
      createdAt: new Date()
    };
    
    setTransactions([newTransaction, ...transactions]);
    setShowAddForm(false);
  };

  const handleEditTransaction = (data: any) => {
    if (selectedTransaction?.id) {
      setTransactions(transactions.map(t => 
        t.id === selectedTransaction.id ? { 
          ...t, 
          ...data, 
          amount: parseFloat(data.amount),
          updatedAt: new Date()
        } : t
      ));
      setShowEditForm(false);
      setSelectedTransaction(null);
    }
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowViewModal(true);
  };

  const handleEditClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowEditForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encaissements et Décaissements</h1>
          <p className="text-gray-600">Suivi de toutes les opérations financières</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Transaction
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Encaissements</p>
              <p className="text-3xl font-bold text-green-600">{totalEncaissements.toLocaleString()} Ar</p>
              <p className="text-sm text-green-600">Ce mois</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Décaissements</p>
              <p className="text-3xl font-bold text-red-600">{totalDecaissements.toLocaleString()} Ar</p>
              <p className="text-sm text-red-600">Ce mois</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Solde</p>
              <p className={`text-3xl font-bold ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {solde >= 0 ? '' : '-'}{Math.abs(solde).toLocaleString()} Ar
              </p>
              <p className="text-sm text-gray-600">Résultat net</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              solde >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <DollarSign className={`w-6 h-6 ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Transactions</p>
              <p className="text-3xl font-bold text-blue-600">{transactionsCount}</p>
              <p className="text-sm text-blue-600">Ce mois</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 border-b border-gray-200">
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              selectedTab === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Toutes les Transactions
          </button>
          <button
            onClick={() => setSelectedTab('encaissements')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              selectedTab === 'encaissements'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Encaissements
          </button>
          <button
            onClick={() => setSelectedTab('decaissements')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              selectedTab === 'decaissements'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Décaissements
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher une transaction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les statuts</option>
              <option value="Validé">Validé</option>
              <option value="En attente">En attente</option>
              <option value="Annulé">Annulé</option>
            </select>
            
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune transaction trouvée</h3>
            <p className="text-gray-500 mb-6">Aucune transaction ne correspond à vos critères de recherche.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">TYPE</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">CATÉGORIE</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">DESCRIPTION</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">MONTANT</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">DATE</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">MODE DE PAIEMENT</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">STATUT</th>
                  <th className="text-left py-3 px-6 font-medium text-gray-900">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        {transaction.type === 'Encaissement' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-medium ${typeColors[transaction.type]}`}>
                          {transaction.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-900">{transaction.category}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                        {transaction.reference && (
                          <p className="text-xs text-gray-500">Réf: {transaction.reference}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-lg font-bold ${
                        transaction.type === 'Encaissement' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'Encaissement' ? '+' : '-'}{transaction.amount.toLocaleString()} Ar
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(transaction.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{transaction.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[transaction.status]}`}>
                        {transaction.status === 'Validé' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {transaction.status === 'En attente' && <Clock className="w-3 h-3 mr-1" />}
                        {transaction.status === 'Annulé' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {transaction.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewTransaction(transaction)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(transaction)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => transaction.id && handleDeleteTransaction(transaction.id)}
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
        )}
      </div>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Nouvelle Transaction"
        size="lg"
      >
        <TransactionForm
          onSubmit={handleAddTransaction}
          onCancel={() => setShowAddForm(false)}
        />
      </Modal>

      {/* Edit Transaction Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedTransaction(null);
        }}
        title="Modifier la Transaction"
        size="lg"
      >
        {selectedTransaction && (
          <TransactionForm
            onSubmit={handleEditTransaction}
            onCancel={() => {
              setShowEditForm(false);
              setSelectedTransaction(null);
            }}
            initialData={selectedTransaction}
          />
        )}
      </Modal>

      {/* View Transaction Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTransaction(null);
        }}
        title="Détails de la Transaction"
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                selectedTransaction.type === 'Encaissement' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {selectedTransaction.type === 'Encaissement' ? (
                  <TrendingUp className="w-8 h-8 text-green-600" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedTransaction.description}</h3>
                <p className="text-gray-600">{selectedTransaction.category}</p>
                {selectedTransaction.reference && (
                  <p className="text-sm text-gray-500">Référence: {selectedTransaction.reference}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Informations de transaction</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Type:</span> 
                    <span className={`ml-2 ${typeColors[selectedTransaction.type]}`}>
                      {selectedTransaction.type}
                    </span>
                  </p>
                  <p><span className="font-medium">Montant:</span> 
                    <span className={`ml-2 text-lg font-bold ${
                      selectedTransaction.type === 'Encaissement' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedTransaction.type === 'Encaissement' ? '+' : '-'}{selectedTransaction.amount.toLocaleString()} Ar
                    </span>
                  </p>
                  <p><span className="font-medium">Date:</span> {new Date(selectedTransaction.date).toLocaleDateString('fr-FR')}</p>
                  <p><span className="font-medium">Mode de paiement:</span> {selectedTransaction.paymentMethod}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Statut et suivi</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Statut:</span> 
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[selectedTransaction.status]}`}>
                      {selectedTransaction.status === 'Validé' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {selectedTransaction.status === 'En attente' && <Clock className="w-3 h-3 mr-1" />}
                      {selectedTransaction.status === 'Annulé' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {selectedTransaction.status}
                    </span>
                  </p>
                  <p><span className="font-medium">Catégorie:</span> {selectedTransaction.category}</p>
                  {selectedTransaction.relatedModule && (
                    <p><span className="font-medium">Module lié:</span> 
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {selectedTransaction.relatedModule === 'ecolage' ? 'Écolage' : 
                         selectedTransaction.relatedModule === 'salary' ? 'Salaires' : 'Autre'}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditClick(selectedTransaction);
                }}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </button>
              <button
                onClick={() => {
                  alert(`Impression du reçu pour la transaction ${selectedTransaction.reference || selectedTransaction.id}...`);
                }}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Imprimer Reçu
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}