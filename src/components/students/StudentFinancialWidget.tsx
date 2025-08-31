import React, { useState } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, Plus, Eye, RefreshCw } from 'lucide-react';
import { useStudentPayments } from '../../hooks/useStudentPayments';
import { Modal } from '../Modal';
import { QuickPaymentForm } from '../ecolage/QuickPaymentForm';
import { StudentPaymentDetails } from '../ecolage/StudentPaymentDetails';

interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  class: string;
  parentName: string;
  phone: string;
  status: string;
}

interface StudentFinancialWidgetProps {
  student: Student;
  onPaymentAdded?: () => void;
}

export function StudentFinancialWidget({ student, onPaymentAdded }: StudentFinancialWidgetProps) {
  const [showQuickPayment, setShowQuickPayment] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  
  const paymentData = useStudentPayments(
    `${student.firstName} ${student.lastName}`, 
    student.class
  );

  const handleQuickPayment = async (paymentData: any) => {
    try {
      // Ici, on utiliserait le service d'écolage pour ajouter le paiement
      console.log('💰 Ajout de paiement rapide:', paymentData);
      
      // Simuler l'ajout (dans une vraie app, on appellerait feesService.create)
      alert('✅ Paiement ajouté avec succès !');
      
      setShowQuickPayment(false);
      onPaymentAdded?.();
    } catch (error: any) {
      alert('❌ Erreur lors de l\'ajout du paiement: ' + error.message);
    }
  };

  const getStatusColor = () => {
    switch (paymentData.status) {
      case 'up_to_date': return 'border-green-200 bg-green-50';
      case 'partial': return 'border-blue-200 bg-blue-50';
      case 'overdue': return 'border-yellow-200 bg-yellow-50';
      case 'critical': return 'border-red-200 bg-red-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getStatusIcon = () => {
    switch (paymentData.status) {
      case 'up_to_date': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'partial': return <DollarSign className="w-5 h-5 text-blue-600" />;
      case 'overdue': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <DollarSign className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusLabel = () => {
    switch (paymentData.status) {
      case 'up_to_date': return 'À jour';
      case 'partial': return 'Paiement partiel';
      case 'overdue': return 'En retard';
      case 'critical': return 'Situation critique';
      default: return 'En attente';
    }
  };

  if (paymentData.loading) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Synchronisation des paiements...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <h4 className="font-medium text-gray-900">Écolage</h4>
            <span className="text-xs text-gray-500">• Temps réel</span>
          </div>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            paymentData.status === 'up_to_date' ? 'bg-green-100 text-green-800' :
            paymentData.status === 'partial' ? 'bg-blue-100 text-blue-800' :
            paymentData.status === 'overdue' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {getStatusLabel()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-600">Payé</p>
            <p className="text-lg font-bold text-green-600">{paymentData.totalPaid.toLocaleString()} Ar</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Restant</p>
            <p className={`text-lg font-bold ${paymentData.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {paymentData.remainingBalance.toLocaleString()} Ar
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progression</span>
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

        {/* Alerts */}
        {paymentData.overduePayments.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
            <p className="text-xs text-red-700 font-medium">
              ⚠️ {paymentData.overduePayments.length} paiement(s) en retard
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={() => setShowPaymentDetails(true)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-xs"
          >
            <Eye className="w-3 h-3 mr-1" />
            Détails
          </button>
          <button
            onClick={() => setShowQuickPayment(true)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Paiement
          </button>
        </div>
      </div>

      {/* Quick Payment Modal */}
      <Modal
        isOpen={showQuickPayment}
        onClose={() => setShowQuickPayment(false)}
        title="Paiement Rapide"
        size="lg"
      >
        <QuickPaymentForm
          student={student}
          suggestedAmount={150000} // Montant suggéré selon la classe
          suggestedPeriod={new Date().toLocaleDateString('fr-FR', { month: 'long' })}
          onSubmit={handleQuickPayment}
          onCancel={() => setShowQuickPayment(false)}
        />
      </Modal>

      {/* Payment Details Modal */}
      <StudentPaymentDetails
        isOpen={showPaymentDetails}
        onClose={() => setShowPaymentDetails(false)}
        student={student}
      />
    </>
  );
}