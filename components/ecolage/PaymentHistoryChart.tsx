import React from 'react';
import { BarChart3, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface PaymentPlan {
  month: string;
  monthNumber: number;
  dueDate: string;
  expectedAmount: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'overdue' | 'pending';
  payments: any[];
  daysLate?: number;
}

interface PaymentHistoryChartProps {
  paymentPlan: PaymentPlan[];
}

export function PaymentHistoryChart({ paymentPlan }: PaymentHistoryChartProps) {
  const maxAmount = Math.max(...paymentPlan.map(p => Math.max(p.expectedAmount, p.paidAmount)));
  
  const getBarColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'partial': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      case 'pending': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  const totalExpected = paymentPlan.reduce((sum, month) => sum + month.expectedAmount, 0);
  const totalPaid = paymentPlan.reduce((sum, month) => sum + month.paidAmount, 0);
  const completionRate = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="font-medium text-gray-900 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Évolution des Paiements
        </h4>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Payé</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span className="text-gray-600">Partiel</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">En retard</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span className="text-gray-600">En attente</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {paymentPlan.map((month, index) => {
          const expectedHeight = maxAmount > 0 ? (month.expectedAmount / maxAmount) * 100 : 0;
          const paidHeight = maxAmount > 0 ? (month.paidAmount / maxAmount) * 100 : 0;
          
          return (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-20 text-sm font-medium text-gray-700 text-right">
                {month.month.substring(0, 3)}
              </div>
              
              <div className="flex-1 relative">
                {/* Expected amount bar (background) */}
                <div className="w-full bg-gray-100 rounded-full h-8 relative overflow-hidden">
                  {/* Paid amount bar (foreground) */}
                  <div 
                    className={`h-8 rounded-full transition-all duration-500 ${getBarColor(month.status)}`}
                    style={{ width: `${(month.paidAmount / month.expectedAmount) * 100}%` }}
                  ></div>
                  
                  {/* Amount labels */}
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
                    <span className="text-gray-700">
                      {month.paidAmount.toLocaleString()} Ar
                    </span>
                    <span className="text-gray-600">
                      / {month.expectedAmount.toLocaleString()} Ar
                    </span>
                  </div>
                </div>
                
                {/* Status indicator */}
                <div className="flex items-center justify-between mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    month.status === 'paid' ? 'bg-green-100 text-green-800' :
                    month.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    month.status === 'overdue' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {month.status === 'paid' ? 'Payé' :
                     month.status === 'partial' ? 'Partiel' :
                     month.status === 'overdue' ? 'En retard' : 'En attente'}
                  </span>
                  
                  {month.daysLate && (
                    <span className="text-xs text-red-600">
                      {month.daysLate} jour(s) de retard
                    </span>
                  )}
                </div>
              </div>
              
              <div className="w-16 text-sm text-gray-600 text-center">
                {month.paidAmount > 0 ? 
                  `${((month.paidAmount / month.expectedAmount) * 100).toFixed(0)}%` : 
                  '0%'
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">{completionRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Taux de Completion</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{paymentPlan.filter(p => p.status === 'paid').length}</p>
            <p className="text-sm text-gray-600">Mois Payés</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{paymentPlan.filter(p => p.status === 'overdue').length}</p>
            <p className="text-sm text-gray-600">Mois en Retard</p>
          </div>
        </div>
      </div>
    </div>
  );
}