import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, CreditCard, DollarSign, AlertTriangle, CheckCircle, Clock, Download, Eye, Edit, Trash2, BarChart3 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { PaymentForm } from '../components/forms/PaymentForm';
import { Avatar } from '../components/Avatar';
import { TransactionSyncIndicator } from '../components/financial/TransactionSyncIndicator';
import { PaymentDashboard } from '../components/ecolage/PaymentDashboard';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { useEcolageSync } from '../hooks/useEcolageSync';
import { feesService, studentsService, classesService } from '../lib/firebase/firebaseService';
import { FinancialIntegrationService } from '../lib/services/financialIntegrationService';
import { FinancialDataCleanup } from '../components/admin/FinancialDataCleanup';

interface Payment {
  id?: string;
  studentName: string;
  class: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  period: string;
  status: 'paid' | 'pending' | 'overdue';
  reference: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const statusColors = {
  paid: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  overdue: 'bg-red-100 text-red-800'
};

const statusLabels = {
  paid: 'Payé',
  pending: 'En attente',
  overdue: 'En retard'
};

const paymentMethodLabels = {
  cash: 'Espèces',
  bank_transfer: 'Virement',
  mobile_money: 'Mobile Money',
  check: 'Chèque'
};

export function EcolageFirebase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hook de synchronisation globale Écolage
  const ecolageSyncData = useEcolageSync();

  // Hook Firebase avec synchronisation temps réel
  const {
    data: payments,
    loading,
    error,
    creating,
    updating,
    deleting,
    create,
    update,
    remove
  } = useFirebaseCollection<Payment>(feesService, true);

  // Charger les données liées (élèves et classes)
  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        console.log('🔄 Chargement des données liées (élèves et classes)...');
        
        // Récupérer les élèves
        const studentsData = await studentsService.getAll();
        setStudents(studentsData);
        console.log('✅ Élèves chargés:', studentsData.length);
        
        // Récupérer les classes
        const classesData = await classesService.getAll();
        setClasses(classesData);
        console.log('✅ Classes chargées:', classesData.length);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données liées:', error);
      }
    };
    
    fetchRelatedData();
  }, []);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === '' || payment.status === selectedStatus;
    const matchesPeriod = selectedPeriod === '' || payment.period === selectedPeriod;
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const totalAmount = payments.reduce((acc, p) => acc + p.amount, 0);
  const paidAmount = payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0);
  const pendingAmount = payments.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);
  const overdueCount = payments.filter(p => p.status === 'overdue').length;

  // Fonction pour obtenir les informations d'un élève
  const getStudentInfo = (studentName: string) => {
    return students.find(s => `${s.firstName} ${s.lastName}` === studentName);
  };

  const handleAddPayment = async (data: any) => {
    try {
      console.log('🚀 Ajout de paiement - Données reçues:', data);
      
      // Préparer les données pour Firebase
      const paymentData = {
        studentName: data.studentName,
        class: data.class,
        amount: parseFloat(data.amount),
        paymentMethod: data.paymentMethod,
        paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
        period: data.period,
        reference: data.reference || `PAY-${Date.now()}`,
        status: 'paid',
        notes: data.notes || ''
      };
      
      console.log('📝 Données formatées pour Firebase:', paymentData);
      
      const paymentId = await create(paymentData);
      console.log('✅ Paiement créé avec l\'ID:', paymentId);
      
      // Créer automatiquement une transaction financière UNIQUEMENT pour les nouveaux paiements
      if (paymentData.status === 'paid') {
        try {
          const result = await FinancialIntegrationService.createEcolageTransaction({
            ...paymentData,
            id: paymentId
          });
          
          if (result.success) {
            console.log('✅ Transaction financière créée automatiquement avec l\'ID:', result.transactionId);
            console.log('🔄 Synchronisation automatique avec profils étudiants activée');
          } else {
            console.warn('⚠️ Erreur lors de la création de la transaction automatique:', result.error);
          }
        } catch (transactionError) {
          console.warn('⚠️ Erreur lors de la création de la transaction automatique:', transactionError);
          // Ne pas bloquer le processus principal si la transaction échoue
        }
      }
      
      setShowAddForm(false);
      
      // Message de succès
      alert('✅ Paiement enregistré avec succès !');
      
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'ajout du paiement:', error);
      alert('❌ Erreur lors de l\'ajout du paiement: ' + error.message);
    }
  };

  const handleEditPayment = async (data: any) => {
    if (selectedPayment?.id) {
      try {
        console.log('🔄 Modification de paiement - Données:', data);
        
        const updateData = {
          ...data,
          amount: parseFloat(data.amount)
        };
        
        await update(selectedPayment.id, updateData);
        console.log('✅ Paiement modifié avec succès');
        
        // Synchroniser avec les transactions financières
        try {
          // Si le statut change vers "paid", créer ou mettre à jour une transaction
          if (updateData.status === 'paid') {
            const result = await FinancialIntegrationService.createEcolageTransaction({
              ...updateData,
              id: selectedPayment.id
            });
            
            if (result.success) {
              console.log('✅ Transaction financière synchronisée lors de la modification');
            }
          }
        } catch (syncError) {
          console.warn('⚠️ Erreur lors de la synchronisation:', syncError);
        }
        
        setShowEditForm(false);
        setSelectedPayment(null);
        
        alert('✅ Paiement modifié avec succès !');
        
      } catch (error: any) {
        console.error('❌ Erreur lors de la modification:', error);
        alert('❌ Erreur lors de la modification: ' + error.message);
      }
    }
  };

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowViewModal(true);
  };

  const handleEditClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowEditForm(true);
  };

  const handleDeletePayment = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce paiement ?')) {
      try {
        console.log('🗑️ Suppression du paiement ID:', id);
        await remove(id);
        console.log('✅ Paiement supprimé avec succès');
        alert('✅ Paiement supprimé avec succès !');
      } catch (error: any) {
        console.error('❌ Erreur lors de la suppression:', error);
        alert('❌ Erreur lors de la suppression: ' + error.message);
      }
    }
  };

  const handleExport = () => {
    alert('Export des données d\'écolage en cours...');
  };

  const handleSendReminder = () => {
    alert('Rappels envoyés aux élèves en retard de paiement');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des paiements...</p>
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
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>Gestion de l'Écolage</h1>
          <p className={`${isMobile ? 'text-sm' : ''} text-gray-600`}>Suivi des paiements et frais scolaires</p>
          {!ecolageSyncData.loading && (
            <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-blue-600 mt-1`}>
              🔄 Synchronisé en temps réel • Dernière MAJ: {ecolageSyncData.lastUpdated.toLocaleTimeString('fr-FR')}
            </p>
          )}
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
          <button 
            onClick={handleSendReminder}
            className={`inline-flex items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors`}
          >
            <AlertTriangle className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
            Rappels
          </button>
          <button 
            onClick={() => setShowDashboard(true)}
            className={`inline-flex items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors`}
          >
            <BarChart3 className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
            Tableau de Bord
          </button>
          <button 
            onClick={handleExport}
            className={`${isMobile ? 'hidden sm:inline-flex' : 'inline-flex'} items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}
          >
            <Download className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
            Exporter
          </button>
          <button
            onClick={() => {
              console.log('🔘 Ouverture du formulaire d\'ajout de paiement');
              setShowAddForm(true);
            }}
            disabled={creating}
            className={`inline-flex items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50`}
          >
            {creating ? (
              <div className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} border-2 border-white border-t-transparent rounded-full animate-spin mr-2`}></div>
            ) : (
              <Plus className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
            )}
            Nouveau Paiement
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
                placeholder="Rechercher par élève, classe ou référence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full ${isMobile ? 'pl-12 pr-4 py-3 text-base' : 'pl-10 pr-4 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              />
            </div>
          </div>
          
          <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="">Tous les statuts</option>
              <option value="paid">Payé</option>
              <option value="pending">En attente</option>
              <option value="overdue">En retard</option>
            </select>
            
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className={`${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="">Toutes les périodes</option>
              <option value="Trimestre 1">Trimestre 1</option>
              <option value="Trimestre 2">Trimestre 2</option>
              <option value="Trimestre 3">Trimestre 3</option>
              <option value="Année complète">Année complète</option>
            </select>
            
            <button className={`${isMobile ? 'hidden sm:inline-flex' : 'inline-flex'} items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-3 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}>
              <Filter className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
              Filtres
            </button>
          </div>
        </div>
      </div>

      {/* Payment Stats */}
      <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-4 gap-4'}`}>
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Total Collecté</p>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>{paidAmount.toLocaleString()} Ar</p>
            </div>
            <DollarSign className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-green-600`} />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>En Attente</p>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-yellow-600`}>{pendingAmount.toLocaleString()} Ar</p>
            </div>
            <Clock className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-yellow-600`} />
          </div>
        </div>
        
        <div className={`bg-white rounded-lg p-4 border border-gray-100 ${isMobile ? 'col-span-2' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>En Retard</p>
              <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-red-600`}>{overdueCount}</p>
            </div>
            <AlertTriangle className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-red-600`} />
          </div>
        </div>
        
        <div className={`bg-white rounded-lg p-4 border border-gray-100 ${isMobile ? 'hidden' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taux de Collecte</p>
              <p className="text-2xl font-bold text-blue-600">
                {totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className={`bg-white ${isMobile ? 'rounded-lg' : 'rounded-xl'} shadow-sm border border-gray-100 overflow-hidden`}>
        {payments.length === 0 ? (
          <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
            <CreditCard className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-gray-300 mx-auto mb-4`} />
            <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>Aucun paiement enregistré</h3>
            <p className={`${isMobile ? 'text-sm' : ''} text-gray-500 mb-6`}>Commencez par enregistrer votre premier paiement d'écolage.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className={`inline-flex items-center ${isMobile ? 'px-6 py-3 text-base' : 'px-4 py-2'} bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors`}
            >
              <Plus className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
              Nouveau Paiement
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900`}>Élève</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden sm:table-cell' : 'py-3 px-6'} font-medium text-gray-900`}>Classe</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900`}>Montant</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden md:table-cell' : 'py-3 px-6'} font-medium text-gray-900`}>Période</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden lg:table-cell' : 'py-3 px-6'} font-medium text-gray-900`}>Mode de Paiement</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden xl:table-cell' : 'py-3 px-6'} font-medium text-gray-900`}>Date</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden sm:table-cell' : 'py-3 px-6'} font-medium text-gray-900`}>Statut</th>
                  <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900`}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                      <div className="flex items-center space-x-3">
                        <Avatar 
                          firstName={payment.studentName.split(' ')[0] || ''} 
                          lastName={payment.studentName.split(' ')[1] || ''} 
                          size={isMobile ? "sm" : "sm"}
                          showPhoto={true}
                        />
                        <div>
                          <p className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>{payment.studentName}</p>
                          {/* Afficher la classe sur mobile */}
                          {isMobile && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                              {payment.class}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden sm:table-cell' : 'py-4 px-6'}`}>
                      <span className={`inline-flex items-center ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'} font-medium bg-blue-100 text-blue-800 rounded-full`}>
                        {payment.class}
                      </span>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                      <p className={`${isMobile ? 'text-sm' : 'text-sm'} font-bold text-gray-900`}>{payment.amount.toLocaleString()} Ar</p>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden md:table-cell' : 'py-4 px-6'}`}>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>{payment.period}</p>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden lg:table-cell' : 'py-4 px-6'}`}>
                      <div className="flex items-center space-x-2">
                        <CreditCard className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400`} />
                        <span className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                          {paymentMethodLabels[payment.paymentMethod as keyof typeof paymentMethodLabels] || payment.paymentMethod}
                        </span>
                      </div>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden xl:table-cell' : 'py-4 px-6'}`}>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                        {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                      </p>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3 hidden sm:table-cell' : 'py-4 px-6'}`}>
                      <span className={`inline-flex items-center ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'} font-medium rounded-full ${statusColors[payment.status]}`}>
                        {statusLabels[payment.status]}
                      </span>
                    </td>
                    <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                      <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
                        <button 
                          onClick={() => handleViewPayment(payment)}
                          className={`${isMobile ? 'p-2' : 'p-1.5'} text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors`}
                        >
                          <Eye className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
                        </button>
                        {!isMobile && (
                          <>
                            <button 
                              onClick={() => handleEditClick(payment)}
                              disabled={updating}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => payment.id && handleDeletePayment(payment.id)}
                              disabled={deleting}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {/* Menu mobile pour les actions supplémentaires */}
                        {isMobile && (
                          <button 
                            onClick={() => {
                              const actions = ['Modifier', 'Supprimer'];
                              const choice = confirm(`Actions: ${actions.join(' | ')}. Modifier le paiement ?`);
                              if (choice) {
                                handleEditClick(payment);
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

      {/* Add Payment Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Nouveau Paiement"
        size={isMobile ? "xl" : "lg"}
      >
        <PaymentForm
          onSubmit={handleAddPayment}
          onCancel={() => setShowAddForm(false)}
          students={students}
          classes={classes}
        />
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setSelectedPayment(null);
        }}
        title="Modifier le Paiement"
        size={isMobile ? "xl" : "lg"}
      >
        {selectedPayment && (
          <PaymentForm
            onSubmit={handleEditPayment}
            onCancel={() => {
              setShowEditForm(false);
              setSelectedPayment(null);
            }}
            initialData={selectedPayment}
            students={students}
            classes={classes}
          />
        )}
      </Modal>

      {/* View Payment Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedPayment(null);
        }}
        title="Détails du Paiement"
        size={isMobile ? "xl" : "lg"}
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center`}>
                <CreditCard className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
              </div>
              <div>
                <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>{selectedPayment.reference}</h3>
                <p className={`${isMobile ? 'text-sm' : ''} text-gray-600`}>{selectedPayment.studentName} - {selectedPayment.class}</p>
              </div>
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
              <div>
                <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>Informations de paiement</h4>
                <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <p><span className="font-medium">Montant:</span> {selectedPayment.amount.toLocaleString()} Ar</p>
                  <p><span className="font-medium">Période:</span> {selectedPayment.period}</p>
                  <p><span className="font-medium">Mode de paiement:</span> {paymentMethodLabels[selectedPayment.paymentMethod as keyof typeof paymentMethodLabels] || selectedPayment.paymentMethod}</p>
                  <p><span className="font-medium">Date:</span> {new Date(selectedPayment.paymentDate).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              
              <div>
                <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>Statut et notes</h4>
                <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  <p><span className="font-medium">Statut:</span> 
                    <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded ${isMobile ? 'text-xs' : 'text-xs'} font-medium ${statusColors[selectedPayment.status]}`}>
                      {statusLabels[selectedPayment.status]}
                    </span>
                  </p>
                  <p><span className="font-medium">Référence:</span> {selectedPayment.reference}</p>
                  {selectedPayment.notes && (
                    <p><span className="font-medium">Notes:</span> {selectedPayment.notes}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Dashboard Modal */}
      <Modal
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
        title="Tableau de Bord des Paiements"
        size={isMobile ? "xl" : "xl"}
      >
        <PaymentDashboard />
      </Modal>

      {/* Financial Data Cleanup - Admin Section */}
      <div className={`bg-white ${isMobile ? 'rounded-lg p-4' : 'rounded-xl p-6'} shadow-sm border border-gray-100 mt-6`}>
        <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-bold text-gray-900 ${isMobile ? 'mb-3' : 'mb-4'} flex items-center`}>
          <Trash2 className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} mr-2 text-red-600`} />
          Administration - Nettoyage des Données
        </h2>
        <FinancialDataCleanup />
      </div>
    </div>
  );
}