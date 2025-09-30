// Panneau de contrôle pour la déduplication automatique
import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Settings, 
  Activity,
  Clock,
  Trash2,
  Eye,
  Play,
  Pause
} from 'lucide-react';
import { useAutomaticDeduplication } from '../../hooks/useAutomaticDeduplication';
import { Modal } from '../Modal';

interface AutoDeduplicationPanelProps {
  className?: string;
  compact?: boolean;
}

export function AutoDeduplicationPanel({ className = '', compact = false }: AutoDeduplicationPanelProps) {
  const {
    isActive,
    lastCheck,
    duplicatesRemoved,
    totalChecks,
    errors,
    config,
    forceCheck,
    updateConfig,
    start,
    stop
  } = useAutomaticDeduplication();

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isForceChecking, setIsForceChecking] = useState(false);
  const [tempConfig, setTempConfig] = useState(config);

  const handleForceCheck = async () => {
    setIsForceChecking(true);
    try {
      const result = await forceCheck();
      
      if (result.duplicatesRemoved > 0) {
        alert(`✅ Vérification forcée terminée !
        
Résultats :
• ${result.duplicatesFound} doublon(s) détecté(s)
• ${result.duplicatesRemoved} doublon(s) supprimé(s)
${result.errors.length > 0 ? `\n⚠️ ${result.errors.length} erreur(s)` : ''}

La base de données est maintenant propre !`);
      } else {
        alert('✅ Aucun doublon détecté lors de la vérification forcée');
      }
    } catch (error: any) {
      alert('❌ Erreur lors de la vérification forcée: ' + error.message);
    } finally {
      setIsForceChecking(false);
    }
  };

  const handleToggleService = () => {
    if (isActive) {
      stop();
    } else {
      start();
    }
  };

  const handleSaveConfig = () => {
    updateConfig(tempConfig);
    setShowConfigModal(false);
    alert('✅ Configuration mise à jour avec succès');
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
        isActive 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-gray-100 text-gray-800 border border-gray-200'
      } ${className}`}>
        {isActive ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <AlertTriangle className="w-3 h-3" />
        )}
        <span>Auto-Déduplication</span>
        <span className="text-gray-600">({duplicatesRemoved})</span>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-6 h-6 text-green-600" />
            <h3 className="font-bold text-gray-900">Déduplication Automatique</h3>
            {isActive ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center px-2 py-1 text-xs border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors"
            >
              <Settings className="w-3 h-3 mr-1" />
              Config
            </button>
            <button
              onClick={() => setShowDetailsModal(true)}
              className="inline-flex items-center px-2 py-1 text-xs border border-green-300 text-green-700 rounded hover:bg-green-50 transition-colors"
            >
              <Eye className="w-3 h-3 mr-1" />
              Détails
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Statut</span>
            </div>
            <p className={`text-lg font-bold ${isActive ? 'text-green-600' : 'text-red-600'}`}>
              {isActive ? 'Actif' : 'Inactif'}
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-gray-900">Supprimés</span>
            </div>
            <p className="text-lg font-bold text-red-600">{duplicatesRemoved}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <RefreshCw className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">Vérifications</span>
            </div>
            <p className="text-lg font-bold text-purple-600">{totalChecks}</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-gray-900">Erreurs</span>
            </div>
            <p className="text-lg font-bold text-yellow-600">{errors.length}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Service:</span>
            <span className={`font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
              {isActive ? '🟢 En fonctionnement' : '🔴 Arrêté'}
            </span>
          </div>
          {lastCheck && (
            <div className="flex justify-between">
              <span className="text-gray-600">Dernière vérification:</span>
              <span className="font-medium text-gray-900">
                {lastCheck.toLocaleTimeString('fr-FR')}
              </span>
            </div>
          )}
          {config && (
            <div className="flex justify-between">
              <span className="text-gray-600">Intervalle:</span>
              <span className="font-medium text-gray-900">
                {config.checkInterval / 1000}s
              </span>
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="flex space-x-2">
          <button
            onClick={handleToggleService}
            className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg transition-colors ${
              isActive 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isActive ? (
              <Pause className="w-4 h-4 mr-2" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isActive ? 'Arrêter' : 'Démarrer'}
          </button>
          
          <button
            onClick={handleForceCheck}
            disabled={isForceChecking}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {isForceChecking ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isForceChecking ? 'Vérification...' : 'Vérifier Maintenant'}
          </button>
        </div>

        {/* Alertes d'erreurs */}
        {errors.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="font-medium text-yellow-800 mb-2">Erreurs Récentes</h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              {errors.slice(-3).map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
            {errors.length > 3 && (
              <p className="text-yellow-600 text-xs mt-1">
                ... et {errors.length - 3} autre(s) erreur(s)
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal de détails */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Détails de la Déduplication Automatique"
        size="lg"
      >
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-bold text-green-900 mb-3">🤖 Fonctionnement Automatique</h4>
            <p className="text-green-800 text-sm mb-3">
              Le système surveille en permanence les transactions et supprime automatiquement 
              les doublons pour maintenir la cohérence des données financières.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-blue-800 mb-2">✅ Fonctionnalités:</h5>
                <ul className="text-blue-700 space-y-1">
                  <li>• Détection temps réel</li>
                  <li>• Suppression automatique</li>
                  <li>• Conservation de la version récente</li>
                  <li>• Notifications discrètes</li>
                  <li>• Logs détaillés</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-green-800 mb-2">🔄 Processus:</h5>
                <ul className="text-green-700 space-y-1">
                  <li>• Analyse des signatures</li>
                  <li>• Identification des groupes</li>
                  <li>• Tri par date de création</li>
                  <li>• Suppression des anciens</li>
                  <li>• Notification des résultats</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Activity className="w-4 h-4 mr-2" />
                Activité du Service
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Statut:</span>
                  <span className={`font-medium ${isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Vérifications effectuées:</span>
                  <span className="font-medium">{totalChecks}</span>
                </div>
                <div className="flex justify-between">
                  <span>Doublons supprimés:</span>
                  <span className="font-medium text-red-600">{duplicatesRemoved}</span>
                </div>
                <div className="flex justify-between">
                  <span>Erreurs:</span>
                  <span className={`font-medium ${errors.length > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {errors.length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Configuration Actuelle
              </h4>
              {config && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Intervalle:</span>
                    <span className="font-medium">{config.checkInterval / 1000}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seuil d'alerte:</span>
                    <span className="font-medium">{config.maxDuplicatesBeforeAlert}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mode silencieux:</span>
                    <span className={`font-medium ${config.silentMode ? 'text-blue-600' : 'text-gray-600'}`}>
                      {config.silentMode ? 'Oui' : 'Non'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Activé:</span>
                    <span className={`font-medium ${config.enabled ? 'text-green-600' : 'text-red-600'}`}>
                      {config.enabled ? 'Oui' : 'Non'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Erreurs récentes */}
          {errors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">Erreurs Récentes</h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                {errors.slice(-5).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
              {errors.length > 5 && (
                <p className="text-yellow-600 text-xs mt-1">
                  ... et {errors.length - 5} autre(s) erreur(s)
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleToggleService}
              className={`flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isActive ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isActive ? 'Arrêter le Service' : 'Démarrer le Service'}
            </button>
            
            <button
              onClick={handleForceCheck}
              disabled={isForceChecking}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {isForceChecking ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {isForceChecking ? 'Vérification...' : 'Vérifier Maintenant'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de configuration */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title="Configuration de la Déduplication Automatique"
        size="md"
      >
        {config && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Intervalle de vérification (secondes)
              </label>
              <input
                type="number"
                value={tempConfig?.checkInterval / 1000 || 30}
                onChange={(e) => setTempConfig(prev => ({
                  ...prev,
                  checkInterval: parseInt(e.target.value) * 1000
                }))}
                min="10"
                max="300"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Fréquence de vérification des doublons (10-300 secondes)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seuil d'alerte (nombre de doublons)
              </label>
              <input
                type="number"
                value={tempConfig?.maxDuplicatesBeforeAlert || 5}
                onChange={(e) => setTempConfig(prev => ({
                  ...prev,
                  maxDuplicatesBeforeAlert: parseInt(e.target.value)
                }))}
                min="1"
                max="50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nombre de doublons avant affichage d'une alerte
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="silentMode"
                checked={tempConfig?.silentMode || false}
                onChange={(e) => setTempConfig(prev => ({
                  ...prev,
                  silentMode: e.target.checked
                }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="silentMode" className="text-sm font-medium text-gray-700">
                Mode silencieux (pas de notifications)
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enabled"
                checked={tempConfig?.enabled || false}
                onChange={(e) => setTempConfig(prev => ({
                  ...prev,
                  enabled: e.target.checked
                }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                Service activé
              </label>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveConfig}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}