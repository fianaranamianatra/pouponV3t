import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Eye, TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Clock, Download, Calendar, CreditCard } from 'lucide-react';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { Modal } from '../components/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import { transactionsService } from '../lib/firebase/firebaseService';
import { FinancialIntegrationService } from '../lib/services/financialIntegrationService';
import { FinancialIntegrationPanel } from '../components/financial/FinancialIntegrationPanel';
import { FinancialDataCleanup } from '../components/admin/FinancialDataCleanup';

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
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const statusColors = {
  'Validé': 'bg-green-100 text-green-800',
  'En attente': 'bg-yellow-100 text-yellow-800',
  'Annulé': 'bg-red-100 text-red-800'
};

const typeColors = {
  'Encaissement': 'bg-green-100 text-green-800',
  'Décaissement': 'bg-red-100 text-red-800'
};

export default function FinancialTransactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hook Firebase avec synchronisation temps réel
  const {
    data: transactions,
    loading,
    error,
    creating,
    updating,
    deleting,
    create,
    update,
    remove
  } = useFirebaseCollection<Transaction>(transactionsService, true);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === '' || transaction.type === selectedType;
    const matchesCategory = selectedCategory === '' || transaction.category === selectedCategory;
    const matchesStatus = selectedStatus === '' || transaction.status === selectedStatus;
    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const categories = [...new Set(transactions.map(t => t.category))];
  const totalEncaissements = transactions
    .filter(t => t.type === 'Encaissement' && t.status === 'Validé')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDecaissements = transactions
    .filter(t => t.type === 'Décaissement' && t.status === 'Validé')
    .reduce((sum, t) => sum + t.amount, 0);

  const solde = totalEncaissements - totalDecaissements;
  const transactionsEnAttente = transactions.filter(t => t.status === 'En attente').length;

  const handleAddTransaction = async (data: any) => {
    try {
      console.log('🚀 Ajout de transaction - Données reçues:', data);
      
      // Préparer les données pour Firebase
      const transactionData = {
        type: data.type,
        category: data.category,
        description: data.description,
        amount: parseFloat(data.amount),
        date: data.date,
        paymentMethod: data.paymentMethod,
        status: data.status || 'Validé',
        reference: data.reference || `TXN-${Date.now()}`,
        notes: data.notes || ''
      };
      
      console.log('📝 Données formatées pour Firebase:', transactionData);
      
      const transactionId = await create(transactionData);
      console.log('✅ Transaction créée avec l\'ID:', transactionId);
      
      // Synchroniser avec les modules liés si applicable
      try {
        await FinancialIntegrationService.syncTransactionWithModules({
          ...transactionData,
          id: transactionId
        });
        console.log('✅ Synchronisation avec les modules liés effectuée');
      } catch (syncError) {
        console.warn('⚠️ Erreur lors de la synchronisation:', syncError);
      }
      
      setShowAddForm(false);
      
      // Message de succès
      alert('✅ Transaction enregistrée avec succès !');
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ajout de la transaction:', error);
      alert('❌ Erreur lors de l\'ajout de la transaction: ' + error.message);
    }
  };

  const handleEditTransaction = async (data: any) => {
    if (selectedTransaction?.id) {
      try {
        console.log('🔄 Modification de transaction - Données:', data);
        
        const updateData = {
          ...data,
          amount: parseFloat(data.amount)
        };
        
        await update(selectedTransaction.id, updateData);
        console.log('✅ Transaction modifiée avec succès');
        
        // Synchroniser les modifications avec les modules liés
        try {
          await FinancialIntegrationService.syncTransactionWithModules({
            ...updateData,
            id: selectedTransaction.id
          });
          console.log('✅ Modifications synchronisées avec les modules liés');
        } catch (syncError) {
          console.warn('⚠️ Erreur lors de la synchronisation:', syncError);
        }
        
        setShowEditForm(false);
        setSelectedTransaction(null);
        
        alert('✅ Transaction modifiée avec succès !');
        
      } catch (error: any) {
        console.error('❌ Erreur lors de la modification:', error);
        alert('❌ Erreur lors de la modification: ' + error.message);
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      try {
        console.log('🗑️ Suppression de la transaction ID:', id);
        await remove(id);
        console.log('✅ Transaction supprimée avec succès');
        alert('✅ Transaction supprimée avec succès !');
      } catch (error: any) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert('❌ Erreur lors de la suppression: ' + error.message);
      }
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
    if (transactions.length === 0) {
      alert('Aucune transaction à exporter');
      return;
    }

    // Utiliser la méthode d'export du service d'intégration
    const csvContent = [
      'Date,Type,Catégorie,Description,Montant,Mode de Paiement,Statut,Référence,Module Lié',
      ...transactions.map(t => [
        t.date,
        t.type,
        t.category,
        t.description,
        t.amount,
        t.paymentMethod,
        t.status,
        t.reference || '',
        t.relatedModule || 'Manuel'
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des transactions...</p>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col sm:flex-row sm:items-center sm:justify-between gap-4'}`}>
        <div>
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>Encaissements et Décaissements</h1>
          <p className={`${isMobile ? 'text-sm' : ''} text-gray-600`}>Suivi des flux financiers de l'établissement</p>
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
          <button 
            onClick={handleExport}
            className={`${isMobile ? 'hidden sm:inline-flex' : 'inline-flex'} items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}
          >
            <Download className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
            Exporter
          </button>
          <button
            onClick={() => {
              console.log('🔘 Ouverture du formulaire d\'ajout de transaction');
              setShowAddForm(true);
            }}
            disabled={creating}
            className={`inline-flex items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50`}
          >
            {creating ? (
              <div className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} border-2 border-white border-t-transparent rounded-full animate-spin mr-2`}></div>
            ) : (
              <Plus className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
            )}
            Nouvelle Transaction
          </button>
        </div>
      </div>

      {/* Financial Integration Panel */}
      <FinancialIntegrationPanel />

      {/* Financial Data Cleanup Panel */}
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 ${isMobile ? 'mb-3' : 'mb-4'} flex items-center`}>
          <Trash2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2 text-red-600`} />
          Nettoyage des Données
        </h2>
        <FinancialDataCleanup />
      </div>

      {/* Navigation Tabs */}
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'space-x-1'}`}>
          <button
            onClick={() => setSelectedType('')}
            className={`${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2 text-sm'} rounded-lg font-medium transition-colors ${
              selectedType === '' 
                ? 'bg-blue-600 text-white border-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-2 border-transparent'
            }`}
          >
            Toutes les Transactions
          </button>
          <button
            onClick={() => setSelectedType('Encaissement')}
            className={`${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2 text-sm'} rounded-lg font-medium transition-colors ${
              selectedType === 'Encaissement' 
                ? 'bg-blue-600 text-white border-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-2 border-transparent'
            }`}
          >
            Encaissements
          </button>
          <button
            onClick={() => setSelectedType('Décaissement')}
            className={`${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2 text-sm'} rounded-lg font-medium transition-colors ${
              selectedType === 'Décaissement' 
                ? 'bg-blue-600 text-white border-2 border-blue-600' 
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-2 border-transparent'
            }`}
          >
            Décaissements
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100`}>
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col lg:flex-row gap-4'}`}>
          <div className="flex-1">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
              <input
                type="text"
                placeholder="Rechercher une transaction..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isMobile ? 'pl-12 pr-4 py-3 text-base' : 'pl-10 pr-4 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              />
            </div>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="">Tous les types</option>
              <option value="Encaissement">Encaissements</option>
              <option value="Décaissement">Décaissements</option>
            </select>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="">Toutes les catégories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="">Tous les statuts</option>
              <option value="Validé">Validé</option>
              <option value="En attente">En attente</option>
              <option value="Annulé">Annulé</option>
            </select>
            
            <button className={`${isMobile ? 'hidden sm:inline-flex' : 'inline-flex'} items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}>
              <Filter className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
              Filtres
            </button>
          </div>
        </div>
      </div>

      {/* Financial Stats */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-4 gap-4'}`}>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center">
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Total Encaissements</p>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-600`}>{totalEncaissements.toLocaleString()} Ar</p>
            </div>
            <TrendingUp className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-green-600 ml-auto`} />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center">
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Total Décaissements</p>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-red-600`}>{totalDecaissements.toLocaleString()} Ar</p>
            </div>
            <TrendingDown className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-red-600 ml-auto`} />
          </div>
        </div>

        <div className={`bg-white rounded-lg p-4 border border-gray-100 ${isMobile ? 'col-span-2' : ''}`}>
          <div className="flex items-center">
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Solde</p>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold ${solde >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {solde.toLocaleString()} Ar
              </p>
            </div>
            <DollarSign className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ml-auto ${solde >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
          </div>
        </div>
        
        <div className={`bg-white rounded-lg p-4 border border-gray-100 ${isMobile ? 'hidden' : ''}`}>
          <div className="flex items-center">
            <div>
              <p className="text-sm text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-yellow-600">{transactionsEnAttente}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600 ml-auto" />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className={`bg-white ${isMobile ? 'rounded-lg' : 'rounded-xl'} shadow-sm border border-gray-100 overflow-hidden`}>
        {transactions.length === 0 ? (
          <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
            <DollarSign className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-gray-300 mx-auto mb-4`} />
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>Aucune transaction enregistrée</h3>
            <p className={`${isMobile ? 'text-sm' : ''} text-gray-500 mb-6`}>Commencez par enregistrer votre première transaction financière.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className={`inline-flex items-center ${isMobile ? 'px-6 py-3 text-base' : 'px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors`}
            >
              <Plus className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
              Nouvelle Transaction
            </button>
          </div>
        ) : (
          <div className={`overflow-x-auto ${isMobile ? 'mobile-table-scroll' : ''}`}>
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900`}>Date</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900`}>Type</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden sm:table-cell' : 'py-3 px-6'} font-medium text-gray-900`}>Catégorie</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden md:table-cell' : 'py-3 px-6'} font-medium text-gray-900`}>Description</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900`}>Montant</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden lg:table-cell' : 'py-3 px-6'} font-medium text-gray-900`}>Mode de Paiement</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden sm:table-cell' : 'py-3 px-6'} font-medium text-gray-900`}>Statut</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                    <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                      <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-900`}>
                        <Calendar className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'} text-gray-400`} />
                        {new Date(transaction.date).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                      <span className={`inline-flex items-center ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'} font-medium rounded-full ${typeColors[transaction.type]}`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden sm:table-cell' : 'py-4 px-6'}`}>
                      <span className={`inline-flex items-center ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'} font-medium bg-gray-100 text-gray-800 rounded-full`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden md:table-cell' : 'py-4 px-6'}`}>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>{transaction.description}</p>
                      {transaction.reference && (
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>Réf: {transaction.reference}</p>
                      )}
                      {transaction.relatedModule && (
                        <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-blue-500`}>
                          🔗 Lié au module: {transaction.relatedModule === 'ecolage' ? 'Écolage' : 'Salaires'}
                        </p>
                      )}
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                      <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold ${
                        transaction.type === 'Encaissement' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'Encaissement' ? '+' : '-'}{transaction.amount.toLocaleString()} Ar
                      </p>
                      {/* Afficher la catégorie sur mobile */}
                      {isMobile && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                          {transaction.category}
                        </span>
                      )}
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden lg:table-cell' : 'py-4 px-6'}`}>
                      <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                        <CreditCard className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'} text-gray-400`} />
                        {transaction.paymentMethod}
                      </div>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden sm:table-cell' : 'py-4 px-6'}`}>
                      <span className={`inline-flex items-center ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'} font-medium rounded-full ${statusColors[transaction.status]}`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                      <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
                        <button 
                          onClick={() => handleViewTransaction(transaction)}
                          className={`${isMobile ? 'p-2' : 'p-1.5'} text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors`}
                        >
                          <Eye className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
                        </button>
                        {!isMobile && (
                          <>
                            <button 
                              onClick={() => handleEditClick(transaction)}
                              disabled={updating}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => transaction.id && handleDeleteTransaction(transaction.id)}
                              disabled={deleting}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {/* Menu mobile pour les actions supplémentaires */}
                        {isMobile && (
                          <button 
                            onClick={() => {
                              const choice = confirm('Modifier cette transaction ?');
                              if (choice) {
                                handleEditClick(transaction);
                              }
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Plus d'actions"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        )}
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
        size={isMobile ? "xl" : "lg"}
      >
        <TransactionForm
          onSubmit={handleAddTransaction}
          onCancel={() => setShowAddForm(false)}
          isSubmitting={creating}
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
        size={isMobile ? "xl" : "lg"}
      >
        {selectedTransaction && (
          <TransactionForm
            onSubmit={handleEditTransaction}
            onCancel={() => {
              setShowEditForm(false);
              setSelectedTransaction(null);
            }}
            initialData={selectedTransaction}
            isSubmitting={updating}
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
        size={isMobile ? "xl" : "lg"}
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-full flex items-center justify-center ${
                selectedTransaction.type === 'Encaissement' 
                  ? 'bg-gradient-to-br from-green-400 to-green-500' 
                  : 'bg-gradient-to-br from-red-400 to-red-500'
              }`}>
                {selectedTransaction.type === 'Encaissement' ? (
                  <TrendingUp className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
                ) : (
                  <TrendingDown className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
                )}
              </div>
              <div>
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>{selectedTransaction.reference || 'Transaction'}</h3>
                <p className={`${isMobile ? 'text-sm' : ''} text-gray-600`}>{selectedTransaction.description}</p>
                <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>{selectedTransaction.category}</p>
              </div>
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
              <div>
                <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>Informations financières</h4>
                <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <p><span className="font-medium">Type:</span> {selectedTransaction.type}</p>
                  <p><span className="font-medium">Montant:</span> 
                    <span className={`ml-2 font-bold ${
                      selectedTransaction.type === 'Encaissement' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedTransaction.type === 'Encaissement' ? '+' : '-'}{selectedTransaction.amount.toLocaleString()} Ar
                    </span>
                  </p>
                  <p><span className="font-medium">Catégorie:</span> {selectedTransaction.category}</p>
                  <p><span className="font-medium">Mode de paiement:</span> {selectedTransaction.paymentMethod}</p>
                </div>
              </div>
              
              <div>
                <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>Informations de suivi</h4>
                <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <p><span className="font-medium">Date:</span> {new Date(selectedTransaction.date).toLocaleDateString('fr-FR')}</p>
                  <p><span className="font-medium">Statut:</span> 
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded ${isMobile ? 'text-xs' : 'text-xs'} font-medium ${statusColors[selectedTransaction.status]}`}>
                      {selectedTransaction.status}
                    </span>
                  </p>
                  {selectedTransaction.reference && (
                    <p><span className="font-medium">Référence:</span> {selectedTransaction.reference}</p>
                  )}
                  {selectedTransaction.notes && (
                    <p><span className="font-medium">Notes:</span> {selectedTransaction.notes}</p>
                  )}
                  {selectedTransaction.relatedModule && (
                    <p><span className="font-medium">Module lié:</span> 
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded ${isMobile ? 'text-xs' : 'text-xs'} font-medium bg-blue-100 text-blue-800`}>
                        {selectedTransaction.relatedModule === 'ecolage' ? 'Écolage' : 'Salaires'}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}