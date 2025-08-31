// Indicateur de synchronisation pour les transactions liées
import React, { useState, useEffect } from 'react';
import { Link2, CheckCircle, AlertTriangle, Eye, ExternalLink } from 'lucide-react';
import { FinancialIntegrationService } from '../../lib/services/financialIntegrationService';

interface TransactionSyncIndicatorProps {
  module: 'salary' | 'ecolage';
  recordId: string;
  recordName: string;
  className?: string;
}

export function TransactionSyncIndicator({ 
  module, 
  recordId, 
  recordName, 
  className = '' 
}: TransactionSyncIndicatorProps) {
  const [relatedTransactions, setRelatedTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const loadRelatedTransactions = async () => {
      if (!recordId) return;
      
      setLoading(true);
      try {
        const transactions = await FinancialIntegrationService.getRelatedTransactions(module, recordId);
        setRelatedTransactions(transactions);
      } catch (error) {
        console.error('Erreur lors du chargement des transactions liées:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRelatedTransactions();
  }, [module, recordId]);

  if (loading) {
    return (
      <div className={`inline-flex items-center space-x-1 ${className}`}>
        <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-gray-500">Vérification...</span>
      </div>
    );
  }

  const hasTransactions = relatedTransactions.length > 0;
  const validTransactions = relatedTransactions.filter(t => t.status === 'Validé');

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      {hasTransactions ? (
        <>
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-700 font-medium">
              {validTransactions.length}/{relatedTransactions.length} synchronisé(s)
            </span>
          </div>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
            title="Voir les détails"
          >
            <Eye className="w-3 h-3" />
          </button>
        </>
      ) : (
        <div className="flex items-center space-x-1">
          <AlertTriangle className="w-4 h-4 text-yellow-600" />
          <span className="text-xs text-yellow-700">Non synchronisé</span>
        </div>
      )}

      {/* Details Dropdown */}
      {showDetails && hasTransactions && (
        <div className="absolute z-10 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <h4 className="font-medium text-gray-900 mb-2 flex items-center">
            <Link2 className="w-4 h-4 mr-2" />
            Transactions Liées
          </h4>
          
          <div className="space-y-2">
            {relatedTransactions.map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    {transaction.type}: {transaction.amount.toLocaleString()} Ar
                  </p>
                  <p className="text-xs text-gray-500">{transaction.date}</p>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                    transaction.status === 'Validé' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.status}
                  </span>
                  <button
                    onClick={() => {
                      // Rediriger vers la page des transactions avec le filtre
                      window.location.href = `/#financial-transactions?ref=${transaction.reference}`;
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                    title="Voir dans les transactions"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => setShowDetails(false)}
            className="w-full mt-2 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}