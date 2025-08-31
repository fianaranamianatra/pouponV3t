import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { 
  User, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  XCircle,
  Download,
  Receipt,
  TrendingUp,
  FileText,
  CreditCard,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Avatar } from '../Avatar';
import { useFirebaseCollection } from '../../hooks/useFirebaseCollection';
import { feesService } from '../../lib/firebase/firebaseService';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { PaymentHistoryChart } from './PaymentHistoryChart';

interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  class: string;
  parentName: string;
  phone: string;
  status: string;
}

interface Payment {
  id?: string;
  studentName: string;
  class: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  period: string;
  status: 'paid' | 'pending' | 'overdue';
  reference: string;
  notes?: string;
}

interface PaymentPlan {
  month: string;
  monthNumber: number;
  dueDate: string;
  expectedAmount: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'overdue' | 'pending';
  payments: Payment[];
  daysLate?: number;
}

interface StudentPaymentDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
}

export function StudentPaymentDetails({ isOpen, onClose, student }: StudentPaymentDetailsProps) {
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({
    totalDue: 0,
    totalPaid: 0,
    totalOverdue: 0,
    remainingBalance: 0,
    paymentRate: 0
  });

  // Hook Firebase pour charger les paiements en temps réel
  const { data: allPayments, loading: paymentsLoading } = useFirebaseCollection(feesService, true);

  // Filtrer les paiements pour cet élève
  const studentPayments = allPayments.filter(payment => 
    payment.studentName === `${student.firstName} ${student.lastName}`
  );

  // Générer le plan de paiement pour l'année scolaire
  const generatePaymentPlan = () => {
    const months = [
      { name: 'Septembre', number: 9, dueDay: 15 },
      { name: 'Octobre', number: 10, dueDay: 15 },
      { name: 'Novembre', number: 11, dueDay: 15 },
      { name: 'Décembre', number: 12, dueDay: 15 },
      { name: 'Janvier', number: 1, dueDay: 15 },
      { name: 'Février', number: 2, dueDay: 15 },
      { name: 'Mars', number: 3, dueDay: 15 },
      { name: 'Avril', number: 4, dueDay: 15 },
      { name: 'Mai', number: 5, dueDay: 15 },
      { name: 'Juin', number: 6, dueDay: 15 }
    ];

    // Montant mensuel standard selon la classe
    const getMonthlyAmount = (className: string): number => {
      const classAmounts: { [key: string]: number } = {
        'TPSA': 120000, 'TPSB': 120000,
        'PSA': 130000, 'PSB': 130000, 'PSC': 130000,
        'MS_A': 140000, 'MSB': 140000,
        'GSA': 150000, 'GSB': 150000, 'GSC': 150000,
        '11_A': 160000, '11B': 160000,
        '10_A': 170000, '10_B': 170000,
        '9A': 180000, '9_B': 180000,
        '8': 190000, '7': 200000,
        'CS': 110000, 'GARDERIE': 100000
      };
      return classAmounts[className] || 150000;
    };

    const monthlyAmount = getMonthlyAmount(student.class);
    const currentYear = academicYear.split('-')[0];
    const nextYear = academicYear.split('-')[1];

    return months.map(month => {
      const year = month.number >= 9 ? parseInt(currentYear) : parseInt(nextYear);
      const dueDate = new Date(year, month.number - 1, month.dueDay);
      const dueDateString = dueDate.toISOString().split('T')[0];

      // Trouver les paiements pour ce mois
      const monthPayments = studentPayments.filter(payment => {
        const paymentMonth = payment.period.toLowerCase();
        return paymentMonth.includes(month.name.toLowerCase()) || 
               paymentMonth === month.name;
      });

      const paidAmount = monthPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      // Déterminer le statut
      let status: 'paid' | 'partial' | 'overdue' | 'pending' = 'pending';
      let daysLate = 0;

      if (paidAmount >= monthlyAmount) {
        status = 'paid';
      } else if (paidAmount > 0) {
        status = 'partial';
      } else {
        const today = new Date();
        if (today > dueDate) {
          status = 'overdue';
          daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        month: month.name,
        monthNumber: month.number,
        dueDate: dueDateString,
        expectedAmount: monthlyAmount,
        paidAmount,
        status,
        payments: monthPayments,
        daysLate: daysLate > 0 ? daysLate : undefined
      };
    });
  };

  // Calculer le résumé financier
  const calculateSummary = (plan: PaymentPlan[]) => {
    const totalDue = plan.reduce((sum, month) => sum + month.expectedAmount, 0);
    const totalPaid = plan.reduce((sum, month) => sum + month.paidAmount, 0);
    const totalOverdue = plan
      .filter(month => month.status === 'overdue')
      .reduce((sum, month) => sum + (month.expectedAmount - month.paidAmount), 0);
    const remainingBalance = totalDue - totalPaid;
    const paymentRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

    return {
      totalDue,
      totalPaid,
      totalOverdue,
      remainingBalance,
      paymentRate
    };
  };

  // Effet pour générer le plan de paiement
  useEffect(() => {
    if (isOpen && student) {
      setLoading(true);
      const plan = generatePaymentPlan();
      setPaymentPlan(plan);
      setSummary(calculateSummary(plan));
      setLoading(false);
    }
  }, [isOpen, student, academicYear, studentPayments]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'partial':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-600" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Payé';
      case 'partial': return 'Partiel';
      case 'overdue': return 'En retard';
      case 'pending': return 'En attente';
      default: return 'Inconnu';
    }
  };

  const handleViewReceipt = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const handleExportStatement = () => {
    // Générer un relevé de paiements
    const csvContent = [
      'Mois,Date Échéance,Montant Dû,Montant Payé,Statut,Jours de Retard',
      ...paymentPlan.map(month => [
        month.month,
        month.dueDate,
        month.expectedAmount,
        month.paidAmount,
        getStatusLabel(month.status),
        month.daysLate || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecolage_${student.firstName}_${student.lastName}_${academicYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading || paymentsLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Chargement..." size="xl">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-gray-600">Chargement des détails de paiement...</span>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Détails des Paiements d'Écolage"
        size="xl"
      >
        <div className="space-y-6">
          {/* Student Header */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar 
                  firstName={student.firstName} 
                  lastName={student.lastName} 
                  size="lg" 
                  showPhoto={true}
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{student.firstName} {student.lastName}</h3>
                  <p className="text-gray-600">Classe: {student.class}</p>
                  <p className="text-gray-500 text-sm">Parent: {student.parentName}</p>
                </div>
              </div>
              
              <div className="text-right">
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="2024-2025">Année 2024-2025</option>
                  <option value="2023-2024">Année 2023-2024</option>
                  <option value="2022-2023">Année 2022-2023</option>
                </select>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Dû</p>
                  <p className="text-lg font-bold text-gray-900">{summary.totalDue.toLocaleString()} Ar</p>
                </div>
                <DollarSign className="w-6 h-6 text-gray-600" />
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Payé</p>
                  <p className="text-lg font-bold text-green-600">{summary.totalPaid.toLocaleString()} Ar</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En Retard</p>
                  <p className="text-lg font-bold text-red-600">{summary.totalOverdue.toLocaleString()} Ar</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux de Paiement</p>
                  <p className="text-lg font-bold text-blue-600">{summary.paymentRate.toFixed(1)}%</p>
                </div>
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Payment Progress Bar */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progression des Paiements</span>
              <span className="text-sm text-gray-600">{summary.paymentRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(summary.paymentRate, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 Ar</span>
              <span>{summary.totalDue.toLocaleString()} Ar</span>
            </div>
          </div>

          {/* Payment History Chart */}
          <PaymentHistoryChart paymentPlan={paymentPlan} />

          {/* Monthly Payment Plan */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Plan de Paiement Mensuel</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={handleExportStatement}
                    className="inline-flex items-center px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Exporter
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Mois</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Échéance</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Montant Dû</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Montant Payé</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Statut</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paymentPlan.map((month, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{month.month}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">
                          {new Date(month.dueDate).toLocaleDateString('fr-FR')}
                        </span>
                        {month.daysLate && (
                          <p className="text-xs text-red-600">
                            {month.daysLate} jour(s) de retard
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">
                          {month.expectedAmount.toLocaleString()} Ar
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${
                          month.paidAmount >= month.expectedAmount ? 'text-green-600' : 
                          month.paidAmount > 0 ? 'text-yellow-600' : 'text-gray-600'
                        }`}>
                          {month.paidAmount.toLocaleString()} Ar
                        </span>
                        {month.paidAmount > 0 && month.paidAmount < month.expectedAmount && (
                          <p className="text-xs text-red-600">
                            Reste: {(month.expectedAmount - month.paidAmount).toLocaleString()} Ar
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(month.status)}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(month.status)}`}>
                            {getStatusLabel(month.status)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1">
                          {month.payments.length > 0 && (
                            <button
                              onClick={() => handleViewReceipt(month.payments[0])}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Voir le reçu"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              // Ouvrir le formulaire de paiement pour ce mois
                              alert(`Ajouter un paiement pour ${month.month}`);
                            }}
                            className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Ajouter un paiement"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Historique Complet des Paiements
            </h4>
            
            {studentPayments.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun paiement enregistré pour cet élève</p>
              </div>
            ) : (
              <div className="space-y-3">
                {studentPayments
                  .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
                  .map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          payment.status === 'paid' ? 'bg-green-100' : 
                          payment.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          {getStatusIcon(payment.status)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payment.period}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(payment.paymentDate).toLocaleDateString('fr-FR')} • {payment.paymentMethod}
                          </p>
                          <p className="text-xs text-gray-500">Réf: {payment.reference}</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">{payment.amount.toLocaleString()} Ar</p>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                            {getStatusLabel(payment.status)}
                          </span>
                          <button
                            onClick={() => handleViewReceipt(payment)}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Voir le reçu"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Outstanding Balance Alert */}
          {summary.remainingBalance > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Solde Restant Dû</h4>
                  <p className="text-yellow-700 mt-1">
                    Il reste <strong>{summary.remainingBalance.toLocaleString()} Ar</strong> à payer pour cette année scolaire.
                  </p>
                  {summary.totalOverdue > 0 && (
                    <p className="text-red-600 text-sm mt-1">
                      Dont <strong>{summary.totalOverdue.toLocaleString()} Ar</strong> en retard de paiement.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={handleExportStatement}
              className="flex-1 px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Download className="w-4 h-4 mr-2 inline" />
              Exporter Relevé
            </button>
            <button
              onClick={() => {
                // Rediriger vers le module d'écolage avec ce student pré-sélectionné
                alert('Redirection vers l\'ajout de paiement...');
              }}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <DollarSign className="w-4 h-4 mr-2 inline" />
              Ajouter Paiement
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Receipt Modal */}
      {selectedPayment && (
        <PaymentReceiptModal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedPayment(null);
          }}
          payment={selectedPayment}
          student={student}
        />
      )}
    </>
  );
}