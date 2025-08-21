import React, { useState } from 'react';
import { Search, Plus, Filter, TrendingUp, TrendingDown, DollarSign, Calendar, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';

interface Transaction {
  id: string;
  type: 'encaissement' | 'decaissement';
  category: string;
  amount: number;
  description: string;
  date: string;
  reference: string;
  status: 'completed' | 'pending' | 'cancelled';
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'encaissement',
    category: 'Écolage',
    amount: 500000,
    description: 'Paiement écolage Marie Dubois - Novembre',
    date: '2024-11-20',
    reference: 'ENC-2024-001',
    status: 'completed'
  },
  {
    id: '2',
    type: 'decaissement',
    category: 'Salaires',
    amount: 1200000,
    description: 'Salaire enseignants - Novembre',
    date: '2024-11-19',
    reference: 'DEC-2024-001',
    status: 'completed'
  },
  {
    id: '3',
    type: 'encaissement',
    category: 'Frais d\'inscription',
    amount: 150000,
    description: 'Frais inscription Pierre Martin',
    date: '2024-11-18',
    reference: 'ENC-2024-002',
    status: 'completed'
  },
  {
    id: '4',
    type: 'decaissement',
    category: 'Fournitures',
    amount: 200000,
    description: 'Achat fournitures scolaires',
    date: '2024-11-17',
    reference: 'DEC-2024-002',
    status: 'pending'
  }
];

const typeColors = {
  encaissement: 'bg-green-100 text-green-800',
  decaissement: 'bg-red-100 text-red-800'
};

const statusColors = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels = {
  completed: 'Terminé',
  pending: 'En attente',
  cancelled: 'Annulé'
};

export function FinancialTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === '' || transaction.type === selectedType;
    const matchesCategory = selectedCategory === '' || transaction.category === selectedCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const categories = [...new Set(transactions.map(t => t.category))];
  const totalEncaissements = transactions.filter(t => t.type === 'encaissement' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0);
  const totalDecaissements = transactions.filter(t => t.type === 'decaissement' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0);
  const soldeNet = totalEncaissements - totalDecaissements;

  const handleAddTransaction = (data: any) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: data.type || 'encaissement',
      category: data.category || 'Divers',
      amount: parseFloat(data.amount) || 0,
      description: data.description || 'Transaction',
      date: data.date || new Date().toISOString().split('T')[0],
      reference: data.reference || `TXN-${Date.now()}`,
      status: data.status || 'completed'
    };
    setTransactions([newTransaction, ...transactions]);
    setShowAddForm(false);
  };

  const handleEditTransaction = (data: any) => {
    if (selectedTransaction) {
      setTransactions(transactions.map(t => 
        t.id === selectedTransaction.id ? { 
          ...t, 
          ...data, 
          amount: parseFloat(data.amount) || 0 
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

  const handleExport = () => {
    alert('Export des transactions en cours...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encaissements/Décaissements</h1>
          <p className="text-gray-600">Gestion des flux financiers de l'école</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Transaction
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
                placeholder="Rechercher une transaction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tous les types</option>
              <option value="encaissement">Encaissements</option>
              <option value="decaissement">Décaissements</option>
            </select>
            
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
            
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </button>
          </div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Encaissements</p>
              <p className="text-2xl font-bold text-green-600">{totalEncaissements.toLocaleString()} MGA</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Décaissements</p>
              <p className="text-2xl font-bold text-red-600">{totalDecaissements.toLocaleString()} MGA</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Solde Net</p>
              <p className={`text-2xl font-bold ${soldeNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {soldeNet.toLocaleString()} MGA
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-purple-600">{transactions.length}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Type</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Description</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Catégorie</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Montant</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Date</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Référence</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Statut</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[transaction.type]}`}>
                      {transaction.type === 'encaissement' ? 'Encaissement' : 'Décaissement'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-medium text-gray-900">{transaction.description}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {transaction.category}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`text-lg font-bold ${
                      transaction.type === 'encaissement' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'encaissement' ? '+' : '-'}{transaction.amount.toLocaleString()} MGA
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(transaction.date).toLocaleDateString('fr-FR')}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-gray-500">{transaction.reference}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[transaction.status]}`}>
                      {statusLabels[transaction.status]}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewTransaction(transaction)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleEditClick(transaction)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                selectedTransaction.type === 'encaissement' 
                  ? 'bg-gradient-to-br from-green-400 to-green-500' 
                  : 'bg-gradient-to-br from-red-400 to-red-500'
              }`}>
                {selectedTransaction.type === 'encaissement' ? (
                  <TrendingUp className="w-8 h-8 text-white" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedTransaction.reference}</h3>
                <p className="text-gray-600">{selectedTransaction.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Informations de la transaction</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Type:</span> {selectedTransaction.type === 'encaissement' ? 'Encaissement' : 'Décaissement'}</p>
                  <p><span className="font-medium">Catégorie:</span> {selectedTransaction.category}</p>
                  <p><span className="font-medium">Montant:</span> {selectedTransaction.amount.toLocaleString()} MGA</p>
                  <p><span className="font-medium">Date:</span> {new Date(selectedTransaction.date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Statut et référence</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Statut:</span> 
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[selectedTransaction.status]}`}>
                      {statusLabels[selectedTransaction.status]}
                    </span>
                  </p>
                  <p><span className="font-medium">Référence:</span> {selectedTransaction.reference}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}