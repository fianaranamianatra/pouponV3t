import React, { useMemo } from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar, DollarSign } from 'lucide-react';

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

interface TransactionAnalyticsProps {
  transactions: Transaction[];
}

export function TransactionAnalytics({ transactions }: TransactionAnalyticsProps) {
  const analytics = useMemo(() => {
    const validTransactions = transactions.filter(t => t.status === 'Validé');
    
    // Analyse par mois
    const monthlyData = validTransactions.reduce((acc, transaction) => {
      const month = new Date(transaction.date).toLocaleDateString('fr-FR', { 
        month: 'long', 
        year: 'numeric' 
      });
      
      if (!acc[month]) {
        acc[month] = { encaissements: 0, decaissements: 0 };
      }
      
      if (transaction.type === 'Encaissement') {
        acc[month].encaissements += transaction.amount;
      } else {
        acc[month].decaissements += transaction.amount;
      }
      
      return acc;
    }, {} as { [key: string]: { encaissements: number; decaissements: number } });

    // Analyse par catégorie
    const categoryData = validTransactions.reduce((acc, transaction) => {
      if (!acc[transaction.category]) {
        acc[transaction.category] = { count: 0, amount: 0, type: transaction.type };
      }
      acc[transaction.category].count++;
      acc[transaction.category].amount += transaction.amount;
      return acc;
    }, {} as { [key: string]: { count: number; amount: number; type: string } });

    // Analyse par mode de paiement
    const paymentMethodData = validTransactions.reduce((acc, transaction) => {
      if (!acc[transaction.paymentMethod]) {
        acc[transaction.paymentMethod] = { count: 0, amount: 0 };
      }
      acc[transaction.paymentMethod].count++;
      acc[transaction.paymentMethod].amount += transaction.amount;
      return acc;
    }, {} as { [key: string]: { count: number; amount: number } });

    return {
      monthlyData,
      categoryData,
      paymentMethodData
    };
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Monthly Trends */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Évolution Mensuelle
        </h3>
        
        <div className="space-y-3">
          {Object.entries(analytics.monthlyData).map(([month, data]) => (
            <div key={month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{month}</span>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <div className="text-green-600">
                  <span className="font-medium">+{data.encaissements.toLocaleString()} Ar</span>
                </div>
                <div className="text-red-600">
                  <span className="font-medium">-{data.decaissements.toLocaleString()} Ar</span>
                </div>
                <div className={`font-bold ${
                  (data.encaissements - data.decaissements) >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {(data.encaissements - data.decaissements).toLocaleString()} Ar
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
          <PieChart className="w-5 h-5 mr-2" />
          Répartition par Catégorie
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(analytics.categoryData).map(([category, data]) => (
            <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{category}</p>
                <p className="text-sm text-gray-600">{data.count} transaction(s)</p>
              </div>
              <div className="text-right">
                <p className={`font-bold ${data.type === 'Encaissement' ? 'text-green-600' : 'text-red-600'}`}>
                  {data.amount.toLocaleString()} Ar
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2" />
          Modes de Paiement
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(analytics.paymentMethodData).map(([method, data]) => (
            <div key={method} className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-medium text-blue-900">{method}</p>
              <p className="text-2xl font-bold text-blue-600">{data.count}</p>
              <p className="text-sm text-blue-700">{data.amount.toLocaleString()} Ar</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}