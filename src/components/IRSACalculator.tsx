import React, { useState } from 'react';
import { Calculator, Info, TrendingDown, DollarSign } from 'lucide-react';
import { IRSAService, IRSACalculation } from '../lib/services/irsaService';

interface IRSACalculatorProps {
  salaireImposable: number;
  onCalculationChange?: (calculation: IRSACalculation) => void;
}

export function IRSACalculator({ salaireImposable, onCalculationChange }: IRSACalculatorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [calculation, setCalculation] = useState<IRSACalculation | null>(null);

  React.useEffect(() => {
    if (salaireImposable > 0) {
      const calc = IRSAService.calculerIRSA(salaireImposable);
      setCalculation(calc);
      onCalculationChange?.(calc);
    }
  }, [salaireImposable, onCalculationChange]);

  if (!calculation || salaireImposable <= 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">Aucun calcul IRSA disponible</span>
        </div>
      </div>
    );
  }

  const bareme = IRSAService.getBareme();

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Calculator className="w-5 h-5 text-purple-600" />
          <h4 className="font-medium text-purple-800">IRSA (Impôt sur Revenus)</h4>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          {showDetails ? 'Masquer' : 'Détails'}
        </button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-purple-700">Salaire imposable:</span>
          <span className="font-bold text-purple-900">{calculation.salaireImposable.toLocaleString()} MGA</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-purple-700">IRSA à déduire:</span>
          <span className="text-lg font-bold text-red-600">-{calculation.montantTotal.toLocaleString()} MGA</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-purple-700">Taux effectif:</span>
          <span className="font-medium text-purple-800">{calculation.tauxEffectif.toFixed(2)}%</span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t border-purple-200">
          <h5 className="font-medium text-purple-800 mb-3 flex items-center">
            <Info className="w-4 h-4 mr-2" />
            Calcul détaillé par tranche
          </h5>
          
          <div className="space-y-2">
            {calculation.tranches.map((tranche, index) => (
              <div key={index} className="bg-white rounded p-3 border border-purple-100">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-700">
                    Tranche {index + 1}: {tranche.min.toLocaleString()} - {
                      tranche.max === calculation.salaireImposable ? '∞' : tranche.max.toLocaleString()
                    } MGA ({tranche.taux}%)
                  </span>
                  <span className="text-xs font-bold text-purple-600">
                    {tranche.impotTranche.toLocaleString()} MGA
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {tranche.taux}% sur {tranche.montantTranche.toLocaleString()} MGA
                </div>
              </div>
            ))}
          </div>

          {/* Barème de référence */}
          <div className="mt-4 pt-4 border-t border-purple-200">
            <h6 className="font-medium text-purple-800 mb-2 text-xs">Barème IRSA Madagascar 2024</h6>
            <div className="grid grid-cols-1 gap-1">
              {bareme.tranches.map((tranche, index) => (
                <div key={index} className="flex justify-between text-xs text-purple-700">
                  <span>
                    {tranche.min.toLocaleString()} - {tranche.max ? tranche.max.toLocaleString() : '∞'} MGA
                  </span>
                  <span className="font-medium">{tranche.taux}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}