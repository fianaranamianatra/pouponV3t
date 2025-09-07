import React from 'react';
import { Plus, Download, Filter, RefreshCw, BarChart3, Calendar } from 'lucide-react';

interface TransactionQuickActionsProps {
  onAddTransaction: () => void;
  onExport: () => void;
  onRefresh: () => void;
  onShowAnalytics?: () => void;
  creating: boolean;
  exportDisabled: boolean;
  isMobile?: boolean;
}

export function TransactionQuickActions({
  onAddTransaction,
  onExport,
  onRefresh,
  onShowAnalytics,
  creating,
  exportDisabled,
  isMobile = false
}: TransactionQuickActionsProps) {
  return (
    <div className={`flex ${isMobile ? 'flex-col gap-2' : 'gap-2'}`}>
      {onShowAnalytics && (
        <button 
          onClick={onShowAnalytics}
          className={`${isMobile ? 'hidden sm:inline-flex' : 'inline-flex'} items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors`}
        >
          <BarChart3 className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
          Analyses
        </button>
      )}
      
      <button 
        onClick={onRefresh}
        className={`${isMobile ? 'hidden sm:inline-flex' : 'inline-flex'} items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors`}
      >
        <RefreshCw className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
        Actualiser
      </button>
      
      <button 
        onClick={onExport}
        disabled={exportDisabled}
        className={`${isMobile ? 'hidden sm:inline-flex' : 'inline-flex'} items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50`}
      >
        <Download className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
        Exporter
      </button>
      
      <button
        onClick={onAddTransaction}
        disabled={creating}
        className={`inline-flex items-center justify-center ${isMobile ? 'px-4 py-3 text-base' : 'px-4 py-2'} bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50`}
      >
        {creating ? (
          <div className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} border-2 border-white border-t-transparent rounded-full animate-spin mr-2`}></div>
        ) : (
          <Plus className={`${isMobile ? 'w-5 h-5 mr-2' : 'w-4 h-4 mr-2'}`} />
        )}
        Nouvelle Transaction
      </button>
    </div>
  );
}