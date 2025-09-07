import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { useStudentPayments } from '../../hooks/useStudentPayments';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { PaymentHistoryChart } from './PaymentHistoryChart';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { QuickPaymentForm } from './QuickPaymentForm';
import { feesService } from '../../lib/services/feesService';
import { X, Plus, Receipt, Calendar, DollarSign, TrendingUp } from 'lucide-react';

interface StudentPaymentDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    class: string;
    email?: string;
  };
}

export const StudentPaymentDetails: React.FC<StudentPaymentDetailsProps> = ({
  isOpen,
  onClose,
  student
}) => {
  const { payments, loading, error, refreshPayments } = useStudentPayments(student.id);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showQuickPayment, setShowQuickPayment] = useState(false);
  const [paymentStats, setPaymentStats] = useState({
    totalPaid: 0,
    totalDue: 0,
    pendingAmount: 0,
    lastPaymentDate: null as Date | null
  });

  useEffect(() => {
    if (payments.length > 0) {
      const totalPaid = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const totalDue = payments
        .reduce((sum, p) => sum + p.amount, 0);
      
      const pendingAmount = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const lastPayment = payments
        .filter(p => p.status === 'paid')
        .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())[0];
      
      setPaymentStats({
        totalPaid,
        totalDue,
        pendingAmount,
        lastPaymentDate: lastPayment ? new Date(lastPayment.paymentDate) : null
      });
    }
  }, [payments]);

  const handlePrintReceipt = (payment: any) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const handleQuickPaymentSuccess = () => {
    setShowQuickPayment(false);
    refreshPayments();
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Détails des Paiements
              </h2>
              <p className="text-gray-600">
                {student.firstName} {student.lastName} - {student.class}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Payment Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Payé</p>
                  <p className="text-2xl font-bold text-green-700">
                    {paymentStats.totalPaid.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-red-600 font-medium">En Attente</p>
                  <p className="text-2xl font-bold text-red-700">
                    {paymentStats.pendingAmount.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600 font-medium">Dernier Paiement</p>
                  <p className="text-lg font-bold text-blue-700">
                    {paymentStats.lastPaymentDate 
                      ? paymentStats.lastPaymentDate.toLocaleDateString('fr-FR')
                      : 'Aucun'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Receipt className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-purple-600 font-medium">Nb. Paiements</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {payments.filter(p => p.status === 'paid').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History Chart */}
          {payments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Historique des Paiements
              </h3>
              <PaymentHistoryChart payments={payments} />
            </div>
          )}

          {/* Quick Payment Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowQuickPayment(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un Paiement
            </button>
          </div>

          {/* Payment List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Liste des Paiements
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Chargement...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">Erreur: {error}</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Aucun paiement trouvé</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <PaymentStatusBadge status={payment.status} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.description || 'Écolage'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(payment.dueDate).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {payment.amount.toLocaleString()} FCFA
                      </p>
                      {payment.status === 'paid' && payment.paymentDate && (
                        <p className="text-sm text-green-600">
                          Payé le {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>

                    {payment.status === 'paid' && (
                      <button
                        onClick={() => handlePrintReceipt(payment)}
                        className="ml-4 p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Imprimer le reçu"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Quick Payment Modal */}
      {showQuickPayment && (
        <QuickPaymentForm
          isOpen={showQuickPayment}
          onClose={() => setShowQuickPayment(false)}
          student={student}
          onSuccess={handleQuickPaymentSuccess}
        />
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedPayment && (
        <PaymentReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          payment={selectedPayment}
          student={student}
        />
      )}
    </>
  );
};