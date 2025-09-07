// Composant d'affichage du statut de synchronisation financière
import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle, AlertTriangle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useFinancialIntegration } from '../../hooks/useFinancialIntegration';

interface FinancialSyncStatusProps {
  compact?: boolean;
  showActions?: boolean;
}

export function FinancialSyncStatus({ compact = false, showActions = true }: FinancialSyncStatusProps) {
  const { summary, loading, error, loadSummary, validateConsistency } = useFinancialIntegration();
  const [lastValidation, setLastValidation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleQuickValidation = async () => {
    setIsValidating(true);
    try {
      const result = await validateConsistency();
      setLastValidation(result);
    } catch (error) {
      console.error('Erreur lors de la validation rapide:', error);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    // Validation automatique au chargement
    if (summary && !lastValidation && summary.transactionsCount > 0) {
      handleQuickValidation();
    }
  }, [summary]);

  if (loading) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${compact ? 'text-sm' : ''}`}>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-blue-700">Vérification de la synchronisation...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${compact ? 'text-sm' : ''}`}>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-red-700">Erreur de synchronisation</span>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const isConsistent = lastValidation?.isConsistent !== false;

  if (compact) {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
        isConsistent 
          ? 'bg-green-100 text-green-800' 
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {isConsistent ? (
          <CheckCircle className="w-3 h-3" />
        ) : (
          <AlertTriangle className="w-3 h-3" />
        )}
        <span>{isConsistent ? 'Synchronisé' : 'À vérifier'}</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-gray-900">Synchronisation Financière</h3>
          {isConsistent ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          )}
        </div>
        
        {showActions && (
          <button
            onClick={handleQuickValidation}
            disabled={isValidating}
            className="inline-flex items-center px-2 py-1 text-xs border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${isValidating ? 'animate-spin' : ''}`} />
            Vérifier
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-green-600" />
          <div>
            <p className="text-green-700 font-medium">Écolages</p>
            <p className="text-green-600">{summary.totalEcolages.toLocaleString()} Ar</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <TrendingDown className="w-4 h-4 text-red-600" />
          <div>
            <p className="text-red-700 font-medium">Salaires</p>
            <p className="text-red-600">{summary.totalSalaires.toLocaleString()} Ar</p>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Solde Net:</span>
          <span className={`font-bold ${summary.soldeNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary.soldeNet.toLocaleString()} Ar
          </span>
        </div>
      </div>

      {lastValidation && !lastValidation.isConsistent && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <p className="text-yellow-800 font-medium">⚠️ Incohérences détectées:</p>
          <ul className="text-yellow-700 mt-1 space-y-1">
            {lastValidation.issues.map((issue: string, index: number) => (
              <li key={index}>• {issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}