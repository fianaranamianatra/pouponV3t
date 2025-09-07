import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, RefreshCw, Database, DollarSign, Users, Receipt, CreditCard } from 'lucide-react';
import { FinancialDataCleanupService, CleanupResult } from '../../lib/services/financialDataCleanup';
import { Modal } from '../Modal';

interface FinancialDataCleanupProps {
  className?: string;
}

export function FinancialDataCleanup({ className = '' }: FinancialDataCleanupProps) {
  const [dataCounts, setDataCounts] = useState({
    transactions: 0,
    fees: 0,
    salaries: 0,
    payroll: 0
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<CleanupResult | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [showDuplicateCleanup, setShowDuplicateCleanup] = useState(false);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [duplicateCleanupResult, setDuplicateCleanupResult] = useState<any>(null);</parameter>

  // Charger les compteurs au montage
  useEffect(() => {
    // Délai pour éviter les appels trop fréquents au montage
    const timer = setTimeout(() => {
      loadDataCounts();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const loadDataCounts = async () => {
    setLoading(true);
    try {
      const counts = await FinancialDataCleanupService.getFinancialDataCounts();
      setDataCounts(counts);
    } catch (error) {
      console.error('Erreur lors du chargement des compteurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (confirmText !== 'SUPPRIMER TOUT') {
      alert('Veuillez taper "SUPPRIMER TOUT" pour confirmer');
      return;
    }

    setIsDeleting(true);
    try {
      console.log('🚨 Début de la suppression de toutes les données financières');
      const result = await FinancialDataCleanupService.deleteAllFinancialData();
      setDeleteResult(result);
      
      if (result.success) {
        alert(`✅ Suppression terminée avec succès !
        
Données supprimées :
• ${result.deletedCounts.transactions} transaction(s)
• ${result.deletedCounts.fees} paiement(s) d'écolage
• ${result.deletedCounts.salaries} salaire(s)
• ${result.deletedCounts.payroll} bulletin(s) de paie

Toutes les données financières ont été supprimées.`);
        
        // Recharger les compteurs
        await loadDataCounts();
      } else {
        alert(`❌ Erreurs lors de la suppression :
        
${result.errors.join('\n')}`);
      }
      
      setShowConfirmModal(false);
      setConfirmText('');
    } catch (error: any) {
      alert('❌ Erreur critique lors de la suppression: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalRecords = dataCounts.transactions + dataCounts.fees + dataCounts.salaries + dataCounts.payroll;

  return (
    <>
      <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-bold text-gray-900">Nettoyage des Données Financières</h2>
          </div>
          
          <button
            onClick={loadDataCounts}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {/* Data Counts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-blue-700">Transactions</p>
            <p className="text-2xl font-bold text-blue-800">{dataCounts.transactions}</p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-green-700">Écolages</p>
            <p className="text-2xl font-bold text-green-800">{dataCounts.fees}</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-purple-700">Salaires</p>
            <p className="text-2xl font-bold text-purple-800">{dataCounts.salaries}</p>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <Receipt className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-orange-700">Bulletins</p>
            <p className="text-2xl font-bold text-orange-800">{dataCounts.payroll}</p>
          </div>
        </div>

        {/* Warning Section */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">⚠️ ATTENTION - Action Irréversible</h3>
              <p className="text-red-700 text-sm mt-1">
                Cette action supprimera définitivement <strong>TOUTES</strong> les données financières :
              </p>
              <ul className="text-red-700 text-sm mt-2 space-y-1">
                <li>• <strong>Encaissements et Décaissements</strong> - Toutes les transactions financières</li>
                <li>• <strong>Gestion Écolage</strong> - Tous les paiements d'écolage enregistrés</li>
                <li>• <strong>Gestion des Salaires</strong> - Tous les enregistrements de salaires</li>
                <li>• <strong>Bulletins de Paie</strong> - Tous les bulletins générés</li>
                <li>• <strong>Paramètres financiers</strong> - Configuration CNAPS, OSTIE, IRSA</li>
                <li>• <strong>Logs d'intégration</strong> - Historique des synchronisations</li>
              </ul>
              <p className="text-red-800 font-medium text-sm mt-3">
                ⚠️ Cette action ne peut pas être annulée. Assurez-vous d'avoir une sauvegarde si nécessaire.
              </p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Résumé des Données à Supprimer</h4>
              <p className="text-gray-600 text-sm">
                Total: <strong>{totalRecords}</strong> enregistrement(s) dans {Object.values(dataCounts).filter(count => count > 0).length} collection(s)
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-red-600">{totalRecords}</p>
              <p className="text-sm text-gray-600">enregistrements</p>
            </div>
          </div>
        </div>

        {/* Delete Button */}
        <div className="space-y-4">
          {/* Cleanup Duplicates Section */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h3 className="font-medium text-yellow-800">Nettoyage des Doublons</h3>
              </div>
            </div>
            
            <p className="text-yellow-700 text-sm mb-4">
              Supprime automatiquement les transactions en double créées lors des calculs de salaires.
              Cette action garde la transaction la plus récente et supprime les doublons.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCleanupDuplicates}
                disabled={isCleaningDuplicates || dataCounts.transactions === 0}
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
              >
                {isCleaningDuplicates ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {isCleaningDuplicates ? 'Nettoyage...' : 'Nettoyer les Doublons'}
              </button>
              
              {duplicateCleanupResult && (
                <div className="text-sm text-yellow-700">
                  Dernier nettoyage: {duplicateCleanupResult.totalCleaned} doublon(s) supprimé(s)
                </div>
              )}
            </div>
          </div>
          
          {/* Delete All Section */}
          <div className="text-center">
          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={loading || totalRecords === 0}
            className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Tout Supprimer ({totalRecords} enregistrements)
          </button>
          
          {totalRecords === 0 && (
            <p className="text-gray-500 text-sm mt-2">
              Aucune donnée financière à supprimer
            </p>
          )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setConfirmText('');
        }}
        title="⚠️ Confirmation de Suppression Totale"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-8 h-8 text-red-600 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-red-800">SUPPRESSION DÉFINITIVE</h3>
                <p className="text-red-700 mt-2">
                  Vous êtes sur le point de supprimer <strong>TOUTES</strong> les données financières de l'école.
                  Cette action est <strong>IRRÉVERSIBLE</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Data Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Données qui seront supprimées :</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span>Transactions financières:</span>
                <span className="font-bold text-red-600">{dataCounts.transactions}</span>
              </div>
              <div className="flex justify-between">
                <span>Paiements d'écolage:</span>
                <span className="font-bold text-red-600">{dataCounts.fees}</span>
              </div>
              <div className="flex justify-between">
                <span>Enregistrements de salaires:</span>
                <span className="font-bold text-red-600">{dataCounts.salaries}</span>
              </div>
              <div className="flex justify-between">
                <span>Bulletins de paie:</span>
                <span className="font-bold text-red-600">{dataCounts.payroll}</span>
              </div>
            </div>
            <div className="border-t border-gray-300 mt-3 pt-3">
              <div className="flex justify-between font-bold">
                <span>TOTAL:</span>
                <span className="text-red-600">{totalRecords} enregistrements</span>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pour confirmer, tapez <strong>"SUPPRIMER TOUT"</strong> (en majuscules) :
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SUPPRIMER TOUT"
              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setShowConfirmModal(false);
                setConfirmText('');
              }}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteAll}
              disabled={isDeleting || confirmText !== 'SUPPRIMER TOUT'}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isDeleting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Suppression en cours...
                </div>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2 inline" />
                  CONFIRMER LA SUPPRESSION
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}