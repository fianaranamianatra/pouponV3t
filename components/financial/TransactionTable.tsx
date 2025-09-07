import React from 'react';
import { Eye, Edit, Trash2, Calendar, CreditCard, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';

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

interface TransactionTableProps {
  transactions: Transaction[];
  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  updating: boolean;
  deleting: boolean;
  isMobile?: boolean;
}

const statusColors = {
  'Validé': 'bg-green-100 text-green-800',
  'En attente': 'bg-yellow-100 text-yellow-800',
  'Annulé': 'bg-red-100 text-red-800'
};

const typeColors = {
  'Encaissement': 'bg-green-100 text-green-800',
  'Décaissement': 'bg-red-100 text-red-800'
};

export function TransactionTable({
  transactions,
  onView,
  onEdit,
  onDelete,
  updating,
  deleting,
  isMobile = false
}: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className={`bg-white ${isMobile ? 'rounded-lg' : 'rounded-xl'} shadow-sm border border-gray-100`}>
        <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
          <TrendingUp className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} text-gray-300 mx-auto mb-4`} />
          <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium text-gray-900 mb-2`}>
            Aucune transaction enregistrée
          </h3>
          <p className={`${isMobile ? 'text-sm' : ''} text-gray-500 mb-6`}>
            Commencez par enregistrer votre première transaction financière.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white ${isMobile ? 'rounded-lg' : 'rounded-xl'} shadow-sm border border-gray-100 overflow-hidden`}>
      <div className={`overflow-x-auto ${isMobile ? 'mobile-table-scroll' : ''}`}>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900`}>
                Date
              </th>
              <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900`}>
                Type
              </th>
              <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden sm:table-cell' : 'py-3 px-6'} font-medium text-gray-900`}>
                Catégorie
              </th>
              <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden md:table-cell' : 'py-3 px-6'} font-medium text-gray-900`}>
                Description
              </th>
              <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900`}>
                Montant
              </th>
              <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden lg:table-cell' : 'py-3 px-6'} font-medium text-gray-900`}>
                Mode de Paiement
              </th>
              <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm hidden sm:table-cell' : 'py-3 px-6'} font-medium text-gray-900`}>
                Statut
              </th>
              <th className={`text-left ${isMobile ? 'py-2 px-3 text-sm' : 'py-3 px-6'} font-medium text-gray-900`}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                  <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-900`}>
                    <Calendar className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'} text-gray-400`} />
                    {new Date(transaction.date).toLocaleDateString('fr-FR')}
                  </div>
                </td>
                <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                  <div className="flex items-center space-x-1">
                    {transaction.type === 'Encaissement' ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`inline-flex items-center ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'} font-medium rounded-full ${typeColors[transaction.type]}`}>
                      {transaction.type}
                    </span>
                  </div>
                </td>
                <td className={`${isMobile ? 'py-3 px-3 hidden sm:table-cell' : 'py-4 px-6'}`}>
                  <span className={`inline-flex items-center ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'} font-medium bg-gray-100 text-gray-800 rounded-full`}>
                    {transaction.category}
                  </span>
                </td>
                <td className={`${isMobile ? 'py-3 px-3 hidden md:table-cell' : 'py-4 px-6'}`}>
                  <div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>
                      {transaction.description}
                    </p>
                    {transaction.reference && (
                      <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>
                        Réf: {transaction.reference}
                      </p>
                    )}
                    {transaction.relatedModule && (
                      <div className="flex items-center space-x-1 mt-1">
                        <ExternalLink className="w-3 h-3 text-blue-500" />
                        <span className={`${isMobile ? 'text-xs' : 'text-xs'} text-blue-500`}>
                          {transaction.relatedModule === 'ecolage' ? 'Écolage' : 'Salaires'}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                  <div>
                    <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold ${
                      transaction.type === 'Encaissement' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'Encaissement' ? '+' : '-'}{transaction.amount.toLocaleString()} Ar
                    </p>
                    {/* Afficher la catégorie sur mobile */}
                    {isMobile && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                        {transaction.category}
                      </span>
                    )}
                  </div>
                </td>
                <td className={`${isMobile ? 'py-3 px-3 hidden lg:table-cell' : 'py-4 px-6'}`}>
                  <div className={`flex items-center ${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>
                    <CreditCard className={`${isMobile ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-2'} text-gray-400`} />
                    {transaction.paymentMethod}
                  </div>
                </td>
                <td className={`${isMobile ? 'py-3 px-3 hidden sm:table-cell' : 'py-4 px-6'}`}>
                  <span className={`inline-flex items-center ${isMobile ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs'} font-medium rounded-full ${statusColors[transaction.status]}`}>
                    {transaction.status}
                  </span>
                </td>
                <td className={`${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
                  <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
                    <button 
                      onClick={() => onView(transaction)}
                      className={`${isMobile ? 'p-2' : 'p-1.5'} text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors`}
                      title="Voir les détails"
                    >
                      <Eye className={`${isMobile ? 'w-4 h-4' : 'w-4 h-4'}`} />
                    </button>
                    {!isMobile && (
                      <>
                        <button 
                          onClick={() => onEdit(transaction)}
                          disabled={updating}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => transaction.id && onDelete(transaction.id)}
                          disabled={deleting}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {/* Menu mobile pour les actions supplémentaires */}
                    {isMobile && (
                      <button 
                        onClick={() => {
                          const choice = confirm('Modifier cette transaction ?');
                          if (choice) {
                            onEdit(transaction);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Plus d'actions"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}