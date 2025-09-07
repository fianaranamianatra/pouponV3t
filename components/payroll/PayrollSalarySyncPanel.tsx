// Panneau de contrôle pour la synchronisation Paie ↔ Salaires
import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Calculator, 
  Users, 
  TrendingUp, 
  Settings,
  Activity,
  Clock,
  DollarSign
} from 'lucide-react';
import { usePayrollSalarySync } from '../../hooks/usePayrollSalarySync';
import { Modal } from '../Modal';

interface PayrollSalarySyncPanelProps {
  className?: string;
  compact?: boolean;
}

export function PayrollSalarySyncPanel({ className = '', compact = false }: PayrollSalarySyncPanelProps) {
  const {
    syncStatus,
    isInitialized,
    lastSyncEvent,
    loading,
    error,
    restart,
    calculateAndSyncAll,
    healthCheck
  } = usePayrollSalarySync();

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);

  const health = healthCheck();

  const handleCalculateAll = async () => {
    if (!confirm('Calculer et synchroniser la paie pour tous les employés actifs ?')) {
      return;
    }

    setIsCalculating(true);
    try {
      const result = await calculateAndSyncAll();
      setCalculationResult(result);
      alert(`✅ Calcul terminé: ${result.calculated} employé(s) traité(s), ${result.synced} synchronisé(s)`);
    } catch (error: any) {
      alert('❌ Erreur lors du calcul: ' + error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRestart = async () => {
    try {
      await restart();
      alert('✅ Synchronisation redémarrée avec succès');
    } catch (error: any) {
      alert('❌ Erreur lors du redémarrage: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-700">Initialisation de la synchronisation...</span>
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
            <span className="text-red-700">Erreur de synchronisation</span>
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
        <span>Paie ↔ Salaires</span>
        <span className="text-gray-600">({syncStatus.activeConnections})</span>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-purple-600" />
            <h3 className="font-bold text-gray-900">Synchronisation Paie ↔ Salaires</h3>
            {health.isHealthy ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="inline-flex items-center px-2 py-1 text-xs border border-purple-300 text-purple-700 rounded hover:bg-purple-50 transition-colors"
            >
              <Activity className="w-3 h-3 mr-1" />
              Détails
            </button>
            <button
              onClick={handleRestart}
              className="inline-flex items-center px-2 py-1 text-xs border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Redémarrer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Users className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">Connexions</span>
            </div>
            <p className="text-xl font-bold text-purple-600">{syncStatus.activeConnections}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Synchronisés</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{syncStatus.totalSyncedRecords}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-900">Erreurs</span>
            </div>
            <p className="text-xl font-bold text-red-600">{syncStatus.errors.length}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Statut:</span>
            <span className={`font-medium ${syncStatus.isActive ? 'text-green-600' : 'text-red-600'}`}>
              {syncStatus.isActive ? 'Actif' : 'Inactif'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Dernière synchronisation:</span>
            <span className="font-medium text-gray-900">
              {syncStatus.lastSyncTime.toLocaleTimeString('fr-FR')}
            </span>
          </div>
          {lastSyncEvent && (
            <div className="flex justify-between">
              <span className="text-gray-600">Dernier événement:</span>
              <span className="font-medium text-blue-600">
                {lastSyncEvent.employeeName}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-purple-200">
          <div className="flex space-x-2">
            <button
              onClick={handleCalculateAll}
              disabled={isCalculating || !isInitialized}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isCalculating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Calculator className="w-4 h-4 mr-2" />
              )}
              {isCalculating ? 'Calcul...' : 'Calculer Tout'}
            </button>
            
            <button
              onClick={() => setShowDetailsModal(true)}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <Activity className="w-4 h-4 mr-2" />
              Voir Détails
            </button>
          </div>
        </div>

        {/* Health Status */}
        {!health.isHealthy && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-medium text-yellow-800 mb-2">Problèmes Détectés</h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              {health.issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Détails de la Synchronisation Paie ↔ Salaires"
        size="lg"
      >
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-3">État de la Synchronisation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Statut:</span>
                  <span className={`font-medium ${syncStatus.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {syncStatus.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Connexions actives:</span>
                  <span className="font-medium">{syncStatus.activeConnections}</span>
                </div>
                <div className="flex justify-between">
                  <span>Enregistrements synchronisés:</span>
                  <span className="font-medium">{syncStatus.totalSyncedRecords}</span>
                </div>
                <div className="flex justify-between">
                  <span>Erreurs:</span>
                  <span className={`font-medium ${syncStatus.errors.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {syncStatus.errors.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-3">Fonctionnalités Actives</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Synchronisation temps réel</li>
                <li>✅ Calcul automatique des paies</li>
                <li>✅ Mise à jour bidirectionnelle</li>
                <li>✅ Intégration financière</li>
                <li>✅ Validation de cohérence</li>
              </ul>
            </div>
          </div>

          {/* Recent Sync Events */}
          {lastSyncEvent && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Dernier Événement de Synchronisation
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Employé:</span>
                  <span className="font-medium">{lastSyncEvent.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Salaire brut:</span>
                  <span className="font-medium">{lastSyncEvent.payrollCalculation?.grossSalary.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                  <span>Salaire net:</span>
                  <span className="font-medium text-green-600">{lastSyncEvent.payrollCalculation?.netSalary.toLocaleString()} Ar</span>
                </div>
                <div className="flex justify-between">
                  <span>Heure:</span>
                  <span className="font-medium">{new Date(lastSyncEvent.syncTime).toLocaleTimeString('fr-FR')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Calculation Result */}
          {calculationResult && calculationResult.calculated > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-3">Résultat du Dernier Calcul Global</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-600">{calculationResult.calculated}</p>
                  <p className="text-sm text-purple-700">Calculés</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{calculationResult.synced}</p>
                  <p className="text-sm text-green-700">Synchronisés</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{calculationResult.errors.length}</p>
                  <p className="text-sm text-red-700">Erreurs</p>
                </div>
              </div>
            </div>
          )}

          {/* Health Check */}
          <div className={`border rounded-lg p-4 ${
            health.isHealthy 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <h4 className={`font-medium mb-3 ${
              health.isHealthy ? 'text-green-800' : 'text-yellow-800'
            }`}>
              Diagnostic de Santé
            </h4>
            
            {health.isHealthy ? (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700">Tous les systèmes fonctionnent correctement</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-yellow-800 text-sm">Problèmes détectés:</h5>
                  <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                    {health.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium text-yellow-800 text-sm">Recommandations:</h5>
                  <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                    {health.recommendations.map((rec, index) => (
                      <li key={index}>→ {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleCalculateAll}
              disabled={isCalculating}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {isCalculating ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <Calculator className="w-4 h-4 mr-2" />
              )}
              {isCalculating ? 'Calcul en cours...' : 'Calculer Toutes les Paies'}
            </button>
            
            <button
              onClick={handleRestart}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Redémarrer Sync
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}