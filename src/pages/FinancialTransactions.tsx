import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Eye, TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle, Clock, Download, Calendar, CreditCard } from 'lucide-react';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { RoleBasedRoute } from '../components/auth/RoleBasedRoute';
import { Modal } from '../components/Modal';
import { TransactionForm } from '../components/forms/TransactionForm';
import { transactionsService } from '../lib/firebase/firebaseService';
import { FinancialIntegrationService } from '../lib/services/financialIntegrationService';
import { FinancialIntegrationPanel } from '../components/financial/FinancialIntegrationPanel';
import { TransactionTable } from '../components/financial/TransactionTable';
import { FinancialStatsSummary } from '../components/financial/FinancialStatsSummary';
import { TransactionFilters } from '../components/financial/TransactionFilters';
import { USER_ROLES } from '../lib/roles';

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

export default function FinancialTransactions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

  // Filtrage et tri optimisés avec useMemo
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (transaction.reference && transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = selectedType === '' || transaction.type === selectedType;
      const matchesCategory = selectedCategory === '' || transaction.category === selectedCategory;
      const matchesStatus = selectedStatus === '' || transaction.status === selectedStatus;
      return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchTerm, selectedType, selectedCategory, selectedStatus, sortBy, sortOrder]);

  // Calculs statistiques optimisés avec useMemo
  const financialStats = useMemo(() => {
    const validTransactions = transactions.filter(t => t.status === 'Validé');
    
    const totalEncaissements = validTransactions
      .filter(t => t.type === 'Encaissement')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDecaissements = validTransactions
      .filter(t => t.type === 'Décaissement')
      .reduce((sum, t) => sum + t.amount, 0);

    const solde = totalEncaissements - totalDecaissements;
    const transactionsEnAttente = transactions.filter(t => t.status === 'En attente').length;
    const montantEnAttente = transactions
      .filter(t => t.status === 'En attente')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalEncaissements,
      totalDecaissements,
      solde,
      transactionsEnAttente,
      montantEnAttente,
      totalTransactions: transactions.length
    };
  }, [transactions]);

  // Catégories uniques pour les filtres
  const categories = useMemo(() => {
    return [...new Set(transactions.map(t => t.category))];
  }, [transactions]);

  const handleAddTransaction = async (data: any) => {
    try {
      console.log('🚀 Ajout de transaction - Données reçues:', data);
      
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
    if (filteredAndSortedTransactions.length === 0) {
      alert('Aucune transaction à exporter');
      return;
    }

    const csvContent = [
      'Date,Type,Catégorie,Description,Montant,Mode de Paiement,Statut,Référence,Module Lié',
      ...filteredAndSortedTransactions.map(t => [
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

  const handleSortChange = (newSortBy: 'date' | 'amount' | 'type') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
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
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-red-600 font-medium">Erreur de chargement</p>
        </div>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2 inline" />
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <RoleBasedRoute 
      allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.DIRECTOR, USER_ROLES.ACCOUNTANT]}
      timeout={8000}
      showPageOnTimeout={true}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className={`flex ${isMobile ? 'flex-col gap-3' : 'flex-col sm:flex-row sm:items-center sm:justify-between gap-4'}`}>
          <div>
            <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>
              Encaissements et Décaissements
            </h1>
            <p className={`${isMobile ? 'text-sm' : ''} text-gray-600`}>
              Suivi des flux financiers de l'établissement
            </p>
            <p className="text-xs text-blue-600 mt-1">
              🔄 {transactions.length} transaction(s) • Synchronisation temps réel active
            </p>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
            <button 
              onClick={handleExport}
              disabled={filteredAndSortedTransactions.length === 0}
              className={`${isMobile ? 'hidden sm:inline-flex' : 'inline-flex'} items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50`}
            >
              <Download className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
              Exporter ({filteredAndSortedTransactions.length})
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

        {/* Financial Statistics Summary */}
        <FinancialStatsSummary 
          stats={financialStats}
          isMobile={isMobile}
        />

        {/* Transaction Filters */}
        <TransactionFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          categories={categories}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          isMobile={isMobile}
        />

        {/* Transaction Table */}
        <TransactionTable
          transactions={filteredAndSortedTransactions}
          onView={handleViewTransaction}
          onEdit={handleEditClick}
          onDelete={handleDeleteTransaction}
          updating={updating}
          deleting={deleting}
          isMobile={isMobile}
        />

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
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>
                    {selectedTransaction.reference || 'Transaction'}
                  </h3>
                  <p className={`${isMobile ? 'text-sm' : ''} text-gray-600`}>
                    {selectedTransaction.description}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
                    {selectedTransaction.category}
                  </p>
                </div>
              </div>

              <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
                <div>
                  <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>
                    Informations financières
                  </h4>
                  <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    <p>
                      <span className="font-medium">Type:</span> {selectedTransaction.type}
                    </p>
                    <p>
                      <span className="font-medium">Montant:</span> 
                      <span className={`ml-2 font-bold ${
                        selectedTransaction.type === 'Encaissement' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {selectedTransaction.type === 'Encaissement' ? '+' : '-'}
                        {selectedTransaction.amount.toLocaleString()} Ar
                      </span>
                    </p>
                    <p>
                      <span className="font-medium">Catégorie:</span> {selectedTransaction.category}
                    </p>
                    <p>
                      <span className="font-medium">Mode de paiement:</span> {selectedTransaction.paymentMethod}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>
                    Informations de suivi
                  </h4>
                  <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    <p>
                      <span className="font-medium">Date:</span> 
                      {new Date(selectedTransaction.date).toLocaleDateString('fr-FR')}
                    </p>
                    <p>
                      <span className="font-medium">Statut:</span> 
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded ${isMobile ? 'text-xs' : 'text-xs'} font-medium ${
                        selectedTransaction.status === 'Validé' ? 'bg-green-100 text-green-800' :
                        selectedTransaction.status === 'En attente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedTransaction.status}
                      </span>
                    </p>
                    {selectedTransaction.reference && (
                      <p>
                        <span className="font-medium">Référence:</span> {selectedTransaction.reference}
                      </p>
                    )}
                    {selectedTransaction.relatedModule && (
                      <p>
                        <span className="font-medium">Module lié:</span> 
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded ${isMobile ? 'text-xs' : 'text-xs'} font-medium bg-blue-100 text-blue-800`}>
                          {selectedTransaction.relatedModule === 'ecolage' ? 'Écolage' : 'Salaires'}
                        </span>
                      </p>
                    )}
                    {selectedTransaction.notes && (
                      <p>
                        <span className="font-medium">Notes:</span> {selectedTransaction.notes}
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
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </button>
                <button
                  onClick={() => {
                    if (selectedTransaction.id) {
                      setShowViewModal(false);
                      handleDeleteTransaction(selectedTransaction.id);
                    }
                  }}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </RoleBasedRoute>
  );
}