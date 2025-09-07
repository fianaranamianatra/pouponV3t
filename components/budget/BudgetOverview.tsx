import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

interface BudgetCategory {
  name: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  status: 'good' | 'warning' | 'danger';
}

interface BudgetOverviewProps {
  categories: BudgetCategory[];
}

export function BudgetOverview({ categories }: BudgetOverviewProps) {
  const totalBudget = categories.reduce((acc, cat) => acc + cat.budgetAmount, 0);
  const totalSpent = categories.reduce((acc, cat) => acc + cat.spentAmount, 0);
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const remainingBudget = totalBudget - totalSpent;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'danger':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <DollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'danger':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Aperçu Budgétaire</h2>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Bon</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">Attention</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Critique</span>
          </div>
        </div>
      </div>

      {/* Overall Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Budget Total</p>
              <p className="text-xl font-bold text-blue-900">{totalBudget.toLocaleString()} Ar</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Dépensé</p>
              <p className="text-xl font-bold text-red-900">{totalSpent.toLocaleString()} Ar</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Restant</p>
              <p className="text-xl font-bold text-green-900">{remainingBudget.toLocaleString()} Ar</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Utilisation</p>
              <p className="text-xl font-bold text-purple-900">{totalPercentage.toFixed(1)}%</p>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              totalPercentage > 90 ? 'bg-red-100' :
              totalPercentage > 75 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              <div className={`w-3 h-3 rounded-full ${
                totalPercentage > 90 ? 'bg-red-500' :
                totalPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Breakdown */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Répartition par Catégorie</h4>
        
        {categories.length === 0 ? (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune catégorie budgétaire disponible</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category, index) => (
              <div key={index} className={`border rounded-lg p-4 ${getStatusColor(category.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(category.status)}
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <span className="text-sm font-bold">
                    {category.percentage.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Dépensé: {category.spentAmount.toLocaleString()} Ar</span>
                  <span>Budget: {category.budgetAmount.toLocaleString()} Ar</span>
                </div>
                
                <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      category.status === 'danger' ? 'bg-red-500' :
                      category.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(category.percentage, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs mt-2">
                  <span>Restant: {(category.budgetAmount - category.spentAmount).toLocaleString()} Ar</span>
                  {category.percentage > 100 && (
                    <span className="text-red-600 font-medium">
                      Dépassement: {(category.spentAmount - category.budgetAmount).toLocaleString()} Ar
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget Alerts */}
      {categories.some(cat => cat.status === 'danger' || cat.status === 'warning') && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Alertes Budgétaires</h4>
              <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                {categories.filter(cat => cat.status === 'danger').map((cat, index) => (
                  <li key={index}>
                    • <strong>{cat.name}</strong>: Budget dépassé ou critique ({cat.percentage.toFixed(1)}%)
                  </li>
                ))}
                {categories.filter(cat => cat.status === 'warning').map((cat, index) => (
                  <li key={index}>
                    • <strong>{cat.name}</strong>: Attention, budget bientôt atteint ({cat.percentage.toFixed(1)}%)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}