import React from 'react';
import { Calculator, Info, TrendingUp } from 'lucide-react';
import { IRSAService } from '../lib/services/irsaService';

interface IRSABaremeDisplayProps {
  className?: string;
}

export function IRSABaremeDisplay({ className = '' }: IRSABaremeDisplayProps) {
  const bareme = IRSAService.getBareme();

  return (
    <div className={`bg-purple-50 border border-purple-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Calculator className="w-5 h-5 text-purple-600" />
        <h3 className="font-bold text-purple-800">Barème IRSA Madagascar 2024</h3>
      </div>
      
      <div className="space-y-2">
        {bareme.tranches.map((tranche, index) => (
          <div key={index} className="flex justify-between items-center py-2 px-3 bg-white rounded border border-purple-100">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                tranche.taux === 0 ? 'bg-green-500' :
                tranche.taux <= 10 ? 'bg-yellow-500' :
                tranche.taux <= 15 ? 'bg-orange-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium text-gray-700">
                {tranche.min.toLocaleString()} - {tranche.max ? tranche.max.toLocaleString() : '∞'} MGA
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-bold ${
                tranche.taux === 0 ? 'text-green-600' :
                tranche.taux <= 10 ? 'text-yellow-600' :
                tranche.taux <= 15 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {tranche.taux}%
              </span>
              <span className="text-xs text-gray-500">({tranche.description})</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-purple-200">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-purple-600 mt-0.5" />
          <div className="text-xs text-purple-700">
            <p className="font-medium mb-1">Calcul progressif :</p>
            <p>• Base imposable = Salaire brut - CNAPS (1%) - OSTIE (1%)</p>
            <p>• Application du barème par tranche</p>
            <p>• Déduction mensuelle sur le salaire</p>
          </div>
        </div>
      </div>
    </div>
  );
}