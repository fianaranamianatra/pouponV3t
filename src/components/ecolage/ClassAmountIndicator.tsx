// Indicateur de montant configuré pour une classe
import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, AlertTriangle, Settings, Eye } from 'lucide-react';
import { ClassEcolageService, ClassEcolageAmount } from '../../lib/services/classEcolageService';

interface ClassAmountIndicatorProps {
  className: string;
  level: string;
  currentAmount?: number;
  showDetails?: boolean;
  compact?: boolean;
  onConfigureClick?: () => void;
}

export function ClassAmountIndicator({ 
  className, 
  level, 
  currentAmount, 
  showDetails = false, 
  compact = false,
  onConfigureClick
}: ClassAmountIndicatorProps) {
  const [configuredAmount, setConfiguredAmount] = useState<ClassEcolageAmount | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadConfiguredAmount();
  }, [className]);

  const loadConfiguredAmount = async () => {
    try {
      setLoading(true);
      const amount = await ClassEcolageService.getClassAmount(className);
      setConfiguredAmount(amount);
    } catch (error) {
      console.error('Erreur lors du chargement du montant configuré:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="inline-flex items-center space-x-1">
        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-gray-500">Chargement...</span>
      </div>
    );
  }

  const isConfigured = configuredAmount && configuredAmount.isActive;
  const amount = isConfigured ? configuredAmount.monthlyAmount : 0;
  const isAmountMatch = currentAmount ? Math.abs(currentAmount - amount) <= (amount * 0.1) : true;

  if (compact) {
    return (
      <div className="inline-flex items-center space-x-1">
        {isConfigured ? (
          <CheckCircle className="w-3 h-3 text-green-600" />
        ) : (
          <AlertTriangle className="w-3 h-3 text-yellow-600" />
        )}
        <span className={`text-xs font-medium ${
          isConfigured ? 'text-green-700' : 'text-yellow-700'
        }`}>
          {isConfigured ? `${amount.toLocaleString()} Ar` : 'Non configuré'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className={`inline-flex items-center space-x-2 px-2 py-1 rounded-lg border ${
        isConfigured 
          ? isAmountMatch 
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}>
        <DollarSign className="w-4 h-4" />
        <div className="text-xs">
          <div className="font-medium">
            {isConfigured ? `${amount.toLocaleString()} Ar/mois` : 'Non configuré'}
          </div>
          {currentAmount && isConfigured && !isAmountMatch && (
            <div className="text-yellow-600">
              Écart: {Math.abs(currentAmount - amount).toLocaleString()} Ar
            </div>
          )}
        </div>
        
        {showDetails && (
          <button
            onClick={() => setShowDetailsModal(!showDetailsModal)}
            className="p-1 hover:bg-white rounded transition-colors"
          >
            <Eye className="w-3 h-3" />
          </button>
        )}
        
        {onConfigureClick && (
          <button
            onClick={onConfigureClick}
            className="p-1 hover:bg-white rounded transition-colors"
          >
            <Settings className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Details Dropdown */}
      {showDetailsModal && configuredAmount && (
        <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <h4 className="font-medium text-gray-900 mb-2">Configuration {className}</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mensuel:</span>
              <span className="font-medium">{configuredAmount.monthlyAmount.toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Annuel:</span>
              <span className="font-medium">{configuredAmount.annualAmount.toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Inscription:</span>
              <span className="font-medium">{(configuredAmount.registrationFee || 0).toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Examen:</span>
              <span className="font-medium">{(configuredAmount.examFee || 0).toLocaleString()} Ar</span>
            </div>
            {configuredAmount.notes && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600">{configuredAmount.notes}</p>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setShowDetailsModal(false)}
            className="w-full mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}