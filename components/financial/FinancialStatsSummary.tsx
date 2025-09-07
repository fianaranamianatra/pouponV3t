import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

interface FinancialStats {
  totalEncaissements: number;
  totalDecaissements: number;
  solde: number;
  transactionsEnAttente: number;
  montantEnAttente: number;
  totalTransactions: number;
}

interface FinancialStatsSummaryProps {
  stats: FinancialStats;
  isMobile?: boolean;
}

export function FinancialStatsSummary({ stats, isMobile = false }: FinancialStatsSummaryProps) {
  return (
    <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-4 gap-4'}`}>
      <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center">
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Total Encaissements</p>
            <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-600`}>
              {stats.totalEncaissements.toLocaleString()} Ar
            </p>
          </div>
          <TrendingUp className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-green-600 ml-auto`} />
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center">
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Total Décaissements</p>
            <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-red-600`}>
              {stats.totalDecaissements.toLocaleString()} Ar
            </p>
          </div>
          <TrendingDown className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-red-600 ml-auto`} />
        </div>
      </div>

      <div className={`bg-white rounded-lg p-4 border border-gray-100 shadow-sm ${isMobile ? 'col-span-2' : ''}`}>
        <div className="flex items-center">
          <div>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Solde</p>
            <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold ${stats.solde >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {stats.solde.toLocaleString()} Ar
            </p>
            <div className="flex items-center mt-1">
              {stats.solde >= 0 ? (
                <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`text-xs ${stats.solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.solde >= 0 ? 'Positif' : 'Négatif'}
              </span>
            </div>
          </div>
          <DollarSign className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ml-auto ${stats.solde >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
        </div>
      </div>
      
      <div className={`bg-white rounded-lg p-4 border border-gray-100 shadow-sm ${isMobile ? 'hidden' : ''}`}>
        <div className="flex items-center">
          <div>
            <p className="text-sm text-gray-600">En Attente</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.transactionsEnAttente}</p>
            <p className="text-xs text-yellow-600 mt-1">
              {stats.montantEnAttente.toLocaleString()} Ar
            </p>
          </div>
          <Clock className="w-8 h-8 text-yellow-600 ml-auto" />
        </div>
      </div>
    </div>
  );
}