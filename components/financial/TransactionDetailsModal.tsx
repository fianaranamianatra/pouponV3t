import React from 'react';
import { TrendingUp, TrendingDown, Calendar, CreditCard, FileText, Tag, ExternalLink, Edit, Trash2 } from 'lucide-react';

interface Transaction {
  id?: string;
  type: 'Encaissement' | 'Décaissement';
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  status: 'Validé' | 'En attente' | 'Annulé';
  reference?: string;
  relatedModule?: 'ecolage' | 'salary' | 'other';
  relatedId?: string;
  notes?: string;
}

interface TransactionDetailsModalProps {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  isMobile?: boolean;
}

export function TransactionDetailsModal({
  transaction,
  onEdit,
  onDelete,
  isMobile = false
}: TransactionDetailsModalProps) {
  const statusColors = {
    'Validé': 'bg-green-100 text-green-800',
    'En attente': 'bg-yellow-100 text-yellow-800',
    'Annulé': 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-full flex items-center justify-center ${
          transaction.type === 'Encaissement' 
            ? 'bg-gradient-to-br from-green-400 to-green-500' 
            : 'bg-gradient-to-br from-red-400 to-red-500'
        }`}>
          {transaction.type === 'Encaissement' ? (
            <TrendingUp className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
          ) : (
            <TrendingDown className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-white`} />
          )}
        </div>
        <div>
          <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>
            {transaction.reference || 'Transaction'}
          </h3>
          <p className={`${isMobile ? 'text-sm' : ''} text-gray-600`}>
            {transaction.description}
          </p>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500`}>
            {transaction.category}
          </p>
        </div>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-6'}`}>
        <div>
          <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>
            Informations financières
          </h4>
          <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Type:</span> 
              <span className={transaction.type === 'Encaissement' ? 'text-green-600' : 'text-red-600'}>
                {transaction.type}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Montant:</span> 
              <span className={`font-bold ${
                transaction.type === 'Encaissement' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'Encaissement' ? '+' : '-'}
                {transaction.amount.toLocaleString()} Ar
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Catégorie:</span> 
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                {transaction.category}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Mode de paiement:</span> 
              <span>{transaction.paymentMethod}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>
            Informations de suivi
          </h4>
          <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="font-medium">Date:</span> 
              <span>{new Date(transaction.date).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Statut:</span> 
              <span className={`inline-flex items-center px-2 py-0.5 rounded ${isMobile ? 'text-xs' : 'text-xs'} font-medium ${statusColors[transaction.status]}`}>
                {transaction.status}
              </span>
            </div>
            {transaction.reference && (
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="font-medium">Référence:</span> 
                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                  {transaction.reference}
                </span>
              </div>
            )}
            {transaction.relatedModule && (
              <div className="flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-blue-500" />
                <span className="font-medium">Module lié:</span> 
                <span className={`inline-flex items-center px-2 py-0.5 rounded ${isMobile ? 'text-xs' : 'text-xs'} font-medium bg-blue-100 text-blue-800`}>
                  {transaction.relatedModule === 'ecolage' ? 'Écolage' : 'Salaires'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {transaction.notes && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-2'}`}>
            Notes
          </h4>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-700`}>
            {transaction.notes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className={`flex ${isMobile ? 'flex-col gap-2' : 'space-x-3'} pt-4 border-t border-gray-200`}>
        <button
          onClick={onEdit}
          className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'flex-1 px-4 py-2'} inline-flex items-center justify-center border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors`}
        >
          <Edit className="w-4 h-4 mr-2" />
          Modifier
        </button>
        <button
          onClick={onDelete}
          className={`${isMobile ? 'w-full px-4 py-3 text-base' : 'flex-1 px-4 py-2'} inline-flex items-center justify-center border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors`}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Supprimer
        </button>
      </div>
    </div>
  );
}