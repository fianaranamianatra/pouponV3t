import React from 'react';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, CreditCard, Calendar } from 'lucide-react';
import { useStudentPayments } from '../../hooks/useStudentPayments';

interface StudentPaymentSummaryProps {
  studentName: string;
  studentClass: string;
  compact?: boolean;
  showActions?: boolean;
  conditionalDisplay?: boolean;
  onViewDetails?: () => void;
  onAddPayment?: () => void;
}

export function StudentPaymentSummary({ 
  studentName, 
  studentClass, 
  compact = false, 
  showActions = true,
  conditionalDisplay = false,
  onViewDetails,
  onAddPayment
}: StudentPaymentSummaryProps) {
  const paymentData = useStudentPayments(studentName, studentClass);

  if (paymentData.loading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Chargement des paiements...</span>
        </div>
      </div>
    );
  }

  if (paymentData.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-600">Erreur: {paymentData.error}</span>
        </div>
      </div>
    );
  }

  const getStatusConfig = () => {
    switch (paymentData.status) {
      case 'up_to_date':
        return {
          color: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          label: 'À jour'
        };
      case 'partial':
        return {
          color: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          icon: <Clock className="w-5 h-5 text-blue-600" />,
          label: 'Paiement partiel'
        };
      case 'overdue':
        return {
          color: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-800',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
          label: 'En retard'
        };
      case 'critical':
        return {
          color: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
          label: 'Critique'
        };
      default:
        return {
          color: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-800',
          icon: <Clock className="w-5 h-5 text-gray-600" />,
          label: 'En attente'
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Logique d'affichage conditionnel
  if (conditionalDisplay) {
    // Ne rien afficher si aucun paiement n'existe
    if (paymentData.payments.length === 0) {
      return (
        <div className="text-xs text-gray-400 italic">
          Aucun paiement
        </div>
      );
    }

    // Affichage minimal pour les élèves à jour
    if (paymentData.status === 'up_to_date') {
      return (
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <span className="text-xs text-green-700 font-medium">À jour</span>
          <span className="text-xs text-gray-500">
            ({paymentData.totalPaid.toLocaleString()} Ar)
          </span>
        </div>
      );
    }

    // Affichage détaillé pour les cas problématiques
    if (paymentData.status === 'overdue' || paymentData.status === 'critical') {
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`w-4 h-4 ${
              paymentData.status === 'critical' ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <span className={`text-xs font-medium ${
              paymentData.status === 'critical' ? 'text-red-700' : 'text-yellow-700'
            }`}>
              {paymentData.status === 'critical' ? 'Critique' : 'En retard'}
            </span>
          </div>
          <div className="text-xs space-y-0.5">
            <div className="flex justify-between">
              <span className="text-gray-600">Payé:</span>
              <span className="text-green-600 font-medium">{paymentData.totalPaid.toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Restant:</span>
              <span className="text-red-600 font-medium">{paymentData.remainingBalance.toLocaleString()} Ar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Taux:</span>
              <span className={`font-medium ${
                paymentData.paymentRate >= 70 ? 'text-blue-600' : 'text-red-600'
              }`}>
                {paymentData.paymentRate.toFixed(1)}%
              </span>
            </div>
            {paymentData.overduePayments.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">En retard:</span>
                <span className="text-red-600 font-medium">{paymentData.overduePayments.length}</span>
              </div>
            )}
          </div>
          {/* Barre de progression pour les cas problématiques */}
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                paymentData.paymentRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(paymentData.paymentRate, 100)}%` }}
            ></div>
          </div>
        </div>
      );
    }

    // Affichage intermédiaire pour les paiements partiels
    if (paymentData.status === 'partial') {
      return (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">Partiel</span>
            <span className="text-xs text-blue-600">
              {paymentData.paymentRate.toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-gray-600">
            {paymentData.totalPaid.toLocaleString()} / {paymentData.totalDue.toLocaleString()} Ar
          </div>
          {/* Barre de progression simplifiée */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.min(paymentData.paymentRate, 100)}%` }}
            ></div>
          </div>
        </div>
      );
    }
  }

  if (compact) {
    return (
      <div className={`border rounded-lg p-3 ${statusConfig.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {statusConfig.icon}
            <span className={`text-sm font-medium ${statusConfig.textColor}`}>
              {statusConfig.label}
            </span>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${statusConfig.textColor}`}>
              {paymentData.paymentRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600">
              {paymentData.totalPaid.toLocaleString()} / {paymentData.totalDue.toLocaleString()} Ar
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${statusConfig.color}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-gray-600" />
          <h4 className="font-medium text-gray-900">Situation Financière</h4>
          <span className="text-xs text-gray-500">• Synchronisé en temps réel</span>
        </div>
        {statusConfig.icon}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Total Payé</p>
          <p className="text-xl font-bold text-green-600">{paymentData.totalPaid.toLocaleString()} Ar</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Solde Restant</p>
          <p className={`text-xl font-bold ${paymentData.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {paymentData.remainingBalance.toLocaleString()} Ar
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progression des paiements</span>
          <span>{paymentData.paymentRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              paymentData.paymentRate >= 90 ? 'bg-green-500' :
              paymentData.paymentRate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(paymentData.paymentRate, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Status Details */}
      <div className={`p-3 rounded-lg border ${statusConfig.color}`}>
        <div className="flex items-center space-x-2 mb-2">
          {statusConfig.icon}
          <span className={`font-medium ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
        </div>
        
        {paymentData.overduePayments.length > 0 && (
          <p className="text-sm text-red-600">
            {paymentData.overduePayments.length} paiement(s) en retard
          </p>
        )}
        
        {paymentData.lastPaymentDate && (
          <p className="text-xs text-gray-600">
            Dernier paiement: {new Date(paymentData.lastPaymentDate).toLocaleDateString('fr-FR')}
          </p>
        )}
      </div>

      {/* Recent Payments */}
      {paymentData.payments.length > 0 && (
        <div className="mt-4">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Paiements Récents</h5>
          <div className="space-y-2">
            {paymentData.payments.slice(0, 3).map((payment, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    payment.status === 'paid' ? 'bg-green-500' :
                    payment.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{payment.period}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{payment.amount.toLocaleString()} Ar</p>
                  <p className="text-xs text-gray-500">{payment.paymentMethod}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Voir Détails
            </button>
          )}
          {onAddPayment && (
            <button
              onClick={onAddPayment}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Ajouter Paiement
            </button>
          )}
        </div>
      )}
    </div>
  );
}