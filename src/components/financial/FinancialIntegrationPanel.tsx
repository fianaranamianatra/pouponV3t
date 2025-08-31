// Panneau de contrôle pour l'intégration financière
import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, DollarSign, Zap, Settings, Eye } from 'lucide-react';
import { useFinancialIntegration } from '../../hooks/useFinancialIntegration';
import { Modal } from '../Modal';

export function FinancialIntegrationPanel() {
  const {
    summary,
    loading,
    error,
    loadSummary,
    validateConsistency,
    repairInconsistencies
  } = useFinancialIntegration();

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  const handleValidateConsistency = async () => {
    setIsValidating(true);
    try {
      const result = await validateConsistency();
      setValidationResult(result);
      setShowValidationModal(true);
    } catch (error: any) {
      alert('Erreur lors de la validation: ' + error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRepairInconsistencies = async () => {
    setIsRepairing(true);
    try {
      const result = await repairInconsistencies();
      alert(`✅ Réparation terminée: ${result.repaired} transaction(s) créée(s)`);
      if (result.errors.length > 0) {
        console.warn('Erreurs lors de la réparation:', result.errors);
      }
      setShowValidationModal(false);
    } catch (error: any) {
      alert('Erreur lors de la réparation: ' + error.message);
    } finally {
      setIsRepairing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-gray-600">Chargement du résumé financier...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Erreur: {error}</p>
        <button 
          onClick={loadSummary}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Intégration Financière Automatique</h2>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleValidateConsistency}
              disabled={isValidating}
              className="inline-flex items-center px-3 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {isValidating ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Valider Cohérence
            </button>
            
            <button
              onClick={loadSummary}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {summary && (
          <>
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Total Écolages</p>
                    <p className="text-xl font-bold text-green-800">{summary.totalEcolages.toLocaleString()} Ar</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600">Total Salaires</p>
                    <p className="text-xl font-bold text-red-800">{summary.totalSalaires.toLocaleString()} Ar</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Solde Net</p>
                    <p className={`text-xl font-bold ${summary.soldeNet >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                      {summary.soldeNet.toLocaleString()} Ar
                    </p>
                  </div>
                  <DollarSign className={`w-8 h-8 ${summary.soldeNet >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600">Transactions</p>
                    <p className="text-xl font-bold text-purple-800">{summary.transactionsCount}</p>
                  </div>
                  <Settings className="w-8 h-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Integration Status */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Intégration Active</h3>
                  <p className="text-sm text-gray-600">
                    Les paiements d'écolage et de salaires sont automatiquement synchronisés avec les transactions financières.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Dernière mise à jour: {summary.lastUpdated.toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>

            {/* Integration Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-800">Encaissements Automatiques</h4>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ Paiements d'écolage → Encaissements</li>
                  <li>✅ Synchronisation temps réel</li>
                  <li>✅ Références automatiques</li>
                  <li>✅ Catégorisation intelligente</li>
                </ul>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  <h4 className="font-medium text-red-800">Décaissements Automatiques</h4>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>✅ Paiements de salaires → Décaissements</li>
                  <li>✅ Calcul automatique des montants nets</li>
                  <li>✅ Liaison bidirectionnelle</li>
                  <li>✅ Historique complet</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Validation Modal */}
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Validation de la Cohérence Financière"
        size="lg"
      >
        {validationResult && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${
              validationResult.isConsistent 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center space-x-2">
                {validationResult.isConsistent ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                )}
                <h3 className={`font-medium ${
                  validationResult.isConsistent ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {validationResult.isConsistent 
                    ? 'Données Financières Cohérentes' 
                    : 'Incohérences Détectées'
                  }
                </h3>
              </div>
              
              {!validationResult.isConsistent && (
                <div className="mt-3">
                  <p className="text-yellow-700 text-sm mb-2">Problèmes détectés:</p>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    {validationResult.issues.map((issue: string, index: number) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {!validationResult.isConsistent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Réparation Automatique</h4>
                <p className="text-blue-700 text-sm mb-3">
                  Le système peut automatiquement créer les transactions manquantes pour restaurer la cohérence.
                </p>
                <button
                  onClick={handleRepairInconsistencies}
                  disabled={isRepairing}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isRepairing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Settings className="w-4 h-4 mr-2" />
                  )}
                  {isRepairing ? 'Réparation en cours...' : 'Réparer Automatiquement'}
                </button>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowValidationModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}