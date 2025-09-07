// Panneau de contrôle pour la synchronisation financière centralisée
import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Database,
  Settings,
  Eye,
  Wrench,
  Activity,
  BarChart3
} from 'lucide-react';
import { useCentralizedFinancialSync } from '../../hooks/useCentralizedFinancialSync';
import { Modal } from '../Modal';

interface CentralizedSyncPanelProps {
  className?: string;
  compact?: boolean;
}

export function CentralizedSyncPanel({ className = '', compact = false }: CentralizedSyncPanelProps) {
  const {
    syncStatus,
    isInitialized,
    lastSyncEvent,
    loading,
    error,
    stats,
    restart,
    syncAllExistingData,
    validateCentralization,
    repairCentralization,
    healthCheck
  } = useCentralizedFinancialSync();

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [repairResult, setRepairResult] = useState<any>(null);

  const health = healthCheck();

  const handleSyncAll = async () => {
    if (!confirm('Synchroniser toutes les données existantes vers le centre financier ?')) {
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncAllExistingData();
      alert(`✅ Synchronisation terminée !
      
Résultats :
• ${result.ecolagesSynced} paiement(s) d'écolage synchronisé(s)
• ${result.salariesSynced} salaire(s) synchronisé(s)
${result.errors.length > 0 ? `\n⚠️ ${result.errors.length} erreur(s) détectée(s)` : ''}

Le module Encaissements et Décaissements est maintenant centralisé !`);
    } catch (error: any) {
      alert('❌ Erreur lors de la synchronisation: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const result = await validateCentralization();
      setValidationResult(result);
      setShowValidationModal(true);
    } catch (error: any) {
      alert('❌ Erreur lors de la validation: ' + error.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRepair = async () => {
    setIsRepairing(true);
    try {
      const result = await repairCentralization();
      setRepairResult(result);
      alert(`✅ Réparation terminée !
      
Résultats :
• ${result.ecolagesRepaired} écolage(s) réparé(s)
• ${result.salariesRepaired} salaire(s) réparé(s)
• ${result.orphansRemoved} transaction(s) orpheline(s) supprimée(s)
${result.errors.length > 0 ? `\n⚠️ ${result.errors.length} erreur(s)` : ''}

La centralisation est maintenant cohérente !`);
      setShowValidationModal(false);
    } catch (error: any) {
      alert('❌ Erreur lors de la réparation: ' + error.message);
    } finally {
      setIsRepairing(false);
    }
  };

  const handleRestart = async () => {
    try {
      await restart();
      alert('✅ Synchronisation centralisée redémarrée avec succès');
    } catch (error: any) {
      alert('❌ Erreur lors du redémarrage: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-700">Initialisation de la synchronisation centralisée...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">Erreur de synchronisation centralisée</span>
          </div>
          <button
            onClick={handleRestart}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Redémarrer
          </button>
        </div>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
        health.isHealthy 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      } ${className}`}>
        {health.isHealthy ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <AlertTriangle className="w-3 h-3" />
        )}
        <span>Centralisation</span>
        <span className="text-gray-600">({syncStatus.activeListeners})</span>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-blue-600" />
            <h3 className="font-bold text-gray-900">Synchronisation Financière Centralisée</h3>
            {health.isHealthy ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="inline-flex items-center px-2 py-1 text-xs border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors"
            >
              <Eye className="w-3 h-3 mr-1" />
              Détails
            </button>
            <button
              onClick={handleRestart}
              className="inline-flex items-center px-2 py-1 text-xs border border-green-300 text-green-700 rounded hover:bg-green-50 transition-colors"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Redémarrer
            </button>
          </div>
        </div>

        {/* Statistiques de centralisation */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Encaissements</p>
                  <p className="text-lg font-bold text-green-600">{stats.ecolageTransactions}</p>
                </div>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white border border-red-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Décaissements</p>
                  <p className="text-lg font-bold text-red-600">{stats.salaryTransactions}</p>
                </div>
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
            </div>
            
            <div className="bg-white border border-purple-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Manuelles</p>
                  <p className="text-lg font-bold text-purple-600">{stats.manualTransactions}</p>
                </div>
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600">Solde Net</p>
                  <p className={`text-lg font-bold ${stats.soldeNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {(stats.soldeNet / 1000000).toFixed(1)}M
                  </p>
                </div>
                <DollarSign className={`w-5 h-5 ${stats.soldeNet >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>
        )}

        {/* Statut des modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`border rounded-lg p-4 ${
            syncStatus.ecolageSync.active 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className={`w-5 h-5 ${
                syncStatus.ecolageSync.active ? 'text-green-600' : 'text-red-600'
              }`} />
              <h4 className={`font-medium ${
                syncStatus.ecolageSync.active ? 'text-green-800' : 'text-red-800'
              }`}>
                Écolage → Encaissements
              </h4>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Statut:</span>
                <span className={`font-medium ${
                  syncStatus.ecolageSync.active ? 'text-green-600' : 'text-red-600'
                }`}>
                  {syncStatus.ecolageSync.active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Traités:</span>
                <span className="font-medium">{syncStatus.ecolageSync.recordsProcessed}</span>
              </div>
            </div>
          </div>
          
          <div className={`border rounded-lg p-4 ${
            syncStatus.salarySync.active 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              <TrendingDown className={`w-5 h-5 ${
                syncStatus.salarySync.active ? 'text-green-600' : 'text-red-600'
              }`} />
              <h4 className={`font-medium ${
                syncStatus.salarySync.active ? 'text-green-800' : 'text-red-800'
              }`}>
                Salaires → Décaissements
              </h4>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Statut:</span>
                <span className={`font-medium ${
                  syncStatus.salarySync.active ? 'text-green-600' : 'text-red-600'
                }`}>
                  {syncStatus.salarySync.active ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Traités:</span>
                <span className="font-medium">{syncStatus.salarySync.recordsProcessed}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSyncing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              {isSyncing ? 'Synchronisation...' : 'Synchroniser Tout'}
            </button>
            
            <button
              onClick={handleValidate}
              disabled={isValidating}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              {isValidating ? (
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {isValidating ? 'Validation...' : 'Valider Cohérence'}
            </button>
          </div>

          {/* Informations de statut */}
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className={`font-medium ${syncStatus.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {syncStatus.isActive ? '✅ Centralisation Active' : '❌ Centralisation Inactive'}
                </span>
                <span className="text-gray-600">
                  {syncStatus.activeListeners} listener(s) actif(s)
                </span>
              </div>
              
              <div className="text-xs text-gray-500">
                MAJ: {syncStatus.lastSyncTime.toLocaleTimeString('fr-FR')}
              </div>
            </div>
          </div>
        </div>

        {/* Alertes de santé */}
        {!health.isHealthy && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Problèmes Détectés</h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              {health.issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
            <div className="mt-2">
              <h5 className="font-medium text-yellow-800 text-xs">Recommandations:</h5>
              <ul className="text-yellow-700 text-xs space-y-1 mt-1">
                {health.recommendations.map((rec, index) => (
                  <li key={index}>→ {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Détails de la Synchronisation Centralisée"
        size="xl"
      >
        <div className="space-y-6">
          {/* Vue d'ensemble */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 mb-3">🎯 Objectif de la Centralisation</h4>
            <p className="text-blue-800 text-sm mb-3">
              Toutes les opérations financières des modules Écolage et Salaires sont automatiquement 
              centralisées dans le module "Encaissements et Décaissements" pour un contrôle financier unifié.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-green-800 mb-2">✅ Fonctionnalités actives:</h5>
                <ul className="text-green-700 space-y-1">
                  <li>• Synchronisation temps réel</li>
                  <li>• Prévention des doublons</li>
                  <li>• Catégorisation automatique</li>
                  <li>• Liaison bidirectionnelle</li>
                  <li>• Mise à jour des totaux</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-blue-800 mb-2">🔄 Flux automatiques:</h5>
                <ul className="text-blue-700 space-y-1">
                  <li>• Écolage payé → Encaissement</li>
                  <li>• Salaire versé → Décaissement</li>
                  <li>• Modification → Mise à jour</li>
                  <li>• Suppression → Suppression liée</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Statistiques détaillées */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Répartition des Transactions
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total transactions:</span>
                    <span className="font-bold">{stats.totalTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depuis Écolage:</span>
                    <span className="font-medium text-green-600">{stats.ecolageTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depuis Salaires:</span>
                    <span className="font-medium text-red-600">{stats.salaryTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Manuelles:</span>
                    <span className="font-medium text-purple-600">{stats.manualTransactions}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Résumé Financier
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total encaissements:</span>
                    <span className="font-medium text-green-600">{stats.totalEncaissements.toLocaleString()} Ar</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total décaissements:</span>
                    <span className="font-medium text-red-600">{stats.totalDecaissements.toLocaleString()} Ar</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2">
                    <span className="font-bold">Solde net:</span>
                    <span className={`font-bold ${stats.soldeNet >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {stats.soldeNet.toLocaleString()} Ar
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statut des listeners */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              État des Connexions Temps Réel
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{syncStatus.activeListeners}</p>
                <p className="text-gray-600">Listeners Actifs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{syncStatus.totalSyncedRecords}</p>
                <p className="text-gray-600">Enregistrements Synchronisés</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{syncStatus.errors.length}</p>
                <p className="text-gray-600">Erreurs</p>
              </div>
            </div>
          </div>

          {/* Actions avancées */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSyncing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              {isSyncing ? 'Synchronisation...' : 'Synchroniser Toutes les Données'}
            </button>
            
            <button
              onClick={handleValidate}
              disabled={isValidating}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              {isValidating ? (
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {isValidating ? 'Validation...' : 'Valider Cohérence'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de validation */}
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Validation de la Centralisation Financière"
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
                    ? '✅ Centralisation Cohérente' 
                    : '⚠️ Incohérences Détectées'
                  }
                </h3>
              </div>
              
              {!validationResult.isConsistent && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{validationResult.missingEcolageTransactions}</p>
                    <p className="text-red-700">Écolages manquants</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{validationResult.missingSalaryTransactions}</p>
                    <p className="text-red-700">Salaires manquants</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{validationResult.orphanedTransactions}</p>
                    <p className="text-orange-700">Transactions orphelines</p>
                  </div>
                </div>
              )}
            </div>

            {!validationResult.isConsistent && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">🔧 Réparation Automatique</h4>
                <p className="text-blue-700 text-sm mb-3">
                  Le système peut automatiquement créer les transactions manquantes et supprimer les orphelines.
                </p>
                <button
                  onClick={handleRepair}
                  disabled={isRepairing}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isRepairing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <Wrench className="w-4 h-4 mr-2" />
                  )}
                  {isRepairing ? 'Réparation...' : 'Réparer Automatiquement'}
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